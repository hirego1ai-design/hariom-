import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { logAuditEvent } from "@/lib/auditLogger";
import { prisma } from "@/lib/prisma";

const appealSchema = z.object({ restrictionId: z.string().uuid(), appealNote: z.string().trim().min(20).max(2000) }).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const now = new Date();
    await prisma.recordedAssessmentRestriction.updateMany({ where: { userId: session.id, status: "ACTIVE", suspendedUntil: { lte: now } }, data: { status: "EXPIRED" } });
    const restrictions = await prisma.recordedAssessmentRestriction.findMany({
      where: { userId: session.id, status: { in: ["ACTIVE", "EXPIRED", "REVOKED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, reason: true, suspendedUntil: true, reviewedAt: true, appealNote: true, appealedAt: true, createdAt: true },
    });
    return NextResponse.json({ success: true, restrictions });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "assessment_restriction_appeal", 5);
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const body = await readValidatedJson(request, appealSchema);
    const restriction = await prisma.recordedAssessmentRestriction.findFirst({ where: { id: body.restrictionId, userId: session.id, status: "ACTIVE" } });
    if (!restriction) throw new ApiError("Active restriction not found.", 404);
    if (restriction.appealedAt) throw new ApiError("An appeal has already been submitted for this restriction.", 409);
    const updated = await prisma.recordedAssessmentRestriction.update({ where: { id: restriction.id }, data: { appealNote: body.appealNote, appealedAt: new Date() }, select: { id: true, status: true, suspendedUntil: true, appealedAt: true } });
    await logAuditEvent({ userId: session.id, action: "ASSESSMENT_RESTRICTION_APPEALED", resource: `RecordedAssessmentRestriction:${restriction.id}`, details: "Candidate submitted an appeal for an active recorded-assessment restriction." });
    return NextResponse.json({ success: true, restriction: updated });
  } catch (error) { return handleApiError(error); }
}
