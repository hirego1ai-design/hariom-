import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { createPurchasedPlanSnapshot, parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";
import { subscriptionCredits, subscriptionExpiry } from "@/lib/payments/subscriptionCredits";
import { planIdSchema } from "@/lib/payments/planContracts";
import { prisma } from "@/lib/prisma";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";

const freeActivationSchema = z.object({ planId: planIdSchema }).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_subscription_get", 60, 60_000);
    const companyId = (await getSessionCompany(session)).id;

    const [credits, activeSubscription, rawPlans, gatewayConfig, copilotConfig, purchaseCount] = await Promise.all([
      subscriptionsDb.getCompanyCredits(companyId),
      subscriptionsDb.getCompanySubscription(companyId),
      subscriptionsDb.getSubscriptionPlans(false),
      PaymentGatewayController.getConfig(),
      subscriptionsDb.getHiringCopilotConfig(),
      prisma.companySubscription.count({ where: { companyId } }),
    ]);
    const plans = rawPlans.map(plan => ({
      ...plan,
      eligible: !plan.firstTimeOnly || purchaseCount === 0,
      eligibilityReason: plan.firstTimeOnly && purchaseCount > 0 ? "First-time employers only" : null,
    }));
    const latestSubscription = activeSubscription ?? await subscriptionsDb.getLatestCompanySubscription(companyId);

    let activePlan = null;
    if (activeSubscription) {
      const snapshot = parsePurchasedPlanSnapshot(activeSubscription.entitlementSnapshot);
      activePlan = { ...snapshot, id: snapshot.planId, description: "Purchased plan terms", isArchived: false };
    }

    const now = new Date();
    let derivedStatus = "INACTIVE";
    let daysRemaining = 0;
    let displayPlan = activePlan;

    if (!displayPlan && latestSubscription?.entitlementSnapshot) {
      try {
        const snapshot = parsePurchasedPlanSnapshot(latestSubscription.entitlementSnapshot);
        displayPlan = { ...snapshot, id: snapshot.planId, description: "Purchased plan terms", isArchived: false };
      } catch {
        displayPlan = null;
      }
    }

    if (latestSubscription) {
      const endDate = new Date(latestSubscription.endDate);
      const diffMs = endDate.getTime() - now.getTime();
      daysRemaining = activeSubscription ? Math.max(0, Math.ceil(diffMs / 86_400_000)) : 0;
      const statusStr = latestSubscription.status || "ACTIVE";
      if (statusStr === "CANCELLED") derivedStatus = "CANCELLED";
      else if (statusStr === "EXPIRED" || endDate <= now) derivedStatus = "EXPIRED";
      else if (activeSubscription && daysRemaining <= 7) derivedStatus = "EXPIRING";
      else if (activeSubscription) derivedStatus = "ACTIVE";
    }

    return NextResponse.json({
      success: true,
      credits,
      activeSubscription,
      activePlan,
      plans,
      copilotConfig,
      gatewayConfig: {
        mode: gatewayConfig.mode,
        primaryGateway: gatewayConfig.primaryGateway,
        allowEmployerSelection: gatewayConfig.allowEmployerSelection,
        gatewaysStatus: gatewayConfig.gatewaysStatus,
      },
      subscriptionState: {
        status: derivedStatus,
        daysRemaining,
        endDate: latestSubscription?.endDate || null,
        price: displayPlan?.price || 0,
        currency: displayPlan?.currency || "INR",
        planName: displayPlan?.name || "No active plan",
        billingMode: "PREPAID_FIXED_TERM",
        autoRenew: false,
        creditAccess: activeSubscription ? "ENABLED" : "LOCKED",
        copilotIncluded: Boolean(activePlan?.copilotIncluded),
      },
      quotas: {
        jobPosts: { left: credits.jobPostsLeft, total: activePlan?.jobPostsQuota ?? 0 },
        resumeUnlocks: { left: credits.resumeUnlocksLeft, total: activePlan?.resumeUnlocksQuota ?? 0 },
        aiInterviews: { left: credits.aiInterviewsLeft, total: activePlan?.aiInterviewsQuota ?? 0 },
        copilotJobs: { left: credits.copilotJobsLeft, total: activePlan?.copilotJobLimit ?? 0 },
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_free_plan_activation", 5, 60_000);
    const company = await getSessionCompany(session);
    const { planId } = await readValidatedJson(request, freeActivationSchema);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.isArchived) throw new ApiError("Plan not available.", 404);
    if (plan.price !== 0 || !plan.firstTimeOnly) {
      throw new ApiError("Paid plans must use verified payment checkout.", 403);
    }

    const snapshot = createPurchasedPlanSnapshot(plan);
    const freeGrantKey = `FREE_GRANT:${company.id}:${plan.id}`;

    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${company.id} FOR UPDATE`;
      const previous = await tx.companySubscription.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, planId: true, paymentId: true, status: true, endDate: true },
      });
      const existingGrant = previous.find(item => item.paymentId === freeGrantKey);
      if (existingGrant) return { idempotent: true, subscription: existingGrant };
      if (previous.length > 0) throw new ApiError("This free plan is available only to first-time employers.", 409);

      const now = new Date();
      const subscription = await tx.companySubscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          entitlementSnapshot: snapshot,
          startDate: now,
          endDate: subscriptionExpiry(now, plan.validityMonths),
          status: "ACTIVE",
          paymentId: freeGrantKey,
        },
      });
      const quotas = subscriptionCredits(snapshot);
      await tx.companyCredits.upsert({
        where: { companyId: company.id },
        create: { companyId: company.id, ...quotas },
        update: {
          jobPostsLeft: { increment: quotas.jobPostsLeft },
          resumeUnlocksLeft: { increment: quotas.resumeUnlocksLeft },
          aiInterviewsLeft: { increment: quotas.aiInterviewsLeft },
          applicationsLeft: { increment: quotas.applicationsLeft },
          resumeDownloadsLeft: { increment: quotas.resumeDownloadsLeft },
          backgroundVerificationsLeft: { increment: quotas.backgroundVerificationsLeft },
          copilotJobsLeft: { increment: quotas.copilotJobsLeft },
        },
      });
      await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: company.id,
          action: "FREE_PLAN_ACTIVATED",
          resource: `SubscriptionPlan:${plan.id}`,
          details: `First-time plan activated with ${plan.jobPostsQuota} job credits.`,
        },
      });
      return { idempotent: false, subscription };
    });

    return NextResponse.json({ success: true, ...result }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
