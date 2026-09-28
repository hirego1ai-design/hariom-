import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(request: Request) {
  try {
    const session = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_referral_analytics:${session.id}`, 30, 60_000);

    const [
      totalAttributions,
      candidateAttributions,
      employerAttributions,
      rewardGroups,
      payoutGroups,
    ] = await prisma.$transaction([
      prisma.referralAttribution.count(),
      prisma.referralAttribution.count({ where: { userType: "CANDIDATE" } }),
      prisma.referralAttribution.count({ where: { userType: "EMPLOYER" } }),
      prisma.referralReward.groupBy({
        by: ["currency", "status"],
        orderBy: [{ currency: "asc" }, { status: "asc" }],
        _count: { id: true },
        _sum: { rewardAmount: true },
      }),
      prisma.referralPayout.groupBy({
        by: ["currency", "status"],
        where: { status: { in: ["PENDING_ADMIN_APPROVAL", "APPROVED"] } },
        orderBy: [{ currency: "asc" }, { status: "asc" }],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const currencies = [
      ...new Set([
        ...rewardGroups.map((row) => row.currency),
        ...payoutGroups.map((row) => row.currency),
      ]),
    ].sort();

    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const rewards = rewardGroups.filter((row) => row.currency === currency);
        const payouts = payoutGroups.filter((row) => row.currency === currency);
        const rewardAmountFor = (...statuses: string[]) =>
          rewards
            .filter((row) => statuses.includes(row.status))
            .reduce((sum, row) => sum + (row._sum?.rewardAmount ?? 0), 0);
        const rewardCount = rewards.reduce((sum, row) => sum + (row._count?.id ?? 0), 0);
        const pendingPayoutLiability = payouts.reduce(
          (sum, row) => sum + (row._sum?.amount ?? 0),
          0,
        );
        const pendingPayoutCount = payouts.reduce(
          (sum, row) => sum + (row._count?.id ?? 0),
          0,
        );

        return [
          currency,
          {
            currency,
            rewardCount,
            totalRewardsValue: rewards.reduce(
              (sum, row) => sum + (row._sum?.rewardAmount ?? 0),
              0,
            ),
            totalEligibleValue: rewardAmountFor("ELIGIBLE"),
            totalLockedValue: rewardAmountFor("LOCKED"),
            totalPaidValue: rewardAmountFor("PAID"),
            pendingPayoutLiability,
            pendingPayoutCount,
          },
        ];
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAttributions,
          candidateAttributions,
          employerAttributions,
          currencyMode: currencies.length <= 1 ? "single" : "multiple",
          currencies,
          byCurrency,
        },
        conversionMetrics: {
          leadToRegisterRate: null,
          registerToQualifyingRate: null,
          pphWarrantyRetentionRate: null,
          status: "NOT_MEASURED",
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
