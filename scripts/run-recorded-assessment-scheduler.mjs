import { runRecordedAssessmentRecovery } from "../src/lib/recordedAssessmentRecovery.ts";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "S3_BUCKET_NAME",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "VIDEO_ANALYSIS_WORKER_URL",
  "VIDEO_ANALYSIS_INTERNAL_TOKEN",
];

function assertWorkerEnvironment() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (process.env.VIDEO_ANALYSIS_ENABLED !== "true") {
    missing.push("VIDEO_ANALYSIS_ENABLED=true");
  }
  if (
    !process.env.VIDEO_ANALYSIS_CALLBACK_ORIGIN?.trim() &&
    !process.env.NEXT_PUBLIC_APP_URL?.trim()
  ) {
    missing.push("VIDEO_ANALYSIS_CALLBACK_ORIGIN or NEXT_PUBLIC_APP_URL");
  }
  if (missing.length > 0) {
    throw new Error(`Recorded assessment worker configuration is incomplete: ${missing.join(", ")}`);
  }
}

const batchSize = Number(process.env.RECORDED_ASSESSMENT_RECOVERY_BATCH_SIZE || 20);

try {
  assertWorkerEnvironment();
  const result = await runRecordedAssessmentRecovery(batchSize);
  console.log(
    JSON.stringify({
      worker: "recorded-assessment-analysis-recovery",
      at: new Date().toISOString(),
      status: "completed",
      scanned: result.scanned,
      staleProcessingMinutes: result.staleProcessingMinutes,
      dispatched: result.results.filter((entry) => entry.dispatched).length,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      worker: "recorded-assessment-analysis-recovery",
      at: new Date().toISOString(),
      status: "failed",
      message: error instanceof Error ? error.message : "Recovery worker failed",
    }),
  );
  process.exitCode = 1;
}
