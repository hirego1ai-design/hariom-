import { prisma } from "./prisma";
import { enqueueSecurityAuditEvent } from "./securityAuditOutbox";

export interface AuditLogEntry {
  id: string;
  userId?: string;
  companyId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  details?: string;
  timestamp: string;
}

const inMemoryAuditLogs: AuditLogEntry[] = [];

export class AuditLogPersistenceError extends Error {
  constructor(action: string) {
    super(`Security audit event '${action}' could not be persisted.`);
    this.name = "AuditLogPersistenceError";
  }
}

/** PostgreSQL is the sole source of truth for security audit events. */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry | null> {
  if (process.env.MOCK_DB === "true") {
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random()}`,
      userId: entry.userId || undefined,
      companyId: entry.companyId || undefined,
      action: entry.action,
      resource: entry.resource,
      ipAddress: entry.ipAddress || "unknown",
      details: entry.details || undefined,
      timestamp: new Date().toISOString(),
    };
    inMemoryAuditLogs.unshift(newEntry);
    return newEntry;
  }

  try {
    // System/cron actors use synthetic IDs that aren't real User records.
    // Store them in details to avoid FK constraint violations.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isRealUserId = entry.userId && UUID_RE.test(entry.userId);
    const actorDetail = !isRealUserId && entry.userId
      ? `actor:${entry.userId}${entry.details ? ` | ${entry.details}` : ""}`
      : entry.details || null;

    // The audit row and the provider-neutral SIEM delivery envelope must be
    // committed together. A future forwarder can fail independently without
    // losing the source event, while a failed enqueue rolls this write back.
    const saved = await prisma.$transaction(async (tx) => {
      const auditLog = await tx.auditLog.create({
        data: {
          userId: isRealUserId ? entry.userId! : null,
          companyId: entry.companyId || null,
          action: entry.action,
          resource: entry.resource,
          ipAddress: entry.ipAddress || "unknown",
          details: actorDetail,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, entry.userId);
      return auditLog;
    });

    const result: AuditLogEntry = {
      id: saved.id,
      userId: saved.userId || undefined,
      companyId: saved.companyId || undefined,
      action: saved.action,
      resource: saved.resource,
      ipAddress: saved.ipAddress || undefined,
      details: saved.details || undefined,
      timestamp: saved.createdAt.toISOString(),
    };
    return result;
  } catch (error) {
    console.error("AUDIT_LOG_PERSISTENCE_FAILURE", {
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      companyId: entry.companyId,
      error,
    });
    return null;
  }
}

/**
 * Use for authentication, credential, and authorization events. Production
 * callers must not report a completed sensitive operation when its audit
 * record could not be durably persisted.
 */
export async function logCriticalAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
  const saved = await logAuditEvent(entry);
  if (!saved) throw new AuditLogPersistenceError(entry.action);
  return saved;
}

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  if (process.env.MOCK_DB === "true") {
    return inMemoryAuditLogs.slice(0, limit);
  }

  try {
    const logs = await prisma.auditLog.findMany({
      take: Math.min(Math.max(limit, 1), 500),
      orderBy: { createdAt: "desc" },
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId || undefined,
      companyId: log.companyId || undefined,
      action: log.action,
      resource: log.resource,
      ipAddress: log.ipAddress || undefined,
      details: log.details || undefined,
      timestamp: log.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("AUDIT_LOG_READ_FAILURE", { error });
  }
  return [];
}
