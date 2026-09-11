import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Only agents that can invoke a metered model need a subscription entitlement
 * and an AI credit. Keep this list deliberately small: adding an agent is a
 * billing decision, not just a registry change.
 */
const BILLABLE_AGENT_FEATURES: Record<string, readonly string[]> = {
  "resume-evaluator": ["AI_SCREENING", "BASIC_RESUME_SCREENING"],
  "jd-generator": ["AI_SCREENING", "AI_JD_GENERATION"],
  "mock-interview-copilot": ["AI_INTERVIEWS", "AI_INTERVIEW_COPILOT", "VIDEO_INTERVIEWS"],
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

export function isBillableAiAgent(agentId: string): boolean {
  return Object.prototype.hasOwnProperty.call(BILLABLE_AGENT_FEATURES, agentId);
}

/**
 * Verifies a current paid plan and consumes exactly one agent credit in the
 * same database transaction. There is intentionally no production fallback:
 * an unavailable billing database means a billable model call is denied.
 */
export async function assertAndConsumeAiEntitlement(companyId: string, agentId: string, transaction?: Prisma.TransactionClient): Promise<void> {
  const requiredFeatures = BILLABLE_AGENT_FEATURES[agentId];
  if (!requiredFeatures) return;

  // Local development may run without the billing tables. Production always
  // goes through the transaction below and therefore fails closed.
  if (process.env.NODE_ENV !== "production" && process.env.MOCK_DB === "true") return;

  const consume = async (tx: Prisma.TransactionClient) => {
    const subscription = await tx.companySubscription.findFirst({
      where: {
        companyId,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gt: new Date() },
      },
      include: { plan: { select: { featuresAllowed: true } } },
      orderBy: { endDate: "desc" },
    });

    if (!subscription) {
      throw new AiEntitlementError("An active AI-enabled subscription is required.");
    }

    const grantedFeatures = new Set(subscription.plan.featuresAllowed.map(normalizedFeature));
    const hasFeature = grantedFeatures.has("ALL_FEATURES") || requiredFeatures.some((feature) => grantedFeatures.has(feature));
    if (!hasFeature) {
      throw new AiEntitlementError("Your subscription does not include this AI agent.");
    }

    // updateMany makes the decrement conditional and atomic. Concurrent
    // dispatches cannot turn a zero balance negative.
    const debit = await tx.companyCredits.updateMany({
      where: { companyId, aiAgentCreditsLeft: { gte: 1 } },
      data: { aiAgentCreditsLeft: { decrement: 1 } },
    });
    if (debit.count !== 1) {
      throw new AiEntitlementError("Your AI agent credits are exhausted.");
    }
  };
  if (transaction) await consume(transaction);
  else await prisma.$transaction(consume);
}
