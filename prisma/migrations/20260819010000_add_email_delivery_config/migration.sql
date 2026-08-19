-- Global configuration for transactional email providers.
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
