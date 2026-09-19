CREATE TABLE "CommunicationTemplate" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "provider" TEXT,
  "providerTemplateId" TEXT,
  "providerAlias" TEXT,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "variableSchema" JSONB NOT NULL DEFAULT '{}',
  "buttons" JSONB,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationDelivery" (
  "id" TEXT NOT NULL,
  "templateId" TEXT,
  "eventKey" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "recipientRef" TEXT,
  "recipientAddressHash" TEXT,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCode" TEXT,
  "lastError" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunicationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunicationTemplate_eventKey_channel_audience_locale_version_key"
ON "CommunicationTemplate"("eventKey", "channel", "audience", "locale", "version");
CREATE INDEX "CommunicationTemplate_eventKey_channel_enabled_idx"
ON "CommunicationTemplate"("eventKey", "channel", "enabled");
CREATE INDEX "CommunicationTemplate_channel_status_updatedAt_idx"
ON "CommunicationTemplate"("channel", "status", "updatedAt");

CREATE UNIQUE INDEX "CommunicationDelivery_idempotencyKey_key"
ON "CommunicationDelivery"("idempotencyKey");
CREATE INDEX "CommunicationDelivery_eventKey_channel_createdAt_idx"
ON "CommunicationDelivery"("eventKey", "channel", "createdAt");
CREATE INDEX "CommunicationDelivery_status_createdAt_idx"
ON "CommunicationDelivery"("status", "createdAt");
CREATE INDEX "CommunicationDelivery_providerMessageId_idx"
ON "CommunicationDelivery"("providerMessageId");

ALTER TABLE "CommunicationDelivery"
ADD CONSTRAINT "CommunicationDelivery_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "CommunicationTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
