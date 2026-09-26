import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkoutSchema } from "@/lib/payments/planContracts";
import { ApiError, enforceRateLimit, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import type { CreateOrderResult } from "@/lib/payments/PaymentGatewayInterface";
import { subscriptionCredits } from "@/lib/payments/subscriptionCredits";
import { failCheckoutOrder } from "@/lib/payments/failCheckoutOrder";
import { createPurchasedPlanSnapshot, type PurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";
import type { PaymentOrder } from "@prisma/client";

type CheckoutPlan = Omit<PurchasedPlanSnapshot, "version" | "planId"> & { id: string };

type PromoReservation = {
  code: string;
  promoId?: string;
  discountApplied: number;
  finalPrice: number;
};

type ReservationResult =
  | { kind: "created"; reservation: PromoReservation }
  | { kind: "existing"; order: PaymentOrder };

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{16,128}$/;

function checkoutOrderId(companyId: string, idempotencyKey: string) {
  return `ord_${crypto.createHash("sha256").update(companyId).update("\0").update(idempotencyKey).digest("hex")}`;
}

function assertSameCheckout(order: PaymentOrder, input: {
  companyId: string; planId: string; promoCode?: string; paymentMethod?: string;
}) {
  const expectedPromo = input.promoCode?.toUpperCase() || null;
  if (order.companyId !== input.companyId || order.planId !== input.planId || order.promoCode !== expectedPromo) {
    throw new ApiError("Idempotency key was already used for a different checkout request.", 409);
  }
  if (input.paymentMethod && input.paymentMethod !== "AUTO" && order.gateway && order.gateway !== input.paymentMethod) {
    throw new ApiError("Idempotency key was already used with a different payment provider.", 409);
  }
}

function existingCheckoutResponse(order: PaymentOrder) {
  if (order.status !== "CREATED" || !order.gateway || !order.gatewayOrderId) {
    const message = order.status === "INITIATED"
      ? "Checkout initialization is still in progress; retry this same request shortly."
      : "This checkout attempt is already settled or failed; start a new checkout explicitly.";
    throw new ApiError(message, 409);
  }
  const snapshot = parsePurchasedPlanSnapshot(order.planSnapshot);
  return NextResponse.json({
    success: true,
    duplicate: true,
    order: {
      orderId: order.orderId,
      gatewayOrderId: order.gatewayOrderId,
      gateway: order.gateway,
      planId: order.planId,
            planName: snapshot.name,
      originalPrice: order.originalAmount,
      discountAmount: order.discountAmount,
      finalAmount: order.expectedAmount,
      currency: snapshot.currency,
      paymentMethod: order.gateway,
      status: order.status,
      checkoutUrl: `/payment/status?orderId=${encodeURIComponent(order.orderId)}&gatewayOrderId=${encodeURIComponent(order.gatewayOrderId)}&gateway=${encodeURIComponent(order.gateway)}`,
    },
  });
}

async function createPaymentOrderWithPromoReservation(params: {
  orderId: string;
  companyId: string;
  plan: CheckoutPlan;
  promoCode?: string;
}): Promise<ReservationResult> {
  const { orderId, companyId, plan, promoCode } = params;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.paymentOrder.findUnique({ where: { orderId } });
    if (existing) return { kind: "existing", order: existing } as const;
    let reservation: PromoReservation = {
      code: "",
      discountApplied: 0,
      finalPrice: plan.price,
    };

    if (promoCode) {
      // A row lock makes availability check + reservation one operation. The
      // reservation is later converted to usage only by a verified webhook.
      const promos = await tx.$queryRaw<Array<{
        id: string;
        code: string;
        discountType: string;
        discountValue: number;
        maxUsage: number;
        usageCount: number;
        reservedUsage: number;
        validUntil: Date | null;
        isArchived: boolean;
      }>>`
        SELECT "id", "code", "discountType", "discountValue", "maxUsage", "usageCount", "reservedUsage", "validUntil", "isArchived"
        FROM "PromoCode"
        WHERE "code" = ${promoCode.toUpperCase()}
        FOR UPDATE
      `;
      const promo = promos[0];
      // A concurrent retry may have committed while this transaction waited
      // for the promo row. Re-check before capacity validation so that retry
      // reuses the first order instead of appearing as an exhausted promo.
      const committedRetry = await tx.paymentOrder.findUnique({ where: { orderId } });
      if (committedRetry) return { kind: "existing", order: committedRetry } as const;
      const isExpired = promo?.validUntil && promo.validUntil < new Date();
      if (!promo || promo.isArchived || isExpired || promo.usageCount + promo.reservedUsage >= promo.maxUsage) {
        throw new ApiError("Invalid, expired, or exhausted promo code.", 400);
      }

      const discountApplied = promo.discountType === "PERCENTAGE"
        ? (plan.price * Math.min(100, Math.max(0, promo.discountValue))) / 100
        : Math.min(plan.price, Math.max(0, promo.discountValue));
      reservation = {
        code: promo.code,
        promoId: promo.id,
        discountApplied,
        finalPrice: Math.max(0, plan.price - discountApplied),
      };
    }

    // This route creates a provider payment order; zero-value purchases need a
    // separate, explicitly authorized grant flow. Rolling back here also means
    // a full-discount promo never consumes or reserves capacity indefinitely.
    if (!Number.isFinite(reservation.finalPrice) || reservation.finalPrice <= 0) {
      throw new ApiError("This checkout has no payable amount and cannot be sent to a payment provider.", 400);
    }

    if (reservation.promoId) {
      await tx.promoCode.update({
        where: { id: reservation.promoId },
        data: { reservedUsage: { increment: 1 } },
      });
    }

    await tx.paymentOrder.create({
      data: {
        orderId,
        companyId,
        planId: plan.id,
        planSnapshot: createPurchasedPlanSnapshot(plan),
        originalAmount: plan.price,
        discountAmount: reservation.discountApplied,
        expectedAmount: reservation.finalPrice,
        promoCode: reservation.code || null,
        promoReservationState: reservation.code ? "RESERVED" : null,
        status: "INITIATED",
      },
    });
    return { kind: "created", reservation } as const;
  });
}

