/**
 * DEPRECATED — This route has been superseded by the Meta webhook handler.
 *
 * All WhatsApp onboarding is now handled at:
 *   POST /api/whatsapp/webhook
 *
 * This endpoint remains as an explicit HTTP 410 tombstone so stale clients
 * cannot accidentally fall back to the retired onboarding implementation.
 */

import { jsonError } from "@/lib/apiSecurity";

const DEPRECATED_MESSAGE =
  "This endpoint is deprecated. WhatsApp onboarding is handled by POST /api/whatsapp/webhook.";

const tombstoneHeaders = {
  "Cache-Control": "no-store",
  Link: '</api/whatsapp/webhook>; rel="successor-version"',
};

export async function POST() {
  return jsonError(DEPRECATED_MESSAGE, 410, tombstoneHeaders);
}

export async function GET() {
  return jsonError(DEPRECATED_MESSAGE, 410, tombstoneHeaders);
}
