-- Existing objects predate malware scanning and must not be silently trusted.
-- Mark them explicitly so operators can rescan them before restoring access.
ALTER TABLE "StoredFile"
  ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT 'LEGACY_UNSCANNED',
  ADD COLUMN "scanCheckedAt" TIMESTAMP(3),
  ADD COLUMN "scanDetail" TEXT;

-- New uploads enter quarantine until the scanner returns CLEAN.
ALTER TABLE "StoredFile"
  ALTER COLUMN "scanStatus" SET DEFAULT 'PENDING';

CREATE INDEX "StoredFile_scanStatus_createdAt_idx" ON "StoredFile"("scanStatus", "createdAt");
