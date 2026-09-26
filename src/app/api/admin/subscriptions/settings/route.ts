import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { copilotConfigSchema } from "@/lib/payments/planContracts";

const promoSchema = z.object({
  code: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().finite().positive().max(100000000),
  maxUsage: z.number().int().positive().max(1000000).optional(),
  validUntil: z.string().datetime().optional(),
}).strict();

const serviceCostSchema = z.object({
  serviceKey: z.string().trim().min(1).max(100),
  creditCost: z.number().int().min(0).max(1000000),
  billingType: z.enum(["CREDIT_BASED", "INCLUDED", "PAID_ADDON"]),
}).strict();

async function requireAdmin(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required", 403);
  return session;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await enforceRateLimit(request, "admin_subscription_settings_read", 60, 60_000);
    const [promos, services, copilotConfig] = await Promise.all([
      subscriptionsDb.getPromoCodes(),
      subscriptionsDb.getAiServices(),
      subscriptionsDb.getHiringCopilotConfig(),
    ]);
    return NextResponse.json({ success: true, promos, services, copilotConfig });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await enforceRateLimit(request, "admin_subscription_settings_write", 20, 60_000);
    const body = await readValidatedJson(request, promoSchema);
    const promo = await subscriptionsDb.createPromoCode({
      code: body.code.toUpperCase(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      maxUsage: body.maxUsage ?? 9999,
      validUntil: body.validUntil,
    });
    return NextResponse.json({ success: true, promo }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    await enforceRateLimit(request, "admin_subscription_settings_write", 20, 60_000);
    const raw = await request.json();
    if (raw?.kind === "COPILOT_CONFIG") {
      const body = copilotConfigSchema.parse(raw.config);
      const copilotConfig = await subscriptionsDb.updateHiringCopilotConfig(body);
      return NextResponse.json({ success: true, copilotConfig });
    }
    const body = serviceCostSchema.parse(raw);
    const updated = await subscriptionsDb.updateAiServiceCost(body.serviceKey, body.creditCost, body.billingType);
    if (!updated) return NextResponse.json({ success: false, error: "AI service key not found" }, { status: 404 });
    return NextResponse.json({ success: true, service: updated });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    await enforceRateLimit(request, "admin_subscription_settings_write", 20, 60_000);
    const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9_-]{3,64}$/.test(code)) throw new ApiError("A valid coupon code is required", 400);
    const archived = await subscriptionsDb.archivePromoCode(code);
    if (!archived) return NextResponse.json({ success: false, error: "Promo code not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Promo code archived successfully" });
  } catch (error) { return handleApiError(error); }
}
