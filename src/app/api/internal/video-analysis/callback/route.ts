import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getVideoAnalysisConfig } from "@/lib/env";

const callbackSchema = z.object({
  jobId: z.string().uuid(),
  videoResumeId: z.string().uuid(),
  status: z.enum(["COMPLETED", "FAILED", "BLOCKED_INFRA"]),
  error: z.string().nullable().optional(),
  modelName: z.string().optional(),
  modelVersion: z.string().optional(),
  workerVersion: z.string().optional(),
  analysisVersion: z.string().optional(),
  result: z
    .object({
      transcript: z.string().optional(),
      detectedLanguage: z.string().optional(),
      wordsPerMinute: z.number().optional(),
      pauseRatio: z.number().optional(),
      fillerWordCount: z.number().int().optional(),
      transcriptConfidence: z.number().optional(),
      lowConfidence: z.boolean().optional(),
      audioQuality: z.string().optional(),
      facePresenceRatio: z.number().nullable().optional(),
      cameraFacingRatioEstimate: z.number().nullable().optional(),
      headPoseIndicators: z.any().nullable().optional(),
      postureIndicators: z.any().nullable().optional(),
      communicationScore: z.number().int().min(0).max(100).nullable().optional(),
      clarityScore: z.number().int().min(0).max(100).nullable().optional(),
      confidenceScore: z.number().int().min(0).max(100).nullable().optional(),
      professionalism: z.number().int().min(0).max(100).nullable().optional(),
      speechDeliveryScore: z.number().int().min(0).max(100).nullable().optional(),
      contentStructureScore: z.number().int().min(0).max(100).nullable().optional(),
      strengths: z.array(z.string()).optional(),
      improvementSuggestions: z.array(z.string()).optional(),
      actualDurationSeconds: z.number().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const config = getVideoAnalysisConfig();
    const isProd = process.env.NODE_ENV === "production";

    // Fail-closed token verification in production
    if (isProd && (config.internalToken === "dev-internal-token-change-in-prod" || !config.internalToken)) {
      return jsonError("Production internal token misconfigured", 500);
    }

    const authHeader = request.headers.get("Authorization");
    const expectedToken = `Bearer ${config.internalToken}`;

    if (!authHeader || authHeader !== expectedToken) {
      return jsonError("Unauthorized internal callback token", 401);
    }

    const body = await readValidatedJson(request, callbackSchema);

    const job = await prisma.videoAnalysisJob.findUnique({
      where: { id: body.jobId },
    });
    if (!job) return jsonError("Job not found", 404);

    // Verify videoResumeId matches job record
    if (job.videoResumeId !== body.videoResumeId) {
      return jsonError("Forbidden: videoResumeId does not match job record", 403);
    }

    // Handle repeated callbacks idempotently
    if (job.status === "COMPLETED" && body.status === "COMPLETED") {
      return NextResponse.json({ success: true, message: "Job already completed (idempotent)" });
    }

    const now = new Date();

    if (body.status === "COMPLETED" && body.result) {
      const res = body.result;
      await prisma.$transaction([
        prisma.videoAnalysisJob.update({
          where: { id: body.jobId },
          data: {
            status: "COMPLETED",
            result: body.result,
            completedAt: now,
          },
        }),
        prisma.videoResume.update({
          where: { id: body.videoResumeId },
          data: {
            analysisStatus: "COMPLETED",
            transcript: res.transcript ?? undefined,
            detectedLanguage: res.detectedLanguage ?? null,
            wordsPerMinute: res.wordsPerMinute ?? null,
            pauseRatio: res.pauseRatio ?? null,
            fillerWordCount: res.fillerWordCount ?? null,
            transcriptConfidence: res.transcriptConfidence ?? null,
            lowConfidence: res.lowConfidence ?? false,
            audioQuality: res.audioQuality ?? null,
            facePresenceRatio: res.facePresenceRatio ?? null,
            cameraFacingRatioEstimate: res.cameraFacingRatioEstimate ?? null,
            headPoseIndicators: res.headPoseIndicators ?? undefined,
            postureIndicators: res.postureIndicators ?? undefined,
            communicationScore: res.communicationScore ?? null,
            clarityScore: res.clarityScore ?? null,
            confidenceScore: res.confidenceScore ?? null,
            professionalism: res.professionalism ?? null,
            speechDeliveryScore: res.speechDeliveryScore ?? null,
            contentStructureScore: res.contentStructureScore ?? null,
            strengths: res.strengths ?? undefined,
            improvementSuggestions: res.improvementSuggestions ?? undefined,
            modelName: body.modelName || "whisper-small",
            modelVersion: body.modelVersion || "1.0.0",
            workerVersion: body.workerVersion || "1.0.0",
            analysisVersion: body.analysisVersion || "v1",
            completedAt: now,
            analysisError: null,
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.videoAnalysisJob.update({
          where: { id: body.jobId },
          data: {
            status: body.status,
            error: body.error || "Analysis failed",
            completedAt: now,
          },
        }),
        prisma.videoResume.update({
          where: { id: body.videoResumeId },
          data: {
            analysisStatus: body.status,
            analysisError: body.error || "Analysis processing failed",
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true, jobId: body.jobId, status: body.status });
  } catch (error) {
    return handleApiError(error);
  }
}
