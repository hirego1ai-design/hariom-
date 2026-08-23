import { NextResponse, type NextRequest } from "next/server";
import { loadRevenueTransactions, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
  const format = request.nextUrl.searchParams.get("format") || "csv";
  if (format !== "csv") {
    return NextResponse.json(
      { success: false, error: "Only CSV export is implemented.", code: "EXPORT_FORMAT_UNAVAILABLE" },
      { status: 422 },
    );
  }

    const transactions = await loadRevenueTransactions();
    const headers = ["Transaction ID", "Invoice Number", "Customer Name", "Customer Type", "Company", "Email", "Mobile", "Revenue Source", "Plan Purchased", "Amount", "Currency", "Tax", "Discount", "Gateway", "Payment Method", "Status", "Paid Date"];
    const rows = transactions.map((transaction) => [transaction.id, transaction.invoiceNo, transaction.customerName, transaction.customerType, transaction.company, transaction.email, transaction.mobile, transaction.revenueSource, transaction.planPurchased, transaction.amount, transaction.currency, transaction.tax, transaction.discount, transaction.gateway, transaction.paymentMethod, transaction.status, transaction.paidDate]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hirego_revenue_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ success: false, error: error.message }, { status: (error as any).status });
    }
    return revenueUnavailable(error, "Revenue export");
  }
}
