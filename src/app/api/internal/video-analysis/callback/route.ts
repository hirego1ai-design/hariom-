import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getVideoAnalysisConfig } from "@/lib/env";
import { canApplyVideoAnalysisCallback } from "@/lib/videoAnalysisState";
import { Prisma } from "@prisma/client";
import { timingSafeEqual } from "node:crypto";

const callbackSchema = z.object({
  jobId: z.string().uuid(),
  videoResumeId: z.string().uuid(),
  claimToken: z.string().uuid(),
  status: z.enum(["COMPLETED", "FAILED", "BLOCKED_INFRA"]),
  error: z.string().nullable().optional(),
  modelName: z.string().optional(),
  modelVersion: z.string().optional(),
  workerVersion: z.string().optional(),
  analysisVersion: z.string().optional(),
  result: z
    .object({
      transcript: z.string().max(30_000).optional(),
      detectedLanguage: z.string().trim().min(1).max(32).optional(),
      wordsPerMinute: z.number().finite().min(0).max(1_000).optional(),
      pauseRatio: z.number().finite().min(0).max(1).optional(),
      fillerWordCount: z.number().int().min(0).max(100_000).optional(),
      transcriptConfidence: z.number().finite().min(0).max(1).optional(),
      lowConfidence: z.boolean().optional(),
      audioQuality: z.string().max(500).optional(),
      actualDurationSeconds: z.number().finite().min(0).max(121).optional(),
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
    const presented = Buffer.from(authHeader || "");
    const expected = Buffer.from(expectedToken);
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) {
      return jsonError("Unauthorized internal callback token", 401);
    }

    const body = await readValidatedJson(request, callbackSchema, 128 * 1024);

    const job = await prisma.videoAnalysisJob.findUnique({
      where: { id: body.jobId },
    });
    if (!job) return jsonError("Job not found", 404);

    // Verify videoResumeId matches job record
    if (job.videoResumeId !== body.videoResumeId) {
      return jsonError("Forbidden: videoResumeId does not match job record", 403);
    }

    // Every terminal status is immutable. This covers exact replays and also
    // prevents a delayed failure from replacing a completed result (or vice
    // versa). Operators must explicitly create/requeue a new job to retry.
    if (!canApplyVideoAnalysisCallback(job.status)) {
      return NextResponse.json({ success: true, message: "Job already terminal (idempotent)", status: job.status });
    }

    const now = new Date();

    if (body.status === "COMPLETED" && body.result) {
      const res = body.result;
      const applied = await prisma.$transaction(async (tx) => {
        const claim = await tx.videoAnalysisJob.updateMany({
          where: { id: body.jobId, videoResumeId: body.videoResumeId, status: "PROCESSING", claimToken: body.claimToken },
          data: {
            status: "COMPLETED",
            // Zod strips legacy appearance and personality scores sent by an
            // older worker before the result is retained in the job record.
            result: res as Prisma.InputJsonValue,
            completedAt: now,
            claimToken: null,
            claimedAt: null,
            leaseExpiresAt: null,
          },
        });
        if (claim.count !== 1) return false;
        await tx.videoResume.update({
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
            facePresenceRatio: null,
            cameraFacingRatioEstimate: null,
            headPoseIndicators: Prisma.JsonNull,
            postureIndicators: Prisma.JsonNull,
            communicationScore: null,
            clarityScore: null,
            confidenceScore: null,
            professionalism: null,
            speechDeliveryScore: null,
            contentStructureScore: null,
            strengths: Prisma.JsonNull,
            improvementSuggestions: res.lowConfidence ? ["The transcript may be inaccurate. Review the recording directly."] : [],
            modelName: body.modelName || "whisper-small",
            modelVersion: body.modelVersion || "1.0.0",
            workerVersion: body.workerVersion || "1.0.0",
            analysisVersion: body.analysisVersion || "v1",
            completedAt: now,
            analysisError: null,
          },
        });
        return true;
      });
      if (!applied) return NextResponse.json({ success: true, message: "Job already terminal (idempotent)" });
    } else {
      const applied = await prisma.$transaction(async (tx) => {
        const claim = await tx.videoAnalysisJob.updateMany({
          where: { id: body.jobId, videoResumeId: body.videoResumeId, status: "PROCESSING", claimToken: body.claimToken },
          data: {
            status: body.status,
            error: body.error || "Analysis failed",
            completedAt: now,
            claimToken: null,
            claimedAt: null,
            leaseExpiresAt: null,
          },
        });
        if (claim.count !== 1) return false;
        await tx.videoResume.update({
          where: { id: body.videoResumeId },
          data: {
            analysisStatus: body.status,
            analysisError: body.error || "Analysis processing failed",
          },
        });
        return true;
      });
      if (!applied) return NextResponse.json({ success: true, message: "Job already terminal (idempotent)" });
    }

    return NextResponse.json({ success: true, jobId: body.jobId, status: body.status });
  } catch (error) {
    return handleApiError(error);
  }
}
