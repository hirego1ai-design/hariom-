import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { getAuditLogs } from "@/lib/auditLogger";

export async function GET(req: NextRequest) {
  await requireAdminSession(req);
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
}
