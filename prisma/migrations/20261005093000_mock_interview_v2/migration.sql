-- Mock Interview V2: adaptive calibration, persona/rubric provenance and voice-ready transcript metadata.
-- Additive and backward-compatible with existing text practice sessions.

DO $$ BEGIN
  CREATE TYPE "MockInterviewMode" AS ENUM ('TEXT','VOICE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MockInterviewPersona" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "roleFamily" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "voiceKey" TEXT,
  "tone" TEXT NOT NULL,
  "questionMethodology" JSONB NOT NULL,
  "competencyDimensions" JSONB NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MockInterviewPersona_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MockInterviewPersona_key_key" ON "MockInterviewPersona"("key");
CREATE INDEX IF NOT EXISTS "MockInterviewPersona_roleFamily_isActive_idx" ON "MockInterviewPersona"("roleFamily","isActive");

ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "declaredSeniority" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "roleFamily" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "personaId" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "personaVersion" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "mode" "MockInterviewMode" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "openingMessage" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "practiceContext" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "calibrationState" JSONB;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "estimatedLevel" TEXT;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "levelConfidence" INTEGER;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "missingEvidence" JSONB;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "nextPracticePlan" JSONB;
ALTER TABLE "MockInterviewSession" ADD COLUMN IF NOT EXISTS "finalReport" JSONB;

ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "difficulty" INTEGER;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "competency" TEXT;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "skillTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "transcriptProvider" TEXT;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "transcriptModel" TEXT;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "transcriptVersion" TEXT;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "transcriptConfidence" DOUBLE PRECISION;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "evidenceConfidence" INTEGER;
ALTER TABLE "MockInterviewTurn" ADD COLUMN IF NOT EXISTS "evaluation" JSONB;

DO $$ BEGIN
  ALTER TABLE "MockInterviewSession"
    ADD CONSTRAINT "MockInterviewSession_personaId_fkey"
    FOREIGN KEY ("personaId") REFERENCES "MockInterviewPersona"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "MockInterviewSession_personaId_idx" ON "MockInterviewSession"("personaId");
CREATE INDEX IF NOT EXISTS "MockInterviewTurn_sessionId_difficulty_idx" ON "MockInterviewTurn"("sessionId","difficulty");

-- Product personas are production configuration, not candidate/employer sample data.
-- They are persisted and can be edited/replaced through the admin configuration API.
INSERT INTO "MockInterviewPersona"
("id","key","roleFamily","displayName","voiceKey","tone","questionMethodology","competencyDimensions","rubricVersion","isActive","createdAt","updatedAt")
VALUES
('10000000-0000-4000-8000-000000000001','engineering-v1','ENGINEERING','Alex',NULL,'Professional, calm, technically rigorous, supportive',
 '{"calibration":"fundamentals_to_tradeoffs","followUps":["implementation","debugging","tradeoffs","production ownership"],"support":"guided_when_stuck"}'::jsonb,
 '["Technical depth","Problem solving","Debugging","System design","Trade-off reasoning","Ownership"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000002','sales-v1','SALES','Maya',NULL,'Professional, warm, commercially sharp, supportive',
 '{"calibration":"discovery_to_objections","followUps":["discovery","objection handling","negotiation","closing","pipeline judgment"],"support":"guided_when_stuck"}'::jsonb,
 '["Discovery","Objection handling","Negotiation","Closing","Commercial judgment","Communication"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000003','hr-v1','HR','Ava',NULL,'Professional, empathetic, structured, supportive',
 '{"calibration":"candidate_and_stakeholder_scenarios","followUps":["sourcing","screening","stakeholders","candidate experience","offer handling"],"support":"guided_when_stuck"}'::jsonb,
 '["Sourcing","Screening","Stakeholder management","Candidate experience","Judgment","Communication"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000004','operations-v1','OPERATIONS','Ryan',NULL,'Professional, practical, process-oriented, supportive',
 '{"calibration":"process_to_escalation","followUps":["SLA","root cause","capacity","escalation","continuous improvement"],"support":"guided_when_stuck"}'::jsonb,
 '["Execution","Process design","SLA management","Escalation judgment","Problem solving","Ownership"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000005','customer-success-v1','CUSTOMER_SUCCESS','Sara',NULL,'Professional, customer-focused, composed, supportive',
 '{"calibration":"customer_scenario_to_retention","followUps":["onboarding","escalation","retention","value realization","stakeholders"],"support":"guided_when_stuck"}'::jsonb,
 '["Customer judgment","Retention","Escalation","Value realization","Communication","Ownership"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000006','product-v1','PRODUCT','Noah',NULL,'Professional, curious, analytical, supportive',
 '{"calibration":"user_problem_to_prioritization","followUps":["discovery","prioritization","metrics","tradeoffs","execution"],"support":"guided_when_stuck"}'::jsonb,
 '["Product thinking","Prioritization","Metrics","User understanding","Trade-off reasoning","Execution"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000007','marketing-v1','MARKETING','Mia',NULL,'Professional, creative, evidence-oriented, supportive',
 '{"calibration":"audience_to_campaign","followUps":["positioning","channels","experimentation","measurement","optimization"],"support":"guided_when_stuck"}'::jsonb,
 '["Positioning","Campaign strategy","Experimentation","Analytics","Growth judgment","Communication"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000008','finance-v1','FINANCE','Daniel',NULL,'Professional, precise, analytical, supportive',
 '{"calibration":"fundamentals_to_business_judgment","followUps":["controls","analysis","forecasting","risk","decision support"],"support":"guided_when_stuck"}'::jsonb,
 '["Financial analysis","Controls","Accuracy","Risk judgment","Business reasoning","Communication"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000009','leadership-v1','LEADERSHIP','Sophia',NULL,'Professional, strategic, direct, supportive',
 '{"calibration":"ownership_to_org_tradeoffs","followUps":["strategy","people leadership","ambiguity","cross-functional influence","decisions"],"support":"guided_when_stuck"}'::jsonb,
 '["Strategy","People leadership","Decision quality","Ambiguity","Influence","Ownership"]'::jsonb,'2026-10-v1',true,NOW(),NOW()),
('10000000-0000-4000-8000-000000000010','general-v1','GENERAL','Jordan',NULL,'Professional, friendly, structured, supportive',
 '{"calibration":"fundamentals_to_scenarios","followUps":["practical examples","problem solving","tradeoffs","ownership"],"support":"guided_when_stuck"}'::jsonb,
 '["Role knowledge","Problem solving","Practical judgment","Communication","Ownership"]'::jsonb,'2026-10-v1',true,NOW(),NOW())
ON CONFLICT ("key") DO NOTHING;

-- Server-side configuration. No direct browser policy is published.
ALTER TABLE "MockInterviewPersona" ENABLE ROW LEVEL SECURITY;
