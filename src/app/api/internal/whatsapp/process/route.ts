import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceInternalApiKey, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { claimWhatsAppInboundEvent, markWhatsAppJobProcessed, markWhatsAppJobRetry } from "@/lib/whatsapp-queue";
import { processWhatsAppMessage } from "@/lib/whatsapp-onboarding";
import { markWhatsAppMessageRead, sendWhatsAppTextMessage } from "@/lib/whatsapp";

const schema = z.object({ eventId: z.string().uuid() });

function isTransientFailure(reason?: string) {
  return Boolean(reason && (/\b429\b|\b5\d\d\b|timeout|network/i.test(reason)));
}

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    const { eventId } = await readValidatedJson(request, schema);
    const event = await claimWhatsAppInboundEvent(eventId);
    if (!event) return NextResponse.json({ success: true, skipped: true });

    try {
      const result = await processWhatsAppMessage(event.waId, event.messageText || "");
      const sent = await sendWhatsAppTextMessage(event.waId, result.reply);
      if (!sent.sent) {
        const retryable = isTransientFailure(sent.reason);
        const terminal = await markWhatsAppJobRetry(event.id, sent.reason || "WhatsApp send failed", event.attemptCount, retryable);
        return NextResponse.json({ success: false, retry: !terminal }, { status: terminal ? 200 : 503 });
      }

      await markWhatsAppMessageRead(event.providerEventId);
      await markWhatsAppJobProcessed(event.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "WhatsApp processing failed";
      const terminal = await markWhatsAppJobRetry(event.id, reason, event.attemptCount);
      return NextResponse.json({ success: false, retry: !terminal, transient: isTransientFailure(reason) }, { status: terminal ? 200 : 503 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
