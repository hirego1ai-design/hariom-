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

/** PostgreSQL is the sole source of truth for security audit events. */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry | null> {
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
    return result;
  } catch (error) {
    console.error("AUDIT_LOG_PERSISTENCE_FAILURE", {
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      error,
    });
    return null;
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      take: Math.min(Math.max(limit, 1), 500),
      orderBy: { createdAt: "desc" },
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId || undefined,
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
