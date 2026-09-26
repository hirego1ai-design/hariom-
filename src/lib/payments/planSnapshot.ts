import { z } from "zod";

const quota = z.number().int().min(0).max(2_147_483_647);
const benefit = z.string().trim().min(1).max(180).regex(/^[^<>\u0000-\u001F\u007F]+$/);

export const purchasedPlanSnapshotSchema = z.object({
  version: z.literal(1),
  planId: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(200),
  price: z.number().finite().min(0).max(1_000_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  validityMonths: z.number().int().min(1).max(120),
  jobValidityDays: z.number().int().min(1).max(365).default(7),
  planType: z.enum(["FREE_TRIAL", "STANDARD", "COPILOT"]).default("STANDARD"),
  firstTimeOnly: z.boolean().default(false),
  copilotJobsQuota: quota.default(0),
  copilotAutoActivate: z.boolean().default(false),
  badge: z.string().trim().max(80).nullable().optional(),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().min(-10_000).max(10_000).default(0),
  displayBenefits: z.array(benefit).max(30).default([]),
  jobPostsQuota: quota,
  resumeUnlocksQuota: quota,
  aiInterviewsQuota: quota,
  applicationsQuota: quota,
  resumeDownloadsQuota: quota,
  backgroundVerificationsQuota: quota,
  featuresAllowed: z.array(z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/)).max(100),
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
    jobValidityDays: plan.jobValidityDays,
    planType: plan.planType,
    firstTimeOnly: plan.firstTimeOnly,
    copilotJobsQuota: plan.copilotJobsQuota,
    copilotAutoActivate: plan.copilotAutoActivate,
    badge: plan.badge ?? null,
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
}

export function parsePurchasedPlanSnapshot(value: unknown): PurchasedPlanSnapshot {
  return purchasedPlanSnapshotSchema.parse(value);
}
