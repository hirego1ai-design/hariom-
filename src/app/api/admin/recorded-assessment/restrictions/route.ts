import { NextRequest, NextResponse } from "next/server";
import { RecordedAssessmentRestrictionStatus } from "@prisma/client";
import { z } from "zod";
import { ApiError, enforceRateLimit, getClientIp, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";

const proposalSchema = z.object({
  userId: z.string().uuid(),
  attemptId: z.string().uuid(),
  proposedMonths: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason: z.string().trim().min(10).max(1000),
}).strict();

const querySchema = z.object({
  status: z.nativeEnum(RecordedAssessmentRestrictionStatus).default("PENDING_REVIEW"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_assessment_restrictions_read:${admin.id}`, 60, 60_000);
    const query = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const where = { status: query.status };

    const [total, restrictions] = await prisma.$transaction([
      prisma.recordedAssessmentRestriction.count({ where }),
      prisma.recordedAssessmentRestriction.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page: query.page,
      limit: query.limit,
      restrictions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_assessment_restriction_proposal:${admin.id}`, 20, 60_000);
    const body = await readValidatedJson(request, proposalSchema);

    const restriction = await prisma.$transaction(async (tx) => {
      const attempt = await tx.recordedAssessmentAttempt.findFirst({
        where: { id: body.attemptId, candidateProfile: { userId: body.userId } },
        include: { proctoringEvents: { orderBy: { createdAt: "asc" }, take: 100 } },
      });
      if (!attempt) throw new ApiError("Assessment attempt does not belong to this candidate.", 404);
      if (!attempt.proctoringEvents.length) {
        throw new ApiError("Restriction proposals require preserved proctoring evidence.", 409);
      }

      const existing = await tx.recordedAssessmentRestriction.findFirst({
        where: {
          userId: body.userId,
          attemptId: body.attemptId,
          status: { in: ["PENDING_REVIEW", "ACTIVE"] },
        },
        select: { id: true },
      });
      if (existing) {
        throw new ApiError("This assessment already has an open restriction review.", 409);
      }

      const created = await tx.recordedAssessmentRestriction.create({
        data: {
          ...body,
          status: "PENDING_REVIEW",
          evidence: {
            attemptStatus: attempt.status,
            events: attempt.proctoringEvents.map((event) => ({
              id: event.id,
              type: event.eventType,
              severity: event.severity,
              warningNumber: event.warningNumber,
              evidence: event.evidence,
              createdAt: event.createdAt,
            })),
          },
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "ASSESSMENT_RESTRICTION_PROPOSED",
          resource: `RecordedAssessmentRestriction:${created.id}`,
          ipAddress: getClientIp(request) || "unknown",
          details: JSON.stringify({
            attemptId: body.attemptId,
            userId: body.userId,
            proposedMonths: body.proposedMonths,
            reason: body.reason,
          }),
        },
      });
      await enqueueSecurityAuditEvent(tx, auditLog, admin.id);
      return created;
    });

    return NextResponse.json({ success: true, restriction }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
