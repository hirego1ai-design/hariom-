import { runRecordedAssessmentRecovery } from "../src/lib/recordedAssessmentRecovery.ts";

const batchSize = Number(process.env.RECORDED_ASSESSMENT_RECOVERY_BATCH_SIZE || 20);

try {
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
