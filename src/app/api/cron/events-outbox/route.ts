import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { OutboxPoller } from "@/lib/events/Outbox";
import { registerProductionConsumers } from "@/lib/events/ProductionConsumers";
import { handleApiError, ApiError } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function verifyCronSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("CRON_SECRET is not configured.", 503);
    }
    const provided =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      request.headers.get("x-cron-secret") ||
      "";
    if (provided !== "dev-cron-secret") throw new ApiError("Unauthorized", 401);
    return;
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-cron-secret") ||
    "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError("Unauthorized", 401);
  }
}

async function processOutbox(request: NextRequest) {
  try {
    verifyCronSecret(request);
    registerProductionConsumers();

    const stopAt = Date.now() + 45_000;
    const reports = [];
    let totalDispatched = 0;
    let totalFailed = 0;
    let totalUnhandled = 0;

    for (let pass = 0; pass < 10 && Date.now() < stopAt; pass++) {
      const report = await OutboxPoller.pollAndProcess(50, 60_000, stopAt);
      reports.push(report);
      totalDispatched += report.dispatched;
      totalFailed += report.failed;
      totalUnhandled += report.unhandled;
      if (report.claimed === 0) break;
    }

    return NextResponse.json(
      {
        success: totalFailed === 0 && totalUnhandled === 0,
        totalDispatched,
        totalFailed,
        totalUnhandled,
        passes: reports.length,
        reports,
      },
      {
        status: totalFailed > 0 || totalUnhandled > 0 ? 503 : 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  return processOutbox(request);
}

export async function POST(request: NextRequest) {
  return processOutbox(request);
}
