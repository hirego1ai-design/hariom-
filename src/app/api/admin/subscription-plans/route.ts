import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { createPlanSchema, updatePlanSchema } from "@/lib/payments/planContracts";

// GET all subscription plans (Admin view includes archived if requested)
export async function GET(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const plans = await subscriptionsDb.getSubscriptionPlans(includeArchived);
  return NextResponse.json({ success: true, plans });
}

// POST create a subscription plan
export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readValidatedJson(request, createPlanSchema);
    const plan = await subscriptionsDb.createSubscriptionPlan(body);

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT edit a subscription plan
export async function PUT(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...updates } = await readValidatedJson(request, updatePlanSchema);
    const plan = await subscriptionsDb.updateSubscriptionPlan(id, updates);
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
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Missing plan ID" }, { status: 400 });
  }

  const plan = await subscriptionsDb.archiveSubscriptionPlan(id);
  if (!plan) {
    return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Plan archived successfully", plan });
}
