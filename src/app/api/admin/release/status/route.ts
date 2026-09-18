import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_release_status", 30, 60_000);
    // A release is not production-ready until the release process explicitly
    // signs it off after CI, migrations, provider checks, and staging tests.
    // Never report a static 100% score to operators.
    const signedOff = process.env.RELEASE_SIGNED_OFF === "true";
    const phaseNames = [
      "Architecture Cleanup & Standardized Codebase",
      "Managed Hiring Wizard & Pipeline",
      "Commercial Agreement Engine",
      "Commercial Pricing Engine & Warranty SLA",
      "Invoice Automation",
      "Admin Configuration & Feature Flags",
      "Multi-LLM Router & AI Infrastructure",
      "Cloud Infrastructure Readiness",
      "Security Hardening",
      "Automated Testing Suite",
      "Production Performance & Optimization",
      "Production Database Migrations & Live Wiring",
    ];
    const phases = phaseNames.map((name, index) => ({
      id: index + 1,
      name: `Phase ${index + 1}: ${name}`,
      status: signedOff ? "SIGNED_OFF" : "PENDING_VALIDATION",
    }));

    const completedCount = phases.filter((p) => p.status === "SIGNED_OFF").length;

    return NextResponse.json({
      success: true,
      masterReleaseName: "HireGo AI v3.0",
      releaseVersion: "3.0.0-PROD",
      launchReadiness: signedOff ? "SIGNED OFF FOR GO-LIVE" : "NOT READY — VALIDATION REQUIRED",
      completedPhases: completedCount,
      totalPhases: phases.length,
      phases,
      signedOffAt: null,
      note: signedOff ? "Release sign-off flag is enabled; consult the immutable deployment/audit record for the actual sign-off timestamp." : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
