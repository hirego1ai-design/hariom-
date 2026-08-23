import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/auditLogger";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession(req);
    const logs = await getAuditLogs();
    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
