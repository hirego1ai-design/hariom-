import { z } from "zod";

const quota = z.number().int().min(0).max(2_147_483_647);
const safeFeature = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9 _-]*$/);

const base = {
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
  featuresAllowed: z.array(safeFeature).max(100),
};

const legacySchema = z.object({ version: z.literal(1), ...base }).strict();

export const purchasedPlanSnapshotSchema = z.object({
  version: z.literal(2),
  ...base,
  marketingBenefits: z.array(z.string().trim().min(1).max(160)).max(24),
  jobValidityDays: z.number().int().min(1).max(365),
  firstTimeOnly: z.boolean(),
  copilotIncluded: z.boolean(),
  copilotJobLimit: quota,
  isFeatured: z.boolean(),
  badgeText: z.string().trim().max(80).nullable(),
  displayOrder: z.number().int().min(0).max(10000),
}).strict();

export type PurchasedPlanSnapshot = z.infer<typeof purchasedPlanSnapshotSchema>;

type SnapshotSource = Omit<PurchasedPlanSnapshot, "version" | "planId"> & { id: string };

export function createPurchasedPlanSnapshot(plan: SnapshotSource): PurchasedPlanSnapshot {
  return purchasedPlanSnapshotSchema.parse({
    version: 2,
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
    marketingBenefits: plan.marketingBenefits,
    jobValidityDays: plan.jobValidityDays,
    firstTimeOnly: plan.firstTimeOnly,
    copilotIncluded: plan.copilotIncluded,
    copilotJobLimit: plan.copilotJobLimit,
    isFeatured: plan.isFeatured,
    badgeText: plan.badgeText ?? null,
    displayOrder: plan.displayOrder,
  });
}

export function parsePurchasedPlanSnapshot(value: unknown): PurchasedPlanSnapshot {
  const modern = purchasedPlanSnapshotSchema.safeParse(value);
  if (modern.success) return modern.data;

  const legacy = legacySchema.parse(value);
  return purchasedPlanSnapshotSchema.parse({
    version: 2,
    ...legacy,
    version: 2,
    marketingBenefits: legacy.featuresAllowed,
    jobValidityDays: 30,
    firstTimeOnly: false,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: false,
    badgeText: null,
    displayOrder: 0,
  });
}
