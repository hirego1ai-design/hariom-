import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runEventsOutboxRecovery } from "@/lib/events/OutboxRecovery";
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
    const result = await runEventsOutboxRecovery(45_000);

    return NextResponse.json(result, {
      status: result.success ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
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
