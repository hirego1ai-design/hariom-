import { NextResponse } from "next/server";
import { runAllTests } from "@/tests/suite.test";

export async function POST() {
  try {
    const report = await runAllTests();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
