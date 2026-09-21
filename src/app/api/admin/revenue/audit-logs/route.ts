import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { getAuditLogs } from "@/lib/auditLogger";
import { enforceRateLimit, handleApiError } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    await enforceRateLimit(req, "admin_revenue_audit_logs", 30, 60_000);
    const logs = await getAuditLogs(200);
    const financeLogs = logs.filter((log) => {
      const searchable = `${log.action} ${log.resource} ${log.details ?? ""}`.toLowerCase();
      return /(revenue|billing|payment|invoice|refund|subscription|pricing|payout)/.test(searchable);
    });

    return NextResponse.json({
      success: true,
      total: financeLogs.length,
      data: financeLogs,
      source: "persisted_audit_log",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
