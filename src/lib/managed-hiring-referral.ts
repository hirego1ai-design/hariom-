/**
 * HireGo Referral Engine — HireGo Managed Hiring™ (Success-Based Placement) & Replacement Guarantee Locking Engine
 * 
 * Rules Enforced:
 * - Authoritative Server-Side Pipeline: Managed Hiring referral rewards can ONLY be triggered by verified server-side
 *   events backed by an authoritative CommercialAgreement and HiringRequirement.
 * - Rule 5: Each referred employer company is eligible for a maximum of ONE referral reward (₹5,000) from HireGo
 *   Managed Hiring™, regardless of how many placements the company makes (unlimited placements allowed).
 * - Rule 6: Referral reward is strictly LOCKED for the dynamic replacement guarantee period (45, 60, or 90 days from
 *   the Commercial Agreement SLA).
 * - Rule 7: Referrer NEVER sees HireGo commercial contract values, client fee %, margin, candidate CTC, or invoices.
 * - Rule 8: Replacement Guarantee Reversal:
 *     - If candidate exits early / fails probation during warranty: Unpaid rewards (LOCKED/ELIGIBLE) transition to REVERSED.
 *     - If reward is already PAID: Financial policy enforcement prevents silent cash deduction; instead, creates an
 *       authoritative ledger adjustment audit record for Admin & Finance review.
 */

import { ReferralProductType, ReferralReward, ReferralStatus } from "@/types/referral";
import { referralDb } from "./referral-db";
import { prisma } from "./prisma";
import { agreementsDb } from "./agreements-db";
import { logAuditEvent } from "./auditLogger";

export interface ProcessManagedHiringPlacementInput {
  hiringRequirementId: string;
  commercialAgreementId?: string;
  candidateId: string;
  companyId: string;
  hiredAt?: Date;
  actorId?: string;
  placementDetails?: {
    candidateName?: string;
    jobTitle?: string;
    annualCtc?: number; // Strictly confidential — redacted from referral layer
  };
}

export interface AuthoritativeValidationResult {
  isValid: boolean;
  error?: string;
  hiringRequirement?: any;
  commercialAgreement?: any;
  warrantyDays: number;
}

/**
 * Authoritative Validation: Ensures placement is backed by real, active CommercialAgreement and HiringRequirement
 */
export async function validateAuthoritativePlacementPrerequisites(input: {
  hiringRequirementId: string;
  commercialAgreementId?: string;
  companyId: string;
}): Promise<AuthoritativeValidationResult> {
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Verify Hiring Requirement
  let requirement: any = null;
  try {
    requirement = await prisma.hiringRequirement.findUnique({
      where: { id: input.hiringRequirementId },
      include: { agreements: true },
    });
  } catch (err: any) {
    if (isProduction) {
      return {
        isValid: false,
        warrantyDays: 90,
        error: `Database error querying HiringRequirement: ${err?.message}`,
      };
    }
  }

  // Fallback to in-memory agreements database for offline dev/test harness
  if (!requirement) {
    requirement = await agreementsDb.getRequirementById(input.hiringRequirementId);
  }

  if (!requirement) {
    return {
      isValid: false,
      warrantyDays: 90,
      error: `Authoritative validation failed: HiringRequirement '${input.hiringRequirementId}' does not exist in authoritative system.`,
    };
  }

  // 2. Verify Commercial Agreement & Dynamic Warranty SLA
  let agreement: any = null;
  if (input.commercialAgreementId) {
    try {
      agreement = await prisma.commercialAgreement.findUnique({
        where: { id: input.commercialAgreementId },
      });
    } catch (err: any) {
      if (isProduction) {
        return {
          isValid: false,
          warrantyDays: 90,
          error: `Database error querying CommercialAgreement: ${err?.message}`,
        };
      }
    }

    if (!agreement) {
      agreement = await agreementsDb.getAgreementById(input.commercialAgreementId);
    }

    if (!agreement) {
      return {
        isValid: false,
        warrantyDays: 90,
        error: `Authoritative validation failed: CommercialAgreement '${input.commercialAgreementId}' does not exist.`,
      };
    }

    // Ensure agreement belongs to the requirement or matching company
    if (agreement.requirementId && agreement.requirementId !== input.hiringRequirementId) {
      return {
        isValid: false,
        warrantyDays: 90,
        error: `Authoritative validation failed: CommercialAgreement is linked to requirement '${agreement.requirementId}', not '${input.hiringRequirementId}'.`,
      };
    }
  } else if (requirement.agreements && requirement.agreements.length > 0) {
    // Pick active agreement linked to requirement
    agreement =
      requirement.agreements.find((a: any) => a.status === "ACTIVE" || a.status === "SENT_TO_EMPLOYER") ||
      requirement.agreements[0];
  } else if (requirement.activeAgreementId) {
    agreement = await agreementsDb.getAgreementById(requirement.activeAgreementId);
  }

  // Determine dynamic warranty days (SLA: 45, 60, or 90 days)
  let warrantyDays = 90;
  if (agreement && agreement.replacementDays) {
    warrantyDays = Number(agreement.replacementDays);
  } else if (requirement.replacementExpectation) {
    const match = String(requirement.replacementExpectation).match(/(\d+)/);
    if (match) {
      warrantyDays = parseInt(match[1], 10);
    }
  }

  // Enforce standard warranty bounds
  if (warrantyDays <= 0 || isNaN(warrantyDays)) {
    warrantyDays = 90;
  }

  return {
    isValid: true,
    hiringRequirement: requirement,
    commercialAgreement: agreement,
    warrantyDays,
  };
}

