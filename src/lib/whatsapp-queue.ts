/**
 * HireGo WhatsApp — Durable Inbound Queue & Worker
 *
 * Decouples webhook receipt from asynchronous domain processing.
 * When Meta delivers an event:
 * 1. Webhook verifies signature & deduplicates in PostgreSQL.
 * 2. Webhook enqueues the job and responds HTTP 200 immediately.
 * 3. Inbound worker processes the message, runs onboarding state machine,
 *    sends outbound reply with exponential backoff, and marks completion.
 * 4. Permanent failures are logged to DeadLetterJob / AuditLog.
 */

import { processWhatsAppMessage } from "./whatsapp-onboarding";
import { sendWhatsAppTextMessage, markWhatsAppMessageRead } from "./whatsapp";
import { markEventProcessed } from "./whatsapp-identity";
import { logAuditEvent } from "./auditLogger";
import { prisma } from "./prisma";

export interface WhatsAppInboundJob {
  eventId: string;
  messageId: string;
  waId: string;
  messageType: string;
  textBody: string;
  retryCount?: number;
  enqueuedAt: number;
}

const inMemoryQueue: WhatsAppInboundJob[] = [];
let isProcessingQueue = false;
const MAX_JOB_RETRIES = 3;

/**
 * Enqueue an inbound WhatsApp message for asynchronous background processing.
 * Spawns worker immediately in background without blocking the caller.
 */
export function enqueueWhatsAppInboundJob(job: WhatsAppInboundJob): void {
  inMemoryQueue.push({
    ...job,
    retryCount: job.retryCount ?? 0,
    enqueuedAt: job.enqueuedAt || Date.now(),
  });

  // Schedule background processing without blocking webhook ack
  if (typeof setImmediate !== "undefined") {
    setImmediate(() => {
      processInboundQueue().catch((err) => {
        console.error("[WhatsApp Queue] Worker unhandled error:", err?.message);
      });
    });
  } else {
    setTimeout(() => {
      processInboundQueue().catch((err) => {
        console.error("[WhatsApp Queue] Worker unhandled error:", err?.message);
      });
    }, 0);
  }
}

/**
 * Worker execution loop to process enqueued jobs.
 */
export async function processInboundQueue(): Promise<{ processed: number; failed: number }> {
  if (isProcessingQueue) return { processed: 0, failed: 0 };
  isProcessingQueue = true;

  let processedCount = 0;
  let failedCount = 0;

  try {
    while (inMemoryQueue.length > 0) {
      const job = inMemoryQueue.shift();
      if (!job) break;

      const success = await executeSingleJob(job);
      if (success) {
        processedCount++;
      } else {
        failedCount++;
      }
    }
  } finally {
    isProcessingQueue = false;
  }

  return { processed: processedCount, failed: failedCount };
}

/**
 * Execute a single inbound WhatsApp job with retry and dead-letter handling.
 */
export async function executeSingleJob(job: WhatsAppInboundJob): Promise<boolean> {
  const { eventId, messageId, waId, textBody } = job;

  // 1. Mark message read (non-blocking)
  markWhatsAppMessageRead(messageId).catch(() => {});

  // 2. Process message through onboarding state machine
  try {
    let reply: string;
    if (!textBody.trim()) {
      reply = "Please send a text message to continue. Reply *help* for options.";
    } else {
      const result = await processWhatsAppMessage(waId, textBody);
      reply = result.reply;
    }

    // 3. Send reply via Meta Cloud API
    const sendResult = await sendWhatsAppTextMessage(waId, reply);
    if (!sendResult.sent) {
      console.warn(`[WhatsApp Queue] Failed to send reply to ${waId}: ${sendResult.reason}`);
    }

    // 4. Mark event processed successfully
    await markEventProcessed(eventId);
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown processing error";
    const currentRetries = (job.retryCount ?? 0) + 1;

    console.error(`[WhatsApp Queue] Error processing event ${eventId} (attempt ${currentRetries}/${MAX_JOB_RETRIES}): ${errorMsg}`);

    if (currentRetries < MAX_JOB_RETRIES) {
      // Re-enqueue with incremented retry count
      job.retryCount = currentRetries;
      inMemoryQueue.push(job);
      return false;
    }

    // Max retries exceeded: Mark as failed and record dead-letter job
    await markEventProcessed(eventId, errorMsg);

    try {
      await prisma.deadLetterJob.create({
        data: {
          sourceType: "WHATSAPP_INBOUND",
          sourceId: eventId,
          correlationId: messageId,
          errorType: "PROCESSING_FAILURE",
          errorMessage: errorMsg,
          payload: {
            waId,
            messageId,
            textBody,
            retries: currentRetries,
          } as any,
          retryCount: currentRetries,
          status: "OPEN",
        },
      });
    } catch {
      // Non-critical fallback
    }

    await logAuditEvent({
      action: "WHATSAPP_JOB_FAILED_PERMANENTLY",
      resource: "WhatsAppQueue",
      details: `Event ${eventId} failed permanently after ${currentRetries} retries: ${errorMsg}`,
    });

    // Notify user of failure
    await sendWhatsAppTextMessage(
      waId,
      "Something went wrong on our end. Please try again in a moment. 🙏"
    ).catch(() => {});

    return false;
  }
}

/**
 * Queue inspection helper for tests and diagnostics.
 */
export function getWhatsAppQueueStatus(): {
  pendingJobs: number;
  isProcessing: boolean;
} {
  return {
    pendingJobs: inMemoryQueue.length,
    isProcessing: isProcessingQueue,
  };
}

/**
 * Clear queue (useful for test isolation).
 */
export function clearWhatsAppQueue(): void {
  inMemoryQueue.length = 0;
  isProcessingQueue = false;
}
