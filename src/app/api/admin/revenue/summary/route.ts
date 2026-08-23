import { NextRequest, NextResponse } from "next/server";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    const transactions = await loadRevenueTransactions();
    const successful = transactions.filter((transaction) => transaction.status === "Success");
    const pending = transactions.filter((transaction) => transaction.status === "Pending");
    const refunded = transactions.filter((transaction) => transaction.status === "Refunded");
    const failed = transactions.filter((transaction) => transaction.status === "Failed");
    const totalRevenue = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
    const taxesCollected = successful.reduce((sum, transaction) => sum + transaction.tax, 0);
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const currentMonthRevenue = successful
      .filter((transaction) => new Date(transaction.paidDate || transaction.createdDate) >= monthStart)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const previousMonthRevenue = successful
      .filter((transaction) => {
        const date = new Date(transaction.paidDate || transaction.createdDate);
        return date >= previousMonthStart && date < monthStart;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const streamTotals = successful.reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.revenueSource] = (totals[transaction.revenueSource] || 0) + transaction.amount;
      return totals;
    }, {});
    const stream = (name: string) => {
      const total = streamTotals[name] || 0;
      return {
        total,
        formatted: formatMoney(total),
        share: totalRevenue ? `${((total / totalRevenue) * 100).toFixed(1)}%` : "0.0%",
      };
    };
    const growth = previousMonthRevenue
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : null;

    return NextResponse.json({
      success: true,
      source: "database",
      data: {
        mrr: currentMonthRevenue,
        mrrFormatted: formatMoney(currentMonthRevenue),
        arr: currentMonthRevenue * 12,
        arrFormatted: formatMoney(currentMonthRevenue * 12),
        totalRevenue,
        totalRevenueFormatted: formatMoney(totalRevenue),
        currentMonthRevenue,
        previousMonthRevenue,
        growthPct: growth === null ? null : `${growth >= 0 ? "+" : ""}${growth.toFixed(2)}%`,
        netRevenue: totalRevenue - taxesCollected,
        grossRevenue: totalRevenue,
        pendingRevenue: pending.reduce((sum, transaction) => sum + transaction.amount, 0),
        refundedRevenue: refunded.reduce((sum, transaction) => sum + transaction.amount, 0),
        failedPayments: failed.reduce((sum, transaction) => sum + transaction.amount, 0),
        taxesCollected,
        platformFees: null,
        netProfit: null,
        streams: {
          subscriptions: stream("Subscription"),
          managedHiring: { ...stream("Managed Hiring"), label: "HireGo Managed Hiring™" },
          pph: { ...stream("Managed Hiring"), label: "HireGo Managed Hiring™" },
          mockInterviews: stream("Mock Interview"),
          jobBoost: stream("Job Boost"),
        },
      },
    });
  } catch (error) {
    return revenueUnavailable(error, "Revenue summary");
  }
}
