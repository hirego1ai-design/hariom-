import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";

const WARNING_LIMIT = 3;
const DUPLICATE_EVENT_WINDOW_MS = 5_000;
const schema = z.object({
  eventType: z.enum(["TAB_HIDDEN","FULLSCREEN_EXIT","CAMERA_INTERRUPTED","MIC_INTERRUPTED","MULTIPLE_FACE_SIGNAL","FACE_MISSING_SIGNAL"]),
  severity: z.enum(["INFO","WARNING","HIGH"]),
  evidence: z.record(z.string(), z.unknown()).optional(),
}).strict();

/**
 * Proctoring records observable browser/media events; it does not decide that a
 * candidate cheated. Three warning-worthy events produce warnings 1..3. A
 * subsequent warning-worthy event terminates the attempt, preserving evidence
 * for human review. Rapid duplicate browser events are stored only once.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(request, "recorded_assessment_proctoring");
    const session = await getCurrentSession(request.headers);
    if (!session || session.role !== "CANDIDATE") throw new ApiError("Candidate access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(request, schema);

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.recordedAssessmentAttempt.findFirst({
        where: { id, candidateProfile: { userId: session.id }, status: "IN_PROGRESS" },
        include: { jobListing: { select: { recordedAssessmentConfig: true } } },
      });
      if (!attempt) throw new ApiError("Active assessment attempt not found.", 404);
      if (!attempt.jobListing.recordedAssessmentConfig?.proctoringEnabled) {
        return { eventId: null, warningNumber: null, terminated: false, duplicate: false };
      }

      const duplicateAfter = new Date(Date.now() - DUPLICATE_EVENT_WINDOW_MS);
      const duplicate = await tx.recordedAssessmentProctoringEvent.findFirst({
        where: { attemptId: id, eventType: body.eventType, createdAt: { gte: duplicateAfter } },
        orderBy: { createdAt: "desc" },
        select: { id: true, warningNumber: true },
      });
      if (duplicate) {
        return { eventId: duplicate.id, warningNumber: duplicate.warningNumber, terminated: false, duplicate: true };
      }

      const priorWarnings = await tx.recordedAssessmentProctoringEvent.count({
        where: { attemptId: id, warningNumber: { not: null } },
      });
      const warningWorthy = body.severity !== "INFO";
      const terminated = warningWorthy && priorWarnings >= WARNING_LIMIT;
      const warningNumber = warningWorthy && !terminated ? priorWarnings + 1 : null;

      const event = await tx.recordedAssessmentProctoringEvent.create({
        data: {
          attemptId: id,
          eventType: body.eventType,
          severity: body.severity,
          evidence: body.evidence as Prisma.InputJsonValue | undefined,
          warningNumber,
        },
      });
      if (terminated) {
        const changed = await tx.recordedAssessmentAttempt.updateMany({
          where: { id, status: "IN_PROGRESS" },
          data: { status: "TERMINATED_PROCTORING", terminatedAt: new Date() },
        });
        if (changed.count !== 1) throw new ApiError("Assessment state changed; reload the attempt.", 409);
      }
      return { eventId: event.id, warningNumber, terminated, duplicate: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ success: true, ...result });
  } catch (error) { return handleApiError(error); }
}
