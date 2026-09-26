import { prisma } from "./prisma";
import { randomUUID } from "node:crypto";
import { createPurchasedPlanSnapshot, type PurchasedPlanSnapshot } from "./payments/planSnapshot";
import type { CompanySubscription } from "@prisma/client";
import { findActiveCompanySubscription, reconcileExpiredCompanySubscriptions } from "./subscriptionAccess";

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  jobPostsQuota: number;
  resumeUnlocksQuota: number;
  aiInterviewsQuota: number;
  applicationsQuota: number;
  resumeDownloadsQuota: number;
  backgroundVerificationsQuota: number;
  featuresAllowed: string[];
  validityMonths: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySubscriptionRecord {
  id: string;
  companyId: string;
  planId: string;
  entitlementSnapshot?: PurchasedPlanSnapshot;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreditsRecord {
  id: string;
  companyId: string;
  jobPostsLeft: number;
  resumeUnlocksLeft: number;
  aiInterviewsLeft: number;
  aiAgentCreditsLeft: number;
  applicationsLeft: number;
  resumeDownloadsLeft: number;
  backgroundVerificationsLeft: number;
  updatedAt: string;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxUsage: number;
  usageCount: number;
  reservedUsage?: number;
  validUntil?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiServiceCostRecord {
  id: string;
  serviceKey: string;
  serviceName: string;
  creditCost: number;
  billingType: "INCLUDED" | "CREDIT_BASED" | "PAID_ADDON";
  createdAt: string;
  updatedAt: string;
}

function mapCompanySubscriptionRecord(record: CompanySubscription): CompanySubscriptionRecord {
  return {
    id: record.id,
    companyId: record.companyId,
    planId: record.planId,
    entitlementSnapshot: record.entitlementSnapshot
      ? record.entitlementSnapshot as PurchasedPlanSnapshot
      : undefined,
    startDate: record.startDate.toISOString(),
    endDate: record.endDate.toISOString(),
    status: record.status as CompanySubscriptionRecord["status"],
    paymentId: record.paymentId || undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

class SubscriptionsDb {
  public async getSubscriptionPlans(includeArchived = false): Promise<SubscriptionPlanRecord[]> {
    const records = await prisma.subscriptionPlan.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: { price: "asc" },
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      currency: r.currency,
      jobPostsQuota: r.jobPostsQuota,
      resumeUnlocksQuota: r.resumeUnlocksQuota,
      aiInterviewsQuota: r.aiInterviewsQuota,
      applicationsQuota: r.applicationsQuota,
      resumeDownloadsQuota: r.resumeDownloadsQuota,
      backgroundVerificationsQuota: r.backgroundVerificationsQuota,
      featuresAllowed: r.featuresAllowed,
      validityMonths: r.validityMonths,
      isArchived: r.isArchived,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  public async getSubscriptionPlanById(id: string): Promise<SubscriptionPlanRecord | null> {
    const r = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      currency: r.currency,
      jobPostsQuota: r.jobPostsQuota,
      resumeUnlocksQuota: r.resumeUnlocksQuota,
      aiInterviewsQuota: r.aiInterviewsQuota,
      applicationsQuota: r.applicationsQuota,
      resumeDownloadsQuota: r.resumeDownloadsQuota,
      backgroundVerificationsQuota: r.backgroundVerificationsQuota,
      featuresAllowed: r.featuresAllowed,
      validityMonths: r.validityMonths,
      isArchived: r.isArchived,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public async createSubscriptionPlan(
    payload: Omit<SubscriptionPlanRecord, "id" | "isArchived" | "createdAt" | "updatedAt">
  ): Promise<SubscriptionPlanRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newPlan: SubscriptionPlanRecord = {
      ...payload,
      id,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await prisma.subscriptionPlan.create({
      data: {
        id,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        currency: payload.currency || "INR",
        jobPostsQuota: payload.jobPostsQuota,
        resumeUnlocksQuota: payload.resumeUnlocksQuota,
        aiInterviewsQuota: payload.aiInterviewsQuota,
        applicationsQuota: payload.applicationsQuota,
        resumeDownloadsQuota: payload.resumeDownloadsQuota,
        backgroundVerificationsQuota: payload.backgroundVerificationsQuota,
        featuresAllowed: payload.featuresAllowed || [],
        validityMonths: payload.validityMonths || 1,
        isArchived: false,
      },
    });

    return newPlan;
  }

  public async updateSubscriptionPlan(
    id: string,
    updates: Partial<SubscriptionPlanRecord>
  ): Promise<SubscriptionPlanRecord | null> {
    const existing = await this.getSubscriptionPlanById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await prisma.subscriptionPlan.update({
      where: { id },
      data: updates as any,
    });
    return updated;
  }

  public async archiveSubscriptionPlan(id: string): Promise<SubscriptionPlanRecord | null> {
    return this.updateSubscriptionPlan(id, { isArchived: true });
  }

  public async getCompanyCredits(companyId: string): Promise<CompanyCreditsRecord> {
    const r = await prisma.companyCredits.findUnique({ where: { companyId } });
    if (!r) throw new Error("Company credit account not found.");
    return {
      id: r.id,
      companyId: r.companyId,
      jobPostsLeft: r.jobPostsLeft,
      resumeUnlocksLeft: r.resumeUnlocksLeft,
      aiInterviewsLeft: r.aiInterviewsLeft,
      aiAgentCreditsLeft: r.aiAgentCreditsLeft,
      applicationsLeft: r.applicationsLeft,
      resumeDownloadsLeft: r.resumeDownloadsLeft,
      backgroundVerificationsLeft: r.backgroundVerificationsLeft,
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public async updateCompanyCredits(
    companyId: string,
    jobPostsDiff: number,
    resumeUnlocksDiff: number,
    aiInterviewsDiff: number
  ): Promise<CompanyCreditsRecord> {
    const current = await prisma.companyCredits.findUnique({ where: { companyId } });
    if (!current) throw new Error("Company credit account not found.");

    const r = await prisma.companyCredits.update({
      where: { companyId },
      data: {
        jobPostsLeft: Math.max(0, current.jobPostsLeft + jobPostsDiff),
        resumeUnlocksLeft: Math.max(0, current.resumeUnlocksLeft + resumeUnlocksDiff),
        aiInterviewsLeft: Math.max(0, current.aiInterviewsLeft + aiInterviewsDiff),
      },
    });

    return {
      id: r.id,
      companyId: r.companyId,
      jobPostsLeft: r.jobPostsLeft,
      resumeUnlocksLeft: r.resumeUnlocksLeft,
      aiInterviewsLeft: r.aiInterviewsLeft,
      aiAgentCreditsLeft: r.aiAgentCreditsLeft,
      applicationsLeft: r.applicationsLeft,
      resumeDownloadsLeft: r.resumeDownloadsLeft,
      backgroundVerificationsLeft: r.backgroundVerificationsLeft,
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public async subscribeCompanyToPlan(
    companyId: string,
    planId: string,
    paymentId?: string
  ): Promise<CompanySubscriptionRecord> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Subscription activation requires a verified payment webhook.");
    }

    const plan = await this.getSubscriptionPlanById(planId);
    if (!plan) throw new Error("Subscription plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.validityMonths * 30 * 86400 * 1000);
    const entitlementSnapshot = createPurchasedPlanSnapshot(plan);

    const record = await prisma.$transaction(async (tx) => {
      const subscription = await tx.companySubscription.create({
        data: {
          companyId,
          planId,
          entitlementSnapshot: entitlementSnapshot as any,
          startDate,
          endDate,
          status: "ACTIVE",
          paymentId,
        },
      });

      await tx.companyCredits.upsert({
        where: { companyId },
        create: {
          companyId,
          jobPostsLeft: plan.jobPostsQuota,
          resumeUnlocksLeft: plan.resumeUnlocksQuota,
          aiInterviewsLeft: plan.aiInterviewsQuota,
          aiAgentCreditsLeft: plan.aiInterviewsQuota,
          applicationsLeft: plan.applicationsQuota,
          resumeDownloadsLeft: plan.resumeDownloadsQuota,
          backgroundVerificationsLeft: plan.backgroundVerificationsQuota,
        },
        update: {
          jobPostsLeft: plan.jobPostsQuota,
          resumeUnlocksLeft: plan.resumeUnlocksQuota,
          aiInterviewsLeft: plan.aiInterviewsQuota,
          aiAgentCreditsLeft: plan.aiInterviewsQuota,
          applicationsLeft: plan.applicationsQuota,
          resumeDownloadsLeft: plan.resumeDownloadsQuota,
          backgroundVerificationsLeft: plan.backgroundVerificationsQuota,
        },
      });

      return subscription;
    });

    return {
      id: record.id,
      companyId: record.companyId,
      planId: record.planId,
      entitlementSnapshot,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate.toISOString(),
      status: record.status as CompanySubscriptionRecord["status"],
      paymentId: record.paymentId || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async getCompanySubscription(companyId: string): Promise<CompanySubscriptionRecord | null> {
    const record = await prisma.$transaction((tx) =>
      findActiveCompanySubscription(tx, companyId)
    );
    return record ? mapCompanySubscriptionRecord(record) : null;
  }

  public async getLatestCompanySubscription(companyId: string): Promise<CompanySubscriptionRecord | null> {
    const record = await prisma.$transaction(async (tx) => {
      await reconcileExpiredCompanySubscriptions(tx, companyId);
      return tx.companySubscription.findFirst({
        where: { companyId },
        orderBy: { endDate: "desc" },
      });
    });
    return record ? mapCompanySubscriptionRecord(record) : null;
  }

  public async cancelCompanySubscription(companyId: string): Promise<boolean> {
    const result = await prisma.companySubscription.updateMany({
      where: { companyId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    return result.count > 0;
  }

  // PROMO CODES (PostgreSQL Prisma Backed)
  public async getPromoCodes(includeArchived = false): Promise<PromoCodeRecord[]> {
    const promos = await prisma.promoCode.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      orderBy: { createdAt: "desc" },
    });
    return promos.map((p) => ({
      id: p.id,
      code: p.code,
      discountType: p.discountType as "PERCENTAGE" | "FLAT",
      discountValue: p.discountValue,
      maxUsage: p.maxUsage,
      usageCount: p.usageCount,
      reservedUsage: p.reservedUsage,
      validUntil: p.validUntil ? p.validUntil.toISOString() : undefined,
      isArchived: p.isArchived,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  public async createPromoCode(
    payload: Omit<PromoCodeRecord, "id" | "usageCount" | "reservedUsage" | "isArchived" | "createdAt" | "updatedAt">
  ): Promise<PromoCodeRecord> {
    const normalizedCode = payload.code.trim().toUpperCase();
    const promo = await prisma.promoCode.create({
      data: {
        code: normalizedCode,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxUsage: payload.maxUsage ?? 9999,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        isArchived: false,
      },
    });
    return {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType as "PERCENTAGE" | "FLAT",
      discountValue: promo.discountValue,
      maxUsage: promo.maxUsage,
      usageCount: promo.usageCount,
      reservedUsage: promo.reservedUsage,
      validUntil: promo.validUntil ? promo.validUntil.toISOString() : undefined,
      isArchived: promo.isArchived,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    };
  }

  public async archivePromoCode(code: string): Promise<PromoCodeRecord | null> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });
    if (!existing) return null;
    const promo = await prisma.promoCode.update({
      where: { code: normalizedCode },
      data: { isArchived: true },
    });
    return {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType as "PERCENTAGE" | "FLAT",
      discountValue: promo.discountValue,
      maxUsage: promo.maxUsage,
      usageCount: promo.usageCount,
      reservedUsage: promo.reservedUsage,
      validUntil: promo.validUntil ? promo.validUntil.toISOString() : undefined,
      isArchived: promo.isArchived,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    };
  }

  public async validatePromoCode(code: string): Promise<PromoCodeRecord | null> {
    const normalizedCode = code.trim().toUpperCase();
    const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });
    if (!promo || promo.isArchived) return null;
    if (promo.validUntil && new Date() > promo.validUntil) return null;
    if (promo.usageCount + promo.reservedUsage >= promo.maxUsage) return null;
    return {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType as "PERCENTAGE" | "FLAT",
      discountValue: promo.discountValue,
      maxUsage: promo.maxUsage,
      usageCount: promo.usageCount,
      reservedUsage: promo.reservedUsage,
      validUntil: promo.validUntil ? promo.validUntil.toISOString() : undefined,
      isArchived: promo.isArchived,
      createdAt: promo.createdAt.toISOString(),
      updatedAt: promo.updatedAt.toISOString(),
    };
  }

  public async reservePromoCode(code: string): Promise<PromoCodeRecord> {
    const normalizedCode = code.trim().toUpperCase();
    return prisma.$transaction(async (tx) => {
      const promos = await tx.$queryRaw<Array<{
        id: string;
        code: string;
        discountType: string;
        discountValue: number;
        maxUsage: number;
        usageCount: number;
        reservedUsage: number;
        validUntil: Date | null;
        isArchived: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>>`
        SELECT "id", "code", "discountType", "discountValue", "maxUsage", "usageCount", "reservedUsage", "validUntil", "isArchived", "createdAt", "updatedAt"
        FROM "PromoCode"
        WHERE "code" = ${normalizedCode}
        FOR UPDATE
      `;
      const promo = promos[0];
      if (!promo || promo.isArchived) {
        throw new Error("Invalid or archived promo code.");
      }
      if (promo.validUntil && promo.validUntil < new Date()) {
        throw new Error("Expired promo code.");
      }
      if (promo.usageCount + promo.reservedUsage >= promo.maxUsage) {
        throw new Error("Exhausted promo code.");
      }

      const updated = await tx.promoCode.update({
        where: { id: promo.id },
        data: { reservedUsage: { increment: 1 } },
      });

      return {
        id: updated.id,
        code: updated.code,
        discountType: updated.discountType as "PERCENTAGE" | "FLAT",
        discountValue: updated.discountValue,
        maxUsage: updated.maxUsage,
        usageCount: updated.usageCount,
        reservedUsage: updated.reservedUsage,
        validUntil: updated.validUntil ? updated.validUntil.toISOString() : undefined,
        isArchived: updated.isArchived,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }

  public async releasePromoReservation(code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    await prisma.promoCode.updateMany({
      where: { code: normalizedCode, reservedUsage: { gt: 0 } },
      data: { reservedUsage: { decrement: 1 } },
    }).catch(() => undefined);
  }

  public async confirmPromoUsage(code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    await prisma.$transaction(async (tx) => {
      const promo = await tx.promoCode.findUnique({ where: { code: normalizedCode } });
      if (!promo) return;
      await tx.promoCode.update({
        where: { id: promo.id },
        data: {
          usageCount: { increment: 1 },
          reservedUsage: promo.reservedUsage > 0 ? { decrement: 1 } : undefined,
        },
      });
    });
  }

  // AI SERVICES
  public async getAiServices(): Promise<AiServiceCostRecord[]> {
    const records = await prisma.aiServiceCost.findMany({ orderBy: { serviceKey: "asc" } });
    return records.map((record) => ({
      ...record,
      billingType: record.billingType as AiServiceCostRecord["billingType"],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));
  }

  public async updateAiServiceCost(
    serviceKey: string,
    creditCost: number,
    billingType: "INCLUDED" | "CREDIT_BASED" | "PAID_ADDON"
  ): Promise<AiServiceCostRecord | null> {
    if (!Number.isSafeInteger(creditCost) || creditCost < 0 || !["INCLUDED", "CREDIT_BASED", "PAID_ADDON"].includes(billingType)) {
      throw new Error("Invalid AI service billing settings");
    }
    const existing = await prisma.aiServiceCost.findUnique({ where: { serviceKey } });
    if (!existing) return null;
    const record = await prisma.aiServiceCost.update({
      where: { serviceKey },
      data: { creditCost, billingType },
    });
    return {
      ...record,
      billingType: record.billingType as AiServiceCostRecord["billingType"],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const subscriptionsDb = new SubscriptionsDb();