async function releasePromoReservation(orderId: string): Promise<void> {
  await prisma.$transaction(tx => failCheckoutOrder(tx, orderId));
}

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit(req, "payment_checkout", 10, 60_000);
    const session = await getCurrentSession(req.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "EMPLOYER") return jsonError("Only company employers can create subscription payment orders.", 403);

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
      include: { user: { select: { phoneNumber: true } } },
    });
    if (!profile || !profile.companyId) {
      return jsonError("No employer profile found for this account", 403);
    }
    const companyId = profile.companyId;

    const idempotencyKey = req.headers.get("idempotency-key")?.trim() || "";
    if (!idempotencyKeyPattern.test(idempotencyKey)) {
      throw new ApiError("A valid Idempotency-Key header (16-128 safe characters) is required for checkout.", 400);
    }

    const { planId, paymentMethod, promoCode } = await readValidatedJson(req, checkoutSchema);

    const isProduction = process.env.NODE_ENV === "production";
    

    if (!planId) {
      return jsonError("planId is required", 400);
    }

    const orderId = checkoutOrderId(companyId, idempotencyKey);
    const checkoutInput = { companyId, planId, promoCode, paymentMethod };
    const existing = await prisma.paymentOrder.findUnique({ where: { orderId } });
    if (existing) {
      assertSameCheckout(existing, checkoutInput);
      return existingCheckoutResponse(existing);
    }

    // Fetch plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return jsonError("Subscription plan not found", 404);
    }

    if (plan.isArchived) {
      return jsonError("This subscription plan has been archived and is no longer available", 400);
    }

    subscriptionCredits(plan);
    let reservationResult: ReservationResult;
    try {
      reservationResult = await createPaymentOrderWithPromoReservation({ orderId, companyId, plan, promoCode });
    } catch (error) {
      // Two serverless instances can race after the initial read. The unique
      // deterministic order ID chooses one winner; the loser reuses it.
      if ((error as { code?: string })?.code !== "P2002") throw error;
      const winner = await prisma.paymentOrder.findUnique({ where: { orderId } });
      if (!winner) throw error;
      reservationResult = { kind: "existing", order: winner };
    }
    if (reservationResult.kind === "existing") {
      assertSameCheckout(reservationResult.order, checkoutInput);
      return existingCheckoutResponse(reservationResult.order);
    }
    const reservation = reservationResult.reservation;

    // Invoke PaymentGatewayController for multi-provider routing & safe failover
    const { PaymentGatewayController } = await import("@/lib/payments/PaymentGatewayController");
    let gatewayResult: CreateOrderResult;
    try {
      gatewayResult = await PaymentGatewayController.createOrder(
        {
          orderId,
          amount: reservation.finalPrice,
          currency: plan.currency,
          planName: plan.name,
          planId: plan.id,
          companyId,
          customerName: session.name,
          customerEmail: session.email,
          customerPhone: profile.user?.phoneNumber || undefined,
        },
        paymentMethod,
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
      await releasePromoReservation(orderId).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        gateway: gatewayResult.gateway,
        planId: plan.id,
                planName: plan.name,
        originalPrice: plan.price,
        discountAmount: reservation.discountApplied,
        finalAmount: reservation.finalPrice,
        currency: plan.currency,
        paymentMethod: gatewayResult.gateway,
        status: "CREATED",
        checkoutUrl: gatewayResult.checkoutUrl || `/payment/status?orderId=${orderId}&amount=${reservation.finalPrice}`,
        checkoutParams: gatewayResult.checkoutParams,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

