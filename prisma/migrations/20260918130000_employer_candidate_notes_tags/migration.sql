CREATE TABLE "EmployerCandidateNote" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL, "text" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "EmployerCandidateNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmployerCandidateNote_applicationId_createdAt_idx" ON "EmployerCandidateNote"("applicationId","createdAt");
CREATE INDEX "EmployerCandidateNote_companyId_idx" ON "EmployerCandidateNote"("companyId");
ALTER TABLE "EmployerCandidateNote" ADD CONSTRAINT "EmployerCandidateNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerCandidateNote" ADD CONSTRAINT "EmployerCandidateNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerCandidateNote" ADD CONSTRAINT "EmployerCandidateNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EmployerCandidateTag" (
  "id" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "label" TEXT NOT NULL, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmployerCandidateTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmployerCandidateTag_applicationId_label_key" ON "EmployerCandidateTag"("applicationId","label");
CREATE INDEX "EmployerCandidateTag_companyId_idx" ON "EmployerCandidateTag"("companyId");
ALTER TABLE "EmployerCandidateTag" ADD CONSTRAINT "EmployerCandidateTag_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerCandidateTag" ADD CONSTRAINT "EmployerCandidateTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerCandidateTag" ADD CONSTRAINT "EmployerCandidateTag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
