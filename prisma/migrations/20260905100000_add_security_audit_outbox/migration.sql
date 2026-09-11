-- A database-backed SIEM delivery outbox. It is deliberately provider-neutral:
-- request handlers only persist events, and a separately configured worker may
-- later lease and forward PENDING rows to a SIEM.
CREATE TABLE "SecurityAuditOutboxEvent" (
    "id" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'security.audit.v1',
    "payload" JSONB NOT NULL,
    "payloadSha256" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseId" TEXT,
    "leasedUntil" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAuditOutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityAuditOutboxEvent_auditLogId_key"
  ON "SecurityAuditOutboxEvent"("auditLogId");
CREATE INDEX "SecurityAuditOutboxEvent_status_availableAt_idx"
  ON "SecurityAuditOutboxEvent"("status", "availableAt");
CREATE INDEX "SecurityAuditOutboxEvent_createdAt_idx"
  ON "SecurityAuditOutboxEvent"("createdAt");

ALTER TABLE "SecurityAuditOutboxEvent"
  ADD CONSTRAINT "SecurityAuditOutboxEvent_auditLogId_fkey"
  FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
