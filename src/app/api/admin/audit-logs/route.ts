import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/auditLogger";

export async function GET() {
  try {
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
