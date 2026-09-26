ALTER TABLE "RecordedAssessmentAnalysisJob"
  ADD COLUMN IF NOT EXISTS "claimToken" TEXT;

CREATE INDEX IF NOT EXISTS "RecordedAssessmentAnalysisJob_claimToken_idx"
  ON "RecordedAssessmentAnalysisJob"("claimToken");