/**
 * Authoritative Placement Referral Reward Processor
 * Can ONLY be triggered by server-side authoritative events (e.g. candidate joining confirmed).
 */
export async function processManagedHiringPlacementReferralReward(
  input: ProcessManagedHiringPlacementInput
): Promise<{ processed: boolean; reward?: ReferralReward | null; message: string; warrantyDays?: number }> {
  try {
    // Security Check: Authoritative Input Guard
    if (!input.hiringRequirementId || !input.companyId || !input.candidateId) {
      return {
        processed: false,
        message: "Missing mandatory placement identifiers (hiringRequirementId, companyId, candidateId).",
      };
    }

    // 1. Authoritative Validation: Verify CommercialAgreement & HiringRequirement exist
    const validation = await validateAuthoritativePlacementPrerequisites({
      hiringRequirementId: input.hiringRequirementId,
      commercialAgreementId: input.commercialAgreementId,
      companyId: input.companyId,
    });

    if (!validation.isValid) {
      logAuditEvent({
        userId: input.actorId || "AUTHORITATIVE_PIPELINE",
        action: "MANAGED_HIRING_REWARD_REJECTED",
        resource: `/requirements/${input.hiringRequirementId}`,
        details: `Placement referral rejected: ${validation.error}`,
      });
      return {
        processed: false,
        message: validation.error || "Authoritative prerequisite check failed.",
      };
    }

    // 2. Resolve Attribution for the Employer Company (Canonical Company Identity)
    const attribution = await referralDb.getAttributionByReferredCompany(input.companyId);
    if (!attribution) {
      return {
        processed: false,
        message: `No referral attribution found for referred company ${input.companyId}.`,
      };
    }

    const agreementWarrantyDays = validation.warrantyDays;
    const customHiredDate = input.hiredAt || new Date();

    // 3. Atomically record Managed Hiring reward with locking window (Rule 5, 6 & 7)
    const reward = await referralDb.recordQualifyingReward({
      attribution,
      productType: ReferralProductType.EMPLOYER_MANAGED_HIRING,
      hiringRequirementId: input.hiringRequirementId,
      commercialAgreementId: validation.commercialAgreement?.id || input.commercialAgreementId,
      agreementWarrantyDays,
      customHiredDate,
    });

    // 4. Audit Trail Logging
    if (reward && reward.status === ReferralStatus.LOCKED) {
      logAuditEvent({
        userId: input.actorId || "SYSTEM",
        action: "MANAGED_HIRING_REWARD_LOCKED",
        resource: `/referral-rewards/${reward.id}`,
        details: `HireGo Managed Hiring™ referral reward ${reward.id} (₹5,000) created and LOCKED for ${agreementWarrantyDays}-day replacement warranty. Referrer: ${reward.referrerId}, Company: ${input.companyId}, Req: ${input.hiringRequirementId}`,
      });
    } else if (reward && reward.status === ReferralStatus.LIMIT_REACHED) {
      logAuditEvent({
        userId: input.actorId || "SYSTEM",
        action: "MANAGED_HIRING_REWARD_LIMIT_REACHED",
        resource: `/requirements/${input.hiringRequirementId}`,
        details: `Placement recorded with ₹0 reward (Company ${input.companyId} has already reached the max 1 Managed Hiring referral reward limit). Unlimited placements permitted.`,
      });
    }

    return {
      processed: true,
      reward,
      warrantyDays: agreementWarrantyDays,
      message: reward && reward.status === ReferralStatus.LOCKED
        ? `HireGo Managed Hiring™ referral reward ${reward.id} created and LOCKED for ${reward.lockDurationDays}-day replacement guarantee.`
        : reward?.status === ReferralStatus.LIMIT_REACHED
        ? `HireGo Managed Hiring™ placement recorded (₹0 referral reward — company limit reached). Employer can continue making unlimited placements.`
        : "Evaluation complete.",
    };
  } catch (error: any) {
    return {
      processed: false,
      message: error?.message || "Failed to process HireGo Managed Hiring referral reward",
    };
  }
}

