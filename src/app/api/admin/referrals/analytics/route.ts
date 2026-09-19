import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

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

    await enforceRateLimit(request, "admin_referral_analytics", 30, 60_000);

    let totalAttributions = 0;
    let candidateAttributions = 0;
    let employerAttributions = 0;
    let totalRewardsValue = 0;
    let totalEligibleValue = 0;
    let totalLockedValue = 0;
    let totalPaidValue = 0;
    let pendingPayoutLiability = 0;

    const [totalAttributionsDb, candidateAttributionsDb, employerAttributionsDb, rewards, payouts] = await prisma.$transaction([
      prisma.referralAttribution.count(),
      prisma.referralAttribution.count({ where: { userType: "CANDIDATE" } }),
      prisma.referralAttribution.count({ where: { userType: "EMPLOYER" } }),
      prisma.referralReward.findMany({ select: { rewardAmount: true, status: true } }),
      prisma.referralPayout.findMany({ where: { status: "PENDING_ADMIN_APPROVAL" }, select: { amount: true } }),
    ]);
    totalAttributions = totalAttributionsDb;
    candidateAttributions = candidateAttributionsDb;
    employerAttributions = employerAttributionsDb;
    for (const r of rewards) {
      totalRewardsValue += r.rewardAmount;
      if (r.status === "ELIGIBLE") totalEligibleValue += r.rewardAmount;
      if (r.status === "LOCKED") totalLockedValue += r.rewardAmount;
      if (r.status === "PAID") totalPaidValue += r.rewardAmount;
    }
    pendingPayoutLiability = payouts.reduce((sum, p) => sum + p.amount, 0);

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
  } catch (error) {
    return handleApiError(error);
  }
}
