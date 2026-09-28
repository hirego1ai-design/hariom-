import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiSecurity";
import { runRecordedAssessmentRecovery } from "@/lib/recordedAssessmentRecovery";
import { OutboxPoller } from "@/lib/events/Outbox";
import { registerProductionConsumers } from "@/lib/events/ProductionConsumers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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

async function runLegacyOutboxBridge() {
  registerProductionConsumers();
  const stopAt = Date.now() + 20_000;
  let dispatched = 0;
  let failed = 0;
  let unhandled = 0;
  let passes = 0;

  for (let pass = 0; pass < 4 && Date.now() < stopAt; pass++) {
    const report = await OutboxPoller.pollAndProcess(50, 60_000, stopAt);
    passes += 1;
    dispatched += report.dispatched;
    failed += report.failed;
    unhandled += report.unhandled;
    if (report.claimed === 0) break;
  }

  return { dispatched, failed, unhandled, passes };
}

async function run(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

    const outbox = await runLegacyOutboxBridge();
    const recovery = await runRecordedAssessmentRecovery();
    const success = recovery.success === true && outbox.failed === 0 && outbox.unhandled === 0;

    return NextResponse.json(
      { ...recovery, success, outbox },
      { status: success ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
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
