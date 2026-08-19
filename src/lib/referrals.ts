/**
 * HireGo Referral Engine — Facade Module
 * Re-exports production repository, qualification logic, and Managed Hiring handlers.
 */

export * from "@/types/referral";
export * from "./referral-rules";
export * from "./referral-db";
export * from "./managed-hiring-referral";
export * from "./payment-referral";

import { referralDb } from "./referral-db";

export async function getReferralDataForUser(userId: string, userName?: string) {
  const stats = await referralDb.getUserReferralStats(userId, userName);
  return {
    referralCode: stats.referralCode,
    referralLink: stats.referralLink,
    totalEarned: stats.lifetimeEarnings,
    pendingReward: stats.lockedBalance,
    availableBalance: stats.availableBalance,
    lockedBalance: stats.lockedBalance,
    totalFriendsReferred: stats.totalAttributions,
    hiredCount: stats.totalQualifiedConversions,
    referrals: stats.recentRewards.map((r) => ({
      id: r.id,
      referrerId: userId,
      referredName: r.productDisplayName,
      status: r.status,
      rewardAmount: r.rewardAmount,
      createdAt: r.createdAt,
    })),
  };
}

export async function recordNewReferral(
  referrerId: string,
  name: string,
  email: string,
  referralCode: string
) {
  const attr = await referralDb.createAttribution({
    referrerId,
    referralCode,
    attributionSource: "DIRECT_INVITE",
    metadata: { name, email },
  });
  return attr;
}
