-- Historical Supabase migration ledger synchronized from production.
-- Prisma migrations remain the authoritative application schema history.
-- Do not edit this historical file after it has been recorded remotely.

-- Supabase production hardening:
-- 1) Enable RLS on Prisma migration metadata as defense in depth.
--    No policy is intentionally added: client roles must never access migration metadata.
--    Do not FORCE RLS; the database owner/migration role must remain able to manage Prisma migrations.
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Add covering indexes for public-schema foreign keys flagged by the Supabase performance advisor.
-- CREATE INDEX IF NOT EXISTS keeps this migration safe if the live database was pre-hardened.

CREATE INDEX IF NOT EXISTS "AgreementEvent_agreementId_idx"
  ON "public"."AgreementEvent" ("agreementId");

CREATE INDEX IF NOT EXISTS "AiUsage_userId_idx"
  ON "public"."AiUsage" ("userId");

CREATE INDEX IF NOT EXISTS "Application_jobId_idx"
  ON "public"."Application" ("jobId");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx"
  ON "public"."AuditLog" ("userId");

CREATE INDEX IF NOT EXISTS "CandidateReadiness_assessmentId_idx"
  ON "public"."CandidateReadiness" ("assessmentId");

CREATE INDEX IF NOT EXISTS "CandidateServiceUsage_serviceId_idx"
  ON "public"."CandidateServiceUsage" ("serviceId");

CREATE INDEX IF NOT EXISTS "CandidateSourcingRelationship_sourcedById_idx"
  ON "public"."CandidateSourcingRelationship" ("sourcedById");

CREATE INDEX IF NOT EXISTS "CommercialAgreement_requirementId_idx"
  ON "public"."CommercialAgreement" ("requirementId");

CREATE INDEX IF NOT EXISTS "CommunicationDelivery_templateId_idx"
  ON "public"."CommunicationDelivery" ("templateId");

CREATE INDEX IF NOT EXISTS "CompanyInvitation_invitedById_idx"
  ON "public"."CompanyInvitation" ("invitedById");

CREATE INDEX IF NOT EXISTS "CompanySubscription_companyId_idx"
  ON "public"."CompanySubscription" ("companyId");

CREATE INDEX IF NOT EXISTS "CompanySubscription_planId_idx"
  ON "public"."CompanySubscription" ("planId");

CREATE INDEX IF NOT EXISTS "CustomSkillRequest_requestedById_idx"
  ON "public"."CustomSkillRequest" ("requestedById");

CREATE INDEX IF NOT EXISTS "EmployerCandidateCollection_createdById_idx"
  ON "public"."EmployerCandidateCollection" ("createdById");

CREATE INDEX IF NOT EXISTS "EmployerCandidateNote_authorId_idx"
  ON "public"."EmployerCandidateNote" ("authorId");

CREATE INDEX IF NOT EXISTS "EmployerCandidateTag_createdById_idx"
  ON "public"."EmployerCandidateTag" ("createdById");

CREATE INDEX IF NOT EXISTS "EmployerProfile_companyId_idx"
  ON "public"."EmployerProfile" ("companyId");

CREATE INDEX IF NOT EXISTS "Interview_applicationId_idx"
  ON "public"."Interview" ("applicationId");

CREATE INDEX IF NOT EXISTS "InterviewRoundProgress_roundId_idx"
  ON "public"."InterviewRoundProgress" ("roundId");

CREATE INDEX IF NOT EXISTS "JobListing_companyId_idx"
  ON "public"."JobListing" ("companyId");

CREATE INDEX IF NOT EXISTS "McqAttempt_assessmentId_idx"
  ON "public"."McqAttempt" ("assessmentId");

CREATE INDEX IF NOT EXISTS "McqCandidateAnswer_questionId_idx"
  ON "public"."McqCandidateAnswer" ("questionId");

CREATE INDEX IF NOT EXISTS "McqCandidateAnswer_selectedOptionId_idx"
  ON "public"."McqCandidateAnswer" ("selectedOptionId");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx"
  ON "public"."Notification" ("userId");

CREATE INDEX IF NOT EXISTS "RecordedAssessmentRestriction_reviewedById_idx"
  ON "public"."RecordedAssessmentRestriction" ("reviewedById");

CREATE INDEX IF NOT EXISTS "ReferralLedgerEntry_payoutId_idx"
  ON "public"."ReferralLedgerEntry" ("payoutId");

CREATE INDEX IF NOT EXISTS "ReferralLedgerEntry_rewardId_idx"
  ON "public"."ReferralLedgerEntry" ("rewardId");

CREATE INDEX IF NOT EXISTS "RoleSkillMapping_skillId_idx"
  ON "public"."RoleSkillMapping" ("skillId");

CREATE INDEX IF NOT EXISTS "SavedJob_jobId_idx"
  ON "public"."SavedJob" ("jobId");

CREATE INDEX IF NOT EXISTS "VideoResume_candidateProfileId_idx"
  ON "public"."VideoResume" ("candidateProfileId");
