import { NextResponse } from "next/server";
import { enforceInternalApiKey, handleApiError } from "@/lib/apiSecurity";
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
const DELIVERY_BATCH_SIZE = 20;

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSiemConfiguration() {
  const endpoint = process.env.SIEM_WEBHOOK_URL?.trim();
  const token = process.env.SIEM_WEBHOOK_TOKEN?.trim();
  if (!endpoint || !token) {
    throw new Error("SIEM delivery is not configured.");
  }

  const url = new URL(endpoint);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SIEM_WEBHOOK_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("SIEM_WEBHOOK_URL must not contain credentials.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("SIEM_WEBHOOK_URL must use HTTPS in production.");
  }
  return { url: url.toString(), token };
}

function isRetryableSiemStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

type LeasedEvent = Awaited<ReturnType<typeof leaseSecurityAuditEvents>>["events"][number];
type DeliveryResult = "delivered" | "retried" | "failed" | "unclaimed";

async function deliverEvent(event: LeasedEvent, leaseId: string, url: string, token: string): Promise<DeliveryResult> {
  if (!(await renewSecurityAuditEventLease(prisma, event.id, leaseId))) return 'unclaimed';
  if (event.attempts > MAX_DELIVERY_ATTEMPTS) {
    return (await markSecurityAuditEventFailed(prisma, event.id, leaseId, 'Delivery attempt limit exceeded after worker recovery.')) ? 'failed' : 'unclaimed';
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

  if (!errorMessage) {
    return (await markSecurityAuditEventDelivered(prisma, event.id, leaseId)) ? "delivered" : "unclaimed";
  }

  if (!retryable || event.attempts >= MAX_DELIVERY_ATTEMPTS) {
    return (await markSecurityAuditEventFailed(prisma, event.id, leaseId, errorMessage)) ? "failed" : "unclaimed";
  }

  const retryAfterMs = Math.min(30 * 60_000, 30_000 * 2 ** Math.min(event.attempts, 6));
  return (await releaseSecurityAuditEvent(prisma, event.id, leaseId, errorMessage, retryAfterMs)) ? "retried" : "unclaimed";
}

async function deliverBatch(events: LeasedEvent[], leaseId: string, url: string, token: string) {
  const results: DeliveryResult[] = [];
  let nextIndex = 0;

  await Promise.all(Array.from({ length: Math.min(DELIVERY_CONCURRENCY, events.length) }, async () => {
    while (nextIndex < events.length) {
      const event = events[nextIndex++];
      results.push(await deliverEvent(event, leaseId, url, token));
    }
  }));

  return results;
}

export async function POST(request: Request) {
  try {
    enforceInternalApiKey(request);
    const { url, token } = getSiemConfiguration();
    const { leaseId, events } = await leaseSecurityAuditEvents(prisma, DELIVERY_BATCH_SIZE);
    const results = await deliverBatch(events, leaseId, url, token);
    const delivered = results.filter((result) => result === "delivered").length;
    const retried = results.filter((result) => result === "retried").length;
    const failed = results.filter((result) => result === "failed").length;
    const remaining = results.filter((result) => result === "unclaimed").length;

    return NextResponse.json(
      { success: true, leaseId, delivered, retried, failed, remaining },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
