/**
 * HireGo Referral Engine — Business Rules & Qualification Engine
 * Phase 1 Production Rules:
 * - Rule 1: Unlimited referrals per referrer (no global cap).
 * - Rule 2: Reward limit belongs to the referred customer/company, not the referrer.
 * - Rule 3: Candidate products max 2 qualifying transactions per referred candidate.
 * - Rule 4: Employer job posting max 2 qualifying transactions per referred employer company.
 * - Rule 5: HireGo Managed Hiring™: Each referred employer is eligible for a maximum of ONE referral reward
 *           from HireGo Managed Hiring™ (regardless of how many Managed Hiring™ placements the employer makes).
 *           Reward limit belongs to the Company, NOT individual employee accounts.
 * - Rule 6: Managed Hiring™ Replacement Guarantee Lock (45, 60, or 90 days from Commercial Agreement SLA).
 * - Rule 7: Strict commercial data confidentiality (redacts contract value, fee %, margin, invoices).
 */

import {
  ReferralProductType,
  ReferralProgramConfig,
  RewardQualificationResult,
} from "@/types/referral";
import { prisma } from "./prisma";

export const DEFAULT_REFERRAL_CONFIG: ReferralProgramConfig = {
  id: "global-referral-config",
  isEnabled: true,
  candidateRewardAmount: 250.0,
  candidateMaxQualifyingTransactions: 2,
  employerJobRewardAmount: 1000.0,
  employerMaxQualifyingTransactions: 2,
  managedHiringRewardAmount: 5000.0,
  managedHiringMaxRewards: 1,
  managedHiringDefaultLockDays: 90,
  minPayoutAmount: 500.0,
  attributionWindowDays: 30,
  updatedAt: new Date().toISOString(),
};

let cachedConfig: ReferralProgramConfig = { ...DEFAULT_REFERRAL_CONFIG };

export async function getReferralProgramConfig(): Promise<ReferralProgramConfig> {
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const client = prisma as any;
    if (client.referralProgramConfig) {
      const config = await client.referralProgramConfig.findUnique({
        where: { id: "global-referral-config" },
      });
      if (config) {
        cachedConfig = {
          id: config.id,
          isEnabled: config.isEnabled,
          candidateRewardAmount: config.candidateRewardAmount,
          candidateMaxQualifyingTransactions: config.candidateMaxQualifyingTransactions,
          employerJobRewardAmount: config.employerJobRewardAmount,
          employerMaxQualifyingTransactions: config.employerMaxQualifyingTransactions,
          managedHiringRewardAmount: config.managedHiringRewardAmount || config.pphRewardAmount || 5000.0,
          managedHiringMaxRewards: config.managedHiringMaxRewards || config.pphMaxQualifyingHires || 1,
          managedHiringDefaultLockDays: config.managedHiringDefaultLockDays || config.pphDefaultLockingPeriodDays || 90,
          minPayoutAmount: config.minPayoutAmount,
          attributionWindowDays: config.attributionWindowDays,
          updatedAt: config.updatedAt.toISOString(),
        };
        return cachedConfig;
      }
    }
  } catch (error: any) {
    if (isProduction) {
      const correlationId = `err-cfg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      console.error(`[PROD-ERROR][CORRELATION: ${correlationId}] Database error loading referral config:`, error);
      throw new Error(`[${correlationId}] Database unavailable: failed to fetch referral program configuration.`);
    }
    // Database unreachable in local offline test environment
  }
  return cachedConfig;
}

export async function updateReferralProgramConfig(
  updates: Partial<ReferralProgramConfig>
): Promise<ReferralProgramConfig> {
  const isProduction = process.env.NODE_ENV === "production";
  const current = await getReferralProgramConfig();
  const nextConfig: ReferralProgramConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    const client = prisma as any;
    if (client.referralProgramConfig) {
      await client.referralProgramConfig.upsert({
        where: { id: "global-referral-config" },
        update: {
          isEnabled: nextConfig.isEnabled,
          candidateRewardAmount: nextConfig.candidateRewardAmount,
          candidateMaxQualifyingTransactions: nextConfig.candidateMaxQualifyingTransactions,
          employerJobRewardAmount: nextConfig.employerJobRewardAmount,
          employerMaxQualifyingTransactions: nextConfig.employerMaxQualifyingTransactions,
          managedHiringRewardAmount: nextConfig.managedHiringRewardAmount,
          managedHiringMaxRewards: nextConfig.managedHiringMaxRewards,
          managedHiringDefaultLockDays: nextConfig.managedHiringDefaultLockDays,
          minPayoutAmount: nextConfig.minPayoutAmount,
          attributionWindowDays: nextConfig.attributionWindowDays,
        },
        create: {
          id: "global-referral-config",
          isEnabled: nextConfig.isEnabled,
          candidateRewardAmount: nextConfig.candidateRewardAmount,
          candidateMaxQualifyingTransactions: nextConfig.candidateMaxQualifyingTransactions,
          employerJobRewardAmount: nextConfig.employerJobRewardAmount,
          employerMaxQualifyingTransactions: nextConfig.employerMaxQualifyingTransactions,
          managedHiringRewardAmount: nextConfig.managedHiringRewardAmount,
          managedHiringMaxRewards: nextConfig.managedHiringMaxRewards,
          managedHiringDefaultLockDays: nextConfig.managedHiringDefaultLockDays,
          minPayoutAmount: nextConfig.minPayoutAmount,
          attributionWindowDays: nextConfig.attributionWindowDays,
        },
      });
      cachedConfig = nextConfig;
      return nextConfig;
    }
  } catch (error: any) {
    if (isProduction) {
      const correlationId = `err-cfg-upd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      console.error(`[PROD-ERROR][CORRELATION: ${correlationId}] Database error updating referral config:`, error);
      throw new Error(`[${correlationId}] Database unavailable: failed to update referral program configuration.`);
    }
    // Fallback persistence for offline dev/test
  }

  cachedConfig = nextConfig;
  return nextConfig;
}

