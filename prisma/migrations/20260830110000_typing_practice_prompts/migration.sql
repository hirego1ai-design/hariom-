-- Administrator-managed prompt catalog for unproctored typing practice.
-- This migration is additive and intentionally seeds no content.
CREATE TABLE "TypingPracticePrompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypingPracticePrompt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TypingPracticePrompt_isActive_updatedAt_idx"
ON "TypingPracticePrompt"("isActive", "updatedAt");

CREATE UNIQUE INDEX "TypingPracticePrompt_one_active_prompt_key"
ON "TypingPracticePrompt" (("isActive"))
WHERE "isActive" = true;
