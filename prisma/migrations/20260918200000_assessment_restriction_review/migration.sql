CREATE TYPE "RecordedAssessmentRestrictionStatus" AS ENUM ('PENDING_REVIEW','ACTIVE','REJECTED','EXPIRED','REVOKED');
CREATE TABLE "RecordedAssessmentRestriction" (
 "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "attemptId" TEXT, "status" "RecordedAssessmentRestrictionStatus" NOT NULL DEFAULT 'PENDING_REVIEW', "proposedMonths" INTEGER NOT NULL, "suspendedUntil" TIMESTAMP(3), "reason" TEXT NOT NULL, "evidence" JSONB, "reviewedById" TEXT, "reviewedAt" TIMESTAMP(3), "reviewNote" TEXT, "appealNote" TEXT, "appealedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RecordedAssessmentRestriction_pkey" PRIMARY KEY ("id"));
ALTER TABLE "RecordedAssessmentRestriction" ADD CONSTRAINT "RecordedAssessmentRestriction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordedAssessmentRestriction" ADD CONSTRAINT "RecordedAssessmentRestriction_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "RecordedAssessmentRestriction_userId_status_idx" ON "RecordedAssessmentRestriction"("userId","status");
CREATE INDEX "RecordedAssessmentRestriction_status_createdAt_idx" ON "RecordedAssessmentRestriction"("status","createdAt");
CREATE INDEX "RecordedAssessmentRestriction_suspendedUntil_idx" ON "RecordedAssessmentRestriction"("suspendedUntil");
ALTER TABLE "RecordedAssessmentRestriction" ADD CONSTRAINT "RecordedAssessmentRestriction_proposedMonths_check" CHECK ("proposedMonths" IN (1,2,3));
