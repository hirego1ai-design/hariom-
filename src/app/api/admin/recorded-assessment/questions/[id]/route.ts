import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

/** Retiring removes a question from future selection only. Frozen attempts keep their snapshot. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_question_bank");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
    const { id } = await params;
    const question = await prisma.recordedAssessmentQuestionBank.findUnique({ where: { id }, select: { id: true, questionKey: true, version: true, isActive: true } });
    if (!question) throw new ApiError("Question not found.", 404);
    if (!question.isActive) return NextResponse.json({ success: true, question, idempotent: true });
    const retired = await prisma.recordedAssessmentQuestionBank.update({ where: { id }, data: { isActive: false }, select: { id: true, questionKey: true, version: true, isActive: true } });
    return NextResponse.json({ success: true, question: retired });
  } catch (error) { return handleApiError(error); }
}
