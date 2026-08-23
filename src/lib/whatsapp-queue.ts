import { prisma } from "./prisma";

const MAX_ATTEMPTS = 3;

export class WhatsAppQueueUnavailableError extends Error {}

function workerUrl() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const key = process.env.INTERNAL_API_KEY;
  if (!appUrl || !key || !process.env.QSTASH_TOKEN) return null;
  return `${appUrl}/api/internal/whatsapp/process`;
}

/**
 * Dispatches an already-persisted inbound event. QStash supplies durable retry
 * outside the Vercel request process; no event data is kept in local memory.
 */
export async function enqueueWhatsAppInboundJob(eventId: string): Promise<void> {
  const destination = workerUrl();
  if (!destination) {
    if (process.env.NODE_ENV === "production") {
      throw new WhatsAppQueueUnavailableError("QStash, APP_URL, and INTERNAL_API_KEY are required for WhatsApp processing.");
    }
    return;
  }

  const response = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      "Content-Type": "application/json",
      "Upstash-Forward-x-api-key": process.env.INTERNAL_API_KEY!,
    },
    body: JSON.stringify({ eventId }),
  });
  if (!response.ok) {
    throw new WhatsAppQueueUnavailableError(`QStash rejected WhatsApp dispatch with status ${response.status}.`);
  }
}

export async function claimWhatsAppInboundEvent(eventId: string) {
  const now = new Date();
  const claim = await prisma.whatsAppInboundEvent.updateMany({
    where: {
      id: eventId,
      processed: false,
      processingStatus: { in: ["PENDING", "RETRY"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    data: { processingStatus: "PROCESSING", processingStartedAt: now, attemptCount: { increment: 1 } },
  });
  if (claim.count !== 1) return null;
  return prisma.whatsAppInboundEvent.findUnique({ where: { id: eventId } });
}

export async function markWhatsAppJobRetry(eventId: string, error: string, attemptCount: number, retryable = true) {
  const delayMs = Math.min(15 * 60_000, 1_000 * 2 ** Math.max(0, attemptCount - 1));
  const terminal = !retryable || attemptCount >= MAX_ATTEMPTS;
  await prisma.whatsAppInboundEvent.update({
    where: { id: eventId },
    data: {
      processingStatus: terminal ? "FAILED" : "RETRY",
      processingError: error.slice(0, 500),
      nextAttemptAt: terminal ? null : new Date(Date.now() + delayMs),
      processingStartedAt: null,
    },
  });
  return terminal;
}

export async function markWhatsAppJobProcessed(eventId: string) {
  await prisma.whatsAppInboundEvent.update({
    where: { id: eventId },
    data: { processed: true, processingStatus: "PROCESSED", processingError: null, processedAt: new Date() },
  });
}
