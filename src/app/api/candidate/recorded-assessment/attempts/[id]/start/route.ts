import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

/**
 * Starts a frozen recorded-assessment attempt.
 * Kept separate from answer submission so the server owns the lifecycle and a
 * refresh cannot accidentally create a second "start" while saving an answer.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_start");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id, candidateProfile: { userId: session.id } },
      select: { id: true, status: true, startedAt: true },
    });
    if (!attempt) throw new ApiError("Assessment attempt not found.", 404);
    if (attempt.status === "IN_PROGRESS") return NextResponse.json({ success: true, status: attempt.status, startedAt: attempt.startedAt });
    if (attempt.status !== "CREATED") throw new ApiError("This assessment attempt can no longer be started.", 409);
    const startedAt = new Date();
    const changed = await prisma.recordedAssessmentAttempt.updateMany({ where: { id, status: "CREATED" }, data: { status: "IN_PROGRESS", startedAt } });
    if (changed.count !== 1) throw new ApiError("Assessment state changed; reload the attempt.", 409);
    return NextResponse.json({ success: true, status: "IN_PROGRESS", startedAt });
  } catch (error) { return handleApiError(error); }
}
