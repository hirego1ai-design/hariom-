-- CTO audit remediation: persisted screening answers, offers, HOLD, and approval lifecycle.
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "screeningAnswers" JSONB;

DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('DRAFT','SENT','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "compensationAmount" DECIMAL(18,2),
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "startDate" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "terms" JSONB NOT NULL,
  "documentFileId" TEXT,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "withdrawnAt" TIMESTAMP(3),
  "candidateResponseNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Offer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Offer_documentFileId_fkey" FOREIGN KEY ("documentFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Offer_applicationId_status_idx" ON "Offer"("applicationId","status");
CREATE INDEX IF NOT EXISTS "Offer_companyId_status_createdAt_idx" ON "Offer"("companyId","status","createdAt");
CREATE INDEX IF NOT EXISTS "Offer_documentFileId_idx" ON "Offer"("documentFileId");

DO $$ BEGIN
  ALTER TYPE "InterviewRoundProgressStatus" ADD VALUE 'ON_HOLD';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "WorkflowApproval" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "WorkflowApproval" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "WorkflowApproval" ADD COLUMN IF NOT EXISTS "revokedBy" TEXT;
ALTER TABLE "WorkflowApproval" ADD COLUMN IF NOT EXISTS "revocationReason" TEXT;
UPDATE "WorkflowApproval" SET "expiresAt" = COALESCE("expiresAt", "requestedAt" + INTERVAL '24 hours');
ALTER TABLE "WorkflowApproval" ALTER COLUMN "expiresAt" SET NOT NULL;
