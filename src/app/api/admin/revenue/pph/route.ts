import { NextRequest, NextResponse } from "next/server";
import { loadManagedHiringRevenue, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    const data = await loadManagedHiringRevenue();
    return NextResponse.json({ success: true, source: "database", summary: data.summary, data: data.placements });
  } catch (error) {
    return revenueUnavailable(error, "Managed hiring revenue");
  }
}
