/**
 * HireGo Referral Engine — Payment Gateway Qualification & Refund Hook
 * Invoked by verified payment webhooks (Razorpay / Stripe) to trigger qualifying rewards or process reversals.
 */

import { ReferralProductType, ReferralReward, ReferralStatus } from "@/types/referral";
import { referralDb } from "./referral-db";
import { prisma } from "./prisma";

export interface ProcessPaymentReferralInput {
  companyId?: string;
  userId?: string;
  amount: number;
  provider: string;
  planId?: string;
  transactionId: string;
  productType?: ReferralProductType;
  tx?: any;
}

export async function processPaymentReferralReward(
  input: ProcessPaymentReferralInput,
  tx?: any
): Promise<{ processed: boolean; reward?: ReferralReward | null; message: string }> {
  const activeTx = input.tx || tx;
  try {
    // 1. Resolve canonical attribution for customer/company (Rule 0 & Canonical Identity)
    const attribution = await referralDb.resolveCanonicalAttribution({
      userId: input.userId,
      companyId: input.companyId,
    }, activeTx);

    // No referrer attributed to this customer
    if (!attribution) {
      return {
        processed: false,
        message: "No referral attribution found for paying entity.",
      };
    }

    // 2. Determine Product Type
    let targetProductType = input.productType;
    if (!targetProductType) {
      if (input.planId || input.companyId) {
        targetProductType = ReferralProductType.EMPLOYER_JOB_POST;
      } else {
        targetProductType = ReferralProductType.CANDIDATE_CAREER_PASS;
      }
    }

    // 3. Atomically record qualifying reward with idempotency guard
    const reward = await referralDb.recordQualifyingReward({
      attribution,
      productType: targetProductType,
      transactionId: input.transactionId,
      tx: activeTx,
    }, activeTx);

    return {
      processed: true,
      reward,
      message: reward
        ? `Referral reward ${reward.id} evaluated (Status: ${reward.status}, Amount: ₹${reward.rewardAmount})`
        : "Evaluation complete.",
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "production" && activeTx) {
      // Re-throw in production transaction to ensure complete atomic rollback
      throw error;
    }
    return {
      processed: false,
      message: error?.message || "Failed to process payment referral reward",
    };
  }
}

/**
 * Payment Refund / Chargeback Handler
 * If payment is refunded, reverses any associated referral reward.
 */
export async function handlePaymentRefundReferralReward(input: {
  transactionId: string;
  reason?: string;
}): Promise<{ reversed: boolean; message: string }> {
  try {
    const client = prisma as any;
    if (client.referralReward) {
      const existing = await client.referralReward.findFirst({
        where: { transactionId: input.transactionId },
      });
      if (existing) {
        await prisma.$transaction(async (tx: any) => {
          // Transition reward to REVERSED
          await tx.referralReward.update({
            where: { id: existing.id },
            data: { status: ReferralStatus.REVERSED as any },
          });

          // Write immutable REWARD_REVERSAL ledger entry to preserve audit trail
          if (tx.referralLedgerEntry) {
            await tx.referralLedgerEntry.create({
              data: {
                referrerId: existing.referrerId,
                rewardId: existing.id,
                entryType: "REWARD_REVERSAL",
                amount: -existing.rewardAmount,
                balanceAfter: 0, // Will be recalculated on next balance query
                currency: existing.currency ?? "INR",
                correlationId: `refund-${input.transactionId}-${Date.now()}`,
                metadata: {
                  transactionId: input.transactionId,
                  reason: input.reason ?? "Payment refunded or charged back",
                  reversedRewardId: existing.id,
                },
              },
            });
          }
        });

        return { reversed: true, message: `Reward ${existing.id} transitioned to REVERSED with ledger entry.` };
      }
    }
    return { reversed: false, message: "No matching reward found for transactionId." };
  } catch (error: any) {
    return { reversed: false, message: error?.message || "Failed to process refund reversal." };
  }
}
