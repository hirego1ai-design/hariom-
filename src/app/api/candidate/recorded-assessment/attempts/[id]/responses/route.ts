import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { dispatchRecordedAssessmentAnalysis, enqueueRecordedAssessmentAnalysis } from "@/lib/recordedAssessmentAnalysis";

const schema = z.object({
  attemptQuestionId: z.string().uuid(),
  storedFileId: z.string().uuid(),
  durationSeconds: z.number().int().min(1).max(60),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_response");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(request, schema);

    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id, candidateProfile: { userId: session.id }, status: "IN_PROGRESS" },
      include: { questions: { select: { id: true, answerDurationSeconds: true } } },
    });
    if (!attempt) throw new ApiError("Active assessment attempt not found.", 404);
    const question = attempt.questions.find((q) => q.id === body.attemptQuestionId);
    if (!question) throw new ApiError("Question does not belong to this attempt.", 403);
    if (body.durationSeconds > question.answerDurationSeconds) throw new ApiError("Recorded answer exceeds the configured question duration.", 400);

    const file = await prisma.storedFile.findFirst({
      where: {
        id: body.storedFileId,
        ownerId: session.id,
        category: "assessment-media",
        deletedAt: null,
        scanStatus: "CLEAN",
      },
      select: { id: true, mimeType: true },
    });
    if (!file) throw new ApiError("Assessment media is unavailable until its security scan is CLEAN.", 423);
    const expectedPrefix = attempt.mediaType === "VIDEO" ? "video/" : "audio/";
    if (!file.mimeType.startsWith(expectedPrefix)) throw new ApiError("Uploaded media does not match this assessment mode.", 415);

    const existing = await prisma.recordedAssessmentResponse.findUnique({ where: { attemptQuestionId: question.id } });
    if (existing) {
      if (existing.storedFileId !== file.id) throw new ApiError("This question already has a saved response.", 409);
      return NextResponse.json({ success: true, response: { id: existing.id, durationSeconds: existing.durationSeconds, mediaType: existing.mediaType, analysisStatus: existing.analysisStatus }, idempotent: true });
    }
    let response;
    try {
      response = await prisma.recordedAssessmentResponse.create({
        data: { attemptQuestionId: question.id, storedFileId: file.id, durationSeconds: body.durationSeconds, mediaType: attempt.mediaType },
      });
    } catch (error) {
      // Two retries may pass the read above concurrently. The DB uniqueness rule is
      // authoritative: return the winner only when it persisted the same media.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const winner = await prisma.recordedAssessmentResponse.findUnique({ where: { attemptQuestionId: question.id } });
      if (!winner || winner.storedFileId !== file.id) throw new ApiError("This question already has a saved response.", 409);
      return NextResponse.json({ success: true, response: { id: winner.id, durationSeconds: winner.durationSeconds, mediaType: winner.mediaType, analysisStatus: winner.analysisStatus }, idempotent: true });
    }
    // Persist the recovery job before returning success. Serverless runtimes may
    // freeze immediately after the response, so fire-and-forget alone is unsafe.
    await enqueueRecordedAssessmentAnalysis(response.id);
    // Worker execution remains asynchronous enrichment; dispatch failure must not
    // make a persisted answer look lost or trigger a duplicate recording attempt.
    void dispatchRecordedAssessmentAnalysis(response.id).catch((error) => {
      console.error("Recorded assessment analysis dispatch failed after response persistence", { responseId: response.id, error });
    });
    return NextResponse.json({ success: true, response: { id: response.id, durationSeconds: response.durationSeconds, mediaType: response.mediaType, analysisStatus: response.analysisStatus } });
  } catch (error) { return handleApiError(error); }
}
