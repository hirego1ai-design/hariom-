import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { parsePurchasedPlanSnapshot } from "@/lib/payments/planSnapshot";

/**
 * These agents incur provider/model cost and therefore use the internal budget
 * reservation system. They are NOT customer per-call billing units.
 */
const METERED_AGENT_FEATURES: Record<string, readonly string[]> = {
  "resume-evaluator": ["MATCHING_SCORE", "AI_SCREENING", "BASIC_RESUME_SCREENING"],
  "jd-generator": ["AI_JD_GENERATION", "AI_SCREENING"],
  "mock-interview-copilot": ["INTERVIEW_WORKFLOW", "VIRTUAL_INTERVIEW", "AI_INTERVIEWS", "AI_INTERVIEW_COPILOT"],
  "live-interview-evaluator": ["INTERVIEW_WORKFLOW", "VIRTUAL_INTERVIEW", "AI_INTERVIEWS", "AI_INTERVIEW_COPILOT"],
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

function hasFeature(grantedFeatures: readonly string[], requiredFeatures: readonly string[]): boolean {
  const granted = new Set(grantedFeatures.map(normalizedFeature));
  return granted.has("ALL_FEATURES") || requiredFeatures.map(normalizedFeature).some(feature => granted.has(feature));
}

export function isBillableAiAgent(agentId: string): boolean {
  // Kept for compatibility with the execution loop. "Billable" here means
  // internally cost-metered, not charged to the employer per invocation.
  return Object.prototype.hasOwnProperty.call(METERED_AGENT_FEATURES, agentId);
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

    if (!hasFeature(planSnapshot.featuresAllowed, requiredFeatures)) {
      throw new AiEntitlementError("Your current plan does not include this feature.");
    }
  };

  if (transaction) await verify(transaction);
  else await prisma.$transaction(verify);
}

/**
 * Backward-compatible name used by older call sites. It validates entitlement
 * only; customer AI credits are deliberately not consumed. Internal provider
 * cost is accounted by BudgetManager.
 */
export async function assertAndConsumeAiEntitlement(
  companyId: string,
  agentId: string,
  transaction?: Prisma.TransactionClient,
): Promise<void> {
  const requiredFeatures = METERED_AGENT_FEATURES[agentId];
  if (!requiredFeatures) return;
  await assertCompanyFeatureEntitlement(companyId, requiredFeatures, transaction);
}
