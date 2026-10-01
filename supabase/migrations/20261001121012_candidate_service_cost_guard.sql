ALTER TABLE "CandidateServiceCatalog"
  ADD CONSTRAINT "CandidateServiceCatalog_creditCost_nonnegative"
  CHECK ("creditCost" >= 0);
