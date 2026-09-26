-- Retire the legacy per-job Co-Pilot commercial path.
-- Standalone Copilot subscriptions in CopilotPlan/CopilotSubscription are authoritative.

UPDATE "SubscriptionPlan"
SET "copilotIncluded" = false,
    "copilotJobLimit" = 0
WHERE "copilotIncluded" = true OR "copilotJobLimit" <> 0;

UPDATE "SubscriptionPlan"
SET "isArchived" = true
WHERE "id" = 'plan-hiring-sprint';

UPDATE "HiringCopilotConfig"
SET "enabled" = false,
    "addonJobLimit" = 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'default';

UPDATE "CompanyCredits"
SET "copilotJobsLeft" = 0
WHERE "copilotJobsLeft" <> 0;

UPDATE "JobListing"
SET "copilotEnabled" = false,
    "copilotActivatedAt" = NULL
WHERE "copilotEnabled" = true OR "copilotActivatedAt" IS NOT NULL;
