import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_revenue_mock_interviews:${admin.id}`, 60, 60_000);

    const [allTransactions, totalSessions, completedSessions, activeSessions, scoreAggregate, recentSessions] =
      await Promise.all([
        loadRevenueTransactions(),
        prisma.mockInterviewSession.count(),
        prisma.mockInterviewSession.count({ where: { status: "COMPLETED" } }),
        prisma.mockInterviewSession.count({ where: { status: "IN_PROGRESS" } }),
        prisma.mockInterviewSession.aggregate({ _avg: { overallScore: true } }),
        prisma.mockInterviewSession.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 200,
          select: {
            id: true,
            roleTarget: true,
            status: true,
            totalQuestions: true,
            currentQuestionIndex: true,
            overallScore: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

    const transactions = allTransactions.filter((transaction) => transaction.revenueSource === "Mock Interview");
    const currencies = [...new Set(transactions.map((transaction) => transaction.currency))].sort();
    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const inCurrency = transactions.filter((transaction) => transaction.currency === currency);
        const successful = inCurrency.filter((transaction) => transaction.status === "Success");
        const totalRevenue = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
        return [
          currency,
          {
            currency,
            totalRevenue,
            totalRevenueFormatted: formatMoney(totalRevenue, currency),
            totalPurchases: inCurrency.length,
            successfulPurchases: successful.length,
          },
        ];
      }),
    );

    const averageScore = scoreAggregate._avg.overallScore;

    return NextResponse.json({
      success: true,
      source: "database",
      summary: {
        currencyMode: currencies.length <= 1 ? "single" : "multiple",
        currencies,
        byCurrency,
        totalPurchases: transactions.length,
        totalSessions,
        completedSessions,
        activeSessions,
        averageCandidateScore: averageScore === null ? null : Number(averageScore.toFixed(2)),
        recentSessionPreviewLimit: 200,
      },
      data: transactions,
      sessions: recentSessions.map((session) => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return revenueUnavailable(error, "Mock interview revenue");
  }
}
