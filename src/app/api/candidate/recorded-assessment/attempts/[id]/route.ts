import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_attempt_get", 60, 60_000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id, candidateProfile: { userId: session.id } },
      include: { questions: { orderBy: { orderIndex: "asc" }, include: { response: true } } },
    });
    if (!attempt) throw new ApiError("Assessment attempt not found.", 404);
    const safeAttempt = { ...attempt, questions: attempt.questions.map(({ response, ...question }) => ({ ...question, response: response ? { id: response.id, durationSeconds: response.durationSeconds, mediaType: response.mediaType, analysisStatus: response.analysisStatus } : null })) };
    return NextResponse.json({ success: true, attempt: safeAttempt });
  } catch (error) { return handleApiError(error); }
}
