import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { subscriptionsDb } from "@/lib/subscriptions-db";
import { PaymentGatewayController } from "@/lib/payments/PaymentGatewayController";
import { createPurchasedPlanSnapshot, parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";
import { complimentaryActivationSchema } from "@/lib/payments/planContracts";
import { subscriptionCredits, subscriptionExpiry } from "@/lib/payments/subscriptionCredits";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";

function pickCopilotUpsell(plans: Awaited<ReturnType<typeof subscriptionsDb.getSubscriptionPlans>>, sourcePlanId: string) {
  const source = plans.find(plan => plan.id === sourcePlanId);
  if (!source || source.copilotJobsQuota > 0) return null;

  const candidates = plans
    .filter(plan =>
      !plan.isArchived &&
      plan.copilotJobsQuota > 0 &&
      plan.jobPostsQuota >= source.jobPostsQuota &&
      plan.price >= source.price,
    )
    .sort((a, b) => {
      const aExact = a.jobPostsQuota === source.jobPostsQuota ? 0 : 1;
      const bExact = b.jobPostsQuota === source.jobPostsQuota ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      if (a.price !== b.price) return a.price - b.price;
      return a.displayOrder - b.displayOrder;
    });

  return candidates[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_subscription_get", 60, 60_000);

    const companyId = (await getSessionCompany(session)).id;
    const [credits, activeSubscription, plans, gatewayConfig, priorSubscriptions] = await Promise.all([
      subscriptionsDb.getCompanyCredits(companyId),
      subscriptionsDb.getCompanySubscription(companyId),
      subscriptionsDb.getSubscriptionPlans(false),
      PaymentGatewayController.getConfig(),
      prisma.companySubscription.count({ where: { companyId } }),
    ]);

    const latestSubscription = activeSubscription ?? await subscriptionsDb.getLatestCompanySubscription(companyId);

    let activePlan = null;
    if (activeSubscription?.entitlementSnapshot) {
      try {
        const snapshot = parsePurchasedPlanSnapshot(activeSubscription.entitlementSnapshot);
        activePlan = {
          ...snapshot,
          id: snapshot.planId,
          description: "Purchased subscription terms",
          isArchived: false,
        };
      } catch {
        activePlan = null;
      }
    }

    const now = new Date();
    let derivedStatus = "INACTIVE";
    let daysRemaining = 0;
    let displayPlan = activePlan;

    if (!displayPlan && latestSubscription?.entitlementSnapshot) {
      try {
        const snapshot = parsePurchasedPlanSnapshot(latestSubscription.entitlementSnapshot);
        displayPlan = {
          ...snapshot,
          id: snapshot.planId,
          description: "Purchased subscription terms",
          isArchived: false,
        };
      } catch {
        displayPlan = null;
      }
    }

    if (latestSubscription) {
      const endDate = new Date(latestSubscription.endDate);
      const diffMs = endDate.getTime() - now.getTime();
      daysRemaining = activeSubscription
        ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        : 0;

      const statusStr = (latestSubscription.status as string) || "ACTIVE";
      if (statusStr === "CANCELLED") derivedStatus = "CANCELLED";
      else if (statusStr === "PAYMENT_FAILED") derivedStatus = "PAYMENT_FAILED";
      else if (statusStr === "EXPIRED" || endDate <= now) derivedStatus = "EXPIRED";
      else if (activeSubscription && daysRemaining <= 7) derivedStatus = "EXPIRING";
      else if (activeSubscription) derivedStatus = "ACTIVE";
    }

    const freePlanEligible = priorSubscriptions === 0;
    const catalog = plans.map(plan => ({
      ...plan,
      eligible: !plan.firstTimeOnly || freePlanEligible,
    }));
    const copilotUpsells = Object.fromEntries(
      plans.map(plan => [plan.id, pickCopilotUpsell(plans, plan.id)]).filter(([, plan]) => Boolean(plan)),
    );

    return NextResponse.json({
      success: true,
      credits,
      activeSubscription,
      activePlan,
      plans: catalog,
      freePlanEligible,
      copilotUpsells,
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
      },
      quotas: {
        jobPosts: { left: credits.jobPostsLeft, total: activePlan?.jobPostsQuota ?? 0 },
        copilotJobs: { left: credits.copilotJobsLeft, total: activePlan?.copilotJobsQuota ?? 0 },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Zero-price first-time trial activation. Paid plans can only be activated by
// a verified payment webhook; this endpoint never accepts a client amount.
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) throw new ApiError("Unauthorized", 401);
    if (session.role !== "EMPLOYER") throw new ApiError("Employer access required.", 403);
    await enforceRateLimit(request, "employer_subscription_complimentary_activation", 5, 60_000);

    const companyId = (await getSessionCompany(session)).id;
    const { planId } = await readValidatedJson(request, complimentaryActivationSchema);

    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Company" WHERE "id" = ${companyId} FOR UPDATE`;

      const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan || plan.isArchived) throw new ApiError("Plan not found.", 404);
      if (plan.price !== 0 || plan.planType !== "FREE_TRIAL" || !plan.firstTimeOnly) {
        throw new ApiError("This plan requires the verified payment checkout flow.", 403);
      }

      const priorSubscriptions = await tx.companySubscription.count({ where: { companyId } });
      if (priorSubscriptions > 0) {
        throw new ApiError("The first-time free plan has already been used or is no longer available for this company.", 409);
      }

      const snapshot = createPurchasedPlanSnapshot({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        validityMonths: plan.validityMonths,
        jobValidityDays: plan.jobValidityDays,
        planType: plan.planType as "FREE_TRIAL" | "STANDARD" | "COPILOT",
        firstTimeOnly: plan.firstTimeOnly,
        copilotJobsQuota: plan.copilotJobsQuota,
        copilotAutoActivate: plan.copilotAutoActivate,
        badge: plan.badge,
        isFeatured: plan.isFeatured,
        displayOrder: plan.displayOrder,
        displayBenefits: plan.displayBenefits,
        jobPostsQuota: plan.jobPostsQuota,
        resumeUnlocksQuota: plan.resumeUnlocksQuota,
        aiInterviewsQuota: plan.aiInterviewsQuota,
        applicationsQuota: plan.applicationsQuota,
        resumeDownloadsQuota: plan.resumeDownloadsQuota,
        backgroundVerificationsQuota: plan.backgroundVerificationsQuota,
        featuresAllowed: plan.featuresAllowed,
      });

      const now = new Date();
      const subscription = await tx.companySubscription.create({
        data: {
          companyId,
          planId: plan.id,
          entitlementSnapshot: snapshot,
          startDate: now,
          endDate: subscriptionExpiry(now, plan.validityMonths),
          status: "ACTIVE",
          paymentId: null,
        },
      });

      const quotaCredits = subscriptionCredits(snapshot);
      const credits = await tx.companyCredits.upsert({
        where: { companyId },
        create: { companyId, ...quotaCredits },
        update: quotaCredits,
      });

      await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId,
          action: "FIRST_TIME_FREE_PLAN_ACTIVATED",
          resource: `SubscriptionPlan:${plan.id}`,
          details: JSON.stringify({
            planId: plan.id,
            jobPosts: plan.jobPostsQuota,
            jobValidityDays: plan.jobValidityDays,
          }),
        },
      });

      return { subscription, credits, plan: snapshot };
    });

    return NextResponse.json({
      success: true,
      activeSubscription: {
        id: result.subscription.id,
        planId: result.subscription.planId,
        startDate: result.subscription.startDate,
        endDate: result.subscription.endDate,
        status: result.subscription.status,
      },
      activePlan: result.plan,
      credits: result.credits,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
