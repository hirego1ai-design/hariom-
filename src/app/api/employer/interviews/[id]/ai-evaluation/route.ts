import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
} from "@/lib/apiSecurity";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import { prisma } from "@/lib/prisma";
import { createTenantContext } from "@/lib/security/TenantContext";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";
import { ExecutionLoop } from "@/lib/agents/ExecutionLoop";
import {
  reconcileCopilotReservation,
  releaseCopilotReservation,
  reserveCopilotCapacityIfActive,
} from "@/lib/copilot/capacity";

export const dynamic = "force-dynamic";

async function authorize(request: NextRequest, interviewId: string) {
  const session = await requireEmployerOrAdminSession(request);
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: { select: { id: true, companyId: true } },
          candidateProfile: { select: { id: true } },
        },
      },
      aiEvaluation: true,
    },
  });
  if (!interview) throw new ApiError("Interview not found.", 404);
  if (session.role !== "ADMIN") {
    const company = await getSessionCompany(session);
    if (company.id !== interview.application.job.companyId) {
      throw new ApiError("Interview access denied.", 403);
    }
  }
  return { session, interview };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { interview } = await authorize(request, id);
    return NextResponse.json(
      {
        success: true,
        evaluation: interview.aiEvaluation,
        transcript: interview.transcript
          ? {
              available: true,
              provider: interview.transcriptProvider,
              model: interview.transcriptModel,
              version: interview.transcriptVersion,
              confidence: interview.transcriptConfidence,
            }
          : { available: false },
        policy: {
          advisoryOnly: true,
          automaticSelection: false,
          automaticRejection: false,
          humanDecisionRequired: true,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, interview } = await authorize(request, id);
    await enforceRateLimit(
      request,
      `live_interview_ai_evaluation:${session.id}`,
      10,
      60_000,
    );

    if (interview.aiEvaluation) {
      return NextResponse.json({
        success: true,
        evaluation: interview.aiEvaluation,
        idempotent: true,
      });
    }
    if (!["COMPLETED", "FEEDBACK_SUBMITTED"].includes(interview.status)) {
      throw new ApiError("Complete the interview before requesting AI evaluation.", 409);
    }
    if (!interview.transcript || interview.transcript.trim().length < 40) {
      throw new ApiError(
        "A finalized live interview transcript is required before answer-based evaluation.",
        409,
      );
    }
    if (
      interview.transcriptConfidence !== null &&
      interview.transcriptConfidence < 0.45
    ) {
      throw new ApiError(
        "Transcript confidence is too low for AI evaluation. Review or re-transcribe the interview first.",
        409,
      );
    }

    const companyId = interview.application.job.companyId;
    const tenantContext = createTenantContext(
      session.role === "ADMIN" ? null : companyId,
      session.id,
      session.role as Role,
    );
    const correlationId = `live-interview-evaluation:${interview.id}`;
    let workflow = await prisma.workflowInstance.findUnique({
      where: { correlationId },
    });

    if (!workflow) {
      try {
        workflow = await WorkflowEngine.startWorkflow({
          workflowType: "VIRTUAL_INTERVIEW",
          companyId,
          jobId: interview.application.job.id,
          candidateId: interview.application.candidateProfile.id,
          applicationId: interview.applicationId,
          correlationId,
          initiatedBy: session.id,
          initialStep: "TRANSCRIPT_EVALUATION",
          checkpointState: {
            mode: "ADVISORY_ONLY",
            interviewId: interview.id,
            transcriptProvider: interview.transcriptProvider,
            transcriptModel: interview.transcriptModel,
            transcriptVersion: interview.transcriptVersion,
          },
          context: tenantContext,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          workflow = await prisma.workflowInstance.findUnique({
            where: { correlationId },
          });
          if (!workflow) throw error;
        } else {
          throw error;
        }
      }
    } else if (workflow.status === "FAILED") {
      workflow = await WorkflowEngine.retryWorkflow({
        workflowId: workflow.id,
        context: tenantContext,
      });
    }

    if (
      workflow.applicationId !== interview.applicationId ||
      workflow.companyId !== companyId
    ) {
      throw new ApiError("Interview evaluation workflow does not match this application.", 409);
    }
    if (workflow.status === "COMPLETED") {
      const existing = await prisma.interviewEvaluation.findUnique({
        where: { interviewId: interview.id },
      });
      if (!existing) {
        throw new ApiError(
          "Evaluation workflow completed without a persisted evaluation. Operator reconciliation is required.",
          503,
        );
      }
      return NextResponse.json({ success: true, evaluation: existing, idempotent: true });
    }
    if (workflow.status !== "RUNNING") {
      throw new ApiError(
        `Interview evaluation workflow cannot run while status is ${workflow.status}.`,
        409,
      );
    }

    const attemptNumber = Math.min(3, workflow.failureCount + 1);
    const executionId = `${workflow.id}:live-interview-evaluator:${attemptNumber}:${crypto.randomUUID()}`;
    const copilotReservation = await reserveCopilotCapacityIfActive({
      companyId,
      actionKey: "INTERVIEW_REPORT",
      quantity: 1,
      idempotencyKey: `live-interview:${interview.id}:ai-report`,
      reference: {
        interviewId: interview.id,
        applicationId: interview.applicationId,
        candidateId: interview.application.candidateProfile.id,
        jobId: interview.application.job.id,
      },
    });

    let result: unknown;
    try {
      result = await WorkflowEngine.executeStep(
        workflow.id,
        "TRANSCRIPT_EVALUATION",
        attemptNumber,
        { interviewId: interview.id },
        () =>
          ExecutionLoop.runTask({
            agentId: "live-interview-evaluator",
            taskInput: { interviewId: interview.id },
            context: {
              tenantContext,
              correlationId,
              executionId,
              agentId: "live-interview-evaluator",
              workflowId: workflow!.id,
              workflowStep: "TRANSCRIPT_EVALUATION",
            },
            companyId,
            estimatedSpendMinor: BigInt(10_000),
          }),
      );
    } catch (executionError) {
      if (copilotReservation) {
        await releaseCopilotReservation(copilotReservation.id).catch(() => undefined);
      }
      throw executionError;
    }

    const output = result as Record<string, unknown>;
    if (copilotReservation) {
      // The paid model call already happened. Consume plan capacity before
      // downstream presentation/schema work so a later UI/data error cannot
      // make a real AI cost disappear from the usage ledger.
      await reconcileCopilotReservation({
        reservationId: copilotReservation.id,
        actualQuantity: 1,
        provider: typeof output.provider === "string" ? output.provider : undefined,
        model: typeof output.model === "string" ? output.model : undefined,
        metadata: { workflowId: workflow.id, executionId },
      });
    }
    const score = (key: string) => {
      const value = output[key];
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
        throw new ApiError("Agent evaluation output failed server validation.", 502);
      }
      return value;
    };
    const strings = (key: string) => {
      const value = output[key];
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw new ApiError("Agent evaluation output failed server validation.", 502);
      }
      return value.slice(0, 20) as string[];
    };
    const recommendation = output.recommendation;
    if (
      !["PROCEED_RECOMMENDED", "HOLD_FOR_REVIEW", "INSUFFICIENT_EVIDENCE"].includes(
        String(recommendation),
      )
    ) {
      throw new ApiError("Agent evaluation recommendation failed validation.", 502);
    }
    if (typeof output.summary !== "string" || !output.summary.trim()) {
      throw new ApiError("Agent evaluation summary failed validation.", 502);
    }

    const evaluation = await prisma.interviewEvaluation.upsert({
      where: { interviewId: interview.id },
      update: {},
      create: {
        interviewId: interview.id,
        overallScore: score("overallScore"),
        technicalScore: score("technicalScore"),
        communicationScore: score("communicationScore"),
        problemSolvingScore: score("problemSolvingScore"),
        evidenceConfidence: score("evidenceConfidence"),
        recommendation: String(recommendation),
        strengths: strings("strengths") as Prisma.InputJsonValue,
        concerns: strings("concerns") as Prisma.InputJsonValue,
        summary: output.summary.trim().slice(0, 5_000),
        provider: typeof output.provider === "string" ? output.provider : null,
        model: typeof output.model === "string" ? output.model : null,
        schemaVersion: "1.0",
      },
    });

    await WorkflowEngine.completeWorkflow({
      workflowId: workflow.id,
      context: tenantContext,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        companyId,
        action: "LIVE_INTERVIEW_AI_EVALUATED",
        resource: `Interview:${interview.id}`,
        details: JSON.stringify({
          evaluationId: evaluation.id,
          recommendation: evaluation.recommendation,
          evidenceConfidence: evaluation.evidenceConfidence,
          automaticSelection: false,
          automaticRejection: false,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        evaluation,
        idempotent: false,
        policy: {
          advisoryOnly: true,
          automaticSelection: false,
          automaticRejection: false,
          humanDecisionRequired: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
