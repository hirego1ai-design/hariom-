import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REVOKE"]),
  reviewNote: z.string().trim().min(3).max(1000),
}).strict();

function addCalendarMonths(from: Date, months: number) {
  // Clamp to the last valid day in the target month (Jan 31 + 1 month => Feb 28/29).
  const targetMonth = from.getUTCMonth() + months;
  const targetYear = from.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(from.getUTCDate(), lastDay), from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds(), from.getUTCMilliseconds()));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "assessment_restriction_review", 30);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "ADMIN") throw new ApiError("Administrator access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(request, schema);
    const restriction = await prisma.recordedAssessmentRestriction.findUnique({ where: { id } });
    if (!restriction) throw new ApiError("Restriction review not found.", 404);

    const now = new Date();
    if (body.decision === "REVOKE") {
      if (restriction.status !== "ACTIVE") throw new ApiError("Only an active restriction can be revoked.", 409);
    } else if (restriction.status !== "PENDING_REVIEW") {
      throw new ApiError("This restriction proposal has already been reviewed.", 409);
    }

    const status = body.decision === "APPROVE" ? "ACTIVE" : body.decision === "REJECT" ? "REJECTED" : "REVOKED";
    const expectedStatus = body.decision === "REVOKE" ? "ACTIVE" : "PENDING_REVIEW";
    const changed = await prisma.recordedAssessmentRestriction.updateMany({
      where: { id, status: expectedStatus },
      data: {
        status,
        reviewedById: session.id,
        reviewedAt: now,
        reviewNote: body.reviewNote,
        suspendedUntil: status === "ACTIVE" ? addCalendarMonths(now, restriction.proposedMonths) : restriction.suspendedUntil,
      },
    });
    if (changed.count !== 1) throw new ApiError("This restriction changed while you were reviewing it. Reload the case.", 409);
    const updated = await prisma.recordedAssessmentRestriction.findUnique({ where: { id } });
    if (!updated) throw new ApiError("Restriction review not found.", 404);
    await logAuditEvent({
      userId: session.id,
      action: `ASSESSMENT_RESTRICTION_${status}`,
      resource: `RecordedAssessmentRestriction:${id}`,
      details: `Candidate restriction review changed to ${status}; proposed duration ${restriction.proposedMonths} month(s).`,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    });
    return NextResponse.json({ success: true, restriction: updated });
  } catch (error) { return handleApiError(error); }
}
