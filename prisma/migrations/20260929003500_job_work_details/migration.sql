ALTER TABLE "JobListing"
  ADD COLUMN "workMode" TEXT NOT NULL DEFAULT 'On-site',
  ADD COLUMN "experienceLevel" TEXT NOT NULL DEFAULT 'Mid-level',
  ADD COLUMN "numberOfOpenings" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "JobListing"
  ADD CONSTRAINT "JobListing_numberOfOpenings_check"
  CHECK ("numberOfOpenings" >= 1 AND "numberOfOpenings" <= 10000);
