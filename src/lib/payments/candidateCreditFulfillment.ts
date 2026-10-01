import { z } from "zod";
import type { PaymentOrder } from "@prisma/client";
import type { GatewayName, VerifyWebhookResult } from "@/lib/payments/PaymentGatewayInterface";
import { ApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { processPaymentReferralReward } from "@/lib/payment-referral";
import { ReferralProductType } from "@/types/referral";

const snapshotSchema = z.object({
  version: z.literal(1),
  packageId: z.string().uuid(),
  packageKey: z.string().min(3).max(80),
  name: z.string().min(1).max(160),
  credits: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().length(3),
}).strict();

export type CandidateCreditPackageSnapshot = z.infer<typeof snapshotSchema>;

export function createCandidateCreditPackageSnapshot(pkg: {
  id: string;
  packageKey: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
}): CandidateCreditPackageSnapshot {
  return snapshotSchema.parse({
    version: 1,
    packageId: pkg.id,
    packageKey: pkg.packageKey,
    name: pkg.name,
    credits: pkg.credits,
    price: pkg.price,
    currency: pkg.currency.toUpperCase(),
  });
}

export function parseCandidateCreditPackageSnapshot(value: unknown): CandidateCreditPackageSnapshot {
  return snapshotSchema.parse(value);
}

export async function fulfillCandidateCreditPayment(params: {
  paymentOrder: PaymentOrder;
  verification: VerifyWebhookResult;
  provider: GatewayName;
  gatewayTxId: string;
  rawPayload: unknown;
}) {
  const { paymentOrder, verification, provider, gatewayTxId, rawPayload } = params;
  if (paymentOrder.productType !== "CANDIDATE_CREDITS") {
    throw new ApiError("Payment order is not a candidate credit purchase.", 409);
  }
  if (!paymentOrder.candidateProfileId) {
    throw new ApiError("Candidate payment order is missing its candidate binding.", 409);
  }

  let snapshot: CandidateCreditPackageSnapshot;
  try {
    snapshot = parseCandidateCreditPackageSnapshot(paymentOrder.planSnapshot);
  } catch {
    throw new ApiError("Candidate credit package snapshot is missing or invalid.", 409);
  }

  if (paymentOrder.planId !== snapshot.packageId) {
    throw new ApiError("Candidate credit payment product does not match its package snapshot.", 409);
  }
  if (verification.subjectId && verification.subjectId !== paymentOrder.candidateProfileId) {
    throw new ApiError("Gateway payment subject does not match the candidate payment order.", 400);
  }
  if (verification.productType && verification.productType !== "CANDIDATE_CREDITS") {
    throw new ApiError("Gateway payment product type does not match the candidate payment order.", 400);
  }
  if (verification.productId && verification.productId !== snapshot.packageId) {
    throw new ApiError("Gateway payment product does not match the purchased credit package.", 400);
  }
  if (verification.currency && verification.currency.toUpperCase() !== snapshot.currency) {
    throw new ApiError("Gateway payment currency does not match the candidate credit package.", 400);
  }
  if (
    verification.amount === undefined ||
    !Number.isFinite(verification.amount) ||
    verification.amount <= 0
  ) {
    throw new ApiError("Gateway payment amount missing or invalid.", 400);
  }
  if (Math.abs(verification.amount - paymentOrder.expectedAmount) > 0.01) {
    throw new ApiError("Gateway payment amount does not match the candidate credit order.", 400);
  }
  if (Math.abs(paymentOrder.expectedAmount - snapshot.price) > 0.01) {
    throw new ApiError("Candidate credit order amount does not match its immutable package snapshot.", 409);
  }

  return prisma.$transaction(async (tx) => {
    const existingTx = await tx.paymentTransaction.findUnique({ where: { gatewayTxId } });
    if (existingTx?.status === "SUCCESS") {
      const wallet = await tx.candidateCreditWallet.findUnique({
        where: { candidateProfileId: paymentOrder.candidateProfileId! },
        select: { balance: true },
      });
      return { duplicate: true, balance: wallet?.balance ?? 0, ledgerId: null as string | null };
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { orderId: paymentOrder.orderId, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", gatewayTxId },
    });
    if (claimed.count !== 1) {
      const wallet = await tx.candidateCreditWallet.findUnique({
        where: { candidateProfileId: paymentOrder.candidateProfileId! },
        select: { balance: true },
      });
      return { duplicate: true, balance: wallet?.balance ?? 0, ledgerId: null as string | null };
    }

    const candidate = await tx.candidateProfile.findUnique({
      where: { id: paymentOrder.candidateProfileId },
      select: { id: true, userId: true },
    });
    if (!candidate) throw new ApiError("Candidate profile for paid credit order no longer exists.", 409);

    await tx.$queryRaw`SELECT "id" FROM "CandidateProfile" WHERE "id" = ${candidate.id} FOR UPDATE`;

    await tx.paymentTransaction.upsert({
      where: { gatewayTxId },
      update: {
        candidateProfileId: candidate.id,
        companyId: null,
        productType: "CANDIDATE_CREDITS",
        planId: snapshot.packageId,
        amount: paymentOrder.expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
      },
      create: {
        gatewayTxId,
        candidateProfileId: candidate.id,
        companyId: null,
        productType: "CANDIDATE_CREDITS",
        planId: snapshot.packageId,
        amount: paymentOrder.expectedAmount,
        currency: snapshot.currency,
        status: "SUCCESS",
        provider,
        rawPayload: rawPayload as any,
      },
    });

    const wallet = await tx.candidateCreditWallet.upsert({
      where: { candidateProfileId: candidate.id },
      create: { candidateProfileId: candidate.id, balance: snapshot.credits },
      update: { balance: { increment: snapshot.credits } },
    });

    const ledger = await tx.candidateCreditLedger.create({
      data: {
        candidateProfileId: candidate.id,
        type: "PURCHASE",
        amount: snapshot.credits,
        balanceAfter: wallet.balance,
        idempotencyKey: `candidate-credit-purchase:${paymentOrder.orderId}`,
        reference: `Paid credit package: ${snapshot.name}`,
      },
    });

    await processPaymentReferralReward({
      userId: candidate.userId,
      amount: paymentOrder.expectedAmount,
      provider,
      transactionId: gatewayTxId,
      productType: ReferralProductType.CANDIDATE_CAREER_PASS,
      tx,
    }, tx);

    await tx.auditLog.create({
      data: {
        userId: candidate.userId,
        companyId: null,
        action: "CANDIDATE_CREDITS_PURCHASED",
        resource: `CandidateCreditLedger:${ledger.id}`,
        details: JSON.stringify({
          orderId: paymentOrder.orderId,
          packageId: snapshot.packageId,
          credits: snapshot.credits,
          amount: paymentOrder.expectedAmount,
          currency: snapshot.currency,
          provider,
        }),
      },
    });

    return { duplicate: false, balance: wallet.balance, ledgerId: ledger.id };
  });
}
