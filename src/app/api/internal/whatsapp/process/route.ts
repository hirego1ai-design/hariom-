import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceInternalApiKey, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import {
  claimWhatsAppInboundEvent,
  markWhatsAppJobProcessed,
  markWhatsAppJobRetry,
  restoreWhatsAppJobPending,
  scheduleWhatsAppInboundRetry,
  scheduleWhatsAppFollowupCheck,
  WhatsAppQueueUnavailableError,
  type WhatsAppRetryErrorType,
} from "@/lib/whatsapp-queue";
import { processWhatsAppMessage } from "@/lib/whatsapp-onboarding";
import { markWhatsAppMessageRead, sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { shouldScheduleWhatsAppFollowup } from "@/lib/whatsapp-followup";

const schema = z.object({ eventId: z.string().uuid() });

function isTransientFailure(reason?: string) {
  return Boolean(reason && (/\b429\b|\b5\d\d\b|timeout|network/i.test(reason)));
}

async function scheduleRetry(
  event: NonNullable<Awaited<ReturnType<typeof claimWhatsAppInboundEvent>>>,
  reason: string,
  retryable: boolean,
  errorType: WhatsAppRetryErrorType,
) {
  const decision = await markWhatsAppJobRetry(event, reason, retryable, errorType);
  if (decision.terminal) return { terminal: true };
  try {
    await scheduleWhatsAppInboundRetry(event.id, decision.delayMs!);
    return { terminal: false };
  } catch (error) {
    // Keep this event PENDING so QStash's infrastructure retry can recover a
    // failed scheduler call without racing the persisted retry timestamp.
    await restoreWhatsAppJobPending(event.id);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    const { eventId } = await readValidatedJson(request, schema);
    const event = await claimWhatsAppInboundEvent(eventId);
    if (!event) return NextResponse.json({ success: true, skipped: true });

    try {
      const rawPayload = event.rawPayload && typeof event.rawPayload === "object"
        ? event.rawPayload as Record<string, unknown>
        : {};
      const campaignMeta = rawPayload.referral && typeof rawPayload.referral === "object"
        ? rawPayload.referral as Record<string, unknown>
        : undefined;
      const result = await processWhatsAppMessage(event.waId, event.messageText || "", { campaignMeta });
      const sent = await sendWhatsAppTextMessage(event.waId, result.reply);
      if (!sent.sent) {
        const retryable = isTransientFailure(sent.reason);
        const scheduled = await scheduleRetry(
          event,
          sent.reason || "WhatsApp send failed",
          retryable,
          retryable ? "TRANSIENT_PROVIDER" : "PERMANENT_PROVIDER",
        );
        // Business retries are already durably scheduled, so ACK this QStash
        // invocation instead of engaging QStash's automatic retry backoff.
        return NextResponse.json({ success: false, retryScheduled: !scheduled.terminal, terminal: scheduled.terminal });
      }

      await markWhatsAppMessageRead(event.providerEventId);
      await markWhatsAppJobProcessed(event);

      // Schedule at most one delayed eligibility check only when the linked
      // candidate currently has a material pending action. The delayed worker
      // re-checks consent, window age, newer inbound replies and business state
      // before sending anything, so this never attempts to manufacture a window.
      if (result.userId && await shouldScheduleWhatsAppFollowup(result.userId)) {
        await scheduleWhatsAppFollowupCheck(event.id).catch(() => {
          console.warn("WHATSAPP_FOLLOWUP_SCHEDULE_FAILED");
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      // Scheduling failures are infrastructure failures. The event was reset
      // to PENDING, so let QStash's single delivery retry invoke it again.
      if (error instanceof WhatsAppQueueUnavailableError) throw error;
      const reason = error instanceof Error ? error.message : "WhatsApp processing failed";
      const retryable = isTransientFailure(reason);
      const scheduled = await scheduleRetry(event, reason, retryable, retryable ? "TRANSIENT_PROVIDER" : "PROCESSING_FAILURE");
      return NextResponse.json({ success: false, retryScheduled: !scheduled.terminal, terminal: scheduled.terminal });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
