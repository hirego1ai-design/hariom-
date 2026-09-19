ALTER TABLE "RecordedAssessmentQuestionBank" ADD COLUMN "questionKey" TEXT;

-- Existing curated rows become independent families. Future versions reuse the
-- same stable key, while frozen attempt snapshots remain unchanged.
UPDATE "RecordedAssessmentQuestionBank" SET "questionKey" = 'legacy-' || "id" WHERE "questionKey" IS NULL;
ALTER TABLE "RecordedAssessmentQuestionBank" ALTER COLUMN "questionKey" SET NOT NULL;
CREATE UNIQUE INDEX "RecordedAssessmentQuestionBank_questionKey_version_key" ON "RecordedAssessmentQuestionBank"("questionKey", "version");
CREATE INDEX "RecordedAssessmentQuestionBank_questionKey_isActive_idx" ON "RecordedAssessmentQuestionBank"("questionKey", "isActive");
