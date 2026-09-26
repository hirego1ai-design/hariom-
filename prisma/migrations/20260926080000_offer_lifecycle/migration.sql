CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'REVOKED');

CREATE TABLE "Offer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "terms" JSONB NOT NULL,
  "documentFileId" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "responseNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Offer_applicationId_key" ON "Offer"("applicationId");
CREATE INDEX "Offer_companyId_status_createdAt_idx" ON "Offer"("companyId", "status", "createdAt");
CREATE INDEX "Offer_createdById_createdAt_idx" ON "Offer"("createdById", "createdAt");

ALTER TABLE "Offer"
ADD CONSTRAINT "Offer_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
