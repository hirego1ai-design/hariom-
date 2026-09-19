CREATE TYPE "CandidateSourcingStatus" AS ENUM ('SOURCED','SHORTLISTED','INVITED','ACCEPTED','DECLINED');
CREATE TABLE "CandidateSourcingRelationship" (
 "id" TEXT NOT NULL, "jobId" TEXT NOT NULL, "candidateProfileId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
 "status" "CandidateSourcingStatus" NOT NULL DEFAULT 'SOURCED', "sourcedById" TEXT NOT NULL,
 "shortlistedAt" TIMESTAMP(3), "invitedAt" TIMESTAMP(3), "acceptedAt" TIMESTAMP(3), "declinedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CandidateSourcingRelationship_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CandidateSourcingRelationship_jobId_candidateProfileId_key" ON "CandidateSourcingRelationship"("jobId","candidateProfileId");
CREATE INDEX "CandidateSourcingRelationship_companyId_status_idx" ON "CandidateSourcingRelationship"("companyId","status");
CREATE INDEX "CandidateSourcingRelationship_candidateProfileId_status_idx" ON "CandidateSourcingRelationship"("candidateProfileId","status");
ALTER TABLE "CandidateSourcingRelationship" ADD CONSTRAINT "CandidateSourcingRelationship_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateSourcingRelationship" ADD CONSTRAINT "CandidateSourcingRelationship_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateSourcingRelationship" ADD CONSTRAINT "CandidateSourcingRelationship_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateSourcingRelationship" ADD CONSTRAINT "CandidateSourcingRelationship_sourcedById_fkey" FOREIGN KEY ("sourcedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
