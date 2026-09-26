-- Production pricing/catalog model: plans are authoritative DB records managed by Admin.
ALTER TABLE "SubscriptionPlan"
  ADD COLUMN "displayBenefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "jobValidityDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN "planType" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "firstTimeOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "copilotJobsQuota" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "copilotAutoActivate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "badge" TEXT,
  ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "CompanyCredits"
  ADD COLUMN "copilotJobsLeft" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "JobListing"
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "copilotEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "copilotActivatedAt" TIMESTAMP(3);

ALTER TABLE "SubscriptionPlan"
  ADD CONSTRAINT "SubscriptionPlan_jobValidityDays_check" CHECK ("jobValidityDays" BETWEEN 1 AND 365),
  ADD CONSTRAINT "SubscriptionPlan_copilotJobsQuota_check" CHECK ("copilotJobsQuota" >= 0),
  ADD CONSTRAINT "SubscriptionPlan_planType_check" CHECK ("planType" IN ('FREE_TRIAL','STANDARD','COPILOT'));

CREATE INDEX "SubscriptionPlan_isArchived_displayOrder_idx"
  ON "SubscriptionPlan"("isArchived", "displayOrder");
CREATE INDEX "JobListing_status_expiresAt_idx"
  ON "JobListing"("status", "expiresAt");
CREATE INDEX "JobListing_status_publishedAt_idx"
  ON "JobListing"("status", "publishedAt");

-- Archive only the old bootstrap templates. Admin-created plans are untouched.
UPDATE "SubscriptionPlan"
SET "isArchived" = true
WHERE "id" IN ('plan-bootstrapped','plan-hypergrowth','plan-unicorn');

-- Launch catalog. Runtime UI never hard-codes these prices/features; Admin can edit/archive them.
INSERT INTO "SubscriptionPlan" (
  "id","name","description","price","currency","jobPostsQuota","resumeUnlocksQuota","aiInterviewsQuota",
  "applicationsQuota","resumeDownloadsQuota","backgroundVerificationsQuota","featuresAllowed","displayBenefits",
  "validityMonths","jobValidityDays","planType","firstTimeOnly","copilotJobsQuota","copilotAutoActivate",
  "badge","isFeatured","displayOrder","isArchived","createdAt","updatedAt"
) VALUES
(
  'plan-free-trial','Free Trial','First-time employers can experience HireGo with three job posts.',0,'INR',3,0,0,0,0,0,
  ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING_SCORE','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING'],
  ARRAY['AI JD generation','Candidate-job matching score','Applicant dashboard','Assessment tools','Virtual interview room','Proctoring evidence for human review'],
  1,7,'FREE_TRIAL',true,0,false,'First-time users',false,10,false,NOW(),NOW()
),
(
  'plan-hire-one','Hire One','A focused self-service plan for one immediate hiring requirement.',299,'INR',1,0,0,0,0,0,
  ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING_SCORE','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','INTERVIEW_WORKFLOW'],
  ARRAY['AI JD generation','Candidate-job matching score','Assessment workflow','Virtual interview suite','Proctoring evidence & review','Structured interview feedback'],
  1,7,'STANDARD',false,0,false,'Best for one role',false,20,false,NOW(),NOW()
),
(
  'plan-hiring-sprint','Hiring Sprint','One role with HireGo Co-Pilot actively assisting the hiring workflow.',799,'INR',1,0,0,0,0,0,
  ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING_SCORE','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','INTERVIEW_WORKFLOW','COPILOT'],
  ARRAY['HireGo Co-Pilot included','Candidate prioritisation','Assessment coordination','Interview scheduling & reminders','Feedback tracking','Next-step recommendations','Human-approved final decisions'],
  1,7,'COPILOT',false,1,true,'Co-Pilot included',true,30,false,NOW(),NOW()
),
(
  'plan-build-team','Build Team','Self-service hiring for growing teams across multiple roles.',999,'INR',4,0,0,0,0,0,
  ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING_SCORE','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','CANDIDATE_COMPARISON','INTERVIEW_WORKFLOW','ANALYTICS','TEAM_COLLABORATION','PROACTIVE_SOURCING','OFFER_WORKFLOW'],
  ARRAY['Four independent job posts','Advanced candidate matching insights','Assessments','Virtual interviews & proctoring','Candidate comparison','Team collaboration','Hiring analytics','Offer workflow'],
  1,7,'STANDARD',false,0,false,'Popular',false,40,false,NOW(),NOW()
),
(
  'plan-copilot-team','Co-Pilot Team','Multi-role hiring with HireGo Co-Pilot included for every job credit.',1999,'INR',4,0,0,0,0,0,
  ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING_SCORE','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','CANDIDATE_COMPARISON','INTERVIEW_WORKFLOW','ANALYTICS','TEAM_COLLABORATION','PROACTIVE_SOURCING','OFFER_WORKFLOW','COPILOT'],
  ARRAY['Co-Pilot on all four jobs','Candidate prioritisation','Assessment coordination','Interview scheduling & reminders','Feedback tracking','Next-step recommendations','Virtual interviews & proctoring','Team collaboration & analytics'],
  1,7,'COPILOT',false,4,true,'Full Co-Pilot',false,50,false,NOW(),NOW()
)
ON CONFLICT ("id") DO NOTHING;
