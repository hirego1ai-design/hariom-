import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, getClientIp, handleApiError } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

/** Retiring removes a question from future selection only. Frozen attempts keep their snapshot. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_question_bank");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.recordedAssessmentQuestionBank.findUnique({
        where: { id },
        select: { id: true, questionKey: true, version: true, roleTitle: true, isActive: true },
      });
      if (!question) throw new ApiError("Question not found.", 404);
      if (!question.isActive) return { question, idempotent: true };

      const changed = await tx.recordedAssessmentQuestionBank.updateMany({
        where: { id, isActive: true },
        data: { isActive: false },
      });
      if (changed.count !== 1) {
        throw new ApiError("Question changed while it was being retired. Reload the bank and try again.", 409);
      }
      const retired = await tx.recordedAssessmentQuestionBank.findUniqueOrThrow({
        where: { id },
        select: { id: true, questionKey: true, version: true, roleTitle: true, isActive: true },
      });
      const auditLog = await tx.auditLog.create({
        data: {
          userId: session.id,
          action: "RECORDED_ASSESSMENT_QUESTION_RETIRED",
          resource: `RecordedAssessmentQuestionBank:${retired.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: `Retired ${retired.questionKey} version ${retired.version} for role ${retired.roleTitle}`,
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      return { question: retired, idempotent: false };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return handleApiError(error); }
}
