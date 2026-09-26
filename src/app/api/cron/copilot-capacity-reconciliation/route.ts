import { NextRequest, NextResponse } from "next/server";
import { reconcileExpiredCopilotReservations } from "@/lib/copilot/reservationReconciliation";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : request.headers.get("x-cron-secret")?.trim();
  return secret
    ? supplied === secret
    : process.env.NODE_ENV !== "production" && supplied === "dev-cron-secret";
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await reconcileExpiredCopilotReservations({ limit: 250 });
  return NextResponse.json({
    success: result.failed === 0,
    ...result,
  }, { status: result.failed === 0 ? 200 : 207 });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
