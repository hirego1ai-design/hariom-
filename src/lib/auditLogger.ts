import { prisma } from "./prisma";

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  details?: string;
  timestamp: string;
}

const inMemoryAuditLogs: AuditLogEntry[] = [];

/**
 * PostgreSQL is the primary source of truth for security audit events.
 * Falls back gracefully to memory store during unit tests or mock DB mode.
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry | null> {
  const fallbackEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: entry.userId || undefined,
    action: entry.action,
    resource: entry.resource,
    ipAddress: entry.ipAddress || "unknown",
    details: entry.details || undefined,
    timestamp: new Date().toISOString(),
  };

  try {
    const saved = await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        resource: entry.resource,
        ipAddress: entry.ipAddress || "unknown",
        details: entry.details || null,
      },
    });

    const result: AuditLogEntry = {
      id: saved.id,
      userId: saved.userId || undefined,
      action: saved.action,
      resource: saved.resource,
      ipAddress: saved.ipAddress || undefined,
      details: saved.details || undefined,
      timestamp: saved.createdAt.toISOString(),
    };
    inMemoryAuditLogs.unshift(result);
    return result;
  } catch (error) {
    inMemoryAuditLogs.unshift(fallbackEntry);
    if (process.env.NODE_ENV === "production") {
      console.error("AUDIT_LOG_PERSISTENCE_FAILURE", {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId,
        error,
      });
    }
    return fallbackEntry;
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      take: Math.min(Math.max(limit, 1), 500),
      orderBy: { createdAt: "desc" },
    });

    if (logs && logs.length > 0) {
      return logs.map((log) => ({
        id: log.id,
        userId: log.userId || undefined,
        action: log.action,
        resource: log.resource,
        ipAddress: log.ipAddress || undefined,
        details: log.details || undefined,
        timestamp: log.createdAt.toISOString(),
      }));
    }
  } catch (error) {
    // Return memory logs in test / offline mode
  }
  return inMemoryAuditLogs.slice(0, limit);
}
