import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

const videoAnalysisSchema = {
  communicationScore: "communicationScore",
  clarityScore: "clarityScore",
  confidenceScore: "confidenceScore",
  professionalismScore: "professionalismScore",
};

export async function GET(request: NextRequest) {
  try {
    const session = getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);

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
    const session = getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const body = await request.json();
    const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
    const durationSeconds = Math.max(1, Math.min(180, Number(body.durationSeconds) || 0));

    if (!videoUrl || !durationSeconds) {
      return jsonError("videoUrl and durationSeconds are required", 400);
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: session.id },
      update: {},
      create: { userId: session.id },
    });

    const analysis = body.analysis && typeof body.analysis === "object" ? body.analysis : {};
    const saved = await prisma.videoResume.create({
      data: {
        candidateProfileId: profile.id,
        videoUrl,
        durationSeconds,
        transcript: typeof body.transcript === "string" ? body.transcript : null,
        communicationScore: Number(analysis[videoAnalysisSchema.communicationScore]) || 0,
        clarityScore: Number(analysis[videoAnalysisSchema.clarityScore]) || 0,
        confidenceScore: Number(analysis[videoAnalysisSchema.confidenceScore]) || 0,
        professionalism: Number(analysis[videoAnalysisSchema.professionalismScore]) || 0,
      },
    });

    return NextResponse.json({ success: true, video: saved }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
