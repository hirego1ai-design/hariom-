import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError, enforceRateLimit } from "@/lib/apiSecurity";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "typing_result_get", 60, 60000);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required", 403);
    const { id } = await params;
    const assessment = await prisma.typingAssessment.findFirst({
      where: { id, candidateProfile: { userId: session.id } },
      select: { id: true, wpm: true, accuracy: true, errorCount: true, durationSeconds: true, createdAt: true },
    });
    if (!assessment) throw new ApiError("Typing practice result not found", 404);
    return NextResponse.json({ success: true, assessment, mode: "SELF_REPORTED_PRACTICE" });
  } catch (error) {
    return handleApiError(error);
  }
}
