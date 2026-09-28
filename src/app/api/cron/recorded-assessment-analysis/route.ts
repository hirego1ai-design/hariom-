import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiSecurity";
import { runRecordedAssessmentRecovery } from "@/lib/recordedAssessmentRecovery";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) return false;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : request.headers.get("x-cron-secret")?.trim();
  return secret
    ? supplied === secret
    : process.env.NODE_ENV !== "production" && supplied === "dev-cron-secret";
}

async function run(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

    const result = await runRecordedAssessmentRecovery();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
