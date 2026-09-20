import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/auditLogger";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession(req);
    await enforceRateLimit(req, `admin_audit_logs:${admin.id}`, 30, 60_000);
    const logs = await getAuditLogs();
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