export interface QualificationContext {
  productType: ReferralProductType;
  priorRewardedCountForEntity: number; // Count for the referred candidate or referred company
  agreementWarrantyDays?: number; // 45, 60, 90 days from Commercial Agreement SLA
  customHiredDate?: Date;
}

/**
 * Authoritative Evaluation Function for Transaction Qualification
 */
export async function evaluateTransactionQualification(
  ctx: QualificationContext
): Promise<RewardQualificationResult> {
  const config = await getReferralProgramConfig();

  if (!config.isEnabled) {
    return {
      isQualified: false,
      rejectionReason: "Referral program is currently paused by admin.",
      productType: ctx.productType,
      rewardAmount: 0,
      currency: "INR",
      isLocked: false,
      lockDurationDays: 0,
      transactionSequenceNumber: ctx.priorRewardedCountForEntity + 1,
    };
  }

  const sequenceNumber = ctx.priorRewardedCountForEntity + 1;

  switch (ctx.productType) {
    // -------------------------------------------------------------
    // CANDIDATE PRODUCTS (Rule 3: Max 2 qualifying transactions)
    // -------------------------------------------------------------
    case ReferralProductType.CANDIDATE_MOCK_INTERVIEW:
    case ReferralProductType.CANDIDATE_CAREER_PASS: {
      if (sequenceNumber > config.candidateMaxQualifyingTransactions) {
        return {
          isQualified: false,
          rejectionReason: `Referred candidate has reached the limit of ${config.candidateMaxQualifyingTransactions} rewarded purchases.`,
          productType: ctx.productType,
          rewardAmount: 0,
          currency: "INR",
          isLocked: false,
          lockDurationDays: 0,
          transactionSequenceNumber: sequenceNumber,
        };
      }

      return {
        isQualified: true,
        productType: ctx.productType,
        rewardAmount: config.candidateRewardAmount,
        currency: "INR",
        isLocked: false,
        lockDurationDays: 0,
        transactionSequenceNumber: sequenceNumber,
      };
    }

    // -------------------------------------------------------------
    // EMPLOYER JOB POSTING (Rule 4: Max 2 qualifying job posts per company)
    // -------------------------------------------------------------
    case ReferralProductType.EMPLOYER_JOB_POST:
    case ReferralProductType.EMPLOYER_SUBSCRIPTION: {
      if (sequenceNumber > config.employerMaxQualifyingTransactions) {
        return {
          isQualified: false,
          rejectionReason: `Referred employer company has reached the limit of ${config.employerMaxQualifyingTransactions} rewarded job post orders.`,
          productType: ctx.productType,
          rewardAmount: 0,
          currency: "INR",
          isLocked: false,
          lockDurationDays: 0,
          transactionSequenceNumber: sequenceNumber,
        };
      }

      return {
        isQualified: true,
        productType: ctx.productType,
        rewardAmount: config.employerJobRewardAmount,
        currency: "INR",
        isLocked: false,
        lockDurationDays: 0,
        transactionSequenceNumber: sequenceNumber,
      };
    }

    // -------------------------------------------------------------
    // HIREGO MANAGED HIRING™ (Rule 5 & 6: Max 1 reward per referred company, locked for 45/60/90 days SLA)
    // -------------------------------------------------------------
    case ReferralProductType.EMPLOYER_MANAGED_HIRING:
    case "EMPLOYER_PPH_PLACEMENT" as any: {
      if (sequenceNumber > config.managedHiringMaxRewards) {
        return {
          isQualified: false,
          rejectionReason: `Referred employer company already generated ${config.managedHiringMaxRewards} HireGo Managed Hiring™ referral reward. Note: Company can continue making unlimited Managed Hiring™ placements without referral reward.`,
          productType: ReferralProductType.EMPLOYER_MANAGED_HIRING,
          rewardAmount: 0,
          currency: "INR",
          isLocked: false,
          lockDurationDays: 0,
          transactionSequenceNumber: sequenceNumber,
        };
      }

      const warrantyDays = ctx.agreementWarrantyDays || config.managedHiringDefaultLockDays || 90;
      const hiredDate = ctx.customHiredDate || new Date();
      const lockExpiresAt = new Date(hiredDate.getTime() + warrantyDays * 24 * 60 * 60 * 1000);

      return {
        isQualified: true,
        productType: ReferralProductType.EMPLOYER_MANAGED_HIRING,
        rewardAmount: config.managedHiringRewardAmount, // Rule 7: Fixed referral reward, zero exposure of HireGo client fee % or margin
        currency: "INR",
        isLocked: true,
        lockDurationDays: warrantyDays,
        lockExpiresAt,
        transactionSequenceNumber: sequenceNumber,
      };
    }

    default:
      return {
        isQualified: false,
        rejectionReason: "Unknown product type.",
        productType: ctx.productType,
        rewardAmount: 0,
        currency: "INR",
        isLocked: false,
        lockDurationDays: 0,
        transactionSequenceNumber: sequenceNumber,
      };
  }
}
