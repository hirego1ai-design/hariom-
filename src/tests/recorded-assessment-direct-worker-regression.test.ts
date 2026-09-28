import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scheduler = readFileSync(
  "scripts/run-recorded-assessment-scheduler.mjs",
  "utf8",
);
const route = readFileSync(
  "src/app/api/cron/recorded-assessment-analysis/route.ts",
  "utf8",
);
const dockerfile = readFileSync(
  "Dockerfile.recorded-assessment-scheduler",
  "utf8",
);
const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  crons?: Array<{ path: string; schedule: string }>;
};

test("Railway scheduler has an explicit direct-worker cutover and safe HTTP fallback", () => {
  assert.match(scheduler, /RAILWAY_DIRECT_BACKGROUND_WORKER/);
  assert.match(scheduler, /runDirectWorker/);
  assert.match(scheduler, /runHttpSchedulerFallback/);
  assert.match(scheduler, /runRecordedAssessmentRecovery/);
  assert.match(scheduler, /OutboxPoller/);
  assert.match(scheduler, /registerProductionConsumers/);
  assert.match(scheduler, /\/api\/cron\/events-outbox/);
  assert.match(scheduler, /\/api\/cron\/recorded-assessment-analysis/);
});

test("direct mode fails closed until authoritative worker infrastructure is configured", () => {
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
    assert.match(
      scheduler,
      new RegExp(required.replace(/[.*+?^{}$()|[\]\\]/g, "\\$&")),
    );
  }
});

test("HTTP fallback uses the existing Railway scheduler secrets and bounded app endpoints", () => {
  assert.match(scheduler, /CRON_SECRET/);
  assert.match(scheduler, /APP_URL/);
  assert.match(scheduler, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(scheduler, /AbortController/);
  assert.match(scheduler, /redirect: "error"/);
});

test("cron API route and direct Railway mode share recorded-assessment recovery implementation", () => {
  assert.match(route, /runRecordedAssessmentRecovery/);
  assert.doesNotMatch(route, /dispatchRecordedAssessmentAnalysis/);
});

test("Railway worker image packages Prisma and TypeScript runtime for direct-mode cutover", () => {
  assert.match(dockerfile, /prisma generate/);
  assert.match(dockerfile, /tsx/);
  assert.match(dockerfile, /COPY src \.\/src/);
});

test("Vercel no longer schedules sub-daily background recovery", () => {
  const crons = vercelConfig.crons ?? [];
  assert.equal(
    crons.some((cron) => cron.path === "/api/cron/events-outbox"),
    false,
  );
  assert.equal(crons.some((cron) => cron.schedule === "*/5 * * * *"), false);
});
