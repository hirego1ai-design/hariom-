import { NextResponse, type NextRequest } from "next/server";
import { sampleTransactions } from "../transactions/route";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") || "csv";

  if (format === "csv") {
    const headers = [
      "Transaction ID",
      "Invoice Number",
      "Customer Name",
      "Customer Type",
      "Company",
      "Email",
      "Mobile",
      "Revenue Source",
      "Plan Purchased",
      "Amount (INR)",
      "Tax (INR)",
      "Discount",
      "Coupon",
      "Gateway",
      "Payment Method",
      "Status",
      "Paid Date",
      "City",
      "State",
    ];

    const rows = sampleTransactions.map((t) => [
      t.id,
      t.invoiceNo,
      `"${t.customerName}"`,
      t.customerType,
      `"${t.company}"`,
      t.email,
      `"${t.mobile}"`,
      `"${t.revenueSource}"`,
      `"${t.planPurchased}"`,
      t.amount,
      t.tax,
      t.discount,
      t.couponUsed,
      t.gateway,
      `"${t.paymentMethod}"`,
      t.status,
      `"${t.paidDate}"`,
      `"${t.city}"`,
      `"${t.state}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hirego_revenue_report_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    message: `Export prepared for format: ${format}`,
    exportDate: new Date().toISOString(),
    totalRows: sampleTransactions.length,
    downloadUrl: `/api/admin/revenue/export?format=${format}`,
  });
}
