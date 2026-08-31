import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, handleApiError, jsonError, readValidatedJson } from "@/lib";
import { prisma } from "@/lib/prisma";

const videoResumeSubmissionSchema = z.object({
  videoUrl: z.string().regex(/^\/api\/files\/[0-9a-f-]{36}$/i, "Video must be an uploaded HireGo file."),
  // Existing clients may submit form values as strings; coercion preserves the
  // prior contract while retaining the original 1–180 second boundary.
  durationSeconds: z.coerce.number().int().min(1).max(180),
  transcript: z.string().max(30_000).optional(),
  // Accepted only for backward compatibility with older clients. It is never
  // persisted: candidate-controlled data cannot be used as an assessment.
  analysis: z.unknown().optional(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);
    if (session.role !== "CANDIDATE") return jsonError("Candidate access required", 403);

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.id },
      include: { videoResumes: { orderBy: { createdAt: "desc" }, take: 10 } },
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
      select: { id: true },
    });
    if (!file) return jsonError("Upload a valid video resume before saving.", 409);

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: session.id },
      update: {},
      create: { userId: session.id },
    });

    const saved = await prisma.videoResume.create({
      data: {
        candidateProfileId: profile.id,
        videoUrl: body.videoUrl,
        durationSeconds: body.durationSeconds,
        transcript: body.transcript ?? null,
        communicationScore: null,
        clarityScore: null,
        confidenceScore: null,
        professionalism: null,
      },
    });

    return NextResponse.json({ success: true, video: saved, analysisStatus: "PENDING" }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
