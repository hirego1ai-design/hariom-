-- Universal candidate skill validation and evidence layer.
-- Additive only: legacy CandidateProfile.skills remains for compatibility.

DO $$ BEGIN
  CREATE TYPE "SkillProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SkillVerificationStatus" AS ENUM ('SELF_DECLARED', 'ASSESSMENT_VALIDATED', 'VERIFIED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SkillEvidenceType" AS ENUM ('MCQ_ASSESSMENT', 'RECORDED_ASSESSMENT', 'INTERVIEW', 'EMPLOYER_ATTESTATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "McqQuestion"
  ADD COLUMN IF NOT EXISTS "skillTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "McqQuestion"
SET "skillTags" = ARRAY[trim("category")]
WHERE cardinality("skillTags") = 0
  AND "category" IS NOT NULL
  AND trim("category") <> '';

CREATE TABLE IF NOT EXISTS "CandidateSkill" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "skillId" TEXT,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "claimedLevel" "SkillProficiencyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
  "verifiedLevel" "SkillProficiencyLevel",
  "verificationStatus" "SkillVerificationStatus" NOT NULL DEFAULT 'SELF_DECLARED',
  "latestScore" INTEGER,
  "verifiedAt" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SkillEvidence" (
  "id" TEXT NOT NULL,
  "candidateSkillId" TEXT NOT NULL,
  "evidenceType" "SkillEvidenceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceVersion" TEXT,
  "score" INTEGER,
  "earnedPoints" INTEGER,
  "totalPoints" INTEGER,
  "questionCount" INTEGER,
  "roleTitle" TEXT,
  "seniority" TEXT,
  "qualifiesVerification" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateSkill_candidateProfileId_normalizedName_key"
  ON "CandidateSkill"("candidateProfileId","normalizedName");
CREATE INDEX IF NOT EXISTS "CandidateSkill_candidateProfileId_verificationStatus_idx"
  ON "CandidateSkill"("candidateProfileId","verificationStatus");
CREATE INDEX IF NOT EXISTS "CandidateSkill_skillId_idx" ON "CandidateSkill"("skillId");
CREATE UNIQUE INDEX IF NOT EXISTS "SkillEvidence_candidateSkillId_evidenceType_sourceId_key"
  ON "SkillEvidence"("candidateSkillId","evidenceType","sourceId");
CREATE INDEX IF NOT EXISTS "SkillEvidence_candidateSkillId_observedAt_idx"
  ON "SkillEvidence"("candidateSkillId","observedAt");
CREATE INDEX IF NOT EXISTS "SkillEvidence_evidenceType_observedAt_idx"
  ON "SkillEvidence"("evidenceType","observedAt");

DO $$ BEGIN
  ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_candidateProfileId_fkey"
    FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "SkillMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_candidateSkillId_fkey"
    FOREIGN KEY ("candidateSkillId") REFERENCES "CandidateSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_latestScore_check"
    CHECK ("latestScore" IS NULL OR ("latestScore" >= 0 AND "latestScore" <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_score_check"
    CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backfill legacy visible skills without fabricating proficiency or verification.
WITH normalized_skills AS (
  SELECT DISTINCT ON (
    cp."id",
    lower(regexp_replace(trim(skill_name), '[[:space:]]+', ' ', 'g'))
  )
    cp."id" AS "candidateProfileId",
    trim(skill_name) AS "name",
    lower(regexp_replace(trim(skill_name), '[[:space:]]+', ' ', 'g')) AS "normalizedName"
  FROM "CandidateProfile" cp
  CROSS JOIN LATERAL unnest(cp."skills") AS skill_name
  WHERE trim(skill_name) <> ''
  ORDER BY
    cp."id",
    lower(regexp_replace(trim(skill_name), '[[:space:]]+', ' ', 'g')),
    trim(skill_name)
)
INSERT INTO "CandidateSkill" (
  "id","candidateProfileId","name","normalizedName","claimedLevel","verificationStatus","isVisible","createdAt","updatedAt"
)
SELECT
  substr(md5(ns."candidateProfileId" || ':' || ns."normalizedName"), 1, 8)
    || '-' || substr(md5(ns."candidateProfileId" || ':' || ns."normalizedName"), 9, 4)
    || '-' || substr(md5(ns."candidateProfileId" || ':' || ns."normalizedName"), 13, 4)
    || '-' || substr(md5(ns."candidateProfileId" || ':' || ns."normalizedName"), 17, 4)
    || '-' || substr(md5(ns."candidateProfileId" || ':' || ns."normalizedName"), 21, 12),
  ns."candidateProfileId",
  ns."name",
  ns."normalizedName",
  'INTERMEDIATE'::"SkillProficiencyLevel",
  'SELF_DECLARED'::"SkillVerificationStatus",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM normalized_skills ns
ON CONFLICT ("candidateProfileId","normalizedName") DO NOTHING;
