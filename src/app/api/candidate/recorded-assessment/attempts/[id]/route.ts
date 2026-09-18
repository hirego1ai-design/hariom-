import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id, candidateProfile: { userId: session.id } },
      include: { questions: { orderBy: { orderIndex: "asc" }, include: { response: true } } },
    });
    if (!attempt) throw new ApiError("Assessment attempt not found.", 404);
    return NextResponse.json({ success: true, attempt });
  } catch (error) { return handleApiError(error); }
}
