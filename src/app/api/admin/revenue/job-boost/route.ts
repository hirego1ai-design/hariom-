import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { formatMoney, loadRevenueTransactions, revenueUnavailable } from "../_shared";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_revenue_job_boost", 60, 60_000);

    const allTransactions = await loadRevenueTransactions();
    const transactions = allTransactions.filter((transaction) => transaction.revenueSource === "Job Boost");
    const successful = transactions.filter((transaction) => transaction.status === "Success");
    const pending = transactions.filter((transaction) => transaction.status === "Pending");
    const refunded = transactions.filter((transaction) => transaction.status === "Refunded");
    const failed = transactions.filter((transaction) => transaction.status === "Failed");

    const totalRevenue = successful.reduce((sum, transaction) => sum + transaction.amount, 0);
    const byPackage = new Map<string, { sold: number; revenue: number }>();
    for (const transaction of successful) {
      const name = transaction.planPurchased || "Job Boost";
      const current = byPackage.get(name) || { sold: 0, revenue: 0 };
      current.sold += 1;
      current.revenue += transaction.amount;
      byPackage.set(name, current);
    }

    return NextResponse.json({
      success: true,
      source: "database",
      summary: {
        totalRevenue,
        totalRevenueFormatted: formatMoney(totalRevenue),
        totalTransactions: transactions.length,
        successfulTransactions: successful.length,
        pendingTransactions: pending.length,
        refundedTransactions: refunded.length,
        failedTransactions: failed.length,
        categories: [...byPackage.entries()].map(([name, value]) => ({
          name,
          sold: value.sold,
          revenue: value.revenue,
          revenueFormatted: formatMoney(value.revenue),
        })),
      },
      data: transactions,
    });
  } catch (error) {
    return revenueUnavailable(error, "Job boost revenue");
  }
}
