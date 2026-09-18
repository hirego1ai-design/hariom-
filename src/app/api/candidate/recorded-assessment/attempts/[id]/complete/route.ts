import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_complete");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id, candidateProfile: { userId: session.id }, status: { in: ["CREATED", "IN_PROGRESS"] } },
      include: { questions: { select: { id: true, response: { select: { id: true } } } } },
    });
    if (!attempt) throw new ApiError("Active assessment attempt not found.", 404);
    if (attempt.questions.length === 0 || attempt.questions.some((q) => !q.response)) throw new ApiError("Every assessment question must have a saved response before completion.", 409);
    const result = await prisma.recordedAssessmentAttempt.updateMany({
      where: { id: attempt.id, status: { in: ["CREATED", "IN_PROGRESS"] } },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    if (result.count !== 1) throw new ApiError("Assessment state changed; reload the attempt.", 409);
    return NextResponse.json({ success: true, status: "COMPLETED" });
  } catch (error) { return handleApiError(error); }
}
