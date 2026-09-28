import { runRecordedAssessmentRecovery } from "../src/lib/recordedAssessmentRecovery.ts";
import { OutboxPoller } from "../src/lib/events/Outbox.ts";
import { registerProductionConsumers } from "../src/lib/events/ProductionConsumers.ts";

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
    throw new Error(`Railway background worker configuration is incomplete: ${missing.join(", ")}`);
  }
}

async function runEventsOutboxRecovery() {
  registerProductionConsumers();

  const stopAt = Date.now() + 45_000;
  const reports = [];
  let totalDispatched = 0;
  let totalFailed = 0;
  let totalUnhandled = 0;

  for (let pass = 0; pass < 10 && Date.now() < stopAt; pass++) {
    const report = await OutboxPoller.pollAndProcess(50, 60_000, stopAt);
    reports.push(report);
    totalDispatched += report.dispatched;
    totalFailed += report.failed;
    totalUnhandled += report.unhandled;
    if (report.claimed === 0) break;
  }

  return {
    totalDispatched,
    totalFailed,
    totalUnhandled,
    passes: reports.length,
    reports,
  };
}

const batchSize = Number(process.env.RECORDED_ASSESSMENT_RECOVERY_BATCH_SIZE || 20);

try {
  assertWorkerEnvironment();

  const outbox = await runEventsOutboxRecovery();
  const result = await runRecordedAssessmentRecovery(batchSize);

  if (outbox.totalFailed > 0 || outbox.totalUnhandled > 0) {
    throw new Error(
      `Outbox recovery incomplete: failed=${outbox.totalFailed}, unhandled=${outbox.totalUnhandled}`,
    );
  }

  console.log(
    JSON.stringify({
      worker: "hirego-background-recovery",
      at: new Date().toISOString(),
      status: "completed",
      outbox: {
        dispatched: outbox.totalDispatched,
        failed: outbox.totalFailed,
        unhandled: outbox.totalUnhandled,
        passes: outbox.passes,
      },
      recordedAssessment: {
        scanned: result.scanned,
        staleProcessingMinutes: result.staleProcessingMinutes,
        dispatched: result.results.filter((entry) => entry.dispatched).length,
      },
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      worker: "hirego-background-recovery",
      at: new Date().toISOString(),
      status: "failed",
      message: error instanceof Error ? error.message : "Background worker failed",
    }),
  );
  process.exitCode = 1;
}
