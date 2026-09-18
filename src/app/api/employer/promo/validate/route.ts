import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(request: NextRequest) {
 try {
  await enforceRateLimit(request, "promo_validate", 30, 60_000);
  const session = await getCurrentSession(request.headers);
  if (!session || (session.role !== "EMPLOYER" && session.role !== "ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const planId = searchParams.get("planId")?.trim();

  if (!code || !planId || code.length > 64 || planId.length > 128) {
    return NextResponse.json({ success: false, error: "Missing code or planId parameter" }, { status: 400 });
  }

  const [promo, plan] = await Promise.all([
    subscriptionsDb.validatePromoCode(code),
    subscriptionsDb.getSubscriptionPlanById(planId),
  ]);

  if (!plan) {
    return NextResponse.json({ success: false, error: "Target plan not found" }, { status: 404 });
  }

  if (!promo) {
    return NextResponse.json({ success: false, error: "Invalid, expired, or max-used promo code" }, { status: 400 });
  }

  let discountAmount = 0;
  if (promo.discountType === "PERCENTAGE") {
    discountAmount = (plan.price * promo.discountValue) / 100;
  } else {
    discountAmount = promo.discountValue;
  }

  discountAmount = Math.min(discountAmount, plan.price);
  const finalPrice = Math.max(0, plan.price - discountAmount);

  return NextResponse.json({
    success: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    originalPrice: plan.price,
    discountAmount,
    finalPrice,
    savings: discountAmount,
  });
 } catch (error) { return handleApiError(error); }
}
