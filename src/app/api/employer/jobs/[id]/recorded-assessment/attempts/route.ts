import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { assertEmployerOwnsJob } from "@/lib/recordedAssessment";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params; await assertEmployerOwnsJob(session.id, session.role, id);
    const attempts = await prisma.recordedAssessmentAttempt.findMany({
      where: { jobListingId: id },
      orderBy: { createdAt: "desc" },
      include: {
        candidateProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
        proctoringEvents: { orderBy: { createdAt: "asc" } },
        questions: { orderBy: { orderIndex: "asc" }, include: { response: { select: { id: true, durationSeconds: true, mediaType: true, analysisStatus: true, transcript: true, analysisResult: true, storedFile: { select: { mimeType: true } } } } } },
      },
    });
    const reviewAttempts = attempts.map((attempt) => ({
      ...attempt,
      questions: attempt.questions.map((question) => ({
        ...question,
        response: question.response ? {
          ...question.response,
          mediaUrl: `/api/employer/recorded-assessment/responses/${question.response.id}/media`,
        } : null,
      })),
    }));
    return NextResponse.json({ success: true, attempts: reviewAttempts });
  } catch (error) { return handleApiError(error); }
}
