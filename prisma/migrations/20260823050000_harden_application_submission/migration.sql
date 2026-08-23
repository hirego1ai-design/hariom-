-- Do not delete or silently merge historical applications.  Deployment stops
-- with a precise reconciliation query if legacy duplicate rows exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Application"
    GROUP BY "candidateProfileId", "jobId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add Application(candidateProfileId, jobId) uniqueness while duplicate applications exist. Reconcile duplicates before deployment.';
  END IF;
END $$;

CREATE UNIQUE INDEX "Application_candidateProfileId_jobId_key"
  ON "Application"("candidateProfileId", "jobId");
