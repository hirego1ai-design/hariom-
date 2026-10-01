-- Candidate credit commerce: admin-managed packages + candidate-owned payment records.
-- Existing employer payment rows remain unchanged; companyId becomes nullable only
-- for the explicit CANDIDATE_CREDITS product type.

ALTER TABLE "PaymentOrder"
  ALTER COLUMN "companyId" DROP NOT NULL,
  ADD COLUMN "candidateProfileId" TEXT;

ALTER TABLE "PaymentTransaction"
  ALTER COLUMN "companyId" DROP NOT NULL,
  ADD COLUMN "candidateProfileId" TEXT;

CREATE TABLE "CandidateCreditPackage" (
  "id" TEXT NOT NULL,
  "packageKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "credits" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateCreditPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateCreditPackage_packageKey_key"
  ON "CandidateCreditPackage"("packageKey");

CREATE INDEX "CandidateCreditPackage_isActive_sortOrder_idx"
  ON "CandidateCreditPackage"("isActive", "sortOrder");

CREATE INDEX "PaymentOrder_candidateProfileId_idx"
  ON "PaymentOrder"("candidateProfileId");

CREATE INDEX "PaymentTransaction_candidateProfileId_idx"
  ON "PaymentTransaction"("candidateProfileId");

ALTER TABLE "PaymentOrder"
  ADD CONSTRAINT "PaymentOrder_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_candidateProfileId_fkey"
  FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
