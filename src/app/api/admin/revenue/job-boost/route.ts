import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_revenue_job_boost:${admin.id}`, 60, 60_000);

    const allTransactions = await loadRevenueTransactions();
    const transactions = allTransactions.filter((transaction) => transaction.revenueSource === "Job Boost");
    const currencies = [...new Set(transactions.map((transaction) => transaction.currency))].sort();

    const byCurrency = Object.fromEntries(
      currencies.map((currency) => {
        const inCurrency = transactions.filter((transaction) => transaction.currency === currency);
        const successful = inCurrency.filter((transaction) => transaction.status === "Success");
        const categories = new Map<string, { sold: number; revenue: number }>();

        for (const transaction of successful) {
          const name = transaction.planPurchased || "Unspecified Job Boost";
          const current = categories.get(name) || { sold: 0, revenue: 0 };
          current.sold += 1;
          current.revenue += transaction.amount;
          categories.set(name, current);
        }

        const totalRevenue = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
        return [
          currency,
          {
            currency,
            totalRevenue,
            totalRevenueFormatted: formatMoney(totalRevenue, currency),
            totalTransactions: inCurrency.length,
            successfulTransactions: successful.length,
            pendingTransactions: inCurrency.filter((transaction) => transaction.status === "Pending").length,
            refundedTransactions: inCurrency.filter((transaction) => transaction.status === "Refunded").length,
            failedTransactions: inCurrency.filter((transaction) => transaction.status === "Failed").length,
            categories: [...categories.entries()].map(([name, value]) => ({
              name,
              sold: value.sold,
              revenue: value.revenue,
              revenueFormatted: formatMoney(value.revenue, currency),
            })),
          },
        ];
      }),
    );

    return NextResponse.json({
      success: true,
      source: "database",
      summary: {
        currencyMode: currencies.length <= 1 ? "single" : "multiple",
        currencies,
        totalTransactions: transactions.length,
        byCurrency,
      },
      data: transactions,
    });
  } catch (error) {
    return revenueUnavailable(error, "Job boost revenue");
  }
}
