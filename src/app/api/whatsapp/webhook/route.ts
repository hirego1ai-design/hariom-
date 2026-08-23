/**
 * HireGo WhatsApp — Meta Webhook Handler
 *
 * GET  /api/whatsapp/webhook  — Meta hub.challenge verification
 * POST /api/whatsapp/webhook  — Inbound message handler
 *
 * Security & Architecture:
 * - GET:  Verifies hub.verify_token against WHATSAPP_VERIFY_TOKEN (fails closed on placeholder).
 * - POST: Enforces body size limit (256 KB) to prevent DoS.
 * - POST: Validates X-Hub-Signature-256 HMAC using WHATSAPP_APP_SECRET.
 * - POST: Enforces per-waId distributed rate limiting (prevents shared-IP throttling).
 * - POST: Idempotent persistence — duplicate providerEventId is detected and skipped.
 * - POST: Fast ACK — Enqueues message to WhatsApp inbound queue and responds 200 immediately.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { persistInboundEvent, ensureWhatsAppContact } from "@/lib/whatsapp-identity";
import { isPlaceholderSecret, validateWhatsAppConfig } from "@/lib/whatsapp";
import { checkWaRateLimit } from "@/lib/whatsapp-rate-limiter";
import { enqueueWhatsAppInboundJob } from "@/lib/whatsapp-queue";
import { logAuditEvent } from "@/lib/auditLogger";

export const MAX_WEBHOOK_BODY_BYTES = 256 * 1024; // 256 KB

// ─── GET — Hub challenge verification ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const isProd = process.env.NODE_ENV === "production";

  if (!verifyToken || (isProd && isPlaceholderSecret(verifyToken))) {
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Inbound message handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Body-size protection (Content-Length header check)
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 2. Read raw body with size enforcement
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 3. Verify X-Hub-Signature-256 HMAC
  const signatureHeader = req.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!appSecret || isPlaceholderSecret(appSecret)) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    if (!signatureHeader) {
      logAuditEvent({ action: "WHATSAPP_WEBHOOK_MISSING_SIGNATURE", resource: "/api/whatsapp/webhook" });
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }
  }

  if (appSecret && signatureHeader) {
    const expected = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

    const actualSignature = Buffer.from(signatureHeader);
    const expectedSignature = Buffer.from(expected);
    if (
      actualSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(actualSignature, expectedSignature)
    ) {
      logAuditEvent({ action: "WHATSAPP_WEBHOOK_INVALID_SIGNATURE", resource: "/api/whatsapp/webhook" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (!appSecret) {
    // Non-production warning
    console.warn("[WhatsApp webhook] Signature verification skipped (WHATSAPP_APP_SECRET not set in non-prod).");
  }

  // 4. Parse JSON payload
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: "ok" }); // Fast ACK even on bad JSON
  }

  // 5. Ingest and enqueue entries
  try {
    await ingestWebhookEntries(body);
  } catch (err: any) {
    console.error("[WhatsApp webhook] Ingestion error:", err?.message);
  }

  // 6. Return fast 200 OK to Meta
  return NextResponse.json({ status: "ok" });
}

// ─── Webhook entry ingestion ─────────────────────────────────────────────────

async function ingestWebhookEntries(body: any): Promise<void> {
  const entries: any[] = body?.entry ?? [];

  for (const entry of entries) {
    const changes: any[] = entry?.changes ?? [];

    for (const change of changes) {
      if (change?.field !== "messages") continue;

      const value = change?.value;
      const messages: any[] = value?.messages ?? [];

      for (const message of messages) {
        await ingestSingleMessage(message).catch((err: any) => {
          console.error("[WhatsApp webhook] Message ingestion error:", err?.message, "messageId:", message?.id);
        });
      }
    }
  }
}

async function ingestSingleMessage(message: any): Promise<void> {
  const messageId: string = message?.id ?? "";
  const waId: string = message?.from ?? "";
  const messageType: string = message?.type ?? "text";

  if (!messageId || !waId) return;

  // 1. Per-waId rate limit check
  const rateLimitResult = checkWaRateLimit(waId, 20, 60_000);
  if (!rateLimitResult.allowed) {
    console.warn(`[WhatsApp webhook] Rate limit exceeded for waId ${waId}`);
    return;
  }

  // 2. Extract text body depending on message type
  let textBody = "";
  if (messageType === "text") {
    textBody = message?.text?.body ?? "";
  } else if (messageType === "interactive") {
    const interactive = message?.interactive;
    if (interactive?.type === "button_reply") {
      textBody = interactive?.button_reply?.title ?? interactive?.button_reply?.id ?? "";
    } else if (interactive?.type === "list_reply") {
      textBody = interactive?.list_reply?.title ?? interactive?.list_reply?.id ?? "";
    }
  } else {
    // Unsupported message type — ensure contact and enqueue notice
    await ensureWhatsAppContact(waId);
    textBody = "";
  }

  // 3. Persist and deduplicate (PostgreSQL unique providerEventId)
  const { isDuplicate, eventId } = await persistInboundEvent({
    providerEventId: messageId,
    waId,
    messageType,
    rawPayload: message,
  });

  if (isDuplicate) {
    return; // Duplicate delivery — silently skip
  }

  // 4. Enqueue into background worker queue for asynchronous processing
  enqueueWhatsAppInboundJob({
    eventId,
    messageId,
    waId,
    messageType,
    textBody,
    enqueuedAt: Date.now(),
  });
}
