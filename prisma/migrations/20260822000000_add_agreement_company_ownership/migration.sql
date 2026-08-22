-- Bind agreement-domain records to immutable tenant identifiers.
ALTER TABLE "HiringRequirement" ADD COLUMN "companyId" TEXT;
ALTER TABLE "CommercialAgreement" ADD COLUMN "companyId" TEXT;

-- Backfill only unambiguous legacy company names. Ambiguous or unmatched rows
-- remain NULL and are deliberately admin-only until manually assigned.
UPDATE "HiringRequirement" AS requirement
SET "companyId" = company_match.id
FROM (
  SELECT lower(name) AS normalized_name, min(id) AS id
  FROM "Company"
  GROUP BY lower(name)
  HAVING count(*) = 1
) AS company_match
WHERE lower(requirement."companyName") = company_match.normalized_name;

UPDATE "CommercialAgreement" AS agreement
SET "companyId" = company_match.id
FROM (
  SELECT lower(name) AS normalized_name, min(id) AS id
  FROM "Company"
  GROUP BY lower(name)
  HAVING count(*) = 1
) AS company_match
WHERE lower(agreement."companyName") = company_match.normalized_name;

ALTER TABLE "HiringRequirement"
  ADD CONSTRAINT "HiringRequirement_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommercialAgreement"
  ADD CONSTRAINT "CommercialAgreement_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "HiringRequirement_companyId_idx" ON "HiringRequirement"("companyId");
CREATE INDEX "CommercialAgreement_companyId_idx" ON "CommercialAgreement"("companyId");
