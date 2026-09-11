-- A distinct balance prevents interview credits from being silently treated as
-- unlimited general-purpose model spend. Existing paid allocations are carried
-- forward once during migration so active customers retain their allowance.
ALTER TABLE "CompanyCredits"
ADD COLUMN "aiAgentCreditsLeft" INTEGER NOT NULL DEFAULT 0;

UPDATE "CompanyCredits"
SET "aiAgentCreditsLeft" = "aiInterviewsLeft"
WHERE "aiAgentCreditsLeft" = 0 AND "aiInterviewsLeft" > 0;

-- The runtime now denies AI execution when no hard budget exists. Backfill
-- every existing company so that rolling out this guard does not turn an
-- existing paid tenant into an unexplained outage. All monetary columns keep
-- their reviewed table defaults; the empty credit balance still prevents use
-- until a qualifying subscription allocates AI credits.
INSERT INTO "AiCompanyBudget" ("id", "companyId", "updatedAt")
SELECT md5("Company"."id" || clock_timestamp()::text), "Company"."id", CURRENT_TIMESTAMP
FROM "Company"
LEFT JOIN "AiCompanyBudget" ON "AiCompanyBudget"."companyId" = "Company"."id"
WHERE "AiCompanyBudget"."id" IS NULL;
