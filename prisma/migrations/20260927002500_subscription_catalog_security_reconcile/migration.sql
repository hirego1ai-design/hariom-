-- Reconcile the production employer catalog even when legacy canonical plan rows do not exist.
-- Keep the new Co-Pilot configuration table fail-closed to Supabase Data API roles.

ALTER TABLE "HiringCopilotConfig" ENABLE ROW LEVEL SECURITY;

DO $
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "HiringCopilotConfig" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "HiringCopilotConfig" FROM authenticated;
  END IF;
END
$;

INSERT INTO "SubscriptionPlan" (
  "id","name","description","price","currency","jobPostsQuota","resumeUnlocksQuota","aiInterviewsQuota",
  "applicationsQuota","resumeDownloadsQuota","backgroundVerificationsQuota","featuresAllowed","marketingBenefits",
  "validityMonths","jobValidityDays","firstTimeOnly","copilotIncluded","copilotJobLimit","isFeatured","badgeText",
  "displayOrder","isArchived","createdAt","updatedAt"
)
VALUES
(
  'plan-bootstrapped','Free Trial','First-time employers can experience HireGo with three job posts.',0,'INR',3,25,10,
  100,25,2,ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING'],
  ARRAY['3 job posts','7-day validity per job','AI JD generation','Candidate-job matching score','Applicant dashboard','Assessment tools','Virtual interview access','Proctoring evidence report'],
  1,7,true,false,0,false,'First-time users',10,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
),
(
  'plan-hypergrowth','Hire One','A focused package for one immediate hiring requirement.',299,'INR',1,50,25,
  250,50,5,ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','INTERVIEW_FEEDBACK'],
  ARRAY['1 job post','7-day validity','AI JD generation','Candidate-job matching score','Assessments','Virtual interview suite','Proctoring evidence report','Interview feedback tools'],
  1,7,false,false,0,false,'Best for one role',20,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
),
(
  'plan-unicorn','Build Team','For growing teams hiring across multiple roles.',999,'INR',4,200,100,
  1000,250,20,ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','ANALYTICS','TEAM_COLLABORATION'],
  ARRAY['4 job posts','7-day validity per job','AI JD generation','Advanced candidate matching','Assessments and analytics','Virtual interview suite','Proctoring evidence report','Team collaboration'],
  1,7,false,false,0,true,'Popular',30,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
),
(
  'plan-hiring-sprint','Hiring Sprint','One role with HireGo Co-Pilot included from the start.',799,'INR',1,50,50,
  500,100,10,ARRAY['JOB_POSTING','AI_JD_GENERATION','MATCHING','ASSESSMENTS','VIRTUAL_INTERVIEW','PROCTORING','COPILOT'],
  ARRAY['1 job post','7-day hiring sprint','HireGo Co-Pilot included','Candidate prioritisation','Assessment coordination','Interview scheduling','Reminder follow-ups','Feedback tracking','Next-step recommendations','Human approval at key steps'],
  1,7,false,true,1,true,'Co-Pilot included',40,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name"=EXCLUDED."name",
  "description"=EXCLUDED."description",
  "price"=EXCLUDED."price",
  "currency"=EXCLUDED."currency",
  "jobPostsQuota"=EXCLUDED."jobPostsQuota",
  "resumeUnlocksQuota"=EXCLUDED."resumeUnlocksQuota",
  "aiInterviewsQuota"=EXCLUDED."aiInterviewsQuota",
  "applicationsQuota"=EXCLUDED."applicationsQuota",
  "resumeDownloadsQuota"=EXCLUDED."resumeDownloadsQuota",
  "backgroundVerificationsQuota"=EXCLUDED."backgroundVerificationsQuota",
  "featuresAllowed"=EXCLUDED."featuresAllowed",
  "marketingBenefits"=EXCLUDED."marketingBenefits",
  "validityMonths"=EXCLUDED."validityMonths",
  "jobValidityDays"=EXCLUDED."jobValidityDays",
  "firstTimeOnly"=EXCLUDED."firstTimeOnly",
  "copilotIncluded"=EXCLUDED."copilotIncluded",
  "copilotJobLimit"=EXCLUDED."copilotJobLimit",
  "isFeatured"=EXCLUDED."isFeatured",
  "badgeText"=EXCLUDED."badgeText",
  "displayOrder"=EXCLUDED."displayOrder",
  "isArchived"=false,
  "updatedAt"=CURRENT_TIMESTAMP;
