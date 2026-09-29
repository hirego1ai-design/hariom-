import { NextRequest, NextResponse } from "next/server";
import { loadManagedHiringRevenue, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_revenue_pph:${admin.id}`, 60, 60_000);
    const data = await loadManagedHiringRevenue();
    return NextResponse.json({ success: true, source: "database", summary: data.summary, data: data.placements });
  } catch (error) {
    return revenueUnavailable(error, "Managed hiring revenue");
  }
}
