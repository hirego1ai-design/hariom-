import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scheduler = readFileSync("scripts/run-recorded-assessment-scheduler.mjs", "utf8");
const route = readFileSync(
  "src/app/api/cron/recorded-assessment-analysis/route.ts",
  "utf8",
);
const dockerfile = readFileSync("Dockerfile.recorded-assessment-scheduler", "utf8");

test("Railway recorded-assessment scheduler executes the shared worker directly", () => {
  assert.match(scheduler, /runRecordedAssessmentRecovery/);
  assert.doesNotMatch(scheduler, /APP_URL/);
  assert.doesNotMatch(scheduler, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.doesNotMatch(scheduler, /fetch\s*\(/);
});

test("cron API route and Railway scheduler share the same recovery implementation", () => {
  assert.match(route, /runRecordedAssessmentRecovery/);
  assert.doesNotMatch(route, /dispatchRecordedAssessmentAnalysis/);
});

test("Railway worker image packages Prisma and the TypeScript runtime", () => {
  assert.match(dockerfile, /prisma generate/);
  assert.match(dockerfile, /tsx/);
  assert.match(dockerfile, /COPY src \.\/src/);
});

test("Railway worker fails closed when required production configuration is absent", () => {
  for (const required of [
    "DATABASE_URL",
    "DIRECT_URL",
    "S3_BUCKET_NAME",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "VIDEO_ANALYSIS_WORKER_URL",
    "VIDEO_ANALYSIS_INTERNAL_TOKEN",
    "VIDEO_ANALYSIS_ENABLED=true",
  ]) {
    assert.match(scheduler, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
