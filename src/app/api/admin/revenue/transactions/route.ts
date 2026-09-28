import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadRevenueTransactions, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

const querySchema = z.object({
  search: z.string().trim().max(200).optional(),
  source: z.string().trim().max(80).optional(),
  status: z.enum(["Success", "Pending", "Overdue", "Refunded", "Failed", "Cancelled"]).optional(),
  gateway: z.string().trim().max(40).optional(),
  customerType: z.string().trim().max(40).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_revenue_transactions:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const search = query.search?.toLowerCase() || "";

    const transactions = await loadRevenueTransactions();
    const filtered = transactions.filter((transaction) => {
      if (
        search &&
        ![
          transaction.id,
          transaction.invoiceNo,
          transaction.customerName,
          transaction.company,
          transaction.email,
          transaction.mobile,
        ].some((value) => value.toLowerCase().includes(search))
      ) return false;
      if (query.source && transaction.revenueSource !== query.source) return false;
      if (query.status && transaction.status !== query.status) return false;
      if (query.gateway && transaction.gateway !== query.gateway) return false;
      if (query.customerType && transaction.customerType !== query.customerType) return false;
      if (query.currency && transaction.currency !== query.currency) return false;
      return true;
    });

    const offset = (query.page - 1) * query.limit;
    return NextResponse.json({
      success: true,
      total: filtered.length,
      page: query.page,
      limit: query.limit,
      data: filtered.slice(offset, offset + query.limit),
      source: "database",
      filters: {
        revenueSources: [...new Set(transactions.map((transaction) => transaction.revenueSource))].sort(),
        currencies: [...new Set(transactions.map((transaction) => transaction.currency))].sort(),
        gateways: [...new Set(transactions.map((transaction) => transaction.gateway).filter(Boolean))].sort(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return handleApiError(error);
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ success: false, error: error.message }, { status: (error as any).status });
    }
    return revenueUnavailable(error, "Revenue transactions");
  }
}
