-- Production pricing / Co-Pilot commercial model
ALTER TABLE "JobListing"
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "copilotEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "copilotActivatedAt" TIMESTAMP(3);

ALTER TABLE "SubscriptionPlan"
  ADD COLUMN IF NOT EXISTS "marketingBenefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "jobValidityDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "firstTimeOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "copilotIncluded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "copilotJobLimit" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "badgeText" TEXT,
  ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CompanyCredits"
  ADD COLUMN IF NOT EXISTS "copilotJobsLeft" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "HiringCopilotConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "addonPrice" DOUBLE PRECISION NOT NULL DEFAULT 499,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "addonJobLimit" INTEGER NOT NULL DEFAULT 1,
  "title" TEXT NOT NULL DEFAULT 'Add HireGo Co-Pilot',
  "description" TEXT NOT NULL DEFAULT 'Let HireGo actively assist this hiring workflow.',
  "badgeText" TEXT DEFAULT 'Recommended',
  "benefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HiringCopilotConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "HiringCopilotConfig" ("id","enabled","addonPrice","currency","addonJobLimit","title","description","badgeText","benefits","updatedAt")
VALUES (
  'default', true, 499, 'INR', 1,
  'Add HireGo Co-Pilot',
  'Let HireGo actively assist this hiring workflow.',
  'Recommended',
  ARRAY['Candidate prioritisation','Assessment coordination','Interview scheduling','Reminder follow-ups','Feedback tracking','Next-step recommendations','Human approval at key steps'],
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Reuse the existing canonical plan rows instead of creating duplicate versions.
UPDATE "SubscriptionPlan" SET
  "name"='Free Trial',
  "description"='First-time employers can experience HireGo with three job posts.',
  "price"=0,
  "currency"='INR',
  "jobPostsQuota"=3,
  "validityMonths"=1,
  "jobValidityDays"=7,
  "firstTimeOnly"=true,
  "copilotIncluded"=false,
  "copilotJobLimit"=0,
  "isFeatured"=false,
  "badgeText"='First-time users',
  "displayOrder"=10,
  "marketingBenefits"=ARRAY['3 job posts','7-day validity per job','AI JD generation','Candidate-job matching score','Applicant dashboard','Assessment tools','Virtual interview access','Proctoring evidence report']
WHERE "id"='plan-bootstrapped';

UPDATE "SubscriptionPlan" SET
  "name"='Hire One',
  "description"='A focused package for one immediate hiring requirement.',
  "price"=299,
  "currency"='INR',
  "jobPostsQuota"=1,
  "validityMonths"=1,
  "jobValidityDays"=7,
  "firstTimeOnly"=false,
  "copilotIncluded"=false,
  "copilotJobLimit"=0,
  "isFeatured"=false,
  "badgeText"='Best for one role',
  "displayOrder"=20,
  "marketingBenefits"=ARRAY['1 job post','7-day validity','AI JD generation','Candidate-job matching score','Assessments','Virtual interview suite','Proctoring evidence report','Interview feedback tools']
WHERE "id"='plan-hypergrowth';

UPDATE "SubscriptionPlan" SET
  "name"='Build Team',
  "description"='For growing teams hiring across multiple roles.',
  "price"=999,
  "currency"='INR',
  "jobPostsQuota"=4,
  "validityMonths"=1,
  "jobValidityDays"=7,
  "firstTimeOnly"=false,
  "copilotIncluded"=false,
  "copilotJobLimit"=0,
  "isFeatured"=true,
  "badgeText"='Popular',
  "displayOrder"=30,
  "marketingBenefits"=ARRAY['4 job posts','7-day validity per job','AI JD generation','Advanced candidate matching','Assessments and analytics','Virtual interview suite','Proctoring evidence report','Team collaboration']
WHERE "id"='plan-unicorn';

INSERT INTO "SubscriptionPlan" (
  "id","name","description","price","currency","jobPostsQuota","resumeUnlocksQuota","aiInterviewsQuota",
  "applicationsQuota","resumeDownloadsQuota","backgroundVerificationsQuota","featuresAllowed","marketingBenefits",
  "validityMonths","jobValidityDays","firstTimeOnly","copilotIncluded","copilotJobLimit","isFeatured","badgeText","displayOrder","isArchived","createdAt","updatedAt"
)
VALUES (
  'plan-hiring-sprint','Hiring Sprint','One role with HireGo Co-Pilot included from the start.',799,'INR',1,50,50,
  500,100,10,ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','COPILOT'],
  ARRAY['1 job post','7-day hiring sprint','HireGo Co-Pilot included','Candidate prioritisation','Assessment coordination','Interview scheduling','Reminder follow-ups','Feedback tracking','Next-step recommendations','Human approval at key steps'],
  1,7,false,true,1,true,'Co-Pilot included',40,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX IF NOT EXISTS "JobListing_expiresAt_status_idx" ON "JobListing"("expiresAt","status");
