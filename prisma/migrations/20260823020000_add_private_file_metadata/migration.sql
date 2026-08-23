CREATE TABLE "StoredFile" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "companyId" TEXT,
  "objectKey" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoredFile_objectKey_key" ON "StoredFile"("objectKey");
CREATE INDEX "StoredFile_ownerId_createdAt_idx" ON "StoredFile"("ownerId", "createdAt");
CREATE INDEX "StoredFile_companyId_createdAt_idx" ON "StoredFile"("companyId", "createdAt");
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
