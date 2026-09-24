-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

ALTER TABLE "CompanyCredits"
ADD COLUMN "aiAgentCreditsLeft" INTEGER NOT NULL DEFAULT 0;

UPDATE "CompanyCredits"
SET "aiAgentCreditsLeft" = "aiInterviewsLeft"
WHERE "aiAgentCreditsLeft" = 0 AND "aiInterviewsLeft" > 0;

INSERT INTO "AiCompanyBudget" ("id", "companyId", "updatedAt")
SELECT md5("Company"."id" || clock_timestamp()::text), "Company"."id", CURRENT_TIMESTAMP
FROM "Company"
LEFT JOIN "AiCompanyBudget" ON "AiCompanyBudget"."companyId" = "Company"."id"
WHERE "AiCompanyBudget"."id" IS NULL;
