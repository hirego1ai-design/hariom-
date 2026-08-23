import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { referralDb } from "@/lib/referral-db";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Administrator access required" },
        { status: 403 }
      );
    }

    let totalAttributions = 0;
    let candidateAttributions = 0;
    let employerAttributions = 0;
    let totalRewardsValue = 0;
    let totalEligibleValue = 0;
    let totalLockedValue = 0;
    let totalPaidValue = 0;
    let pendingPayoutLiability = 0;

    try {
      const client = prisma as any;
      if (client.referralAttribution) {
        totalAttributions = await client.referralAttribution.count();
        candidateAttributions = await client.referralAttribution.count({
          where: { userType: "CANDIDATE" },
        });
        employerAttributions = await client.referralAttribution.count({
          where: { userType: "EMPLOYER" },
        });
      }

      if (client.referralReward) {
        const rewards = await client.referralReward.findMany();
        for (const r of rewards) {
          totalRewardsValue += r.rewardAmount;
          if (r.status === "ELIGIBLE") totalEligibleValue += r.rewardAmount;
          if (r.status === "LOCKED") totalLockedValue += r.rewardAmount;
          if (r.status === "PAID") totalPaidValue += r.rewardAmount;
        }
      }

      if (client.referralPayout) {
        const payouts = await client.referralPayout.findMany({
          where: { status: "PENDING_ADMIN_APPROVAL" },
        });
        pendingPayoutLiability = payouts.reduce((sum: number, p: any) => sum + p.amount, 0);
      }
    } catch {
      // DB query failed — return zeros rather than fake numbers
    }

    const analytics = {
      summary: {
        totalAttributions,
        candidateAttributions,
        employerAttributions,
        totalRewardsValue,
        totalEligibleValue,
        totalLockedValue,
        totalPaidValue,
        pendingPayoutLiability,
        currency: "INR",
      },
      conversionMetrics: {
        // These require funnel analytics beyond attribution counts — not yet implemented
        leadToRegisterRate: "—",
        registerToQualifyingRate: "—",
        pphWarrantyRetentionRate: "—",
      },
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
