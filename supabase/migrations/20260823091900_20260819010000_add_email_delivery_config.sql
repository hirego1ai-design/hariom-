-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

CREATE TABLE "EmailDeliveryConfig" (
    "id" TEXT NOT NULL DEFAULT 'global-email-delivery',
    "primaryProvider" TEXT NOT NULL DEFAULT 'SENDGRID',
    "fallbackProvider" TEXT NOT NULL DEFAULT 'ZEPTOMAIL',
    "autoFailover" BOOLEAN NOT NULL DEFAULT true,
    "sendgridEnabled" BOOLEAN NOT NULL DEFAULT true,
    "zeptoMailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sendgridFromEmail" TEXT,
    "zeptoMailFromEmail" TEXT,
    "sendgridApiKeyEncrypted" TEXT,
    "zeptoMailApiKeyEncrypted" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDeliveryConfig_pkey" PRIMARY KEY ("id")
);
