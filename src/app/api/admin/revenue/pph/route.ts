import { NextResponse } from "next/server";
import { loadManagedHiringRevenue, revenueUnavailable } from "../_shared";

export async function GET() {
  try {
    const data = await loadManagedHiringRevenue();
    return NextResponse.json({ success: true, source: "database", summary: data.summary, data: data.placements });
  } catch (error) {
    return revenueUnavailable(error, "Managed hiring revenue");
  }
}
