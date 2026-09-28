-- Persist the identifier declared with an employer KYC document so manual
-- reviewers can compare the submitted certificate against the entered value.
ALTER TABLE "DocumentVerification"
  ADD COLUMN IF NOT EXISTS "declaredIdentifier" TEXT;

-- Historical risk values were generated from document type rather than a
-- verified risk engine. Do not preserve that heuristic as an evidence signal.
UPDATE "DocumentVerification"
SET "riskScore" = 'UNASSESSED'
WHERE "riskScore" IS DISTINCT FROM 'UNASSESSED';

ALTER TABLE "DocumentVerification"
  ALTER COLUMN "riskScore" SET DEFAULT 'UNASSESSED';
