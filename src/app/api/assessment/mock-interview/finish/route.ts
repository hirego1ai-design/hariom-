import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  handleApiError,
  readValidatedJson,
  ApiError,
  enforceRateLimit,
} from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/auditLogger";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import { buildMockInterviewPracticeReport } from "@/lib/mockInterview/MockInterviewReport";
import { LearningEventStore } from "@/lib/intelligence/LearningEventStore";

const mockInterviewFinishSchema = z.object({
  sessionId: z.string().uuid(),
}).strict();

function serializeReport(report: ReturnType<typeof buildMockInterviewPracticeReport>) {
  return {
    mode: "PRACTICE" as const,
    practiceScore: report.practiceScore,
    answeredTurns: report.answeredTurns,
    estimatedLevel: report.estimatedLevel,
    levelConfidence: report.levelConfidence,
    evidenceStatus: report.evidenceStatus,
    strengths: report.strengths,
    missingEvidence: report.missingEvidence,
    nextPracticePlan: report.nextPracticePlan,
    summary: report.summary,
  };
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "mock_interview_finish", 20, 60_000);
    const auth = await getCurrentSession(request.headers);
    if (!auth || auth.role !== "CANDIDATE") {
      throw new ApiError("Unauthorized", 401);
    }

    const body = await readValidatedJson(request, mockInterviewFinishSchema);

    const interviewSession = await prisma.mockInterviewSession.findUnique({
      where: { id: body.sessionId },
      include: {
        turns: { orderBy: { questionIndex: "asc" } },
        persona: true,
      },
    });

    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: auth.id },
      select: { id: true },
    });

    if (
      !interviewSession ||
      !candidateProfile ||
      interviewSession.candidateProfileId !== candidateProfile.id
    ) {
      throw new ApiError("Session not found", 404);
    }

    if (interviewSession.status === "ABANDONED") {
      throw new ApiError("An abandoned practice session cannot be completed.", 409);
    }

    const report = buildMockInterviewPracticeReport(
      interviewSession.turns,
      interviewSession.declaredSeniority,
    );
    const serialized = serializeReport(report);

    if (interviewSession.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        reused: true,
        report:
          interviewSession.finalReport &&
          typeof interviewSession.finalReport === "object"
            ? interviewSession.finalReport
            : serialized,
      });
    }

    const unanswered = interviewSession.turns.filter(
      (turn) => !turn.candidateAnswerTranscript?.trim(),
    );
    if (
      report.answeredTurns < Math.min(3, interviewSession.totalQuestions) ||
      unanswered.length > 0
    ) {
      throw new ApiError(
        "Complete the planned interview questions before generating the final practice report.",
        409,
      );
    }

    await prisma.mockInterviewSession.update({
      where: { id: interviewSession.id },
      data: {
        status: "COMPLETED",
        overallScore: report.practiceScore,
        communicationScore: null,
        technicalScore: null,
        integrityScore: null,
        estimatedLevel: report.estimatedLevel,
        levelConfidence: report.levelConfidence,
        missingEvidence: report.missingEvidence as Prisma.InputJsonValue,
        nextPracticePlan: report.nextPracticePlan as Prisma.InputJsonValue,
        finalReport: serialized as Prisma.InputJsonValue,
        aiFeedback: report.summary,
      },
    });

    await logAuditEvent({
      action: "MOCK_INTERVIEW_COMPLETED",
      userId: auth.id,
      resource: `interview_session_${interviewSession.id}`,
      details: `Completed adaptive practice session with ${report.answeredTurns} answered turns`,
    });

    void LearningEventStore.record({
      idempotencyKey: `mock-interview-finish:${interviewSession.id}`,
      correlationId: interviewSession.id,
      actorUserId: auth.id,
      actorRole: Role.CANDIDATE,
      channel: "WEB",
      feature: "MOCK_INTERVIEW",
      task: "SESSION_COMPLETED",
      evidenceRefs: {
        sessionId: interviewSession.id,
        roleTarget: interviewSession.roleTarget,
        declaredSeniority: interviewSession.declaredSeniority,
        roleFamily: interviewSession.roleFamily,
        personaVersion: interviewSession.personaVersion,
        answeredTurns: report.answeredTurns,
      },
      acceptedResult: serialized,
      outcome: {
        evidenceStatus: report.evidenceStatus,
        estimatedLevel: report.estimatedLevel,
        levelConfidence: report.levelConfidence,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      report: serialized,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
