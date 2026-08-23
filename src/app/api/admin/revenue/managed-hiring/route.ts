import { NextRequest, NextResponse } from "next/server";
import { loadManagedHiringRevenue, revenueUnavailable } from "../_shared";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const data = await loadManagedHiringRevenue();
    const activeAgreements = data.agreements.filter((agreement) => agreement.status === "ACTIVE");
    return NextResponse.json({
      success: true,
      source: "database",
      framework: "HireGo Managed Hiring™ Commercial Agreement System",
      summary: {
        ...data.summary,
        activeAgreementsCount: activeAgreements.length,
        totalAgreementsCount: data.agreements.length,
      },
      placements: data.placements,
      agreements: data.agreements,
    });
  } catch (error) {
    return revenueUnavailable(error, "Managed hiring revenue");
  }
}
