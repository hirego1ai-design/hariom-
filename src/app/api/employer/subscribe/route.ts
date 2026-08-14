import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { prisma } from "@/lib/prisma";

// GET employer's subscription, credits, and available plans
export async function GET(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || (session.role !== "EMPLOYER" && session.role !== "ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Resolve companyId (default to "comp-1")
  let companyId = "comp-1";
  const profile = await prisma.employerProfile.findUnique({
    where: { userId: session.id },
  });
  if (profile) {
    companyId = profile.companyId;
  }

  const [credits, activeSubscription, plans] = await Promise.all([
    subscriptionsDb.getCompanyCredits(companyId),
    subscriptionsDb.getCompanySubscription(companyId),
    subscriptionsDb.getSubscriptionPlans(false),
  ]);

  let activePlan = null;
  if (activeSubscription) {
    activePlan = await subscriptionsDb.getSubscriptionPlanById(activeSubscription.planId);
  }

  // Calculate derived subscription state
  const now = new Date();
  let derivedStatus = "INACTIVE";
  let daysRemaining = 0;

  if (activeSubscription) {
    const endDate = new Date(activeSubscription.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const statusStr = (activeSubscription.status as string) || "ACTIVE";
    if (statusStr === "CANCELLED") {
      derivedStatus = "CANCELLED";
    } else if (statusStr === "PAYMENT_FAILED") {
      derivedStatus = "PAYMENT_FAILED";
    } else if (endDate < now) {
      derivedStatus = "EXPIRED";
    } else if (daysRemaining <= 7) {
      derivedStatus = "EXPIRING";
    } else {
      derivedStatus = "ACTIVE";
    }
  }

  return NextResponse.json({
    success: true,
    credits,
    activeSubscription,
    activePlan,
    plans,
    subscriptionState: {
      status: derivedStatus,
      daysRemaining,
      endDate: activeSubscription?.endDate || null,
      price: activePlan?.price || 0,
      currency: activePlan?.currency || "INR",
      planName: activePlan?.name || "Free Tier",
    },
    quotas: {
      jobPosts: { left: credits.jobPostsLeft, total: activePlan?.jobPostsQuota || 10 },
      resumeUnlocks: { left: credits.resumeUnlocksLeft, total: activePlan?.resumeUnlocksQuota || 100 },
      aiInterviews: { left: credits.aiInterviewsLeft, total: activePlan?.aiInterviewsQuota || 40 },
    },
  });
}

// POST purchase/activate a plan
export async function POST(request: NextRequest) {
  const session = await getCurrentSession(request.headers);
  if (!session || (session.role !== "EMPLOYER" && session.role !== "ADMIN")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { planId } = body;
    if (!planId) {
      return NextResponse.json({ success: false, error: "Missing planId" }, { status: 400 });
    }

    // Resolve companyId (default to "comp-1")
    let companyId = "comp-1";
    const profile = await prisma.employerProfile.findUnique({
      where: { userId: session.id },
    });
    if (profile) {
      companyId = profile.companyId;
    }

    const paymentId = crypto.randomUUID();
    const subscription = await subscriptionsDb.subscribeCompanyToPlan(companyId, planId, paymentId);

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully!",
      subscription,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
