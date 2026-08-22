import { NextRequest, NextResponse } from "next/server";
import { runAllTests } from "@/tests/suite.test";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { handleApiError } from "@/lib/apiSecurity";

export async function POST(req: NextRequest) {
  try {
    requireAdminSession(req);
    const report = await runAllTests();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
