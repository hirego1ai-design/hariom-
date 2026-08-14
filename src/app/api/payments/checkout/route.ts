import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = getCurrentSession(req.headers);
    if (!session) {
      return jsonError("Unauthorized access", 401);
    }

    const body = await req.json();
    const { planId, paymentMethod, promoCode } = body;

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
      // Fallback plan tier mapping
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

    let finalPrice = plan.price;
    let discountApplied = 0;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (promo && !promo.isArchived) {
        if (promo.discountType === "PERCENTAGE") {
          discountApplied = (plan.price * promo.discountValue) / 100;
        } else {
          discountApplied = promo.discountValue;
        }
        finalPrice = Math.max(0, plan.price - discountApplied);
      }
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Resolve companyId
    let companyId = "comp-1";
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (profile) {
      companyId = profile.companyId;
    }

    // Invoke PaymentGatewayController for multi-provider routing & safe failover
    const { PaymentGatewayController } = await import("@/lib/payments/PaymentGatewayController");
    const gatewayResult = await PaymentGatewayController.createOrder(
      {
        orderId,
        amount: finalPrice,
        currency: plan.currency,
        planName: plan.name,
        companyId,
      },
      paymentMethod
    );

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
