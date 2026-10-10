import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { AmbiguousPaymentOrderError } from "@/lib/payments/PaymentGatewayInterface";
import {
  CANDIDATE_CREDIT_PRODUCT_TYPE,
  candidatePaymentSubject,
  createCandidateCreditPackageSnapshot,
  parseCandidateCreditPackageSnapshot,
} from "@/lib/payments/candidateCreditCommerce";

const checkoutSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.enum(["AUTO", "STRIPE", "PAYU"]).optional().default("AUTO"),
  returnTo: z.enum(["mock-interview"]).optional(),
}).strict();

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{16,128}$/;

async function candidateContext(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.id },
    include: { user: { select: { phoneNumber: true } } },
  });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

function orderIdFor(candidateProfileId: string, idempotencyKey: string) {
  return `cand_ord_${crypto.createHash("sha256").update(candidateProfileId).update("\0").update(idempotencyKey).digest("hex")}`;
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://hiregoai.com").replace(/\/$/, "");
}

function existingCheckoutResponse(order: {
  orderId: string; productType: string; companyId: string; planId: string; planSnapshot: unknown;
  gateway: string | null; gatewayOrderId: string | null; status: string; expectedAmount: number;
}) {
  if (order.productType !== CANDIDATE_CREDIT_PRODUCT_TYPE) {
    throw new ApiError("Idempotency key was already used for a different product.", 409);
  }
  const snapshot = parseCandidateCreditPackageSnapshot(order.planSnapshot);
  if (order.status !== "CREATED" || !order.gateway || !order.gatewayOrderId || !snapshot.gatewayCheckout) {
    throw new ApiError(
      order.status === "INITIATED"
        ? "Checkout initialization is still in progress; retry this same request shortly."
        : "This checkout attempt is already settled or failed; refresh your credit wallet before starting another purchase.",
      409,
    );
  }
  return NextResponse.json({
    success: true,
    duplicate: true,
    order: {
      orderId: order.orderId,
      gateway: order.gateway,
      gatewayOrderId: order.gatewayOrderId,
      packageId: snapshot.packageId,
      packageName: snapshot.name,
      credits: snapshot.credits,
      finalAmount: order.expectedAmount,
      currency: snapshot.currency,
      status: order.status,
      checkoutUrl: snapshot.gatewayCheckout.checkoutUrl,
      checkoutParams: snapshot.gatewayCheckout.checkoutParams,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_get", 60, 60_000);
    const { profile } = await candidateContext(request);
    const [wallet, ledger, services, packages, gatewayConfig] = await Promise.all([
      prisma.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id },
        update: {},
        select: { balance: true, updatedAt: true },
      }),
      prisma.candidateCreditLedger.findMany({
        where: { candidateProfileId: profile.id },
        select: { id: true, type: true, amount: true, balanceAfter: true, serviceKey: true, reference: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.candidateServiceCatalog.findMany({
        // Mock Interview debits atomically when a real session starts. Never
        // expose it through the generic service-request debit path as that
        // would charge the candidate twice.
        where: {
          isActive: true,
          serviceKey: { notIn: ["mock-interview", "mock_interview"] },
        },
        select: { serviceKey: true, name: true, description: true, creditCost: true },
        orderBy: { name: "asc" },
      }),
      prisma.candidateCreditPackage.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, description: true, credits: true, price: true, currency: true, sortOrder: true },
        orderBy: [{ sortOrder: "asc" }, { credits: "asc" }],
      }),
      PaymentGatewayController.getConfig().catch(() => null),
    ]);

    // Only advertise a live purchase route when it is administratively enabled
    // AND checkout + signed webhook credentials are configured. Adding the
    // credentials alone must not bypass the production payment release gate.
    const stripeConfigured = Boolean(
      process.env.STRIPE_SECRET_KEY?.trim() &&
      (process.env.STRIPE_WEBHOOK_SECRET?.trim() || process.env.PAYMENT_WEBHOOK_SECRET?.trim()) &&
      process.env.NEXT_PUBLIC_APP_URL?.trim()
    );
    const payuConfigured = Boolean(
      process.env.PAYU_MERCHANT_KEY?.trim() &&
      process.env.PAYU_MERCHANT_SALT?.trim() &&
      process.env.PAYU_ENVIRONMENT !== "test"
    );
    const hasGateway = Boolean(gatewayConfig && (
      (gatewayConfig.gatewaysStatus.STRIPE !== "DISABLED" && stripeConfigured) ||
      (gatewayConfig.gatewaysStatus.PAYU !== "DISABLED" && payuConfigured)
    ));
    const purchaseStatus = !hasGateway
      ? "PAYMENT_CONFIGURATION_UNAVAILABLE"
      : packages.length === 0
        ? "NO_ACTIVE_PACKAGES"
        : "READY";

    return NextResponse.json({
      success: true,
      wallet,
      ledger,
      services,
      purchaseStatus,
      packages,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_post", 10, 60_000);
    const { session, profile } = await candidateContext(request);
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
    if (!idempotencyKeyPattern.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required for checkout.", 400);
    }
    const input = await readValidatedJson(request, checkoutSchema, 8 * 1024);
    const subject = candidatePaymentSubject(profile.id);
    const orderId = orderIdFor(profile.id, idempotencyKey);

    const existing = await prisma.paymentOrder.findUnique({ where: { orderId } });
    if (existing) {
      if (existing.companyId !== subject || existing.planId !== input.packageId) {
        throw new ApiError("Idempotency key was already used for a different candidate credit purchase.", 409);
      }
      return existingCheckoutResponse(existing);
    }

    const creditPackage = await prisma.candidateCreditPackage.findUnique({ where: { id: input.packageId } });
    if (!creditPackage || !creditPackage.isActive) throw new ApiError("Candidate credit package is not available.", 404);
    if (!Number.isInteger(creditPackage.credits) || creditPackage.credits <= 0 ||
        !Number.isFinite(creditPackage.price) || creditPackage.price <= 0) {
      throw new ApiError("Candidate credit package configuration is invalid.", 409);
    }

    const snapshot = createCandidateCreditPackageSnapshot({
      ...creditPackage,
      candidateProfileId: profile.id,
    });

    try {
      await prisma.paymentOrder.create({
        data: {
          orderId,
          companyId: subject,
          productType: CANDIDATE_CREDIT_PRODUCT_TYPE,
          planId: creditPackage.id,
          planSnapshot: snapshot,
          originalAmount: creditPackage.price,
          discountAmount: 0,
          expectedAmount: creditPackage.price,
          status: "INITIATED",
        },
      });
    } catch (error) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      const raced = await prisma.paymentOrder.findUnique({ where: { orderId } });
      if (!raced) throw error;
      if (raced.companyId !== subject || raced.planId !== input.packageId) {
        throw new ApiError("Idempotency key was already used for a different candidate credit purchase.", 409);
      }
      return existingCheckoutResponse(raced);
    }

    const returnBase = appBaseUrl();
    const returnPath =
      `/api/candidate/credits/return?orderId=${encodeURIComponent(orderId)}` +
      (input.returnTo === "mock-interview" ? "&returnTo=mock-interview" : "");
    let gatewayResult;
    try {
      gatewayResult = await PaymentGatewayController.createOrder({
        orderId,
        amount: creditPackage.price,
        currency: creditPackage.currency.toUpperCase(),
        planName: creditPackage.name,
        planId: creditPackage.id,
        companyId: subject,
        customerName: session.name,
        customerEmail: session.email,
        customerPhone: profile.user.phoneNumber || undefined,
        successUrl: `${returnBase}${returnPath}`,
        cancelUrl: `${returnBase}${returnPath}&cancelled=1`,
      }, input.paymentMethod === "AUTO" ? undefined : input.paymentMethod);
    } catch (error) {
      if (!(error instanceof AmbiguousPaymentOrderError)) {
        await prisma.paymentOrder.updateMany({
          where: { orderId, status: "INITIATED" },
          data: { status: "FAILED" },
        }).catch(() => undefined);
      }
      throw error;
    }

    const persistedSnapshot = {
      ...snapshot,
      gatewayCheckout: {
        checkoutUrl: gatewayResult.checkoutUrl || returnPath,
        ...(gatewayResult.checkoutParams ? { checkoutParams: gatewayResult.checkoutParams } : {}),
      },
    };
    await prisma.paymentOrder.update({
      where: { orderId },
      data: {
        gateway: gatewayResult.gateway,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        planSnapshot: persistedSnapshot,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        gateway: gatewayResult.gateway,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        credits: creditPackage.credits,
        finalAmount: creditPackage.price,
        currency: creditPackage.currency.toUpperCase(),
        status: "CREATED",
        checkoutUrl: persistedSnapshot.gatewayCheckout.checkoutUrl,
        checkoutParams: persistedSnapshot.gatewayCheckout.checkoutParams,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
