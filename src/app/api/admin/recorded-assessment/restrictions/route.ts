import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RecordedAssessmentRestrictionStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { prisma } from "@/lib/prisma";

const proposalSchema = z.object({
  userId: z.string().uuid(),
  attemptId: z.string().uuid(),
  proposedMonths: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason: z.string().trim().min(10).max(1000),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
    const statusParam = request.nextUrl.searchParams.get("status") || "PENDING_REVIEW";
    if (!Object.values(RecordedAssessmentRestrictionStatus).includes(statusParam as RecordedAssessmentRestrictionStatus)) throw new ApiError("Invalid restriction status.", 400);
    const status = statusParam as RecordedAssessmentRestrictionStatus;
    const restrictions = await prisma.recordedAssessmentRestriction.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ success: true, restrictions });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "assessment_restriction_proposal", 20);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
    const body = await readValidatedJson(request, proposalSchema);
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({
      where: { id: body.attemptId, candidateProfile: { userId: body.userId } },
      include: { proctoringEvents: { orderBy: { createdAt: "asc" }, take: 100 } },
    });
    if (!attempt) throw new ApiError("Assessment attempt does not belong to this candidate.", 404);
    if (!attempt.proctoringEvents.length) throw new ApiError("Restriction proposals require preserved proctoring evidence.", 409);
    const existing = await prisma.recordedAssessmentRestriction.findFirst({
      where: { userId: body.userId, attemptId: body.attemptId, status: { in: ["PENDING_REVIEW","ACTIVE"] } },
      select: { id: true },
    });
    if (existing) throw new ApiError("This assessment already has an open restriction review.", 409);
    const restriction = await prisma.recordedAssessmentRestriction.create({
      data: {
        ...body,
        status: "PENDING_REVIEW",
        evidence: {
          attemptStatus: attempt.status,
          events: attempt.proctoringEvents.map((event) => ({ id: event.id, type: event.eventType, severity: event.severity, warningNumber: event.warningNumber, evidence: event.evidence, createdAt: event.createdAt })),
        },
      },
    });
    await logAuditEvent({ userId: session.id, action: "ASSESSMENT_RESTRICTION_PROPOSED", resource: `RecordedAssessmentRestriction:${restriction.id}`, details: `Created human-review proposal for assessment attempt ${body.attemptId}; proposed duration ${body.proposedMonths} month(s).` });
    return NextResponse.json({ success: true, restriction }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
