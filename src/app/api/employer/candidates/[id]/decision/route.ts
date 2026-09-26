import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  readValidatedJson,
} from "@/lib/apiSecurity";
import {
  getSessionCompany,
  requireEmployerOrAdminSession,
} from "@/lib/routeAuthorization";
import { createTenantContext } from "@/lib/security/TenantContext";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";

const schema = z.object({
  action: z.literal("REJECT"),
  reason: z.string().trim().min(10).max(2000),
  approvalId: z.string().uuid().optional(),
  workflowId: z.string().uuid().optional(),
  confirmApproval: z.boolean().optional(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireEmployerOrAdminSession(request);
    await enforceRateLimit(
      request,
      `candidate_rejection_decision:${session.id}`,
      20,
      60_000,
    );

    const { id: applicationId } = await params;
    const body = await readValidatedJson(request, schema, 8 * 1024);

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, companyId: true, title: true } },
        candidateProfile: { select: { id: true } },
        gates: {
          select: { type: true, status: true, assessmentId: true },
        },
      },
    });
    if (!application) throw new ApiError("Candidate application not found.", 404);

    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== application.job.companyId) {
        throw new ApiError("Candidate is not in your company pipeline.", 403);
      }
    }

    if (application.status === "REJECTED") {
      return NextResponse.json({
        success: true,
        applicationId,
        status: "REJECTED",
        idempotent: true,
      });
    }
    if (["HIRED", "WITHDRAWN"].includes(application.status)) {
      throw new ApiError(
        "This application is already in a terminal state and cannot be rejected.",
        409,
      );
    }

    const pendingValidation = application.gates.find((gate) =>
      ["REQUIRED", "IN_PROGRESS"].includes(gate.status),
    );
    if (pendingValidation) {
      throw new ApiError(
        "Required candidate evidence is still pending. Do not reject because evidence is missing; complete or reconcile the required assessment first.",
        409,
      );
    }

    const tenantContext = createTenantContext(
      session.role === "ADMIN" ? null : application.job.companyId,
      session.id,
      session.role as Role,
    );
    const expectedAction = {
      applicationId,
      candidateProfileId: application.candidateProfile.id,
      jobId: application.job.id,
      action: "REJECT" as const,
      reason: body.reason,
    };
    const correlationId = `application-rejection:${applicationId}`;

    let workflow = await prisma.workflowInstance.findUnique({
      where: { correlationId },
    });
    if (!workflow) {
      workflow = await WorkflowEngine.startWorkflow({
        workflowType: "SELECTION_REJECTION",
        companyId: application.job.companyId,
        jobId: application.job.id,
        candidateId: application.candidateProfile.id,
        applicationId,
        correlationId,
        initiatedBy: session.id,
        initialStep: "SCREENING_REJECTION",
        checkpointState: {
          source: "managed-hiring-candidate-tracking",
          reason: body.reason,
        },
        context: tenantContext,
      });
    }

    const checkpoint =
      workflow.checkpointState &&
      typeof workflow.checkpointState === "object" &&
      !Array.isArray(workflow.checkpointState)
        ? (workflow.checkpointState as Record<string, unknown>)
        : {};
    if (
      typeof checkpoint.reason === "string" &&
      checkpoint.reason !== body.reason
    ) {
      throw new ApiError(
        "The persisted rejection approval was created for a different reason. Reconcile or revoke that approval before changing the rejection reason.",
        409,
      );
    }

    if (
      workflow.applicationId !== applicationId ||
      workflow.companyId !== application.job.companyId
    ) {
      throw new ApiError(
        "Existing rejection workflow does not match this candidate application.",
        409,
      );
    }
    if (!["RUNNING", "PAUSED_FOR_APPROVAL"].includes(workflow.status)) {
      throw new ApiError(
        "Existing rejection workflow requires reconciliation before another rejection decision.",
        409,
      );
    }

    if (!body.approvalId || !body.workflowId) {
      let approval = await prisma.workflowApproval.findFirst({
        where: {
          workflowInstanceId: workflow.id,
          actionType: "CANDIDATE_REJECTION",
          decision: { in: ["PENDING", "APPROVED"] },
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { requestedAt: "desc" },
      });

      if (!approval) {
        if (workflow.status !== "RUNNING") {
          throw new ApiError(
            "Rejection workflow is paused without an active approval request.",
            409,
          );
        }
        const requested = await WorkflowEngine.requestConsequentialAction({
          workflowId: workflow.id,
          stepName: "SCREENING_REJECTION",
          actionType: "CANDIDATE_REJECTION",
          action: expectedAction,
          context: tenantContext,
        });
        approval = await prisma.workflowApproval.findUnique({
          where: { id: requested.approvalId },
        });
      }

      if (!approval) {
        throw new ApiError(
          "Unable to persist candidate-rejection approval request.",
          500,
        );
      }

      return NextResponse.json(
        {
          success: true,
          action: "REJECT",
          requiresConfirmation: true,
          approvalId: approval.id,
          workflowId: workflow.id,
          applicationId,
          message:
            "Human rejection approval has been persisted. Confirm once more to execute this consequential action.",
        },
        { status: 202 },
      );
    }

    if (body.workflowId !== workflow.id) {
      throw new ApiError("Rejection workflow does not match this application.", 409);
    }

    let approval = await WorkflowEngine.getApprovalDetails({
      approvalId: body.approvalId,
      context: tenantContext,
    });
    if (
      approval.workflowInstanceId !== workflow.id ||
      approval.actionType !== "CANDIDATE_REJECTION" ||
      approval.consumedAt ||
      approval.revokedAt
    ) {
      throw new ApiError(
        "Valid unconsumed candidate-rejection approval is required.",
        409,
      );
    }
    if (approval.workflowInstance.applicationId !== applicationId) {
      throw new ApiError(
        "Approval does not belong to this candidate application.",
        403,
      );
    }

    if (approval.decision === "PENDING") {
      if (!body.confirmApproval) {
        throw new ApiError(
          "Explicit confirmation is required to approve this candidate rejection.",
          409,
        );
      }
      await WorkflowEngine.decideApproval({
        approvalId: approval.id,
        decision: "APPROVED",
        notes: `Human-confirmed managed-hiring rejection. Reason: ${body.reason}`,
        context: tenantContext,
      });
      approval = await WorkflowEngine.getApprovalDetails({
        approvalId: approval.id,
        context: tenantContext,
      });
    }
    if (approval.decision !== "APPROVED") {
      throw new ApiError("Candidate rejection approval is not approved.", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${applicationId} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({
        where: { id: applicationId },
        select: { status: true },
      });
      if (!lockedApplication) throw new ApiError("Application not found.", 404);
      if (lockedApplication.status === "REJECTED") {
        return { idempotent: true };
      }
      if (["HIRED", "WITHDRAWN"].includes(lockedApplication.status)) {
        throw new ApiError(
          "Application entered a terminal state before rejection was executed.",
          409,
        );
      }

      await WorkflowEngine.consumeApprovedActionInTransaction(tx, {
        workflowId: workflow.id,
        stepName: approval.stepName,
        action: expectedAction,
        context: tenantContext,
      });

      const updated = await tx.application.updateMany({
        where: {
          id: applicationId,
          status: lockedApplication.status,
        },
        data: { status: "REJECTED" },
      });
      if (updated.count !== 1) {
        throw new ApiError(
          "Application state changed while rejection was being executed.",
          409,
        );
      }

      await tx.auditLog.create({
        data: {
          userId: session.id,
          companyId: application.job.companyId,
          action: "CANDIDATE_REJECTED",
          resource: `Application:${applicationId}`,
          details: body.reason,
        },
      });

      const completed = await tx.workflowInstance.updateMany({
        where: { id: workflow.id, status: "RUNNING" },
        data: {
          status: "COMPLETED",
          currentStep: "SCREENING_REJECTION_EXECUTED",
          updatedAt: new Date(),
        },
      });
      if (completed.count !== 1) {
        throw new ApiError(
          "Rejection workflow could not be finalized after approval consumption.",
          409,
        );
      }

      return { idempotent: false };
    });

    return NextResponse.json({
      success: true,
      action: "REJECT",
      applicationId,
      status: "REJECTED",
      reason: body.reason,
      idempotent: result.idempotent,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
