ALTER TABLE "HiringRequirement"
  ADD COLUMN "website" TEXT,
  ADD COLUMN "gstin" TEXT,
  ADD COLUMN "pan" TEXT,
  ADD COLUMN "billingAddress" TEXT,
  ADD COLUMN "multipleRoles" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "department" TEXT,
  ADD COLUMN "employmentType" TEXT,
  ADD COLUMN "preferredSkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "languages" TEXT,
  ADD COLUMN "tools" TEXT,
  ADD COLUMN "variableComponent" TEXT,
  ADD COLUMN "bonusIncentives" TEXT,
  ADD COLUMN "benefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "shift" TEXT,
  ADD COLUMN "noticePeriod" TEXT,
  ADD COLUMN "positions" JSONB;

-- Existing rows were created under legacy implicit defaults. Keep their current
-- values, but remove database defaults so all new managed-hiring requirements
-- must provide these business-critical terms explicitly at the application layer.
ALTER TABLE "HiringRequirement"
  ALTER COLUMN "workMode" DROP DEFAULT,
  ALTER COLUMN "hiringPriority" DROP DEFAULT,
  ALTER COLUMN "replacementExpectation" DROP DEFAULT;
