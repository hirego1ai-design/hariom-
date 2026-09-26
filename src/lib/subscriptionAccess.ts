import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/apiSecurity";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";

type SubscriptionClient = Pick<Prisma.TransactionClient, "companySubscription">;
type PublicationClient = Pick<Prisma.TransactionClient, "companySubscription" | "companyCredits">;

export async function reconcileExpiredCompanySubscriptions(
  db: SubscriptionClient,
  companyId: string,
  now = new Date(),
): Promise<void> {
  await db.companySubscription.updateMany({
    where: {
      companyId,
      status: "ACTIVE",
      endDate: { lte: now },
    },
    data: { status: "EXPIRED" },
  });
}

export async function findActiveCompanySubscription(
  db: SubscriptionClient,
  companyId: string,
  now = new Date(),
) {
  await reconcileExpiredCompanySubscriptions(db, companyId, now);

  return db.companySubscription.findFirst({
    where: {
      companyId,
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gt: now },
    },
    orderBy: { endDate: "desc" },
  });
}

export async function requireActiveCompanySubscription(
  db: SubscriptionClient,
  companyId: string,
  message = "An active subscription is required for this action. Please purchase or renew a plan.",
) {
  const subscription = await findActiveCompanySubscription(db, companyId);
  if (!subscription) {
    throw new ApiError(message, 403);
  }
  return subscription;
}

export function purchasedPlanHasFeature(entitlementSnapshot: unknown, requiredFeatures: readonly string[]): boolean {
  if (!requiredFeatures.length) return true;
  const plan = parsePurchasedPlanSnapshot(entitlementSnapshot);
  const granted = new Set(plan.featuresAllowed.map(feature => feature.trim().toUpperCase()));
  return granted.has("ALL_FEATURES") || requiredFeatures.some(feature => granted.has(feature.trim().toUpperCase()));
}

export async function requireCompanyPlanFeature(
  db: SubscriptionClient,
  companyId: string,
  requiredFeatures: readonly string[],
  message = "Your current plan does not include this feature.",
) {
  const subscription = await requireActiveCompanySubscription(db, companyId);
  if (!purchasedPlanHasFeature(subscription.entitlementSnapshot, requiredFeatures)) {
    throw new ApiError(message, 403);
  }
  return subscription;
}

export async function consumeJobPublicationEntitlement(
  db: PublicationClient,
  companyId: string,
  now = new Date(),
) {
  const subscription = await requireActiveCompanySubscription(
    db,
    companyId,
    "An active subscription is required to publish jobs. Please purchase or renew a plan.",
  );
  const plan = parsePurchasedPlanSnapshot(subscription.entitlementSnapshot);

  const debited = await db.companyCredits.updateMany({
    where: { companyId, jobPostsLeft: { gt: 0 } },
    data: { jobPostsLeft: { decrement: 1 } },
  });
  if (debited.count !== 1) {
    throw new ApiError("No job-post credits remain on the active plan.", 402);
  }

  let copilotEnabled = false;
  if (plan.copilotAutoActivate && plan.copilotJobsQuota > 0) {
    const copilotDebit = await db.companyCredits.updateMany({
      where: { companyId, copilotJobsLeft: { gt: 0 } },
      data: { copilotJobsLeft: { decrement: 1 } },
    });
    if (copilotDebit.count !== 1) {
      throw new ApiError("The plan promises Co-Pilot for this job, but its Co-Pilot allocation is unavailable.", 409);
    }
    copilotEnabled = true;
  }

  const balances = await db.companyCredits.findUnique({ where: { companyId } });
  if (!balances) throw new ApiError("Company quota account is unavailable.", 409);

  const publishedAt = new Date(now);
  const expiresAt = new Date(now.getTime() + plan.jobValidityDays * 24 * 60 * 60 * 1000);

  return {
    plan,
    publishedAt,
    expiresAt,
    copilotEnabled,
    remainingJobPosts: balances.jobPostsLeft,
    remainingCopilotJobs: balances.copilotJobsLeft,
  };
}
