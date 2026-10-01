ALTER TABLE "EmailDeliveryConfig"
  ALTER COLUMN "primaryProvider" SET DEFAULT 'ZEPTOMAIL',
  ALTER COLUMN "fallbackProvider" SET DEFAULT 'SENDGRID',
  ALTER COLUMN "zeptoMailEnabled" SET DEFAULT true;

UPDATE "EmailDeliveryConfig"
SET
  "primaryProvider" = 'ZEPTOMAIL',
  "fallbackProvider" = 'SENDGRID',
  "zeptoMailEnabled" = true
WHERE
  "id" = 'global-email-delivery'
  AND "primaryProvider" = 'SENDGRID'
  AND "fallbackProvider" = 'ZEPTOMAIL';
