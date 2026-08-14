import { prisma } from "./prisma";

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

  public async createSubscriptionPlan(payload: Omit<SubscriptionPlanRecord, "id" | "isArchived" | "createdAt" | "updatedAt">): Promise<SubscriptionPlanRecord> {
    const id = crypto.randomUUID();
    const r = await prisma.subscriptionPlan.create({
      data: {
        id,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        currency: payload.currency || "INR",
        jobPostsQuota: payload.jobPostsQuota,
        resumeUnlocksQuota: payload.resumeUnlocksQuota,
        aiInterviewsQuota: payload.aiInterviewsQuota,
        applicationsQuota: payload.applicationsQuota || 100,
        resumeDownloadsQuota: payload.resumeDownloadsQuota || 50,
        backgroundVerificationsQuota: payload.backgroundVerificationsQuota || 5,
        featuresAllowed: payload.featuresAllowed || [],
        validityMonths: payload.validityMonths || 1,
        isArchived: false,
      },
    });
    return {
      ...payload,
      id: r.id,
      isArchived: r.isArchived,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    } as SubscriptionPlanRecord;
  }

  public async updateSubscriptionPlan(id: string, updates: Partial<SubscriptionPlanRecord>): Promise<SubscriptionPlanRecord | null> {
    const updateData: any = { ...updates };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const r = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

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

  public async archiveSubscriptionPlan(id: string): Promise<SubscriptionPlanRecord | null> {
    return this.updateSubscriptionPlan(id, { isArchived: true });
  }

  public async getCompanyCredits(companyId: string): Promise<CompanyCreditsRecord> {
    const r = await prisma.companyCredits.findUnique({ where: { companyId } });
    if (!r) throw new Error("Company credits not found");
    return {
      id: r.id,
      companyId: r.companyId,
      jobPostsLeft: r.jobPostsLeft,
      resumeUnlocksLeft: r.resumeUnlocksLeft,
      aiInterviewsLeft: r.aiInterviewsLeft,
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
    aiInterviewsDiff: number,
    applicationsDiff = 0,
    resumeDownloadsDiff = 0,
    backgroundVerificationsDiff = 0
  ): Promise<CompanyCreditsRecord> {
    const current = await prisma.companyCredits.findUnique({ where: { companyId } });
    if (current) {
      const r = await prisma.companyCredits.update({
        where: { companyId },
        data: {
          jobPostsLeft: Math.max(0, current.jobPostsLeft + jobPostsDiff),
          resumeUnlocksLeft: Math.max(0, current.resumeUnlocksLeft + resumeUnlocksDiff),
          aiInterviewsLeft: Math.max(0, current.aiInterviewsLeft + aiInterviewsDiff),
          applicationsLeft: Math.max(0, current.applicationsLeft + applicationsDiff),
          resumeDownloadsLeft: Math.max(0, current.resumeDownloadsLeft + resumeDownloadsDiff),
          backgroundVerificationsLeft: Math.max(0, current.backgroundVerificationsLeft + backgroundVerificationsDiff),
        },
      });
      return {
        id: r.id,
        companyId: r.companyId,
        jobPostsLeft: r.jobPostsLeft,
        resumeUnlocksLeft: r.resumeUnlocksLeft,
        aiInterviewsLeft: r.aiInterviewsLeft,
        applicationsLeft: r.applicationsLeft,
        resumeDownloadsLeft: r.resumeDownloadsLeft,
        backgroundVerificationsLeft: r.backgroundVerificationsLeft,
        updatedAt: r.updatedAt.toISOString(),
      };
    } else {
      const r = await prisma.companyCredits.create({
        data: {
          companyId,
          jobPostsLeft: Math.max(0, jobPostsDiff),
          resumeUnlocksLeft: Math.max(0, resumeUnlocksDiff),
          aiInterviewsLeft: Math.max(0, aiInterviewsDiff),
          applicationsLeft: Math.max(0, applicationsDiff),
          resumeDownloadsLeft: Math.max(0, resumeDownloadsDiff),
          backgroundVerificationsLeft: Math.max(0, backgroundVerificationsDiff),
        },
      });
      return {
        id: r.id,
        companyId: r.companyId,
        jobPostsLeft: r.jobPostsLeft,
        resumeUnlocksLeft: r.resumeUnlocksLeft,
        aiInterviewsLeft: r.aiInterviewsLeft,
        applicationsLeft: r.applicationsLeft,
        resumeDownloadsLeft: r.resumeDownloadsLeft,
        backgroundVerificationsLeft: r.backgroundVerificationsLeft,
        updatedAt: r.updatedAt.toISOString(),
      };
    }
  }

  public async getCompanySubscription(companyId: string): Promise<CompanySubscriptionRecord | null> {
    const r = await prisma.companySubscription.findFirst({
      where: { companyId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (!r) return null;
    return {
      id: r.id,
      companyId: r.companyId,
      planId: r.planId,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      status: r.status as any,
      paymentId: r.paymentId || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public async subscribeCompanyToPlan(companyId: string, planId: string, paymentId?: string): Promise<CompanySubscriptionRecord> {
    const plan = await this.getSubscriptionPlanById(planId);
    if (!plan) throw new Error("Subscription plan not found.");

    const id = crypto.randomUUID();
    const startDate = new Date();
    
    const durationMs = plan.id === "plan-trial" 
      ? 14 * 24 * 60 * 60 * 1000 
      : plan.validityMonths * 30 * 24 * 60 * 60 * 1000;
      
    const endDate = new Date(startDate.getTime() + durationMs);

    await prisma.companySubscription.updateMany({
      where: { companyId, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    const r = await prisma.companySubscription.create({
      data: {
        id,
        companyId,
        planId,
        startDate,
        endDate,
        status: "ACTIVE",
        paymentId: paymentId || null,
      },
    });

    await this.updateCompanyCredits(
      companyId,
      plan.jobPostsQuota,
      plan.resumeUnlocksQuota,
      plan.aiInterviewsQuota,
      plan.applicationsQuota,
      plan.resumeDownloadsQuota,
      plan.backgroundVerificationsQuota
    );

    return {
      id: r.id,
      companyId: r.companyId,
      planId: r.planId,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      status: r.status as any,
      paymentId: r.paymentId || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  public async getPromoCodes(): Promise<PromoCodeRecord[]> {
    const records = await prisma.promoCode.findMany({ where: { isArchived: false } });
    return records.map(r => ({
      id: r.id,
      code: r.code,
      discountType: r.discountType as any,
      discountValue: r.discountValue,
      maxUsage: r.maxUsage,
      usageCount: r.usageCount,
      validUntil: r.validUntil?.toISOString() || undefined,
      isArchived: r.isArchived,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  public async validatePromoCode(code: string): Promise<PromoCodeRecord | null> {
    const cleanCode = code.trim().toUpperCase();
    const record = await prisma.promoCode.findUnique({
      where: { code: cleanCode, isArchived: false }
    });
    if (!record) return null;
    if (record.validUntil && record.validUntil.getTime() < Date.now()) return null;
    if (record.usageCount >= record.maxUsage) return null;
    return {
      id: record.id,
      code: record.code,
      discountType: record.discountType as any,
      discountValue: record.discountValue,
      maxUsage: record.maxUsage,
      usageCount: record.usageCount,
      validUntil: record.validUntil?.toISOString() || undefined,
      isArchived: record.isArchived,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async createPromoCode(payload: Omit<PromoCodeRecord, "id" | "isArchived" | "usageCount" | "createdAt" | "updatedAt">): Promise<PromoCodeRecord> {
    const id = crypto.randomUUID();
    const r = await prisma.promoCode.create({
      data: {
        id,
        code: payload.code.trim().toUpperCase(),
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxUsage: payload.maxUsage || 9999,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
        isArchived: false,
      }
    });
    return {
      ...payload,
      id: r.id,
      usageCount: 0,
      isArchived: false,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    } as PromoCodeRecord;
  }

  public async archivePromoCode(code: string): Promise<boolean> {
    await prisma.promoCode.update({
      where: { code: code.toUpperCase() },
      data: { isArchived: true }
    });
    return true;
  }

  public async getAiServices(): Promise<AiServiceCostRecord[]> {
    const records = await prisma.aiServiceCost.findMany({ orderBy: { serviceName: "asc" } });
    return records.map(r => ({
      id: r.id,
      serviceKey: r.serviceKey,
      serviceName: r.serviceName,
      creditCost: r.creditCost,
      billingType: r.billingType as any,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  public async updateAiServiceCost(serviceKey: string, cost: number, billingType: string): Promise<AiServiceCostRecord | null> {
    const r = await prisma.aiServiceCost.update({
      where: { serviceKey },
      data: { creditCost: cost, billingType: billingType as any }
    });
    return {
      id: r.id,
      serviceKey: r.serviceKey,
      serviceName: r.serviceName,
      creditCost: r.creditCost,
      billingType: r.billingType as any,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

export const subscriptionsDb = new SubscriptionsDb();
