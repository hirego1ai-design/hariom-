import { NextRequest, NextResponse } from "next/server";
import { getAiUsageStats } from "@/utils";

export async function GET() {
  try {
    const stats = await getAiUsageStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
