import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const checkoutSchema = z.object({
  planId: z.string().uuid(),
  paymentMethod: z.enum(["RAZORPAY", "STRIPE", "PAYU", "PHONEPE", "AUTO"]).optional(),
  promoCode: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict();

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
    const gatewaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_WEBHOOK_SECRET;

    if (isProduction && !gatewaySecret) {
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

    let finalPrice = plan.price;
    let discountApplied = 0;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      const now = new Date();
      const isExpired = promo?.validUntil && new Date(promo.validUntil) < now;
      const isUsageExceeded = promo && promo.usageCount >= promo.maxUsage;

      if (promo && !promo.isArchived && !isExpired && !isUsageExceeded) {
        if (promo.discountType === "PERCENTAGE") {
          discountApplied = (plan.price * Math.min(100, Math.max(0, promo.discountValue))) / 100;
        } else {
          discountApplied = Math.min(plan.price, Math.max(0, promo.discountValue));
        }
        finalPrice = Math.max(0, plan.price - discountApplied);
      } else if (promoCode) {
        return jsonError("Invalid, expired, or exhausted promo code.", 400);
      }
    }

    const orderId = 'ord_' + crypto.randomUUID();

    await prisma.paymentOrder.create({
      data: {
        orderId,
        companyId,
        planId: plan.id,
        originalAmount: plan.price,
        discountAmount: discountApplied,
        expectedAmount: finalPrice,
        promoCode: promoCode || null,
        status: "INITIATED"
      }
    });

    // Invoke PaymentGatewayController for multi-provider routing & safe failover
    const { PaymentGatewayController } = await import("@/lib/payments/PaymentGatewayController");
    const gatewayResult = await PaymentGatewayController.createOrder(
      {
        orderId,
        amount: finalPrice,
        currency: plan.currency,
        planName: plan.name,
        planId: plan.id,
        companyId,
      },
      paymentMethod
    );

    await prisma.paymentOrder.update({
      where: { orderId },
      data: {
        gateway: gatewayResult.gateway,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        status: "CREATED"
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        gatewayOrderId: gatewayResult.gatewayOrderId,
        gateway: gatewayResult.gateway,
        planId: plan.id,
        planName: plan.name,
        originalPrice: plan.price,
        discountAmount: discountApplied,
        finalAmount: finalPrice,
        currency: plan.currency,
        paymentMethod: gatewayResult.gateway,
        status: "CREATED",
        checkoutUrl: gatewayResult.checkoutUrl || `/payment/status?orderId=${orderId}&amount=${finalPrice}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
