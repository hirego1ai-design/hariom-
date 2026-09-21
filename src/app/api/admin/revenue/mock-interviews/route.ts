import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_revenue_mock_interviews", 60, 60_000);

    const [allTransactions, sessions] = await Promise.all([
      loadRevenueTransactions(),
      prisma.mockInterviewSession.findMany({
        orderBy: { createdAt: "desc" },
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
    const successful = transactions.filter((transaction) => transaction.status === "Success");
    const scoredSessions = sessions.filter((session) => typeof session.overallScore === "number");
    const totalRevenue = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
    const averageScore = scoredSessions.length
      ? scoredSessions.reduce((sum, session) => sum + (session.overallScore ?? 0), 0) / scoredSessions.length
      : null;

    return NextResponse.json({
      success: true,
      source: "database",
      summary: {
        totalRevenue,
        totalRevenueFormatted: formatMoney(totalRevenue),
        totalPurchases: transactions.length,
        successfulPurchases: successful.length,
        totalSessions: sessions.length,
        completedSessions: sessions.filter((session) => session.status === "COMPLETED").length,
        activeSessions: sessions.filter((session) => session.status === "IN_PROGRESS").length,
        averageCandidateScore: averageScore === null ? null : Number(averageScore.toFixed(2)),
      },
      data: transactions,
      sessions: sessions.map((session) => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return revenueUnavailable(error, "Mock interview revenue");
  }
}
