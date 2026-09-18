ALTER TABLE "StoredFile"
  ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "scanCheckedAt" TIMESTAMP(3),
  ADD COLUMN "scanDetail" TEXT;

CREATE INDEX "StoredFile_scanStatus_createdAt_idx" ON "StoredFile"("scanStatus", "createdAt");
