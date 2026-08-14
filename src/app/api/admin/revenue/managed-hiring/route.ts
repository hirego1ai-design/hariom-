import { NextResponse } from "next/server";
import { agreementsDb } from "@/lib/agreements-db";
import {
  HireGoManagedHiringRecord,
  managedHiringSummary,
  managedHiringPlacementLogs,
} from "../pph/route";

export { type HireGoManagedHiringRecord, managedHiringSummary, managedHiringPlacementLogs };

export async function GET() {
  const agreements = await agreementsDb.getAgreements();
  const activeAgreements = agreements.filter((a) => a.status === "ACTIVE");

  return NextResponse.json({
    success: true,
    framework: "HireGo Managed Hiring™ Commercial Agreement System",
    summary: {
      ...managedHiringSummary,
      activeAgreementsCount: activeAgreements.length,
      totalAgreementsCount: agreements.length,
    },
    placements: managedHiringPlacementLogs,
    agreements: agreements,
  });
}
