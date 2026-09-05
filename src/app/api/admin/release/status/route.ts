import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    // A release is not production-ready until the release process explicitly
    // signs it off after CI, migrations, provider checks, and staging tests.
    // Never report a static 100% score to operators.
    const signedOff = process.env.RELEASE_SIGNED_OFF === "true";
    const phases = [
      { id: 1, name: "Phase 1: Architecture Cleanup & Standardized Codebase", status: "COMPLETED", score: 100 },
      { id: 2, name: "Phase 2: HireGo Managed Hiring Wizard & Pipeline", status: "COMPLETED", score: 100 },
      { id: 3, name: "Phase 3: Commercial Agreement Engine", status: "COMPLETED", score: 100 },
      { id: 4, name: "Phase 4: Commercial Pricing Engine & Warranty SLA", status: "COMPLETED", score: 100 },
      { id: 5, name: "Phase 5: Invoice Automation", status: "COMPLETED", score: 100 },
      { id: 6, name: "Phase 6: Admin Configuration & Feature Flags", status: "COMPLETED", score: 100 },
      { id: 7, name: "Phase 7: Multi-LLM Router & AI Infrastructure", status: "COMPLETED", score: 100 },
      { id: 8, name: "Phase 8: Cloud Infrastructure Readiness", status: "COMPLETED", score: 100 },
      { id: 9, name: "Phase 9: Security Hardening", status: "COMPLETED", score: 100 },
      { id: 10, name: "Phase 10: Automated Testing Suite", status: "COMPLETED", score: 100 },
      { id: 11, name: "Phase 11: Production Performance & Optimization", status: "COMPLETED", score: 100 },
      { id: 12, name: "Phase 12: Production Database Migrations & Live Wiring", status: "COMPLETED", score: 100 },
    ].map((phase) => ({
      ...phase,
      status: signedOff ? phase.status : "PENDING_VALIDATION",
      score: signedOff ? phase.score : 0,
    }));

    const completedCount = phases.filter((p) => p.status === "COMPLETED").length;
    const overallScore = signedOff ? 100 : 0;

    return NextResponse.json({
      success: true,
      masterReleaseName: "HireGo AI v3.0",
      releaseVersion: "3.0.0-PROD",
      launchReadiness: signedOff ? "READY FOR GO-LIVE" : "NOT READY — VALIDATION REQUIRED",
      overallScore,
      completedPhases: completedCount,
      totalPhases: phases.length,
      phases,
      signedOffAt: signedOff ? new Date().toISOString() : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
