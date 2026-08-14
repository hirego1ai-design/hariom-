import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

function checkFileExists(relPath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relPath));
}

export async function GET() {
  try {
    const checks = [
      { id: 1, name: "Phase 1: Architecture Cleanup & Standardized Codebase", check: () => checkFileExists("src/lib/auth.ts") && checkFileExists("src/lib/apiSecurity.ts") },
      { id: 2, name: "Phase 2: HireGo Managed Hiring Wizard & Pipeline", check: () => checkFileExists("src/app/employer/managed-hiring/request/page.tsx") },
      { id: 3, name: "Phase 3: Commercial Agreement Engine", check: () => checkFileExists("src/lib/agreements-db.ts") },
      { id: 4, name: "Phase 4: Commercial Pricing Engine & Warranty SLA", check: () => checkFileExists("src/lib/pricing.ts") || checkFileExists("src/utils/pricing.ts") },
      { id: 5, name: "Phase 5: Invoice Automation", check: () => checkFileExists("src/lib/invoices-db.ts") },
      { id: 6, name: "Phase 6: Admin Configuration & Feature Flags", check: () => checkFileExists("src/app/api/admin/config/route.ts") },
      { id: 7, name: "Phase 7: Multi-LLM Router & AI Infrastructure", check: () => checkFileExists("src/utils/aiRouter.ts") },
      { id: 8, name: "Phase 8: Cloud Infrastructure Readiness", check: () => checkFileExists(".env.production") && checkFileExists("prisma/schema.prisma") },
      { id: 9, name: "Phase 9: Security Hardening", check: () => (checkFileExists("src/middleware.ts") || checkFileExists("src/proxy.ts")) && checkFileExists("src/lib/apiSecurity.ts") },
      { id: 10, name: "Phase 10: Automated Testing Suite", check: () => checkFileExists("src/tests/suite.test.ts") || checkFileExists("scripts/run-tests.ts") },
      { id: 11, name: "Phase 11: Production Performance & Optimization", check: () => false },
      { id: 12, name: "Phase 12: Production Database Migrations", check: () => checkFileExists("prisma/migrations") },
    ];

    const phases = checks.map(c => {
      const passed = c.check();
      return { id: c.id, name: c.name, status: passed ? "COMPLETED" : "PENDING", score: passed ? 100 : 0 };
    });

    const completedCount = phases.filter(p => p.status === "COMPLETED").length;
    const overallScore = Math.round((completedCount / phases.length) * 100);

    return NextResponse.json({
      success: true,
      masterReleaseName: "HireGo AI v3.0",
      releaseVersion: "3.0.0-RC",
      launchReadiness: overallScore >= 90 ? "READY FOR GO-LIVE" : overallScore >= 70 ? "READY FOR STAGING" : "IN DEVELOPMENT",
      overallScore,
      completedPhases: completedCount,
      totalPhases: phases.length,
      phases,
      signedOffAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
