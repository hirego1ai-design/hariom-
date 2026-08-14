import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";

// GET AI Service costs and Promo Codes
export async function GET(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [promos, services] = await Promise.all([
    subscriptionsDb.getPromoCodes(),
    subscriptionsDb.getAiServices(),
  ]);

  return NextResponse.json({ success: true, promos, services });
}

// POST create a promo code
export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.code || !body.discountType || body.discountValue === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const promo = await subscriptionsDb.createPromoCode({
      code: body.code.toUpperCase(),
      discountType: body.discountType,
      discountValue: parseFloat(body.discountValue),
      maxUsage: parseInt(body.maxUsage || 9999),
      validUntil: body.validUntil || undefined,
    });

    return NextResponse.json({ success: true, promo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update AI service cost parameters
export async function PUT(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.serviceKey || body.creditCost === undefined || !body.billingType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updated = await subscriptionsDb.updateAiServiceCost(
      body.serviceKey,
      parseInt(body.creditCost),
      body.billingType
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "AI service key not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE to archive/expire a promo code
export async function DELETE(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ success: false, error: "Missing coupon code" }, { status: 400 });
  }

  const archived = await subscriptionsDb.archivePromoCode(code);
  if (!archived) {
    return NextResponse.json({ success: false, error: "Promo code not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Promo code archived successfully" });
}
