-- New WhatsApp contacts must not be treated as opted in without explicit consent.
ALTER TABLE "WhatsAppContact" ALTER COLUMN "optInStatus" SET DEFAULT 'UNKNOWN';
