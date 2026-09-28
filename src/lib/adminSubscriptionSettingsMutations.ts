import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./apiSecurity";
import { enqueueSecurityAuditEvent } from "./securityAuditOutbox";

type AdminMutationContext = {
  actorId: string;
  ipAddress?: string;
};

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

export async function createAdminPromoCode(
  payload: {
    code: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxUsage: number;
    validUntil?: string;
  },
  context: AdminMutationContext,
) {
  const code = payload.code.trim().toUpperCase();
  return prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.create({
      data: {
        code,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxUsage: payload.maxUsage,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        usageCount: 0,
        reservedUsage: 0,
        isArchived: false,
      },
    });
    await writeAudit(
      tx,
      context,
      "PROMO_CODE_CREATED",
      `PromoCode:${promo.id}`,
      `Promo ${code} created; discountType:${payload.discountType}; maxUsage:${payload.maxUsage}`,
    );
    return promo;
  });
}

export async function archiveAdminPromoCode(
  codeInput: string,
  context: AdminMutationContext,
) {
  const code = codeInput.trim().toUpperCase();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.promoCode.findUnique({ where: { code } });
    if (!existing) return null;
    if (existing.isArchived) return existing;

    const changed = await tx.promoCode.updateMany({
      where: { id: existing.id, isArchived: false, updatedAt: existing.updatedAt },
      data: { isArchived: true },
    });
    if (changed.count !== 1) {
      throw new ApiError("Promo code changed; refresh before archiving.", 409);
    }
    const archived = await tx.promoCode.findUniqueOrThrow({ where: { id: existing.id } });
    await writeAudit(tx, context, "PROMO_CODE_ARCHIVED", `PromoCode:${existing.id}`, `Promo ${code} archived.`);
    return archived;
  });
}

export async function updateAdminAiServiceCost(
  payload: {
    serviceKey: string;
    creditCost: number;
    billingType: "CREDIT_BASED" | "INCLUDED" | "PAID_ADDON";
  },
  context: AdminMutationContext,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.aiServiceCost.findUnique({ where: { serviceKey: payload.serviceKey } });
    if (!existing) return null;

    const changed = await tx.aiServiceCost.updateMany({
      where: { id: existing.id, updatedAt: existing.updatedAt },
      data: { creditCost: payload.creditCost, billingType: payload.billingType },
    });
    if (changed.count !== 1) {
      throw new ApiError("AI service cost changed; refresh before saving.", 409);
    }
    const updated = await tx.aiServiceCost.findUniqueOrThrow({ where: { id: existing.id } });
    await writeAudit(
      tx,
      context,
      "AI_SERVICE_COST_UPDATED",
      `AiServiceCost:${existing.id}`,
      `serviceKey:${payload.serviceKey}; creditCost:${payload.creditCost}; billingType:${payload.billingType}`,
    );
    return updated;
  });
}
