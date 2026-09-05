import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, handleApiError, jsonError } from "@/lib";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session) return jsonError("Unauthorized access", 401);

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    if (!videoId) return jsonError("videoId parameter is required", 400);

    const videoResume = await prisma.videoResume.findUnique({
      where: { id: videoId },
      include: {
        candidateProfile: { select: { id: true, userId: true } },
        analysisJobs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!videoResume) return jsonError("Video resume not found", 404);

    // Authorization checks
    if (session.role === "CANDIDATE") {
      if (videoResume.candidateProfile.userId !== session.id) {
        return jsonError("Forbidden: Access denied to other candidate's video resume", 403);
      }
    } else if (session.role === "EMPLOYER" || session.role === "RECRUITER") {
      const employer = await prisma.employerProfile.findUnique({
        where: { userId: session.id },
        select: { companyId: true },
      });
      if (!employer?.companyId) return jsonError("Forbidden: Employer profile not found", 403);

      const hasApplication = await prisma.application.findFirst({
        where: {
          candidateProfileId: videoResume.candidateProfileId,
          job: { companyId: employer.companyId },
        },
        select: { id: true },
      });
      if (!hasApplication) {
        return jsonError("Forbidden: Candidate has not applied to your company", 403);
      }
    } else if (session.role !== "ADMIN") {
      return jsonError("Forbidden: Invalid role", 403);
    }

    const latestJob = videoResume.analysisJobs[0] || null;

    return NextResponse.json({
      success: true,
      videoId: videoResume.id,
      analysisStatus: videoResume.analysisStatus,
      durationSeconds: videoResume.durationSeconds,
      transcript: videoResume.transcript,
      scores: {
        communicationScore: videoResume.communicationScore,
        clarityScore: videoResume.clarityScore,
        confidenceScore: videoResume.confidenceScore,
        professionalism: videoResume.professionalism,
        speechDeliveryScore: videoResume.speechDeliveryScore,
        contentStructureScore: videoResume.contentStructureScore,
      },
      metrics: {
        detectedLanguage: videoResume.detectedLanguage,
        wordsPerMinute: videoResume.wordsPerMinute,
        pauseRatio: videoResume.pauseRatio,
        fillerWordCount: videoResume.fillerWordCount,
        transcriptConfidence: videoResume.transcriptConfidence,
        lowConfidence: videoResume.lowConfidence,
        audioQuality: videoResume.audioQuality,
        facePresenceRatio: videoResume.facePresenceRatio,
        cameraFacingRatioEstimate: videoResume.cameraFacingRatioEstimate,
        headPoseIndicators: videoResume.headPoseIndicators,
        postureIndicators: videoResume.postureIndicators,
      },
      insights: {
        strengths: videoResume.strengths,
        improvementSuggestions: videoResume.improvementSuggestions,
      },
      modelInfo: {
        analysisVersion: videoResume.analysisVersion,
        workerVersion: videoResume.workerVersion,
        modelName: videoResume.modelName,
        modelVersion: videoResume.modelVersion,
      },
      job: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            attempts: latestJob.attempts,
            error: latestJob.error,
          }
        : null,
      error: videoResume.analysisError,
      completedAt: videoResume.completedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
