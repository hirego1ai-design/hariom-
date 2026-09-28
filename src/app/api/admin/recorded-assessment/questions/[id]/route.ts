import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  enforceRateLimit,
  getClientIp,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const retireSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

/** Retiring removes a question from future selection only. Frozen attempts keep their snapshot. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_recorded_question_bank_write:${admin.id}`, 20, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, retireSchema, 8 * 1024);

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.recordedAssessmentQuestionBank.findUnique({
        where: { id },
        select: {
          id: true,
          questionKey: true,
          version: true,
          roleTitle: true,
          isActive: true,
          updatedAt: true,
        },
      });
      if (!question) throw new ApiError("Question not found.", 404);
      if (!question.isActive) return { question, idempotent: true };
      if (question.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Question changed; reload the role bank before retiring it.", 409);
      }

      const changed = await tx.recordedAssessmentQuestionBank.updateMany({
        where: { id, isActive: true, updatedAt: question.updatedAt },
        data: { isActive: false },
      });
      if (changed.count !== 1) {
        throw new ApiError(
          "Question changed while it was being retired. Reload the bank and try again.",
          409,
        );
      }

      const retired = await tx.recordedAssessmentQuestionBank.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          questionKey: true,
          version: true,
          roleTitle: true,
          isActive: true,
          updatedAt: true,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "RECORDED_ASSESSMENT_QUESTION_RETIRED",
          resource: `RecordedAssessmentQuestionBank:${retired.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            questionKey: retired.questionKey,
            version: retired.version,
            roleTitle: retired.roleTitle,
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return { question: retired, idempotent: false };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
