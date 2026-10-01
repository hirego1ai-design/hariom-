import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import type { CreateOrderResult } from "@/lib/payments/PaymentGatewayInterface";
import { createCandidateCreditPackageSnapshot } from "@/lib/payments/candidateCreditFulfillment";

const checkoutSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.enum(["AUTO", "STRIPE", "PAYU"]).optional().default("AUTO"),
}).strict();

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{16,128}$/;

async function candidateContext(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "CANDIDATE") {
    throw new ApiError("Candidate access required", 403);
  }
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.id },
    include: { user: { select: { phoneNumber: true } } },
  });
  if (!profile) throw new ApiError("Candidate profile not found", 404);
  return { session, profile };
}

function candidateOrderId(candidateProfileId: string, idempotencyKey: string) {
  return "cc_" + crypto
    .createHash("sha256")
    .update(candidateProfileId)
    .update("\0")
    .update(idempotencyKey)
    .digest("hex");
}

function existingCheckoutResponse(order: {
  orderId: string;
  gatewayOrderId: string | null;
  gateway: string | null;
  status: string;
  planId: string;
  planSnapshot: unknown;
}) {
  if (order.status !== "CREATED" || !order.gateway || !order.gatewayOrderId) {
    throw new ApiError(
      order.status === "INITIATED"
        ? "Checkout initialization is still in progress; retry this same request shortly."
        : "This checkout attempt is already settled or failed; start a new checkout explicitly.",
      409,
    );
  }
  return NextResponse.json({
    success: true,
    duplicate: true,
    order: {
      orderId: order.orderId,
      gatewayOrderId: order.gatewayOrderId,
      gateway: order.gateway,
      packageId: order.planId,
      status: order.status,
      checkoutUrl: `/payment/status?orderId=${encodeURIComponent(order.orderId)}&gatewayOrderId=${encodeURIComponent(order.gatewayOrderId)}&gateway=${encodeURIComponent(order.gateway)}`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_get", 60, 60_000);
    const { profile } = await candidateContext(request);
    const [wallet, ledger, services, packages] = await Promise.all([
      prisma.candidateCreditWallet.upsert({
        where: { candidateProfileId: profile.id },
        create: { candidateProfileId: profile.id },
        update: {},
        select: { balance: true, updatedAt: true },
      }),
      prisma.candidateCreditLedger.findMany({
        where: { candidateProfileId: profile.id },
        select: {
          id: true,
          type: true,
          amount: true,
          balanceAfter: true,
          serviceKey: true,
          reference: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.candidateServiceCatalog.findMany({
        where: { isActive: true },
        select: { serviceKey: true, name: true, description: true, creditCost: true },
        orderBy: { name: "asc" },
      }),
      prisma.candidateCreditPackage.findMany({
        where: { isActive: true },
        select: {
          id: true,
          packageKey: true,
          name: true,
          description: true,
          credits: true,
          price: true,
          currency: true,
        },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      }),
    ]);

    let gatewayAvailable = false;
    try {
      const config = await PaymentGatewayController.getConfig();
      gatewayAvailable = Object.values(config.gatewaysStatus).some((status) => status !== "DISABLED");
    } catch {
      gatewayAvailable = false;
    }

    return NextResponse.json({
      success: true,
      wallet,
      ledger,
      services,
      packages,
      purchaseStatus:
        packages.length === 0
          ? "NO_ACTIVE_PACKAGES"
          : gatewayAvailable
            ? "AVAILABLE"
            : "PAYMENT_GATEWAY_UNAVAILABLE",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "candidate_credits_checkout", 10, 60_000);
    const { session, profile } = await candidateContext(request);

    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
    if (!idempotencyKeyPattern.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required for checkout.", 400);
    }

    const { packageId, paymentMethod } = await readValidatedJson(request, checkoutSchema, 8 * 1024);
    const pkg = await prisma.candidateCreditPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (!pkg) throw new ApiError("Candidate credit package is unavailable.", 404);
    if (!Number.isFinite(pkg.price) || pkg.price <= 0 || pkg.credits <= 0) {
      throw new ApiError("Candidate credit package is not configured for paid checkout.", 409);
    }

    const orderId = candidateOrderId(profile.id, idempotencyKey);
    const existing = await prisma.paymentOrder.findUnique({ where: { orderId } });
    if (existing) {
      if (
        existing.productType !== "CANDIDATE_CREDITS" ||
        existing.candidateProfileId !== profile.id ||
        existing.planId !== pkg.id
      ) {
        throw new ApiError("Idempotency key was already used for a different purchase.", 409);
      }
      return existingCheckoutResponse(existing);
    }

    const snapshot = createCandidateCreditPackageSnapshot(pkg);
    try {
      await prisma.paymentOrder.create({
        data: {
          orderId,
          companyId: null,
          candidateProfileId: profile.id,
          productType: "CANDIDATE_CREDITS",
          billingCountry: "IN",
          planId: pkg.id,
          planSnapshot: snapshot,
          originalAmount: pkg.price,
          discountAmount: 0,
          expectedAmount: pkg.price,
          status: "INITIATED",
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code !== "P2002") throw error;
      const winner = await prisma.paymentOrder.findUnique({ where: { orderId } });
      if (!winner) throw error;
      if (
        winner.productType !== "CANDIDATE_CREDITS" ||
        winner.candidateProfileId !== profile.id ||
        winner.planId !== pkg.id
      ) {
        throw new ApiError("Idempotency key was already used for a different purchase.", 409);
      }
      return existingCheckoutResponse(winner);
    }

    let gatewayResult: CreateOrderResult;
    try {
      gatewayResult = await PaymentGatewayController.createOrder(
        {
          orderId,
          amount: pkg.price,
          currency: pkg.currency,
          planName: pkg.name,
          planId: pkg.id,
          subjectId: profile.id,
          productType: "CANDIDATE_CREDITS",
          productId: pkg.id,
          customerName: session.name,
          customerEmail: session.email,
          customerPhone: profile.user?.phoneNumber || undefined,
        },
        paymentMethod === "AUTO" ? undefined : paymentMethod,
      );

      await prisma.paymentOrder.update({
        where: { orderId },
        data: {
          gateway: gatewayResult.gateway,
          gatewayOrderId: gatewayResult.gatewayOrderId,
          status: "CREATED",
        },
      });
    } catch (error) {
      await prisma.paymentOrder.updateMany({
        where: { orderId, status: "INITIATED" },
        data: { status: "FAILED" },
      }).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        gateway: gatewayResult.gateway,
        packageId: pkg.id,
        packageName: pkg.name,
        credits: pkg.credits,
        amount: pkg.price,
        currency: pkg.currency,
        status: "CREATED",
        checkoutUrl: gatewayResult.checkoutUrl,
        checkoutParams: gatewayResult.checkoutParams,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
