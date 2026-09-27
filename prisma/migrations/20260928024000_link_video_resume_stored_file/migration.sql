ALTER TABLE "VideoResume" ADD COLUMN "storedFileId" TEXT;

CREATE UNIQUE INDEX "VideoResume_storedFileId_key"
ON "VideoResume"("storedFileId");

ALTER TABLE "VideoResume"
ADD CONSTRAINT "VideoResume_storedFileId_fkey"
FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
