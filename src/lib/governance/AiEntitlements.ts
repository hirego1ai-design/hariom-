import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";

type BillableAgentConfig = {
  serviceKey: string;
  entitlementFeatures: readonly string[];
};

/**
 * Only agents that can invoke a metered model belong here. Each entry ties the
 * runtime agent to both a subscription entitlement and an Admin-configured
 * service cost. Adding an agent is therefore a billing decision.
 */
const BILLABLE_AGENT_CONFIG: Record<string, BillableAgentConfig> = {
  "resume-evaluator": {
    serviceKey: "resume_screening",
    entitlementFeatures: ["AI_SCREENING", "BASIC_RESUME_SCREENING"],
  },
  "jd-generator": {
    serviceKey: "jd_generation",
    entitlementFeatures: ["AI_SCREENING", "AI_JD_GENERATION"],
  },
  "mock-interview-copilot": {
    serviceKey: "interview_evaluation",
    entitlementFeatures: ["AI_INTERVIEWS", "AI_INTERVIEW_COPILOT", "VIDEO_INTERVIEWS"],
  },
  "live-interview-evaluator": {
    serviceKey: "interview_evaluation",
    entitlementFeatures: ["AI_INTERVIEWS", "AI_INTERVIEW_COPILOT", "VIDEO_INTERVIEWS"],
  },
};

export const DIRECT_DISPATCH_AGENT_IDS = ["resume-evaluator", "jd-generator"] as const;
export type DirectDispatchAgentId = (typeof DIRECT_DISPATCH_AGENT_IDS)[number];

export class AiEntitlementError extends Error {
  public readonly status = 403;

  constructor(message: string) {
    super(message);
    this.name = "AiEntitlementError";
  }
}

function normalizedFeature(feature: string): string {
  return feature.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function hasEntitlement(
  featuresAllowed: readonly string[],
  acceptedFeatures: readonly string[],
): boolean {
  const grantedFeatures = new Set(featuresAllowed.map(normalizedFeature));
  return grantedFeatures.has("ALL_FEATURES")
    || acceptedFeatures.map(normalizedFeature).some((feature) => grantedFeatures.has(feature));
}

export function isBillableAiAgent(agentId: string): boolean {
  return Object.prototype.hasOwnProperty.call(BILLABLE_AGENT_CONFIG, agentId);
}

export async function assertCompanyFeatureEntitlement(
  companyId: string,
  requiredFeatures: readonly string[],
  transaction?: Prisma.TransactionClient,
): Promise<void> {
  if (!requiredFeatures.length) throw new AiEntitlementError("At least one entitlement feature is required.");

  const verify = async (tx: Prisma.TransactionClient) => {
    const subscription = await tx.companySubscription.findFirst({
      where: {
        companyId,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
      select: { entitlementSnapshot: true },
      orderBy: { endDate: "desc" },
    });
    if (!subscription) {
      throw new AiEntitlementError("An active subscription is required for this feature.");
    }

    let planSnapshot;
    try {
      planSnapshot = parsePurchasedPlanSnapshot(subscription.entitlementSnapshot);
    } catch {
      throw new AiEntitlementError("Your subscription terms are unavailable; contact support.");
    }

    if (!hasEntitlement(planSnapshot.featuresAllowed, requiredFeatures)) {
      throw new AiEntitlementError("Your subscription does not include this feature.");
    }
  };

  if (transaction) {
    await verify(transaction);
  } else {
    await prisma.$transaction(verify);
  }
}

/**
 * Verifies the active plan, resolves the Admin-configured service billing rule,
 * and atomically consumes the configured number of AI agent credits.
 *
 * CREDIT_BASED: deduct exactly creditCost.
 * INCLUDED: allow without decrement.
 * PAID_ADDON: fail closed until a separately verified add-on purchase flow is
 *             connected; Admin configuration alone never grants paid access.
 */
export async function assertAndConsumeAiEntitlement(
  companyId: string,
  agentId: string,
  transaction?: Prisma.TransactionClient,
): Promise<void> {
  const config = BILLABLE_AGENT_CONFIG[agentId];
  if (!config) return;

  const consume = async (tx: Prisma.TransactionClient) => {
    const subscription = await tx.companySubscription.findFirst({
      where: {
        companyId,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
      select: { entitlementSnapshot: true },
      orderBy: { endDate: "desc" },
    });

    if (!subscription) {
      throw new AiEntitlementError("An active AI-enabled subscription is required.");
    }

    let planSnapshot;
    try {
      planSnapshot = parsePurchasedPlanSnapshot(subscription.entitlementSnapshot);
    } catch {
      throw new AiEntitlementError("Your subscription terms are unavailable; contact support before using a billed AI agent.");
    }

    // Admin plan editing stores AI service keys directly in featuresAllowed,
    // while older seeded plans use human-readable entitlement names. Accept
    // both representations so existing purchases remain valid.
    const acceptedFeatures = [...config.entitlementFeatures, config.serviceKey];
    if (!hasEntitlement(planSnapshot.featuresAllowed, acceptedFeatures)) {
      throw new AiEntitlementError("Your subscription does not include this AI agent.");
    }

    const service = await tx.aiServiceCost.findUnique({
      where: { serviceKey: config.serviceKey },
      select: { serviceName: true, creditCost: true, billingType: true },
    });
    if (!service) {
      throw new AiEntitlementError("AI service billing configuration is unavailable. Contact support.");
    }

    if (service.billingType === "INCLUDED") {
      return;
    }

    if (service.billingType === "PAID_ADDON") {
      throw new AiEntitlementError(
        `${service.serviceName} requires a separately verified paid add-on. Add-on checkout is not available for this service yet.`,
      );
    }

    if (!Number.isSafeInteger(service.creditCost) || service.creditCost <= 0) {
      throw new AiEntitlementError("AI service credit pricing is invalid. Contact support.");
    }

    // updateMany makes the decrement conditional and atomic. Concurrent
    // dispatches cannot make a balance negative or partially charge a request.
    const debit = await tx.companyCredits.updateMany({
      where: { companyId, aiAgentCreditsLeft: { gte: service.creditCost } },
      data: { aiAgentCreditsLeft: { decrement: service.creditCost } },
    });
    if (debit.count !== 1) {
      throw new AiEntitlementError(
        `Insufficient AI agent credits. ${service.serviceName} requires ${service.creditCost} credit(s).`,
      );
    }
  };

  if (transaction) await consume(transaction);
  else await prisma.$transaction(consume);
}
