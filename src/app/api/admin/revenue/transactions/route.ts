import { NextResponse, type NextRequest } from "next/server";
import { loadRevenueTransactions, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(request: NextRequest) {
  try {
    requireAdminSession(request);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const source = searchParams.get("source") || "All";
    const status = searchParams.get("status") || "All";
    const gateway = searchParams.get("gateway") || "All";
    const customerType = searchParams.get("customerType") || "All";
    const transactions = await loadRevenueTransactions();
    const data = transactions.filter((transaction) => {
      if (
        search &&
        ![transaction.id, transaction.invoiceNo, transaction.customerName, transaction.company, transaction.email, transaction.mobile]
          .some((value) => value.toLowerCase().includes(search))
      ) return false;
      if (source !== "All" && transaction.revenueSource !== source) return false;
      if (status !== "All" && transaction.status !== status) return false;
      if (gateway !== "All" && transaction.gateway !== gateway) return false;
      if (customerType !== "All" && transaction.customerType !== customerType) return false;
      return true;
    });
    return NextResponse.json({ success: true, total: data.length, data, source: "database" });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ success: false, error: error.message }, { status: (error as any).status });
    }
    return revenueUnavailable(error, "Revenue transactions");
  }
}
