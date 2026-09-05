import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";
import { getVideoAnalysisConfig } from "@/lib/env";
import { getWorkerDownloadUrl } from "@/lib/storage";
import crypto from "crypto";

const videoResumeSubmissionSchema = z.object({
  videoUrl: z.string().regex(/^\/api\/files\/[0-9a-f-]{36}$/i, "Video must be an uploaded HireGo file."),
  // Enforce exact 1..120 second boundary server-side
  durationSeconds: z.coerce.number().int().min(1).max(120, "Video duration cannot exceed 120 seconds."),
  transcript: z.string().max(30_000).optional(),
  analysis: z.unknown().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      include: {
        videoResumes: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            analysisJobs: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, videos: profile?.videoResumes ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);

    const body = await readValidatedJson(request, videoResumeSubmissionSchema);

    const fileId = body.videoUrl.slice("/api/files/".length);
    const file = await prisma.storedFile.findFirst({
      where: { id: fileId, ownerId: session.id, category: "video-resumes", deletedAt: null, mimeType: { in: ["video/mp4", "video/webm"] } },
      select: { id: true, objectKey: true },
    });
    if (!file) return jsonError("Upload a valid video resume before saving.", 409);

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: session.id },
      update: {},
      create: { userId: session.id },
    });

    const config = getVideoAnalysisConfig();
    const initialStatus = config.enabled ? "PENDING" : "BLOCKED_INFRA";

    const saved = await prisma.videoResume.create({
      data: {
        candidateProfileId: profile.id,
        videoUrl: body.videoUrl,
        durationSeconds: body.durationSeconds,
        transcript: body.transcript ?? null,
        analysisStatus: initialStatus,
        communicationScore: null,
        clarityScore: null,
        confidenceScore: null,
        professionalism: null,
      },
    });

    const idempotencyKey = `analysis-job-${saved.id}-${crypto.randomUUID()}`;
    const job = await prisma.videoAnalysisJob.create({
      data: {
        videoResumeId: saved.id,
        status: initialStatus,
        idempotencyKey,
        payload: {
          fileId: file.id,
          objectKey: file.objectKey,
          durationSeconds: body.durationSeconds,
          candidateUserId: session.id,
        },
      },
    });

    // Generate secure worker download URL (signed R2/S3 URL in production)
    const downloadUrl = await getWorkerDownloadUrl(file.objectKey);

    // Asynchronously dispatch to worker service if enabled
    if (config.enabled && config.workerUrl) {
      dispatchWorkerJob({
        jobId: job.id,
        videoResumeId: saved.id,
        fileId: file.id,
        objectKey: file.objectKey,
        downloadUrl,
        durationSeconds: body.durationSeconds,
        workerUrl: config.workerUrl,
        token: config.internalToken,
      }).catch((err) => {
        console.error("Worker dispatch error:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        videoId: saved.id,
        jobId: job.id,
        analysisStatus: saved.analysisStatus,
        video: saved,
      },
      { status: 202 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

async function dispatchWorkerJob(params: {
  jobId: string;
  videoResumeId: string;
  fileId: string;
  objectKey: string;
  downloadUrl: string | null;
  durationSeconds: number;
  workerUrl: string;
  token: string;
}) {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/internal/video-analysis/callback`;
    const res = await fetch(`${params.workerUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        jobId: params.jobId,
        videoResumeId: params.videoResumeId,
        fileId: params.fileId,
        objectKey: params.objectKey,
        downloadUrl: params.downloadUrl,
        claimedDurationSeconds: params.durationSeconds,
        callbackUrl,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Worker responded with status ${res.status}: ${txt}`);
      await prisma.$transaction([
        prisma.videoAnalysisJob.update({
          where: { id: params.jobId },
          data: { status: "BLOCKED_INFRA", error: `Worker error ${res.status}: ${txt}` },
        }),
        prisma.videoResume.update({
          where: { id: params.videoResumeId },
          data: { analysisStatus: "BLOCKED_INFRA", analysisError: "Worker service returned error" },
        }),
      ]).catch(() => undefined);
    }
  } catch (e) {
    console.error("Failed to reach video-analysis-worker:", e);
    await prisma.$transaction([
      prisma.videoAnalysisJob.update({
        where: { id: params.jobId },
        data: { status: "BLOCKED_INFRA", error: "Worker connection failed" },
      }),
      prisma.videoResume.update({
        where: { id: params.videoResumeId },
        data: { analysisStatus: "BLOCKED_INFRA", analysisError: "Worker service unavailable" },
      }),
    ]).catch(() => undefined);
  }
}
