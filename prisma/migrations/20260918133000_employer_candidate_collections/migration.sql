CREATE TABLE "EmployerCandidateCollection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "candidateIds" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployerCandidateCollection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmployerCandidateCollection_companyId_name_key" ON "EmployerCandidateCollection"("companyId","name");
CREATE INDEX "EmployerCandidateCollection_companyId_idx" ON "EmployerCandidateCollection"("companyId");
ALTER TABLE "EmployerCandidateCollection" ADD CONSTRAINT "EmployerCandidateCollection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployerCandidateCollection" ADD CONSTRAINT "EmployerCandidateCollection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
