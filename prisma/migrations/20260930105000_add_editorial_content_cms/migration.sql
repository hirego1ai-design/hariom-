DO $$ BEGIN
  CREATE TYPE "EditorialContentType" AS ENUM ('BLOG', 'PRESS_RELEASE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EditorialContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "EditorialContent" (
  "id" TEXT NOT NULL,
  "type" "EditorialContentType" NOT NULL,
  "status" "EditorialContentStatus" NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "contentHtml" TEXT NOT NULL,
  "contentText" TEXT NOT NULL,
  "featuredImageFileId" TEXT,
  "featuredImageAlt" TEXT,
  "inlineMediaFileIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "ogImageFileId" TEXT,
  "authorId" TEXT NOT NULL,
  "category" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dateline" TEXT,
  "mediaContactName" TEXT,
  "mediaContactEmail" TEXT,
  "mediaContactPhone" TEXT,
  "companyBoilerplate" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "canonicalUrl" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EditorialContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EditorialContent_slug_key" ON "EditorialContent"("slug");
CREATE INDEX IF NOT EXISTS "EditorialContent_status_publishedAt_idx" ON "EditorialContent"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "EditorialContent_type_status_publishedAt_idx" ON "EditorialContent"("type", "status", "publishedAt");
CREATE INDEX IF NOT EXISTS "EditorialContent_authorId_updatedAt_idx" ON "EditorialContent"("authorId", "updatedAt");
CREATE INDEX IF NOT EXISTS "EditorialContent_scheduledAt_idx" ON "EditorialContent"("scheduledAt");

DO $ BEGIN
  ALTER TABLE "EditorialContent"
    ADD CONSTRAINT "EditorialContent_revision_check"
    CHECK ("revision" >= 1);
EXCEPTION
  WHEN duplicate_object THEN null;
END $;

DO $$ BEGIN
  ALTER TABLE "EditorialContent"
    ADD CONSTRAINT "EditorialContent_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- HireGo uses custom JWT sessions and server-side Prisma. Keep editorial
-- content private from Supabase Data API roles; public reads go through the
-- application so publication state is always enforced.
ALTER TABLE "EditorialContent" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "EditorialContent" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "EditorialContent" FROM authenticated;
  END IF;
END
$$;
