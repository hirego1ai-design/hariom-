import { prisma } from "@/lib/prisma";
import { getVideoAnalysisConfig } from "@/lib/env";
import { getWorkerDownloadUrl } from "@/lib/storage";
import { isStoredFileSafeForProcessing } from "@/lib/uploadSecurity";

export async function enqueueRecordedAssessmentAnalysis(responseId: string) {
  const response = await prisma.recordedAssessmentResponse.findUnique({ where: { id: responseId }, include: { storedFile: true } });
  if (!response?.storedFile) return null;
  const idempotencyKey = `assessment-analysis-${responseId}`;
  return prisma.recordedAssessmentAnalysisJob.upsert({
    where: { idempotencyKey }, update: {},
    create: { responseId, idempotencyKey, payload: { fileId: response.storedFile.id, objectKey: response.storedFile.objectKey } },
  });
}

export async function dispatchRecordedAssessmentAnalysis(responseId: string) {
  const response = await prisma.recordedAssessmentResponse.findUnique({
    where: { id: responseId },
    include: { storedFile: true },
  });
  if (!response?.storedFile) return;
  const config = getVideoAnalysisConfig();
  if (!config.enabled || !config.workerUrl) {
    await prisma.recordedAssessmentResponse.update({ where: { id: response.id }, data: { analysisStatus: "BLOCKED_INFRA" } });
    return;
  }
  // The job is normally persisted synchronously with the candidate-facing save.
  // Upsert keeps recovery/legacy callers safe and idempotent.
  const job = await enqueueRecordedAssessmentAnalysis(responseId);
  if (!job) return;
  if (["PROCESSING", "COMPLETED"].includes(job.status)) return;

  // Defense in depth: a quarantined, failed-scan, legacy, or deleted file must
  // never receive a signed worker URL and must never reach transcription/AI.
  if (!isStoredFileSafeForProcessing(response.storedFile)) {
    await prisma.$transaction([
      prisma.recordedAssessmentAnalysisJob.updateMany({
        where: { id: job.id, status: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } },
        data: {
          status: "BLOCKED_INFRA",
          error: "Security scan has not produced a CLEAN file.",
          completedAt: null,
        },
      }),
      prisma.recordedAssessmentResponse.updateMany({
        where: { id: response.id, analysisStatus: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } },
        data: { analysisStatus: "BLOCKED_INFRA" },
      }),
    ]);
    return;
  }

  const downloadUrl = await getWorkerDownloadUrl(response.storedFile.objectKey);
  try {
    const origin = process.env.VIDEO_ANALYSIS_CALLBACK_ORIGIN?.trim().replace(/\/$/, "") || process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "http://localhost:3000";
    if (process.env.NODE_ENV === "production") {
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Assessment callback origin must be credential-free HTTPS.");
    }
    const result = await fetch(`${config.workerUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.internalToken}` },
      signal: AbortSignal.timeout(Math.min(config.timeoutSeconds * 1_000, 60_000)),
      redirect: "error",
      body: JSON.stringify({
        jobId: job.id, videoResumeId: response.id, fileId: response.storedFile.id, objectKey: response.storedFile.objectKey,
        downloadUrl, claimedDurationSeconds: response.durationSeconds,
        callbackUrl: `${origin}/api/internal/recorded-assessment-analysis/callback`,
      }),
    });
    if (!result.ok) throw new Error(`Worker rejected dispatch with HTTP ${result.status}`);
    await prisma.$transaction([
      prisma.recordedAssessmentAnalysisJob.updateMany({ where: { id: job.id, status: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } }, data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 } } }),
      prisma.recordedAssessmentResponse.updateMany({ where: { id: response.id, analysisStatus: { in: ["PENDING", "BLOCKED_INFRA", "FAILED"] } }, data: { analysisStatus: "PROCESSING" } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker dispatch failed";
    await prisma.$transaction([
      prisma.recordedAssessmentAnalysisJob.update({ where: { id: job.id }, data: { status: "BLOCKED_INFRA", error: message, completedAt: new Date(), attempts: { increment: 1 } } }),
      prisma.recordedAssessmentResponse.update({ where: { id: response.id }, data: { analysisStatus: "BLOCKED_INFRA" } }),
    ]);
  }
}
