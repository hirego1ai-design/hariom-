import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { assertEmployerOwnsJob } from "@/lib/recordedAssessment";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "employer_recorded_assessment_attempts", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params;
    await assertEmployerOwnsJob(session.id, session.role, id);

    const { searchParams } = new URL(request.url);
    const requestedLimit = searchParams.get("limit");
    const requestedCursor = searchParams.get("cursor");
    const limit = requestedLimit === null ? DEFAULT_LIMIT : Number(requestedLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new ApiError(`limit must be an integer between 1 and ${MAX_LIMIT}.`, 400);
    }
    if (
      requestedCursor &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedCursor)
    ) {
      throw new ApiError("Invalid recorded-assessment cursor.", 400);
    }

    const attempts = await prisma.recordedAssessmentAttempt.findMany({
      where: { jobListingId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: requestedCursor ? { id: requestedCursor } : undefined,
      skip: requestedCursor ? 1 : 0,
      take: limit + 1,
      include: {
        candidateProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
        proctoringEvents: { orderBy: { createdAt: "asc" } },
        questions: { orderBy: { orderIndex: "asc" }, include: { response: { select: { id: true, durationSeconds: true, mediaType: true, analysisStatus: true, transcript: true, analysisResult: true, storedFile: { select: { mimeType: true } } } } } },
      },
    });
    const page = attempts.slice(0, limit);
    const nextCursor = attempts.length > limit ? page[page.length - 1]?.id || null : null;
    const reviewAttempts = page.map((attempt) => ({
      ...attempt,
      questions: attempt.questions.map((question) => ({
        ...question,
        response: question.response ? {
          ...question.response,
          mediaUrl: `/api/employer/recorded-assessment/responses/${question.response.id}/media`,
        } : null,
      })),
    }));
    return NextResponse.json({
      success: true,
      attempts: reviewAttempts,
      pagination: { limit, nextCursor, hasMore: nextCursor !== null },
    });
  } catch (error) { return handleApiError(error); }
}
