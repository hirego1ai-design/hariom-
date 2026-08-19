CREATE TYPE "CustomSkillStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "SkillMaster" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SkillMaster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoleSkillMapping" (
  "id" TEXT NOT NULL,
  "roleTitle" TEXT NOT NULL,
  "industry" TEXT,
  "department" TEXT,
  "skillId" TEXT NOT NULL,
  "skillCategory" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'preferred',
  "recommendedProficiency" TEXT NOT NULL DEFAULT 'intermediate',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoleSkillMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomSkillRequest" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "suggestedForRole" TEXT,
  "requestedById" TEXT NOT NULL,
  "status" "CustomSkillStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomSkillRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillMaster_name_key" ON "SkillMaster"("name");
CREATE UNIQUE INDEX "SkillMaster_slug_key" ON "SkillMaster"("slug");
CREATE UNIQUE INDEX "RoleSkillMapping_roleTitle_skillId_key" ON "RoleSkillMapping"("roleTitle", "skillId");
CREATE INDEX "RoleSkillMapping_roleTitle_industry_department_idx" ON "RoleSkillMapping"("roleTitle", "industry", "department");
CREATE INDEX "CustomSkillRequest_status_createdAt_idx" ON "CustomSkillRequest"("status", "createdAt");
CREATE INDEX "CustomSkillRequest_normalizedName_idx" ON "CustomSkillRequest"("normalizedName");

ALTER TABLE "RoleSkillMapping" ADD CONSTRAINT "RoleSkillMapping_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "SkillMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomSkillRequest" ADD CONSTRAINT "CustomSkillRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
