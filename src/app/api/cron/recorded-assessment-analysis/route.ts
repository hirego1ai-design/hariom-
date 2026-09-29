import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiSecurity";
import { runEventsOutboxRecovery } from "@/lib/events/OutboxRecovery";
import { runRecordedAssessmentRecovery } from "@/lib/recordedAssessmentRecovery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 90;

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

    // Compatibility bridge: the currently deployed Railway scheduler calls this
    // endpoint every five minutes. Until the direct Railway worker can be
    // deployed with its DB/storage secrets, use the same authenticated tick to
    // drain the durable event outbox as well as recorded-assessment recovery.
    const outbox = await runEventsOutboxRecovery(20_000);
    const recordedAssessment = await runRecordedAssessmentRecovery();
    const success = outbox.success && recordedAssessment.success;

    return NextResponse.json(
      {
        ...recordedAssessment,
        success,
        outbox: {
          dispatched: outbox.totalDispatched,
          failed: outbox.totalFailed,
          unhandled: outbox.totalUnhandled,
          passes: outbox.passes,
        },
      },
      {
        status: success ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
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
