/**
 * DEPRECATED — This route has been superseded by the Meta webhook handler.
 *
 * All WhatsApp onboarding is now handled at:
 *   POST /api/whatsapp/webhook
 *
 * This endpoint is kept as a tombstone to return a clear error if anything
 * still calls the old URL, rather than silently serving the old fake stub.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "This endpoint is deprecated. WhatsApp onboarding is handled by POST /api/whatsapp/webhook.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ deprecated: true, replacedBy: "POST /api/whatsapp/webhook" }, { status: 410 });
}
