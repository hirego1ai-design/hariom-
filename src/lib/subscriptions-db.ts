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

const defaultPlans: SubscriptionPlanRecord[] = [
  {
    id: "plan-daily",
    name: "Pay-As-You-Go / Day Pass",
    description: "Ideal for fast single hiring requirements",
    price: 4999,
    currency: "INR",
    jobPostsQuota: 1,
    resumeUnlocksQuota: 5,
    aiInterviewsQuota: 2,
    applicationsQuota: 25,
    resumeDownloadsQuota: 10,
    backgroundVerificationsQuota: 1,
    featuresAllowed: ["JOB_POSTING", "AI_SCREENING"],
    validityMonths: 1,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "plan-monthly-pro",
    name: "Monthly Growth Pro",
    description: "Complete hiring suite for scaling businesses",
    price: 24999,
    currency: "INR",
    jobPostsQuota: 5,
    resumeUnlocksQuota: 50,
    aiInterviewsQuota: 20,
    applicationsQuota: 200,
    resumeDownloadsQuota: 50,
    backgroundVerificationsQuota: 5,
    featuresAllowed: ["JOB_POSTING", "AI_SCREENING", "MANAGED_HIRING", "VIDEO_INTERVIEWS"],
    validityMonths: 1,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "plan-annual-enterprise",
    name: "Enterprise Annual SLA",
    description: "Unlimited high-trust neural recruiting with SLA guarantee",
    price: 199999,
    currency: "INR",
    jobPostsQuota: 50,
    resumeUnlocksQuota: 500,
    aiInterviewsQuota: 200,
    applicationsQuota: 2000,
    resumeDownloadsQuota: 500,
    backgroundVerificationsQuota: 50,
    featuresAllowed: ["ALL_FEATURES", "DEDICATED_ACCOUNT_MANAGER", "CUSTOM_SLA"],
    validityMonths: 12,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultPromoCodes: PromoCodeRecord[] = [
  {
    id: "promo-welcome20",
    code: "WELCOME20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxUsage: 1000,
    usageCount: 14,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "promo-hirego5000",
    code: "HIREGO5000",
    discountType: "FLAT",
    discountValue: 5000,
    maxUsage: 500,
    usageCount: 8,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultAiServices: AiServiceCostRecord[] = [
  {
    id: "srv-resume-parse",
    serviceKey: "AI_RESUME_PARSING",
    serviceName: "Neural Resume Vector Parsing",
    creditCost: 1,
    billingType: "CREDIT_BASED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-video-proctor",
    serviceKey: "AI_VIDEO_PROCTORING",
    serviceName: "Autonomous Video Proctoring & Sentiment Analysis",
    creditCost: 3,
    billingType: "CREDIT_BASED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "srv-jd-generator",
    serviceKey: "AI_JD_GENERATION",
    serviceName: "Automated Job Spec Generator",
    creditCost: 0,
    billingType: "INCLUDED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class SubscriptionsDb {
  private inMemoryPlans = new Map<string, SubscriptionPlanRecord>(
    defaultPlans.map((p) => [p.id, p])
  );
  private inMemoryCredits = new Map<string, CompanyCreditsRecord>();
  private inMemorySubs = new Map<string, CompanySubscriptionRecord>();
  private inMemoryPromos = new Map<string, PromoCodeRecord>(
    defaultPromoCodes.map((p) => [p.code, p])
  );
  private inMemoryAiServices = new Map<string, AiServiceCostRecord>(
    defaultAiServices.map((s) => [s.serviceKey, s])
  );

  public async getSubscriptionPlans(includeArchived = false): Promise<SubscriptionPlanRecord[]> {
    try {
      const records = await prisma.subscriptionPlan.findMany({
        where: includeArchived ? {} : { isArchived: false },
        orderBy: { price: "asc" },
      });
      if (records && records.length > 0) {
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
    } catch {}

    const plans = Array.from(this.inMemoryPlans.values());
    return includeArchived ? plans : plans.filter((p) => !p.isArchived);
  }

  public async getSubscriptionPlanById(id: string): Promise<SubscriptionPlanRecord | null> {
    try {
      const r = await prisma.subscriptionPlan.findUnique({ where: { id } });
      if (r) {
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
    } catch {}

    return this.inMemoryPlans.get(id) || null;
  }

  public async createSubscriptionPlan(
    payload: Omit<SubscriptionPlanRecord, "id" | "isArchived" | "createdAt" | "updatedAt">
  ): Promise<SubscriptionPlanRecord> {
    const id = `plan-${Date.now()}`;
    const newPlan: SubscriptionPlanRecord = {
      ...payload,
      id,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemoryPlans.set(id, newPlan);

    try {
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
          applicationsQuota: payload.applicationsQuota || 100,
          resumeDownloadsQuota: payload.resumeDownloadsQuota || 50,
          backgroundVerificationsQuota: payload.backgroundVerificationsQuota || 5,
          featuresAllowed: payload.featuresAllowed || [],
          validityMonths: payload.validityMonths || 1,
          isArchived: false,
        },
      });
    } catch {}

    return newPlan;
  }

  public async updateSubscriptionPlan(
    id: string,
    updates: Partial<SubscriptionPlanRecord>
  ): Promise<SubscriptionPlanRecord | null> {
    const existing = await this.getSubscriptionPlanById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.inMemoryPlans.set(id, updated);

    try {
      await prisma.subscriptionPlan.update({
        where: { id },
        data: updates as any,
      });
    } catch {}

    return updated;
  }

  public async archiveSubscriptionPlan(id: string): Promise<SubscriptionPlanRecord | null> {
    return this.updateSubscriptionPlan(id, { isArchived: true });
  }

  public async getCompanyCredits(companyId: string): Promise<CompanyCreditsRecord> {
    try {
      const r = await prisma.companyCredits.findUnique({ where: { companyId } });
      if (r) {
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
    } catch {}

    let credits = this.inMemoryCredits.get(companyId);
    if (!credits) {
      credits = {
        id: `cred-${companyId}`,
        companyId,
        jobPostsLeft: 1,
        resumeUnlocksLeft: 5,
        aiInterviewsLeft: 2,
        applicationsLeft: 25,
        resumeDownloadsLeft: 10,
        backgroundVerificationsLeft: 1,
        updatedAt: new Date().toISOString(),
      };
      this.inMemoryCredits.set(companyId, credits);
    }
    return credits;
  }

  public async updateCompanyCredits(
    companyId: string,
    jobPostsDiff: number,
    resumeUnlocksDiff: number,
    aiInterviewsDiff: number
  ): Promise<CompanyCreditsRecord> {
    const credits = await this.getCompanyCredits(companyId);
    credits.jobPostsLeft = Math.max(0, credits.jobPostsLeft + jobPostsDiff);
    credits.resumeUnlocksLeft = Math.max(0, credits.resumeUnlocksLeft + resumeUnlocksDiff);
    credits.aiInterviewsLeft = Math.max(0, credits.aiInterviewsLeft + aiInterviewsDiff);
    credits.updatedAt = new Date().toISOString();
    this.inMemoryCredits.set(companyId, credits);

    try {
      await prisma.companyCredits.update({
        where: { companyId },
        data: {
          jobPostsLeft: credits.jobPostsLeft,
          resumeUnlocksLeft: credits.resumeUnlocksLeft,
          aiInterviewsLeft: credits.aiInterviewsLeft,
        },
      });
    } catch {}

    return credits;
  }

  public async subscribeCompanyToPlan(
    companyId: string,
    planId: string,
    paymentId?: string
  ): Promise<CompanySubscriptionRecord> {
    const plan = await this.getSubscriptionPlanById(planId);
    if (!plan) throw new Error("Subscription plan not found");

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + plan.validityMonths * 30 * 86400 * 1000).toISOString();

    const record: CompanySubscriptionRecord = {
      id: `sub-${Date.now()}`,
      companyId,
      planId,
      startDate,
      endDate,
      status: "ACTIVE",
      paymentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.inMemorySubs.set(companyId, record);

    const credits: CompanyCreditsRecord = {
      id: `cred-${companyId}`,
      companyId,
      jobPostsLeft: plan.jobPostsQuota,
      resumeUnlocksLeft: plan.resumeUnlocksQuota,
      aiInterviewsLeft: plan.aiInterviewsQuota,
      applicationsLeft: plan.applicationsQuota,
      resumeDownloadsLeft: plan.resumeDownloadsQuota,
      backgroundVerificationsLeft: plan.backgroundVerificationsQuota,
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryCredits.set(companyId, credits);

    return record;
  }

  public async getCompanySubscription(companyId: string): Promise<CompanySubscriptionRecord | null> {
    try {
      const r = await prisma.companySubscription.findFirst({
        where: { companyId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
      if (r) {
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
    } catch {}

    return this.inMemorySubs.get(companyId) || null;
  }

  public async cancelCompanySubscription(companyId: string): Promise<boolean> {
    const sub = this.inMemorySubs.get(companyId);
    if (sub) {
      sub.status = "CANCELLED";
      sub.updatedAt = new Date().toISOString();
      this.inMemorySubs.set(companyId, sub);
    }

    try {
      await prisma.companySubscription.updateMany({
        where: { companyId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      });
    } catch {}

    return true;
  }

  // PROMO CODES
  public async getPromoCodes(includeArchived = false): Promise<PromoCodeRecord[]> {

    const promos = Array.from(this.inMemoryPromos.values());
    return includeArchived ? promos : promos.filter((p) => !p.isArchived);
  }

  public async createPromoCode(
    payload: Omit<PromoCodeRecord, "id" | "usageCount" | "isArchived" | "createdAt" | "updatedAt">
  ): Promise<PromoCodeRecord> {
    const promo: PromoCodeRecord = {
      ...payload,
      id: `promo-${Date.now()}`,
      usageCount: 0,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inMemoryPromos.set(payload.code.toUpperCase(), promo);
    return promo;
  }

  public async archivePromoCode(code: string): Promise<PromoCodeRecord | null> {
    const promo = this.inMemoryPromos.get(code.toUpperCase());
    if (!promo) return null;
    promo.isArchived = true;
    promo.updatedAt = new Date().toISOString();
    this.inMemoryPromos.set(code.toUpperCase(), promo);
    return promo;
  }

  public async validatePromoCode(code: string): Promise<PromoCodeRecord | null> {
    const promo = this.inMemoryPromos.get(code.toUpperCase());
    if (!promo || promo.isArchived) return null;
    if (promo.validUntil && new Date() > new Date(promo.validUntil)) return null;
    if (promo.usageCount >= promo.maxUsage) return null;
    return promo;
  }

  // AI SERVICES
  public async getAiServices(): Promise<AiServiceCostRecord[]> {
    return Array.from(this.inMemoryAiServices.values());
  }

  public async updateAiServiceCost(
    serviceKey: string,
    creditCost: number,
    billingType: "INCLUDED" | "CREDIT_BASED" | "PAID_ADDON"
  ): Promise<AiServiceCostRecord | null> {
    const srv = this.inMemoryAiServices.get(serviceKey);
    if (!srv) return null;
    srv.creditCost = creditCost;
    srv.billingType = billingType;
    srv.updatedAt = new Date().toISOString();
    this.inMemoryAiServices.set(serviceKey, srv);
    return srv;
  }
}

export const subscriptionsDb = new SubscriptionsDb();
