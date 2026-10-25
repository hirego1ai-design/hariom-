import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import {
  archiveAdminPromoCode,
  createAdminPromoCode,
  updateAdminAiServiceCost,
} from "@/lib/adminSubscriptionSettingsMutations";

const promoSchema = z.object({
  code: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_-]+$/),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.number().finite().positive().max(100000000),
  maxUsage: z.number().int().positive().max(1000000),
  validUntil: z.string().datetime().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.discountType === "PERCENTAGE" && value.discountValue > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["discountValue"], message: "Percentage discount cannot exceed 100%." });
  }
});

const serviceCostSchema = z.object({
  serviceKey: z.string().trim().min(1).max(100),
  creditCost: z.number().int().min(0).max(1000000),
  billingType: z.enum(["CREDIT_BASED", "INCLUDED", "PAID_ADDON"]),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_settings_read:${admin.id}`, 60, 60_000);
    const [promos, services] = await Promise.all([
      subscriptionsDb.getPromoCodes(),
      subscriptionsDb.getAiServices(),
    ]);
    return NextResponse.json({
      success: true,
      promos,
      services,
      copilotConfig: null,
      copilotCommercePath: "/admin/copilot-commerce",
    });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_settings_write:${admin.id}`, 20, 60_000);
    const body = await readValidatedJson(request, promoSchema);
    const promo = await createAdminPromoCode(body, {
      actorId: admin.id,
      ipAddress: getClientIp(request),
    });
    return NextResponse.json({ success: true, promo }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_settings_write:${admin.id}`, 20, 60_000);
    const raw = await readValidatedJson(request, z.record(z.string(), z.unknown()), 64 * 1024);
    if (raw.kind === "COPILOT_CONFIG") {
      throw new ApiError("Legacy per-job Co-Pilot configuration is disabled. Use the standalone Copilot Commerce console.", 409);
    }
    const body = serviceCostSchema.parse(raw);
    const updated = await updateAdminAiServiceCost(body, {
      actorId: admin.id,
      ipAddress: getClientIp(request),
    });
    if (!updated) return NextResponse.json({ success: false, error: "AI service key not found" }, { status: 404 });
    return NextResponse.json({ success: true, service: updated });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_settings_write:${admin.id}`, 20, 60_000);
    const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9_-]{3,64}$/.test(code)) throw new ApiError("A valid coupon code is required", 400);
    const archived = await archiveAdminPromoCode(code, {
      actorId: admin.id,
      ipAddress: getClientIp(request),
    });
    if (!archived) return NextResponse.json({ success: false, error: "Promo code not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Promo code archived successfully" });
  } catch (error) { return handleApiError(error); }
}
