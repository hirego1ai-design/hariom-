import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  eventType: z.enum(["TAB_HIDDEN","FULLSCREEN_EXIT","CAMERA_INTERRUPTED","MIC_INTERRUPTED","MULTIPLE_FACE_SIGNAL","FACE_MISSING_SIGNAL"]),
  severity: z.enum(["INFO","WARNING","HIGH"]),
  evidence: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_proctoring");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params; const body = await readValidatedJson(request, schema);
    const attempt = await prisma.recordedAssessmentAttempt.findFirst({ where: { id, candidateProfile: { userId: session.id }, status: { in: ["CREATED","IN_PROGRESS"] } }, include: { jobListing: { select: { recordedAssessmentConfig: true } } } });
    if (!attempt) throw new ApiError("Active assessment attempt not found.", 404);
    if (!attempt.jobListing.recordedAssessmentConfig?.proctoringEnabled) return NextResponse.json({ success: true, warningNumber: null, terminated: false });
    const priorWarnings = await prisma.recordedAssessmentProctoringEvent.count({ where: { attemptId: id, warningNumber: { not: null } } });
    const warningNumber = body.severity === "INFO" ? null : Math.min(3, priorWarnings + 1);
    const terminated = warningNumber === 3;
    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.recordedAssessmentProctoringEvent.create({ data: { attemptId: id, eventType: body.eventType, severity: body.severity, evidence: body.evidence as Prisma.InputJsonValue | undefined, warningNumber } });
      if (terminated) await tx.recordedAssessmentAttempt.updateMany({ where: { id, status: { in: ["CREATED","IN_PROGRESS"] } }, data: { status: "TERMINATED_PROCTORING", terminatedAt: new Date() } });
      return created;
    });
    return NextResponse.json({ success: true, eventId: event.id, warningNumber, terminated });
  } catch (error) { return handleApiError(error); }
}
