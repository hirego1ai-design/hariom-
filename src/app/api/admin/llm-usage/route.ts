import { NextRequest, NextResponse } from "next/server";
import { getAiUsageStats } from "@/utils";
import { requireAdminSession } from "@/lib/routeAuthorization";

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    const stats = await getAiUsageStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
