import { createHash, randomUUID } from "crypto";
import { Prisma, type AuditLog, type PrismaClient } from "@prisma/client";

export const SECURITY_AUDIT_EVENT_TYPE = "security.audit.v1";

export interface SecurityAuditEnvelope {
  schemaVersion: 1;
  eventType: typeof SECURITY_AUDIT_EVENT_TYPE;
  eventId: string;
  occurredAt: string;
  audit: {
    action: string;
    resource: string;
    ipAddress: string | null;
    details: string | null;
  };
  actor: {
    suppliedUserId: string | null;
    persistedUserId: string | null;
  };
  companyId: string | null;
}

type SecurityAuditOutboxWriter = Pick<PrismaClient, "securityAuditOutboxEvent">;

/**
 * Uses an explicit, versioned envelope so an eventual SIEM worker can forward
 * stored events without parsing application log lines or rebuilding context.
 */
export function createSecurityAuditEnvelope(
  auditLog: AuditLog,
  suppliedUserId?: string,
): SecurityAuditEnvelope {
  return {
    schemaVersion: 1,
    eventType: SECURITY_AUDIT_EVENT_TYPE,
    eventId: auditLog.id,
    occurredAt: auditLog.createdAt.toISOString(),
    audit: {
      action: auditLog.action,
      resource: auditLog.resource,
      ipAddress: auditLog.ipAddress,
      details: auditLog.details,
    },
    actor: {
      suppliedUserId: suppliedUserId || null,
      persistedUserId: auditLog.userId,
    },
    companyId: auditLog.companyId,
  };
}

export function hashSecurityAuditEnvelope(envelope: SecurityAuditEnvelope): string {
  return createHash("sha256").update(JSON.stringify(envelope)).digest("hex");
}

/**
 * Called from the same transaction as AuditLog creation. If this insert fails,
 * the audit write is rolled back instead of silently creating an unforwardable
 * security event.
 */
export async function enqueueSecurityAuditEvent(
  db: SecurityAuditOutboxWriter,
  auditLog: AuditLog,
  suppliedUserId?: string,
) {
  const payload = createSecurityAuditEnvelope(auditLog, suppliedUserId);
  return db.securityAuditOutboxEvent.create({
    data: {
      auditLogId: auditLog.id,
      eventType: SECURITY_AUDIT_EVENT_TYPE,
      payload: payload as unknown as Prisma.InputJsonValue,
      payloadSha256: hashSecurityAuditEnvelope(payload),
      status: "PENDING",
    },
  });
}

/**
 * Lease a bounded batch for a SIEM forwarder. No network calls occur here;
 * callers supply their own transport and then acknowledge each event.
 */
export async function leaseSecurityAuditEvents(
  db: PrismaClient,
  batchSize = 100,
  leaseMs = 60_000,
) {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || !Number.isSafeInteger(leaseMs) || leaseMs < 1) {
    throw new RangeError('Batch size and lease duration must be positive integers');
  }
  const now = new Date();
  const leaseId = randomUUID();
  const candidates = await db.securityAuditOutboxEvent.findMany({
    where: {
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", leasedUntil: { lt: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(Math.max(batchSize, 1), 500),
    select: { id: true },
  });

  if (candidates.length === 0) return { leaseId, events: [] };

  // The predicate makes a racing worker's stale candidate harmless. Returning
  // only our lease ensures a forwarder never delivers another worker's event.
  await db.securityAuditOutboxEvent.updateMany({
    where: {
      id: { in: candidates.map((candidate) => candidate.id) },
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", leasedUntil: { lt: now } },
      ],
    },
    data: {
      status: "PROCESSING",
      leaseId,
      leasedUntil: new Date(now.getTime() + leaseMs),
      attempts: { increment: 1 },
    },
  });

  const events = await db.securityAuditOutboxEvent.findMany({
    where: { leaseId, status: "PROCESSING" },
    orderBy: { createdAt: "asc" },
  });
  return { leaseId, events };
}

/** Refresh immediately before transport; a delayed batch must not send an
 * event whose lease expired or was taken over by another worker. */
export async function renewSecurityAuditEventLease(db: PrismaClient, eventId: string, leaseId: string, leaseMs = 60_000) {
  const now = new Date();
  const result = await db.securityAuditOutboxEvent.updateMany({
    where: { id: eventId, leaseId, status: 'PROCESSING', leasedUntil: { gt: now } },
    data: { leasedUntil: new Date(now.getTime() + leaseMs) },
  });
  return result.count === 1;
}

export async function markSecurityAuditEventDelivered(
  db: PrismaClient,
  eventId: string,
  leaseId: string,
) {
  const result = await db.securityAuditOutboxEvent.updateMany({
    where: { id: eventId, leaseId, status: "PROCESSING" },
    data: { status: "DELIVERED", deliveredAt: new Date(), leasedUntil: null, lastError: null },
  });
  return result.count === 1;
}

export async function releaseSecurityAuditEvent(
  db: PrismaClient,
  eventId: string,
  leaseId: string,
  error: string,
  retryAfterMs = 30_000,
) {
  const result = await db.securityAuditOutboxEvent.updateMany({
    where: { id: eventId, leaseId, status: "PROCESSING" },
    data: {
      status: "PENDING",
      availableAt: new Date(Date.now() + retryAfterMs),
      leasedUntil: null,
      lastError: error.slice(0, 2_000),
    },
  });
  return result.count === 1;
}

export async function markSecurityAuditEventFailed(
  db: PrismaClient,
  eventId: string,
  leaseId: string,
  error: string,
) {
  const result = await db.securityAuditOutboxEvent.updateMany({
    where: { id: eventId, leaseId, status: "PROCESSING" },
    data: {
      status: "FAILED",
      leasedUntil: null,
      lastError: error.slice(0, 2_000),
    },
  });
  return result.count === 1;
}
