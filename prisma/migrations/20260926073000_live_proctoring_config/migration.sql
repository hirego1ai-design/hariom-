CREATE TABLE "ProctoringConfig" (
  "id" TEXT NOT NULL DEFAULT 'global-proctoring-config',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "tabSwitchEnabled" BOOLEAN NOT NULL DEFAULT true,
  "clipboardEnabled" BOOLEAN NOT NULL DEFAULT true,
  "contextMenuEnabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProctoringConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProctoringConfig" ("id")
VALUES ('global-proctoring-config')
ON CONFLICT ("id") DO NOTHING;
