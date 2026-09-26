import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/apiSecurity";

type SubscriptionClient = Pick<Prisma.TransactionClient, "companySubscription">;

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
