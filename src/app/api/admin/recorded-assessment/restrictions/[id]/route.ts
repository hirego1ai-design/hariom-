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

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REVOKE"]),
  reviewNote: z.string().trim().min(3).max(1000),
  expectedUpdatedAt: z.string().datetime(),
}).strict();

function addCalendarMonths(from: Date, months: number) {
  const targetMonth = from.getUTCMonth() + months;
  const targetYear = from.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      Math.min(from.getUTCDate(), lastDay),
      from.getUTCHours(),
      from.getUTCMinutes(),
      from.getUTCSeconds(),
      from.getUTCMilliseconds(),
    ),
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_assessment_restrictions_review:${admin.id}`, 30, 60_000);
    const { id } = await params;
    const body = await readValidatedJson(request, schema, 8 * 1024);

    const updated = await prisma.$transaction(async (tx) => {
      const restriction = await tx.recordedAssessmentRestriction.findUnique({
        where: { id },
      });
      if (!restriction) throw new ApiError("Restriction review not found.", 404);
      if (restriction.updatedAt.toISOString() !== body.expectedUpdatedAt) {
        throw new ApiError("Restriction changed; reload the review queue.", 409);
      }

      if (body.decision === "REVOKE") {
        if (restriction.status !== "ACTIVE") {
          throw new ApiError("Only an active restriction can be revoked.", 409);
        }
      } else if (restriction.status !== "PENDING_REVIEW") {
        throw new ApiError("This restriction proposal has already been reviewed.", 409);
      }

      const now = new Date();
      const status =
        body.decision === "APPROVE"
          ? "ACTIVE"
          : body.decision === "REJECT"
            ? "REJECTED"
            : "REVOKED";
      const expectedStatus = body.decision === "REVOKE" ? "ACTIVE" : "PENDING_REVIEW";

      const changed = await tx.recordedAssessmentRestriction.updateMany({
        where: {
          id,
          status: expectedStatus,
          updatedAt: restriction.updatedAt,
        },
        data: {
          status,
          reviewedById: admin.id,
          reviewedAt: now,
          reviewNote: body.reviewNote,
          suspendedUntil:
            status === "ACTIVE"
              ? addCalendarMonths(now, restriction.proposedMonths)
              : restriction.suspendedUntil,
        },
      });
      if (changed.count !== 1) {
        throw new ApiError(
          "This restriction changed while you were reviewing it. Reload the case.",
          409,
        );
      }

      const current = await tx.recordedAssessmentRestriction.findUniqueOrThrow({
        where: { id },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: `ASSESSMENT_RESTRICTION_${status}`,
          resource: `RecordedAssessmentRestriction:${id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            fromStatus: restriction.status,
            toStatus: status,
            proposedMonths: restriction.proposedMonths,
            reviewNoteRecorded: true,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);

      return current;
    });

    return NextResponse.json({ success: true, restriction: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
