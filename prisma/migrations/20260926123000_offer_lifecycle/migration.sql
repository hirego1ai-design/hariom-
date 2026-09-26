CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');

CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "positionTitle" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "annualCompensation" DECIMAL(18,2) NOT NULL,
  "joiningDate" TIMESTAMP(3),
  "terms" JSONB NOT NULL,
  "documentFileId" TEXT,
  "sentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "responseNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Offer_applicationId_key" ON "Offer"("applicationId");
CREATE UNIQUE INDEX "Offer_documentFileId_key" ON "Offer"("documentFileId");
CREATE INDEX "Offer_companyId_status_createdAt_idx" ON "Offer"("companyId", "status", "createdAt");
CREATE INDEX "Offer_status_sentAt_idx" ON "Offer"("status", "sentAt");

ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_documentFileId_fkey"
  FOREIGN KEY ("documentFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
