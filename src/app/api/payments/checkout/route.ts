import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { ApiError, getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import type { CreateOrderResult } from "@/lib/payments/PaymentGatewayInterface";
import { subscriptionCredits } from "@/lib/payments/subscriptionCredits";

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "PAYU", "PHONEPE", "AUTO"]).optional(),
  promoCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();

type CheckoutPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
};

type PromoReservation = {
  code: string;
  discountApplied: number;
  finalPrice: number;
};

async function createPaymentOrderWithPromoReservation(params: {
  orderId: string;
  companyId: string;
  plan: CheckoutPlan;
  promoCode?: string;
}): Promise<PromoReservation> {
  const { orderId, companyId, plan, promoCode } = params;
  return prisma.$transaction(async (tx) => {
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
      const isExpired = promo?.validUntil && promo.validUntil < new Date();
      if (!promo || promo.isArchived || isExpired || promo.usageCount + promo.reservedUsage >= promo.maxUsage) {
        throw new ApiError("Invalid, expired, or exhausted promo code.", 400);
      }

      const discountApplied = promo.discountType === "PERCENTAGE"
        ? (plan.price * Math.min(100, Math.max(0, promo.discountValue))) / 100
        : Math.min(plan.price, Math.max(0, promo.discountValue));
      reservation = {
        code: promo.code,
        discountApplied,
        finalPrice: Math.max(0, plan.price - discountApplied),
      };

      await tx.promoCode.update({
        where: { id: promo.id },
        data: { reservedUsage: { increment: 1 } },
      });
    }

    await tx.paymentOrder.create({
      data: {
        orderId,
        companyId,
        planId: plan.id,
        originalAmount: plan.price,
        discountAmount: reservation.discountApplied,
        expectedAmount: reservation.finalPrice,
        promoCode: reservation.code || null,
        promoReservationState: reservation.code ? "RESERVED" : null,
        status: "INITIATED",
      },
    });
    return reservation;
  });
}

async function releasePromoReservation(orderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { orderId } });
    if (!order || order.promoReservationState !== "RESERVED" || !order.promoCode) return;

    const promos = await tx.$queryRaw<Array<{ id: string; reservedUsage: number }>>`
      SELECT "id", "reservedUsage"
      FROM "PromoCode"
      WHERE "code" = ${order.promoCode}
      FOR UPDATE
    `;
    const promo = promos[0];
    if (promo && promo.reservedUsage > 0) {
      await tx.promoCode.update({ where: { id: promo.id }, data: { reservedUsage: { decrement: 1 } } });
    }
    await tx.paymentOrder.update({
      where: { orderId },
      data: { status: "FAILED", promoReservationState: "RELEASED" },
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession(req.headers);
    if (!session || !["EMPLOYER", "RECRUITER"].includes(session.role)) {
      return jsonError("Unauthorized access", 401);
    }

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (!profile || !profile.companyId) {
      return jsonError("No employer profile found for this account", 403);
    }
    const companyId = profile.companyId;

    const { planId, paymentMethod, promoCode } = await readValidatedJson(req, checkoutSchema);

    const isProduction = process.env.NODE_ENV === "production";
    const hasRazorpayCredentials = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

    if (isProduction && !hasRazorpayCredentials) {
      throw new Error("Payment gateway credentials not configured in production environment.");
    }

    if (!planId) {
      return jsonError("planId is required", 400);
    }

    // Fetch plan details
    let plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      if (isProduction) {
        return jsonError("Subscription plan not found", 404);
      }

      // Development-only fallback plan tier mapping
      const planPrices: Record<string, { name: string; price: number; credits: number }> = {
        bootstrapped: { name: "Bootstrapped", price: 4999, credits: 3 },
        hypergrowth: { name: "Hypergrowth", price: 14999, credits: 10 },
        unicorn: { name: "Unicorn Mode", price: 49999, credits: 50 },
      };

      const selected = planPrices[planId] || { name: "Standard Plan", price: 9999, credits: 5 };
      plan = {
        id: planId,
        name: selected.name,
        description: "Plan subscription",
        price: selected.price,
        currency: "INR",
        jobPostsQuota: selected.credits,
        resumeUnlocksQuota: selected.credits * 10,
        aiInterviewsQuota: selected.credits * 5,
        applicationsQuota: 500,
        resumeDownloadsQuota: 250,
        backgroundVerificationsQuota: 20,
        featuresAllowed: ["All Tiers"],
        validityMonths: 1,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (plan.isArchived) {
      return jsonError("This subscription plan has been archived and is no longer available", 400);
    }

    subscriptionCredits(plan);
    const orderId = 'ord_' + crypto.randomUUID();
    const reservation = await createPaymentOrderWithPromoReservation({ orderId, companyId, plan, promoCode });

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
        keyId: gatewayResult.gateway === "RAZORPAY" ? process.env.RAZORPAY_KEY_ID : undefined,
        planName: plan.name,
        originalPrice: plan.price,
        discountAmount: reservation.discountApplied,
        finalAmount: reservation.finalPrice,
        currency: plan.currency,
        paymentMethod: gatewayResult.gateway,
        status: "CREATED",
        checkoutUrl: gatewayResult.checkoutUrl || `/payment/status?orderId=${orderId}&amount=${reservation.finalPrice}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
