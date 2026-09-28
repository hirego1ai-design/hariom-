import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { SubscriptionPlanRecord } from "./subscriptions-db";
import { enqueueSecurityAuditEvent } from "./securityAuditOutbox";
import { ApiError } from "./apiSecurity";

type AdminMutationContext = {
  actorId: string;
  ipAddress?: string;
};

type CreatePlanInput = Omit<
  SubscriptionPlanRecord,
  "id" | "isArchived" | "createdAt" | "updatedAt"
>;

type UpdatePlanInput = Partial<
  Omit<SubscriptionPlanRecord, "id" | "createdAt" | "updatedAt">
>;

function presentPlan(record: any): SubscriptionPlanRecord {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    price: record.price,
    currency: record.currency,
    jobPostsQuota: record.jobPostsQuota,
    resumeUnlocksQuota: record.resumeUnlocksQuota,
    aiInterviewsQuota: record.aiInterviewsQuota,
    applicationsQuota: record.applicationsQuota,
    resumeDownloadsQuota: record.resumeDownloadsQuota,
    backgroundVerificationsQuota: record.backgroundVerificationsQuota,
    featuresAllowed: record.featuresAllowed,
    marketingBenefits: record.marketingBenefits,
    validityMonths: record.validityMonths,
    jobValidityDays: record.jobValidityDays,
    firstTimeOnly: record.firstTimeOnly,
    copilotIncluded: record.copilotIncluded,
    copilotJobLimit: record.copilotJobLimit,
    isFeatured: record.isFeatured,
    badgeText: record.badgeText,
    displayOrder: record.displayOrder,
    isArchived: record.isArchived,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  context: AdminMutationContext,
  action: string,
  resource: string,
  details: string,
) {
  const auditLog = await tx.auditLog.create({
    data: {
      userId: context.actorId,
      action,
      resource,
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      details,
    },
  });
  await enqueueSecurityAuditEvent(tx, auditLog, context.actorId);
}

export async function createAdminSubscriptionPlan(
  payload: CreatePlanInput,
  context: AdminMutationContext,
): Promise<SubscriptionPlanRecord> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.subscriptionPlan.create({
      data: {
        id: randomUUID(),
        name: payload.name,
        description: payload.description,
        price: payload.price,
        currency: payload.currency,
        jobPostsQuota: payload.jobPostsQuota,
        resumeUnlocksQuota: payload.resumeUnlocksQuota,
        aiInterviewsQuota: payload.aiInterviewsQuota,
        applicationsQuota: payload.applicationsQuota,
        resumeDownloadsQuota: payload.resumeDownloadsQuota,
        backgroundVerificationsQuota: payload.backgroundVerificationsQuota,
        featuresAllowed: payload.featuresAllowed,
        marketingBenefits: payload.marketingBenefits,
        validityMonths: payload.validityMonths,
        jobValidityDays: payload.jobValidityDays,
        firstTimeOnly: payload.firstTimeOnly,
        copilotIncluded: payload.copilotIncluded,
        copilotJobLimit: payload.copilotJobLimit,
        isFeatured: payload.isFeatured,
        badgeText: payload.badgeText ?? null,
        displayOrder: payload.displayOrder,
        isArchived: false,
      },
    });

    await writeAudit(
      tx,
      context,
      "SUBSCRIPTION_PLAN_CREATED",
      `SubscriptionPlan:${created.id}`,
      `Plan created; currency:${created.currency}; price:${created.price}`,
    );
    return presentPlan(created);
  });
}

export async function updateAdminSubscriptionPlan(
  id: string,
  updates: UpdatePlanInput,
  context: AdminMutationContext,
  expectedUpdatedAt: string,
): Promise<SubscriptionPlanRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return null;
    if (existing.updatedAt.toISOString() !== expectedUpdatedAt) {
      throw new ApiError("Subscription plan changed; reload before saving.", 409);
    }

    const changed = await tx.subscriptionPlan.updateMany({
      where: { id, updatedAt: existing.updatedAt },
      data: updates as any,
    });
    if (changed.count !== 1) {
      throw new ApiError("Subscription plan changed; refresh before saving.", 409);
    }
    const updated = await tx.subscriptionPlan.findUniqueOrThrow({ where: { id } });
    await writeAudit(
      tx,
      context,
      "SUBSCRIPTION_PLAN_UPDATED",
      `SubscriptionPlan:${id}`,
      `changedKeys:${Object.keys(updates).sort().join(",")}`,
    );
    return presentPlan(updated);
  });
}

export async function archiveAdminSubscriptionPlan(
  id: string,
  context: AdminMutationContext,
  expectedUpdatedAt?: string,
): Promise<SubscriptionPlanRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) return null;
    if (existing.isArchived) return presentPlan(existing);
    if (expectedUpdatedAt && existing.updatedAt.toISOString() !== expectedUpdatedAt) {
      throw new ApiError("Subscription plan changed; reload before archiving.", 409);
    }

    const changed = await tx.subscriptionPlan.updateMany({
      where: { id, isArchived: false, updatedAt: existing.updatedAt },
      data: { isArchived: true },
    });
    if (changed.count !== 1) {
      throw new ApiError("Subscription plan changed; refresh before archiving.", 409);
    }
    const archived = await tx.subscriptionPlan.findUniqueOrThrow({ where: { id } });
    await writeAudit(
      tx,
      context,
      "SUBSCRIPTION_PLAN_ARCHIVED",
      `SubscriptionPlan:${id}`,
      "Plan archived by administrator",
    );
    return presentPlan(archived);
  });
}
