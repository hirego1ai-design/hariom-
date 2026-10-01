import { z } from "zod";
import type { PaymentOrder } from "@prisma/client";
import type { GatewayName, VerifyWebhookResult } from "@/lib/payments/PaymentGatewayInterface";
import { ApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { processPaymentReferralReward } from "@/lib/payment-referral";
import { ReferralProductType } from "@/types/referral";

export const CANDIDATE_CREDIT_PRODUCT_TYPE = "CANDIDATE_CREDITS";
export const candidatePaymentSubject = (candidateProfileId: string) => `candidate:${candidateProfileId}`;

const snapshotSchema = z.object({
  version: z.literal(1),
  productType: z.literal(CANDIDATE_CREDIT_PRODUCT_TYPE),
  packageId: z.string().uuid(),
  candidateProfileId: z.string().uuid(),
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  credits: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().trim().min(3).max(8),
  gatewayCheckout: z.object({
    checkoutUrl: z.string().min(1).max(4000),
    checkoutParams: z.record(z.string(), z.any()).optional(),
  }).strict().optional(),
}).strict();

export type CandidateCreditPackageSnapshot = z.infer<typeof snapshotSchema>;

export function createCandidateCreditPackageSnapshot(input: {
  id: string;
  code: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  candidateProfileId: string;
}): CandidateCreditPackageSnapshot {
  return snapshotSchema.parse({
    version: 1,
    productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
    packageId: input.id,
    candidateProfileId: input.candidateProfileId,
    code: input.code,
    name: input.name,
    credits: input.credits,
    price: input.price,
    currency: input.currency.toUpperCase(),
  });
}

export function parseCandidateCreditPackageSnapshot(value: unknown): CandidateCreditPackageSnapshot {
  return snapshotSchema.parse(value);
}

export async function handleCandidateCreditPaymentWebhook(params: {
  paymentOrder: PaymentOrder;
  verification: VerifyWebhookResult;
  provider: GatewayName;
  gatewayTxId: string;
  rawPayload: unknown;
}) {
  const { paymentOrder, verification, provider, gatewayTxId, rawPayload } = params;
  const snapshot = parseCandidateCreditPackageSnapshot(paymentOrder.planSnapshot);

  if (paymentOrder.productType !== CANDIDATE_CREDIT_PRODUCT_TYPE) {
    throw new ApiError("Payment order is not a candidate credit purchase.", 400);
  }
  if (paymentOrder.companyId !== candidatePaymentSubject(snapshot.candidateProfileId)) {
    throw new ApiError("Candidate payment subject does not match the payment order.", 400);
  }
  if (paymentOrder.planId !== snapshot.packageId) {
    throw new ApiError("Candidate credit package snapshot does not match the payment order.", 409);
  }
  if (verification.companyId && verification.companyId !== paymentOrder.companyId) {
    throw new ApiError("Gateway payment subject does not match the candidate order.", 400);
  }
  if (verification.planId && verification.planId !== snapshot.packageId) {
    throw new ApiError("Gateway package identifier does not match the candidate order.", 400);
  }
  if (verification.currency && verification.currency.toUpperCase() !== snapshot.currency) {
    throw new ApiError("Gateway payment currency does not match the candidate package.", 400);
  }

  if (verification.status === "PENDING") {
    return {
      success: true,
      received: true,
      product: CANDIDATE_CREDIT_PRODUCT_TYPE,
      status: "PENDING",
      message: "Payment is awaiting authoritative gateway confirmation. No credits were granted.",
    };
  }

  if (verification.status === "FAILED" || verification.status === "REJECTED") {
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.paymentOrder.updateMany({
        where: { id: paymentOrder.id, status: { in: ["INITIATED", "CREATED"] } },
        data: { status: "FAILED", gatewayTxId: gatewayTxId || null },
      });
      if (claim.count !== 1) return { duplicate: true };

      const profile = await tx.candidateProfile.findUnique({
        where: { id: snapshot.candidateProfileId },
        select: { userId: true },
      });
      if (!profile) throw new ApiError("Candidate profile for payment order no longer exists.", 409);

      if (gatewayTxId) {
        await tx.paymentTransaction.upsert({
          where: { gatewayTxId },
          update: {
            productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
            status: "FAILED",
            errorMessage: "Candidate credit payment failed at gateway.",
          },
          create: {
            gatewayTxId,
            companyId: paymentOrder.companyId,
            productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
            planId: snapshot.packageId,
            amount: verification.amount || paymentOrder.expectedAmount,
            currency: snapshot.currency,
            status: "FAILED",
            provider,
            rawPayload: rawPayload as any,
            errorMessage: "Candidate credit payment failed at gateway.",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: profile.userId,
          action: "CANDIDATE_CREDIT_PAYMENT_FAILED",
          resource: `PaymentOrder:${paymentOrder.orderId}`,
          details: `Candidate credit payment failed; package:${snapshot.code}; provider:${provider}; creditsGranted:0`,
        },
      });
      return { duplicate: false };
    });

    return {
      success: true,
      received: true,
      duplicate: result.duplicate,
      product: CANDIDATE_CREDIT_PRODUCT_TYPE,
      status: "FAILED",
      message: "Payment failure recorded. No candidate credits were granted.",
    };
  }

  if (verification.status !== "SUCCESS") {
    throw new ApiError("Unsupported candidate payment state.", 400);
  }
  if (!gatewayTxId || !verification.gatewayOrderId) {
    throw new ApiError("Gateway success is missing its authoritative transaction or order identifier.", 400);
  }
  if (paymentOrder.gatewayOrderId !== verification.gatewayOrderId) {
    throw new ApiError("Gateway order does not match the candidate payment order.", 400);
  }
  if (verification.amount === undefined || !Number.isFinite(verification.amount) || verification.amount <= 0) {
    throw new ApiError("Gateway payment amount is missing or invalid.", 400);
  }
  if (Math.abs(verification.amount - paymentOrder.expectedAmount) > 0.01 ||
      Math.abs(paymentOrder.expectedAmount - snapshot.price) > 0.01) {
    throw new ApiError("Gateway payment amount does not match the candidate package.", 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const priorLedger = await tx.candidateCreditLedger.findUnique({
      where: { idempotencyKey: `candidate-credit-purchase:${paymentOrder.orderId}` },
    });
    if (priorLedger) {
      return { duplicate: true, balance: priorLedger.balanceAfter, creditsGranted: priorLedger.amount };
    }

    const claim = await tx.paymentOrder.updateMany({
      where: { id: paymentOrder.id, status: { in: ["INITIATED", "CREATED", "FAILED"] } },
      data: { status: "SUCCESS", gatewayTxId },
    });
    if (claim.count !== 1) {
      const ledger = await tx.candidateCreditLedger.findUnique({
        where: { idempotencyKey: `candidate-credit-purchase:${paymentOrder.orderId}` },
      });
      if (ledger) return { duplicate: true, balance: ledger.balanceAfter, creditsGranted: ledger.amount };
      throw new ApiError("Candidate payment order was already settled without a matching credit ledger.", 409);
    }

    const profile = await tx.candidateProfile.findUnique({
      where: { id: snapshot.candidateProfileId },
      select: { userId: true },
    });
    if (!profile) throw new ApiError("Candidate profile for payment order no longer exists.", 409);

    await tx.paymentTransaction.upsert({
      where: { gatewayTxId },
      update: {
        productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
        planId: snapshot.packageId,
        amount: paymentOrder.expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
        rawPayload: rawPayload as any,
        errorMessage: null,
      },
      create: {
        gatewayTxId,
        companyId: paymentOrder.companyId,
        productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
        planId: snapshot.packageId,
        amount: paymentOrder.expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
        rawPayload: rawPayload as any,
      },
    });

    const wallet = await tx.candidateCreditWallet.upsert({
      where: { candidateProfileId: snapshot.candidateProfileId },
      create: { candidateProfileId: snapshot.candidateProfileId, balance: snapshot.credits },
      update: { balance: { increment: snapshot.credits } },
    });

    const ledger = await tx.candidateCreditLedger.create({
      data: {
        candidateProfileId: snapshot.candidateProfileId,
        type: "PURCHASE",
        amount: snapshot.credits,
        balanceAfter: wallet.balance,
        idempotencyKey: `candidate-credit-purchase:${paymentOrder.orderId}`,
        reference: `Purchased ${snapshot.name} via ${provider}`,
      },
    });

    // Candidate paid-credit commerce participates in the existing referral
    // program as a candidate career purchase. Attribution, qualification,
    // limits, anti-fraud rules and reward amount remain authoritative in the
    // referral engine. Keep it in this same transaction so payment
    // fulfillment, wallet credit and any qualifying referral reward commit
    // together or roll back together.
    await processPaymentReferralReward({
      userId: profile.userId,
      amount: paymentOrder.expectedAmount,
      provider,
      transactionId: gatewayTxId,
      productType: ReferralProductType.CANDIDATE_CAREER_PASS,
      tx,
    }, tx);

    await tx.auditLog.create({
      data: {
        userId: profile.userId,
        action: "CANDIDATE_CREDIT_PAYMENT_FULFILLED",
        resource: `CandidateCreditLedger:${ledger.id}`,
        details: `orderId:${paymentOrder.orderId}; package:${snapshot.code}; amount:${paymentOrder.expectedAmount} ${snapshot.currency}; credits:${snapshot.credits}; provider:${provider}`,
      },
    });

    return { duplicate: false, balance: wallet.balance, creditsGranted: snapshot.credits };
  });

  return {
    success: true,
    received: true,
    duplicate: result.duplicate,
    product: CANDIDATE_CREDIT_PRODUCT_TYPE,
    status: "SUCCESS",
    creditsGranted: result.creditsGranted,
    balance: result.balance,
  };
}
