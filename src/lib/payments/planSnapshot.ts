import { z } from "zod";

const quota = z.number().int().min(0).max(2_147_483_647);

export const purchasedPlanSnapshotSchema = z.object({
  version: z.literal(1),
  planId: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(200),
  price: z.number().finite().min(0).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  validityMonths: z.number().int().min(1).max(120),
  jobPostsQuota: quota,
  resumeUnlocksQuota: quota,
  aiInterviewsQuota: quota,
  applicationsQuota: quota,
  resumeDownloadsQuota: quota,
  backgroundVerificationsQuota: quota,
  featuresAllowed: z.array(z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9 _-]*$/)).max(100),
}).strict();

export type PurchasedPlanSnapshot = z.infer<typeof purchasedPlanSnapshotSchema>;

type SnapshotSource = Omit<PurchasedPlanSnapshot, "version" | "planId"> & { id: string };

export function createPurchasedPlanSnapshot(plan: SnapshotSource): PurchasedPlanSnapshot {
  return purchasedPlanSnapshotSchema.parse({
    version: 1,
    planId: plan.id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    validityMonths: plan.validityMonths,
    jobPostsQuota: plan.jobPostsQuota,
    resumeUnlocksQuota: plan.resumeUnlocksQuota,
    aiInterviewsQuota: plan.aiInterviewsQuota,
    applicationsQuota: plan.applicationsQuota,
    resumeDownloadsQuota: plan.resumeDownloadsQuota,
    backgroundVerificationsQuota: plan.backgroundVerificationsQuota,
    featuresAllowed: plan.featuresAllowed,
  });
}

export function parsePurchasedPlanSnapshot(value: unknown): PurchasedPlanSnapshot {
  return purchasedPlanSnapshotSchema.parse(value);
}
