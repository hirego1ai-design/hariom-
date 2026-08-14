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

const auditLogsStore: AuditLogEntry[] = [];

export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const log: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.action,
        resource: entry.resource,
        ipAddress: entry.ipAddress || "local",
        details: entry.details || null,
      },
    });
  } catch (err) {
    // Fallback to local in-memory logging if database url placeholder / down
  }

  auditLogsStore.push(log);
  console.log(`[AUDIT LOG] ${log.timestamp} | ${log.action} | Resource: ${log.resource} | IP: ${log.ipAddress || "local"}`);
  return log;
}

export async function getAuditLogs(limit = 50) {
  try {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    if (logs && logs.length > 0) {
      return logs.map((l) => ({
        id: l.id,
        userId: l.userId || undefined,
        action: l.action,
        resource: l.resource,
        ipAddress: l.ipAddress || undefined,
        details: l.details || undefined,
        timestamp: l.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    // Fallback to in-memory store
  }
  return auditLogsStore.slice(-limit).reverse();
}
