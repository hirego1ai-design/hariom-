import { NextRequest, NextResponse } from "next/server";
import { runAllTests } from "@/tests/suite.test";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_tests_run", 2, 60_000);

    // The suite intentionally creates and deletes database records. It must
    // never be executable from a deployed production application, even by an
    // administrator. CI invokes the suite directly with an explicitly
    // disposable localhost PostgreSQL database.
    if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
      throw new ApiError("The destructive test runner is disabled in deployed environments.", 404);
    }

    const report = await runAllTests();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
