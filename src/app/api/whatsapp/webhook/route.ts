/**
 * HireGo WhatsApp — Meta Webhook Handler
 *
 * GET  /api/whatsapp/webhook  — Meta hub.challenge verification
 * POST /api/whatsapp/webhook  — Inbound message handler
 *
 * Security:
 * - GET:  Verifies hub.verify_token against WHATSAPP_VERIFY_TOKEN
 * - POST: Validates X-Hub-Signature-256 HMAC using WHATSAPP_APP_SECRET
 * - POST: Idempotent — duplicate providerEventId is silently skipped
 * - POST: Acknowledges 200 immediately; all domain processing is synchronous
 *         but safe — DB errors do not break the ack.
 *
 * Rate limiting: per IP via existing enforceRateLimit infrastructure.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { enforceRateLimit } from "@/lib/apiSecurity";
import { persistInboundEvent, markEventProcessed, ensureWhatsAppContact } from "@/lib/whatsapp-identity";
import { processWhatsAppMessage } from "@/lib/whatsapp-onboarding";
import { sendWhatsAppTextMessage, markWhatsAppMessageRead } from "@/lib/whatsapp";
import { logAuditEvent } from "@/lib/auditLogger";

// ─── GET — Hub challenge verification ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST — Inbound message handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Rate limiting (per IP)
  try {
    enforceRateLimit(req as any, "whatsapp:webhook", 120, 60_000);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 2. Read raw body for HMAC verification
  const rawBody = await req.text();

  // 3. Verify X-Hub-Signature-256
  const signatureHeader = req.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env.WHATSAPP_APP_SECRET;

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
  } else if (process.env.NODE_ENV === "production") {
    // Production webhooks must always be signed with the Meta App Secret.
    if (!appSecret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    logAuditEvent({ action: "WHATSAPP_WEBHOOK_MISSING_SIGNATURE", resource: "/api/whatsapp/webhook" });
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  } else if (!appSecret) {
    // Local development may omit Meta credentials, but never production.
    console.warn("[WhatsApp webhook] Signature verification skipped because WHATSAPP_APP_SECRET is not configured.");
  } else {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // 4. Acknowledge immediately — Meta expects a fast 200
  // (We run processing inline but keep it safe with try/catch)
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: "ok" }); // ack even on bad JSON
  }

  // 5. Process each entry
  try {
    await processWebhookBody(body);
  } catch (err: any) {
    // Log but do not return 5xx — Meta would retry
    console.error("[WhatsApp webhook] Processing error:", err?.message);
  }

  return NextResponse.json({ status: "ok" });
}

// ─── Webhook body processor ───────────────────────────────────────────────────

async function processWebhookBody(body: any): Promise<void> {
  const entries: any[] = body?.entry ?? [];

  for (const entry of entries) {
    const changes: any[] = entry?.changes ?? [];

    for (const change of changes) {
      if (change?.field !== "messages") continue;

      const value = change?.value;
      const messages: any[] = value?.messages ?? [];

      for (const message of messages) {
        await processInboundMessage(message, value).catch((err: any) => {
          console.error("[WhatsApp webhook] Message processing error:", err?.message, "messageId:", message?.id);
        });
      }
    }
  }
}

async function processInboundMessage(message: any, value: any): Promise<void> {
  const messageId: string = message?.id ?? "";
  const waId: string = message?.from ?? "";
  const messageType: string = message?.type ?? "text";

  if (!messageId || !waId) return;

  // Extract text body depending on message type
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
    // Unsupported message type — acknowledge receipt but don't process
    await ensureWhatsAppContact(waId);
    await sendWhatsAppTextMessage(waId, "We received your message but can't process this type yet. Please send a text reply.");
    return;
  }

  // 5. Persist and deduplicate
  const { isDuplicate, eventId } = await persistInboundEvent({
    providerEventId: messageId,
    waId,
    messageType,
    rawPayload: message,
  });

  if (isDuplicate) {
    return; // Already processed — no side effects
  }

  // 6. Mark message as read (non-critical)
  markWhatsAppMessageRead(messageId).catch(() => {});

  // 7. Process through onboarding state machine
  let reply: string;
  try {
    if (!textBody.trim()) {
      // Empty message — nudge user
      reply = "Please send a text message to continue. Reply *help* for options.";
    } else {
      const result = await processWhatsAppMessage(waId, textBody);
      reply = result.reply;
    }
  } catch (err: any) {
    reply = "Something went wrong on our end. Please try again in a moment. 🙏";
    await markEventProcessed(eventId, err?.message ?? "unknown");
    await sendWhatsAppTextMessage(waId, reply);
    return;
  }

  // 8. Send reply
  const sendResult = await sendWhatsAppTextMessage(waId, reply);
  if (!sendResult.sent) {
    console.error("[WhatsApp webhook] Failed to send reply:", sendResult.reason);
  }

  await markEventProcessed(eventId);
}
