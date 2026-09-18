import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const WHATSAPP_MAX_ATTEMPTS = 3;
const STALE_PROCESSING_MS = 10 * 60_000;

export class WhatsAppQueueUnavailableError extends Error {}

export type WhatsAppRetryErrorType =
  | "TRANSIENT_PROVIDER"
  | "PERMANENT_PROVIDER"
  | "RATE_LIMITED"
  | "PROCESSING_FAILURE";

function workerUrl() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  const key = process.env.INTERNAL_API_KEY;
  if (!appUrl || !key || !process.env.QSTASH_TOKEN) return null;
  return `${appUrl}/api/internal/whatsapp/process`;
}

function sanitizedFailureMessage(error: string): string {
  const status = error.match(/\b([45]\d\d)\b/)?.[1];
  if (status) return `WhatsApp provider returned HTTP ${status}.`;
  if (/rate.?limit/i.test(error)) return "WhatsApp sender rate limit reached.";
  if (/timeout|network|temporar/i.test(error)) return "WhatsApp provider was temporarily unavailable.";
  if (/not configured|invalid|forbidden|unauthori[sz]ed/i.test(error)) return "WhatsApp provider configuration or request was rejected.";
  return "WhatsApp message processing failed.";
}

function retryDelayMs(attemptCount: number): number {
  const base = Math.min(15 * 60_000, 1_000 * 2 ** Math.max(0, attemptCount - 1));
  return base + Math.floor(Math.random() * Math.max(1, Math.floor(base * 0.2)));
}

async function publishWhatsAppInboundJob(eventId: string, delayMs = 0): Promise<void> {
  const destination = workerUrl();
  if (!destination) {
    if (process.env.NODE_ENV === "production") {
      throw new WhatsAppQueueUnavailableError("QStash, APP_URL, and INTERNAL_API_KEY are required for WhatsApp processing.");
    }
    return;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
    "Content-Type": "application/json",
    "Upstash-Forward-x-api-key": process.env.INTERNAL_API_KEY!,
    // Business retries are scheduled below, not by QStash retry backoff. One
    // infrastructure retry remains only when this worker itself is unavailable.
    "Upstash-Retries": "1",
    "Upstash-Redact-Fields": "body,header[x-api-key]",
  };
  if (delayMs > 0) headers["Upstash-Delay"] = `${Math.max(1, Math.ceil(delayMs / 1_000))}s`;

  const response = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ eventId }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new WhatsAppQueueUnavailableError(`QStash rejected WhatsApp dispatch with status ${response.status}.`);
}

/** Initial ingress uses QStash only for durable asynchronous invocation. */
export async function enqueueWhatsAppInboundJob(eventId: string): Promise<void> {
  await publishWhatsAppInboundJob(eventId);
}

/** QStash owns business retry timing: every transient retry is a new delayed message. */
export async function scheduleWhatsAppInboundRetry(eventId: string, delayMs: number): Promise<void> {
  await publishWhatsAppInboundJob(eventId, delayMs);
}

export async function claimWhatsAppInboundEvent(eventId: string) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
  const claim = await prisma.whatsAppInboundEvent.updateMany({
    where: {
      id: eventId,
      processed: false,
      OR: [
        { processingStatus: "PENDING" },
        { processingStatus: "RETRY", nextAttemptAt: { lte: now } },
        { processingStatus: "PROCESSING", processingStartedAt: { lte: staleBefore } },
      ],
    },
    data: {
      processingStatus: "PROCESSING",
      processingStartedAt: now,
      nextAttemptAt: null,
      attemptCount: { increment: 1 },
    },
  });
  if (claim.count !== 1) return null;
  return prisma.whatsAppInboundEvent.findUnique({ where: { id: eventId } });
}

type ClaimedWhatsAppEvent = {
  id: string;
  processingStartedAt: Date | null;
};

export async function markWhatsAppJobProcessed(event: ClaimedWhatsAppEvent | string) {
  const eventId = typeof event === "string" ? event : event.id;
  const claimStartedAt = typeof event === "string" ? undefined : event.processingStartedAt;
  const settled = await prisma.whatsAppInboundEvent.updateMany({
    where: {
      id: eventId,
      processed: false,
      processingStatus: "PROCESSING",
      ...(claimStartedAt ? { processingStartedAt: claimStartedAt } : {}),
    },
    data: {
      processed: true,
      processingStatus: "PROCESSED",
      processingError: null,
      processingStartedAt: null,
      nextAttemptAt: null,
      messageText: null,
      processedAt: new Date(),
    },
  });
  return settled.count === 1;
}

