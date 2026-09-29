import { prisma } from "@/lib/prisma";
import { dispatchRecordedAssessmentAnalysis } from "@/lib/recordedAssessmentAnalysis";

const DEFAULT_BATCH_SIZE = 20;
export const RECORDED_ASSESSMENT_STALE_PROCESSING_MINUTES = 15;
const BASE_RETRY_MINUTES = 2;

function retryDelayMs(attempts: number) {
  return BASE_RETRY_MINUTES * 60_000 * 2 ** Math.max(0, attempts - 1);
}

export async function runRecordedAssessmentRecovery(batchSize = DEFAULT_BATCH_SIZE) {
  const boundedBatchSize = Math.max(1, Math.min(batchSize, 100));
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - RECORDED_ASSESSMENT_STALE_PROCESSING_MINUTES * 60_000,
  );

  const jobs = await prisma.recordedAssessmentAnalysisJob.findMany({
    where: {
      completedAt: null,
      OR: [
        { status: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } },
        {
          status: "PROCESSING",
          OR: [{ startedAt: { lt: staleBefore } }, { startedAt: null }],
        },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: boundedBatchSize,
    select: {
      id: true,
      responseId: true,
      attempts: true,
      maxAttempts: true,
      status: true,
      updatedAt: true,
    },
  });

  const results: Array<{
    jobId: string;
    responseId: string;
    dispatched: boolean;
    reason?: string;
  }> = [];

  for (const job of jobs) {
    if (job.attempts >= job.maxAttempts) {
      await prisma.recordedAssessmentAnalysisJob.update({
        where: { id: job.id },
        data: { completedAt: new Date(), status: "FAILED" },
      });
      results.push({
        jobId: job.id,
        responseId: job.responseId,
        dispatched: false,
        reason: "max-attempts",
      });
      continue;
    }

    if (
      job.status !== "PROCESSING" &&
      now.getTime() - job.updatedAt.getTime() < retryDelayMs(job.attempts)
    ) {
      results.push({
        jobId: job.id,
        responseId: job.responseId,
        dispatched: false,
        reason: "backoff",
      });
      continue;
    }

    if (job.status === "PROCESSING") {
      const claimed = await prisma.recordedAssessmentAnalysisJob.updateMany({
        where: {
          id: job.id,
          status: "PROCESSING",
          OR: [{ startedAt: { lt: staleBefore } }, { startedAt: null }],
        },
        data: {
          status: "BLOCKED_INFRA",
          error: "Worker callback timed out; queued for bounded recovery.",
          completedAt: null,
        },
      });
      if (claimed.count !== 1) {
        results.push({
          jobId: job.id,
          responseId: job.responseId,
          dispatched: false,
          reason: "claimed-elsewhere",
        });
        continue;
      }
      await prisma.recordedAssessmentResponse.updateMany({
        where: { id: job.responseId, analysisStatus: "PROCESSING" },
        data: { analysisStatus: "BLOCKED_INFRA" },
      });
    } else {
      const claimed = await prisma.recordedAssessmentAnalysisJob.updateMany({
        where: {
          id: job.id,
          status: job.status,
          attempts: job.attempts,
        },
        data: { updatedAt: now },
      });
      if (claimed.count !== 1) {
        results.push({
          jobId: job.id,
          responseId: job.responseId,
          dispatched: false,
          reason: "claimed-elsewhere",
        });
        continue;
      }
    }

    try {
      await dispatchRecordedAssessmentAnalysis(job.responseId);
      results.push({
        jobId: job.id,
        responseId: job.responseId,
        dispatched: true,
      });
    } catch {
      results.push({
        jobId: job.id,
        responseId: job.responseId,
        dispatched: false,
      });
    }
  }

  return {
    success: true as const,
    scanned: jobs.length,
    results,
    staleProcessingMinutes: RECORDED_ASSESSMENT_STALE_PROCESSING_MINUTES,
  };
}
