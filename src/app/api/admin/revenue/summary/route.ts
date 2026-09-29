import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_revenue_summary:${admin.id}`, 60, 60_000);

    const transactions = await loadRevenueTransactions();
    const successful = transactions.filter((transaction) => transaction.status === "Success");
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const currencies = [...new Set(transactions.map((transaction) => transaction.currency).filter(Boolean))].sort();

    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const inCurrency = transactions.filter((transaction) => transaction.currency === currency);
        const successfulInCurrency = inCurrency.filter((transaction) => transaction.status === "Success");
        const pendingInCurrency = inCurrency.filter((transaction) => transaction.status === "Pending");
        const refundedInCurrency = inCurrency.filter((transaction) => transaction.status === "Refunded");
        const failedInCurrency = inCurrency.filter((transaction) => transaction.status === "Failed");

        const totalRevenue = successfulInCurrency.reduce((sum, transaction) => sum + transaction.amount, 0);
        const taxesCollected = successfulInCurrency.reduce((sum, transaction) => sum + transaction.tax, 0);
        const currentMonthRevenue = successfulInCurrency
          .filter((transaction) => new Date(transaction.paidDate || transaction.createdDate) >= monthStart)
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const previousMonthRevenue = successfulInCurrency
          .filter((transaction) => {
            const date = new Date(transaction.paidDate || transaction.createdDate);
            return date >= previousMonthStart && date < monthStart;
          })
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const mrr = successfulInCurrency
          .filter(
            (transaction) =>
              transaction.revenueSource === "Subscription" &&
              new Date(transaction.paidDate || transaction.createdDate) >= monthStart,
          )
          .reduce((sum, transaction) => sum + transaction.amount, 0);

        const streamTotals = successfulInCurrency.reduce<Record<string, number>>((totals, transaction) => {
          totals[transaction.revenueSource] = (totals[transaction.revenueSource] || 0) + transaction.amount;
          return totals;
        }, {});
        const streams = Object.fromEntries(
          Object.entries(streamTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, total]) => [
              name,
              {
                total,
                formatted: formatMoney(total, currency),
                sharePct: totalRevenue ? Number(((total / totalRevenue) * 100).toFixed(2)) : 0,
              },
            ]),
        );

        const growthPct = previousMonthRevenue
          ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(2))
          : null;

        return [
          currency,
          {
            currency,
            totalRevenue,
            totalRevenueFormatted: formatMoney(totalRevenue, currency),
            currentMonthRevenue,
            currentMonthRevenueFormatted: formatMoney(currentMonthRevenue, currency),
            previousMonthRevenue,
            growthPct,
            mrr,
            mrrFormatted: formatMoney(mrr, currency),
            arr: mrr * 12,
            arrFormatted: formatMoney(mrr * 12, currency),
            taxesCollected,
            taxesCollectedFormatted: formatMoney(taxesCollected, currency),
            netRevenue: totalRevenue - taxesCollected,
            netRevenueFormatted: formatMoney(totalRevenue - taxesCollected, currency),
            pendingRevenue: pendingInCurrency.reduce((sum, transaction) => sum + transaction.amount, 0),
            refundedRevenue: refundedInCurrency.reduce((sum, transaction) => sum + transaction.amount, 0),
            failedPayments: failedInCurrency.reduce((sum, transaction) => sum + transaction.amount, 0),
            successfulTransactions: successfulInCurrency.length,
            transactionCount: inCurrency.length,
            streams,
          },
        ];
      }),
    );

    return NextResponse.json({
      success: true,
      source: "database",
      data: {
        currencyMode: currencies.length <= 1 ? "single" : "multiple",
        currencies,
        transactionCount: transactions.length,
        successfulTransactions: successful.length,
        platformFees: null,
        netProfit: null,
        byCurrency,
      },
    });
  } catch (error) {
    return revenueUnavailable(error, "Revenue summary");
  }
}