async function terminallyFailWhatsAppJob(params: {
  eventId: string;
  providerEventId: string;
  messageType: string;
  receivedAt: Date;
  attemptCount: number;
  processingStartedAt: Date | null;
  error: string;
  errorType: WhatsAppRetryErrorType;
}) {
  const errorMessage = sanitizedFailureMessage(params.error);
  await prisma.$transaction(async (tx) => {
    const settled = await tx.whatsAppInboundEvent.updateMany({
      where: {
        id: params.eventId,
        processed: false,
        processingStatus: "PROCESSING",
        ...(params.processingStartedAt ? { processingStartedAt: params.processingStartedAt } : {}),
      },
      data: {
        processingStatus: "FAILED",
        processingError: errorMessage,
        processingStartedAt: null,
        nextAttemptAt: null,
        messageText: null,
      },
    });
    if (settled.count !== 1) return;
    await tx.deadLetterJob.upsert({
      where: { sourceType_sourceId: { sourceType: "WHATSAPP_INBOUND", sourceId: params.eventId } },
      create: {
        sourceType: "WHATSAPP_INBOUND",
        sourceId: params.eventId,
        correlationId: params.providerEventId,
        errorType: params.errorType,
        errorMessage,
        retryCount: params.attemptCount,
        status: "OPEN",
        // Deliberately exclude sender IDs, message text, and raw webhook data.
        payload: { messageType: params.messageType, receivedAt: params.receivedAt.toISOString() } as Prisma.InputJsonValue,
      },
      update: {},
    });
  }, {
    timeout: 15000
  });
}

/**
 * Persists a retry decision. The caller schedules a delayed QStash message and
 * ACKs only after that succeeds. Scheduling failure is restored to PENDING so
 * QStash's one infrastructure retry can safely invoke the worker again.
 */
export async function markWhatsAppJobRetry(
  event: { id: string; providerEventId: string; messageType: string; receivedAt: Date; attemptCount: number; processingStartedAt: Date | null },
  error: string,
  retryable = true,
  errorType: WhatsAppRetryErrorType = "PROCESSING_FAILURE"
): Promise<{ terminal: boolean; delayMs?: number }> {
  if (!retryable || event.attemptCount >= WHATSAPP_MAX_ATTEMPTS) {
    await terminallyFailWhatsAppJob({ eventId: event.id, ...event, error, errorType });
    return { terminal: true };
  }

  const delayMs = retryDelayMs(event.attemptCount);
  await prisma.whatsAppInboundEvent.updateMany({
    where: {
      id: event.id,
      processed: false,
      processingStatus: "PROCESSING",
      ...(event.processingStartedAt ? { processingStartedAt: event.processingStartedAt } : {}),
    },
    data: {
      processingStatus: "RETRY",
      processingError: sanitizedFailureMessage(error),
      nextAttemptAt: new Date(Date.now() + delayMs),
      processingStartedAt: null,
    },
  });
  return { terminal: false, delayMs };
}

export interface WhatsAppRecoveryReport {
  eligible: number;
  scheduled: number;
  failed: number;
  timeBudgetExhausted: boolean;
}

/**
 * Restores queue delivery after an ingress/scheduler crash. It does not claim
 * or process business work; it only republishes bounded durable event IDs.
 * The worker's database claim remains the idempotency boundary.
 */
export async function recoverWhatsAppInboundEvents(
  batchSize = 10,
  stopAt = Number.POSITIVE_INFINITY,
): Promise<WhatsAppRecoveryReport> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
    throw new RangeError("WhatsApp recovery batch size must be between 1 and 100.");
  }
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);
  const events = await prisma.whatsAppInboundEvent.findMany({
    where: {
      processed: false,
      OR: [
        { processingStatus: "PENDING" },
        { processingStatus: "RETRY", nextAttemptAt: { lte: now } },
        { processingStatus: "PROCESSING", processingStartedAt: { lte: staleBefore } },
      ],
    },
    select: { id: true },
    take: batchSize,
    orderBy: { receivedAt: "asc" },
  });

  let scheduled = 0;
  let failed = 0;
  for (const event of events) {
    if (Date.now() >= stopAt) break;
    try {
      await publishWhatsAppInboundJob(event.id);
      scheduled++;
    } catch {
      // Continue past a poison/transient publish failure so one event cannot
      // block recovery of the rest. The row remains eligible for a later pass.
      failed++;
    }
  }
  return {
    eligible: events.length,
    scheduled,
    failed,
    timeBudgetExhausted: Date.now() >= stopAt,
  };
}

export class WhatsAppQueueRecovery {
  static run = recoverWhatsAppInboundEvents;
}

export async function restoreWhatsAppJobPending(eventId: string) {
  await prisma.whatsAppInboundEvent.updateMany({
    where: { id: eventId, processed: false, processingStatus: "RETRY" },
    data: { processingStatus: "PENDING", nextAttemptAt: null, processingStartedAt: null },
  });
}

/** Preserve rate-limited ingress durably and schedule it without counting a worker attempt. */
export async function deferRateLimitedWhatsAppEvent(eventId: string, delayMs: number): Promise<void> {
  await prisma.whatsAppInboundEvent.updateMany({
    where: { id: eventId, processed: false, processingStatus: "PENDING" },
    data: {
      processingStatus: "RETRY",
      processingError: "WhatsApp sender rate limit reached.",
      nextAttemptAt: new Date(Date.now() + delayMs),
    },
  });
  try {
    await scheduleWhatsAppInboundRetry(eventId, delayMs);
  } catch (error) {
    await restoreWhatsAppJobPending(eventId);
    throw error;
  }
}
