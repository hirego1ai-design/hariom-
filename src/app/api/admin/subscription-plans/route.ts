import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { createPlanSchema, planIdSchema, updatePlanSchema } from "@/lib/payments/planContracts";
import {
  archiveAdminSubscriptionPlan,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
} from "@/lib/adminSubscriptionPlanMutations";

// GET all subscription plans (Admin view includes archived if requested)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_plans_read:${session.id}`, 60, 60_000);
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "true";
    const plans = await subscriptionsDb.getSubscriptionPlans(includeArchived);
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a subscription plan
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_plans_write:${session.id}`, 20, 60_000);
    const body = await readValidatedJson(request, createPlanSchema);
    const plan = await createAdminSubscriptionPlan(
      { ...body, badgeText: body.badgeText ?? null },
      { actorId: session.id, ipAddress: getClientIp(request) },
    );

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT edit a subscription plan
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_plans_write:${session.id}`, 20, 60_000);
    const { id, ...updates } = await readValidatedJson(request, updatePlanSchema);
    const plan = await updateAdminSubscriptionPlan(
      id,
      updates,
      { actorId: session.id, ipAddress: getClientIp(request) },
    );
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE to archive a plan
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_subscription_plans_write:${session.id}`, 20, 60_000);
    const { searchParams } = new URL(request.url);
    const id = planIdSchema.parse(searchParams.get("id"));
    const plan = await archiveAdminSubscriptionPlan(
      id,
      { actorId: session.id, ipAddress: getClientIp(request) },
    );
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Plan archived successfully", plan });
  } catch (error) {
    return handleApiError(error);
  }
}