export interface CandidateEarlyExitInput {
  hiringRequirementId: string;
  candidateId: string;
  companyId?: string;
  exitDate?: Date;
  reason?: string;
  actorId?: string;
}

export interface CandidateEarlyExitResult {
  reversed: boolean;
  count: number;
  paidAdjustmentCount: number;
  requiresAdminReview: boolean;
  affectedRewardIds: string[];
  message: string;
}

/**
 * Early Candidate Exit / Replacement Trigger (Rule 8)
 * - If candidate resigns or fails probation during warranty:
 *     - If reward is LOCKED or ELIGIBLE: Transitions status to REVERSED.
 *     - If reward is already PAID: Financial policy check (does NOT silently deduct cash; logs an authoritative
 *       audit event / ledger adjustment requirement for Admin & Finance review).
 */
export async function handleManagedHiringCandidateEarlyExit(
  input: CandidateEarlyExitInput
): Promise<CandidateEarlyExitResult> {
  let reversedCount = 0;
  let paidAdjustmentCount = 0;
  const affectedRewardIds: string[] = [];
  const exitDate = input.exitDate || new Date();
  const reasonText = input.reason || "Candidate exited during replacement warranty window";

  // 1. Process PostgreSQL Database Records (Prisma)
  try {
    const client = prisma as any;
    if (client.referralReward) {
      const rewards = await client.referralReward.findMany({
        where: {
          hiringRequirementId: input.hiringRequirementId,
          productType: {
            in: [
              ReferralProductType.EMPLOYER_MANAGED_HIRING,
              "EMPLOYER_PPH_PLACEMENT" as any,
            ],
          },
        },
      });

      for (const r of rewards) {
        affectedRewardIds.push(r.id);

        if (
          r.status === ReferralStatus.LOCKED ||
          r.status === ReferralStatus.ELIGIBLE ||
          r.status === ReferralStatus.QUALIFIED
        ) {
          // Unpaid reward: Safe authoritative transition to REVERSED
          await client.referralReward.update({
            where: { id: r.id },
            data: {
              status: ReferralStatus.REVERSED as any,
              isLocked: false,
            },
          });
          reversedCount++;

          logAuditEvent({
            userId: input.actorId || "AUTHORITATIVE_WARRANTY_SYSTEM",
            action: "MANAGED_HIRING_REWARD_REVERSED",
            resource: `/referral-rewards/${r.id}`,
            details: `Placement reward ${r.id} (₹${r.rewardAmount}) transitioned to REVERSED due to early candidate exit on ${exitDate.toISOString().split("T")[0]}. Reason: ${reasonText}. Req: ${input.hiringRequirementId}`,
          });
        } else if (r.status === ReferralStatus.PAID) {
          // PAID Reward: Financial Policy Check — Do NOT silently deduct cash
          paidAdjustmentCount++;

          logAuditEvent({
            userId: input.actorId || "FINANCIAL_AUDIT_SYSTEM",
            action: "REFERRAL_FINANCIAL_ADJUSTMENT_REQUIRED",
            resource: `/referral-rewards/${r.id}`,
            details: `CRITICAL FINANCIAL AUDIT: Candidate exit occurred after referral reward ${r.id} (₹${r.rewardAmount}) was already PAID to Referrer ${r.referrerId} (Payout ID: ${r.payoutId || "N/A"}). Financial policy prohibits silent deduction. Manual admin clawback / ledger adjustment required. Exit Date: ${exitDate.toISOString().split("T")[0]}. Reason: ${reasonText}`,
          });
        }
      }
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database error processing candidate exit: ${err?.message}`);
    }
  }

  // 2. Process In-Memory Test Harness Store
  try {
    const memoryStore = (referralDb as any).rewards;
    if (memoryStore && memoryStore instanceof Map) {
      for (const [id, r] of memoryStore.entries()) {
        if (
          r.hiringRequirementId === input.hiringRequirementId &&
          (r.productType === ReferralProductType.EMPLOYER_MANAGED_HIRING ||
            (r.productType as any) === "EMPLOYER_PPH_PLACEMENT")
        ) {
          if (!affectedRewardIds.includes(id)) {
            affectedRewardIds.push(id);
          }

          if (
            r.status === ReferralStatus.LOCKED ||
            r.status === ReferralStatus.ELIGIBLE ||
            r.status === ReferralStatus.QUALIFIED
          ) {
            r.status = ReferralStatus.REVERSED;
            r.isLocked = false;
            r.updatedAt = new Date().toISOString();
            memoryStore.set(id, r);
            reversedCount++;

            logAuditEvent({
              userId: input.actorId || "AUTHORITATIVE_WARRANTY_SYSTEM",
              action: "MANAGED_HIRING_REWARD_REVERSED",
              resource: `/referral-rewards/${id}`,
              details: `Placement reward ${id} (₹${r.rewardAmount}) transitioned to REVERSED in test harness. Reason: ${reasonText}`,
            });
          } else if (r.status === ReferralStatus.PAID) {
            paidAdjustmentCount++;
            logAuditEvent({
              userId: input.actorId || "FINANCIAL_AUDIT_SYSTEM",
              action: "REFERRAL_FINANCIAL_ADJUSTMENT_REQUIRED",
              resource: `/referral-rewards/${id}`,
              details: `CRITICAL FINANCIAL AUDIT (Test Harness): Candidate exit on PAID reward ${id}. Manual admin ledger adjustment required.`,
            });
          }
        }
      }
    }
  } catch {}

  const requiresAdminReview = paidAdjustmentCount > 0;
  let message = "Candidate exit evaluation completed.";
  if (reversedCount > 0 && paidAdjustmentCount === 0) {
    message = `Successfully reversed ${reversedCount} referral reward(s) within warranty window.`;
  } else if (paidAdjustmentCount > 0) {
    message = `Processed candidate exit. ${reversedCount} reward(s) reversed. ${paidAdjustmentCount} reward(s) were already PAID: Financial policy check triggered — created audit record for admin review (zero silent cash deduction).`;
  }

  return {
    reversed: reversedCount > 0,
    count: reversedCount,
    paidAdjustmentCount,
    requiresAdminReview,
    affectedRewardIds,
    message,
  };
}

export interface ReconcileWarrantyLocksResult {
  unlocked: number;
  totalAmountUnlocked: number;
  unlockedRewards: Array<{
    id: string;
    referrerId: string;
    rewardAmount: number;
    lockExpiresAt: string | null;
    unlockedAt: string;
  }>;
}

/**
 * Scheduled / Cron Reconciliation for Expired Managed Hiring Guarantee Locks
 * Transitions all verified expired LOCKED rewards to ELIGIBLE and creates audit entries.
 * Idempotent and safe for retries.
 */
export async function reconcileManagedHiringWarrantyLocks(): Promise<ReconcileWarrantyLocksResult> {
  const isProduction = process.env.NODE_ENV === "production";
  const now = new Date();
  const unlockedRewards: ReconcileWarrantyLocksResult["unlockedRewards"] = [];
  let totalAmountUnlocked = 0;
  let unlockedCount = 0;

  // 1. PostgreSQL Database Execution (Prisma)
  try {
    const client = prisma as any;
    if (client.referralReward) {
      const expiredDbRewards = await client.referralReward.findMany({
        where: {
          status: ReferralStatus.LOCKED as any,
          lockExpiresAt: { lte: now },
        },
      });

      for (const rew of expiredDbRewards) {
        await client.referralReward.update({
          where: { id: rew.id },
          data: {
            status: ReferralStatus.ELIGIBLE as any,
            isLocked: false,
            unlockedAt: now,
          },
        });

        unlockedCount++;
        totalAmountUnlocked += rew.rewardAmount;
        unlockedRewards.push({
          id: rew.id,
          referrerId: rew.referrerId,
          rewardAmount: rew.rewardAmount,
          lockExpiresAt: rew.lockExpiresAt ? rew.lockExpiresAt.toISOString() : null,
          unlockedAt: now.toISOString(),
        });

        logAuditEvent({
          userId: "SCHEDULED_RECONCILIATION_CRON",
          action: "REFERRAL_WARRANTY_LOCK_EXPIRED_UNLOCKED",
          resource: `/referral-rewards/${rew.id}`,
          details: `Warranty guarantee lock (${rew.lockDurationDays} days) expired. Reward ${rew.id} (₹${rew.rewardAmount}) transitioned from LOCKED to ELIGIBLE for Referrer ${rew.referrerId}.`,
        });
      }

      if (isProduction) {
        return {
          unlocked: unlockedCount,
          totalAmountUnlocked,
          unlockedRewards,
        };
      }
    }
  } catch (err: any) {
    if (isProduction) {
      throw new Error(`Database error during warranty lock reconciliation: ${err?.message}`);
    }
  }

  // 2. In-Memory Test Harness Fallback
  try {
    const memoryStore = (referralDb as any).rewards;
    if (memoryStore && memoryStore instanceof Map) {
      for (const [id, rew] of memoryStore.entries()) {
        if (rew.status === ReferralStatus.LOCKED && rew.lockExpiresAt) {
          const expiryDate = new Date(rew.lockExpiresAt);
          if (expiryDate <= now) {
            rew.status = ReferralStatus.ELIGIBLE;
            rew.isLocked = false;
            rew.unlockedAt = now.toISOString();
            rew.updatedAt = now.toISOString();
            memoryStore.set(id, rew);

            unlockedCount++;
            totalAmountUnlocked += rew.rewardAmount;
            unlockedRewards.push({
              id: rew.id,
              referrerId: rew.referrerId,
              rewardAmount: rew.rewardAmount,
              lockExpiresAt: rew.lockExpiresAt ? String(rew.lockExpiresAt) : null,
              unlockedAt: now.toISOString(),
            });

            logAuditEvent({
              userId: "SCHEDULED_RECONCILIATION_CRON",
              action: "REFERRAL_WARRANTY_LOCK_EXPIRED_UNLOCKED",
              resource: `/referral-rewards/${rew.id}`,
              details: `Warranty guarantee lock (${rew.lockDurationDays} days) expired. Reward ${rew.id} (₹${rew.rewardAmount}) transitioned from LOCKED to ELIGIBLE in test harness.`,
            });
          }
        }
      }
    }
  } catch {}

  return {
    unlocked: unlockedCount,
    totalAmountUnlocked,
    unlockedRewards,
  };
}

// Backward-compatibility aliases
export const processPphPlacementReferralReward = processManagedHiringPlacementReferralReward;
export const handlePphCandidateEarlyExit = handleManagedHiringCandidateEarlyExit;
export const reconcilePphWarrantyLocks = reconcileManagedHiringWarrantyLocks;
