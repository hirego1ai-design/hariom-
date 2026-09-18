import { prisma } from "@/lib/prisma";
import {
  leaseSecurityAuditEvents,
  markSecurityAuditEventDelivered,
  markSecurityAuditEventFailed,
  releaseSecurityAuditEvent,
  renewSecurityAuditEventLease,
} from "@/lib/securityAuditOutbox";

const MAX_DELIVERY_ATTEMPTS = 10;
const DELIVERY_TIMEOUT_MS = 5_000;
const DELIVERY_CONCURRENCY = 4;

export interface SecurityAuditDeliveryReport {
  configured: boolean;
  pending: number;
  delivered: number;
  retried: number;
  failed: number;
  unclaimed: number;
}

export class SecurityAuditDeliveryNotConfiguredError extends Error {}

function getSiemConfiguration() {
  const endpoint = process.env.SIEM_WEBHOOK_URL?.trim();
  const token = process.env.SIEM_WEBHOOK_TOKEN?.trim();
  if (!endpoint || !token) return null;
  const url = new URL(endpoint);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("SIEM_WEBHOOK_URL must use HTTP or HTTPS.");
  if (url.username || url.password) throw new Error("SIEM_WEBHOOK_URL must not contain credentials.");
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("SIEM_WEBHOOK_URL must use HTTPS in production.");
  return { url: url.toString(), token };
}

function isRetryableSiemStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

type LeasedEvent = Awaited<ReturnType<typeof leaseSecurityAuditEvents>>["events"][number];
type DeliveryResult = "delivered" | "retried" | "failed" | "unclaimed";

async function deliverEvent(event: LeasedEvent, leaseId: string, url: string, token: string): Promise<DeliveryResult> {
  if (!(await renewSecurityAuditEventLease(prisma, event.id, leaseId))) return "unclaimed";
  if (event.attempts > MAX_DELIVERY_ATTEMPTS) {
    return (await markSecurityAuditEventFailed(prisma, event.id, leaseId, "Delivery attempt limit exceeded after worker recovery.")) ? "failed" : "unclaimed";
  }
  let errorMessage: string | null = null;
  let retryable = true;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-HireGo-Audit-Event": event.id,
        "X-HireGo-Audit-SHA256": event.payloadSha256,
      },
      body: JSON.stringify(event.payload),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    if (!response.ok) {
      errorMessage = `SIEM returned HTTP ${response.status}.`;
      retryable = isRetryableSiemStatus(response.status);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "SIEM delivery failed.";
  }
  if (!errorMessage) return (await markSecurityAuditEventDelivered(prisma, event.id, leaseId)) ? "delivered" : "unclaimed";
  if (!retryable || event.attempts >= MAX_DELIVERY_ATTEMPTS) {
    return (await markSecurityAuditEventFailed(prisma, event.id, leaseId, errorMessage)) ? "failed" : "unclaimed";
  }
  const retryAfterMs = Math.min(30 * 60_000, 30_000 * 2 ** Math.min(event.attempts, 6));
  return (await releaseSecurityAuditEvent(prisma, event.id, leaseId, errorMessage, retryAfterMs)) ? "retried" : "unclaimed";
}

export async function processSecurityAuditDeliveryBatch(
  batchSize = 20,
  options: { requireConfiguration?: boolean } = {},
): Promise<SecurityAuditDeliveryReport> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new RangeError("Invalid security audit delivery batch size.");
  const config = getSiemConfiguration();
  if (!config) {
    if (options.requireConfiguration) throw new SecurityAuditDeliveryNotConfiguredError("SIEM delivery is not configured.");
    const pending = await prisma.securityAuditOutboxEvent.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } });
    return { configured: false, pending, delivered: 0, retried: 0, failed: 0, unclaimed: 0 };
  }
  const { leaseId, events } = await leaseSecurityAuditEvents(prisma, batchSize);
  const results: DeliveryResult[] = [];
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(DELIVERY_CONCURRENCY, events.length) }, async () => {
    while (nextIndex < events.length) results.push(await deliverEvent(events[nextIndex++], leaseId, config.url, config.token));
  }));
  return {
    configured: true,
    pending: 0,
    delivered: results.filter((result) => result === "delivered").length,
    retried: results.filter((result) => result === "retried").length,
    failed: results.filter((result) => result === "failed").length,
    unclaimed: results.filter((result) => result === "unclaimed").length,
  };
}

export class SecurityAuditDeliveryWorker {
  static run = processSecurityAuditDeliveryBatch;
}
