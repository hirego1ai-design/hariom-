import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";

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
    const body = await request.json();
    if (!body.name || !body.description || body.price === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const plan = await subscriptionsDb.createSubscriptionPlan({
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      currency: body.currency || "INR",
      jobPostsQuota: parseInt(body.jobPostsQuota || 0),
      resumeUnlocksQuota: parseInt(body.resumeUnlocksQuota || 0),
      aiInterviewsQuota: parseInt(body.aiInterviewsQuota || 0),
      applicationsQuota: parseInt(body.applicationsQuota || 100),
      resumeDownloadsQuota: parseInt(body.resumeDownloadsQuota || 50),
      backgroundVerificationsQuota: parseInt(body.backgroundVerificationsQuota || 5),
      featuresAllowed: body.featuresAllowed || [],
      validityMonths: parseInt(body.validityMonths || 1),
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT edit a subscription plan
export async function PUT(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Missing plan ID" }, { status: 400 });
    }

    const plan = await subscriptionsDb.updateSubscriptionPlan(body.id, body);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
