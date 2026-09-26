import type { Prisma } from "@prisma/client";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";
import { jobExpiry } from "@/lib/payments/subscriptionCredits";
import { requireActiveCompanySubscription } from "@/lib/subscriptionAccess";

type Tx = Prisma.TransactionClient;

export async function getActivePlanSnapshot(tx: Tx, companyId: string) {
  const subscription = await requireActiveCompanySubscription(
    tx,
    companyId,
    "An active hiring plan is required to publish jobs.",
  );
  return parsePurchasedPlanSnapshot(subscription.entitlementSnapshot);
}

export async function getJobPublicationTerms(tx: Tx, companyId: string, now = new Date()) {
  const snapshot = await getActivePlanSnapshot(tx, companyId);
  return {
    snapshot,
    publishedAt: now,
    expiresAt: jobExpiry(now, snapshot.jobValidityDays),
  };
}
