import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { enqueueSecurityAuditEvent } from "@/lib/securityAuditOutbox";
import {
  dispatchCommunication,
  dispatchDecisionCommunication,
} from "@/lib/communications/dispatcher";
import { WorkflowEngine } from "@/lib/workflows/WorkflowEngine";
import { createTenantContext } from "@/lib/security/TenantContext";
import { Role } from "@prisma/client";

const schema = z.object({ action: z.enum(["PROCEED", "REJECT", "HOLD"]), approvalId: z.string().uuid().optional(), workflowId: z.string().uuid().optional(), confirmApproval: z.boolean().optional() }).strict();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit(req, "interview_round_decision", 20, 60000);
    const session = await getCurrentSession(req.headers);
    if (!session || !["EMPLOYER","RECRUITER","ADMIN"].includes(session.role)) throw new ApiError("Employer access required.", 403);
    const { id } = await params;
    const body = await readValidatedJson(req, schema);
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: { include: { job: { include: { company: true } }, candidateProfile: { include: { user: true } } } }, roundProgress: { include: { round: true, feedbacks: true } } },
    });
    if (!interview?.roundProgress) throw new ApiError("Configured interview round not found.", 404);
    if (session.role !== "ADMIN") {
      const company = await getSessionCompany(session);
      if (company.id !== interview.application.job.companyId) throw new ApiError("Interview access denied.", 403);
    }
    let interviewMetadata: Record<string, unknown> = {};
    try {
      interviewMetadata = interview.aiFeedback ? JSON.parse(interview.aiFeedback) : {};
    } catch {
      interviewMetadata = {};
    }
    const copilotManagedForInterview = interviewMetadata.copilotManaged === true;

    const tenantContext = createTenantContext(session.role === "ADMIN" ? null : interview.application.job.companyId, session.id, session.role as Role);
    let rejectionAuthorization: { workflowId: string; approvalId: string; approvedByUserId: string; stepName: string; expectedAction: { interviewId: string; applicationId: string; action: "REJECT" } } | null = null;
    let selectionAuthorization: { workflowId: string; approvalId: string; approvedByUserId: string; stepName: string; expectedAction: { interviewId: string; applicationId: string; action: "SELECT" } } | null = null;

    if (["TRANSFERRED", "FINAL_ROUND_COMPLETE"].includes(interview.roundProgress.status) && body.action === "PROCEED") {
      const nextRound = await prisma.interviewRound.findUnique({ where: { processId_sequence: { processId: interview.roundProgress.round.processId, sequence: interview.roundProgress.round.sequence + 1 } }, include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } } });
      return NextResponse.json({ success: true, action: nextRound ? "PROCEED" : "FINAL_ROUND_COMPLETE", nextRound: nextRound ? { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) } : null, applicationId: interview.applicationId, idempotent: true });
    }
    if (
      interview.roundProgress.status === "TRANSFERRED" &&
      body.action === "REJECT" &&
      interview.application.status === "REJECTED"
    ) {
      return NextResponse.json({
        success: true,
        action: "REJECT",
        applicationId: interview.applicationId,
        idempotent: true,
        message: "Candidate rejection was already completed.",
      });
    }
    if (interview.roundProgress.status === "ON_HOLD" && body.action === "HOLD") {
      return NextResponse.json({ success: true, action: "HOLD", applicationId: interview.applicationId, idempotent: true, message: "Candidate is already on hold after this round." });
    }
    if (interview.application.status !== "AI_INTERVIEW") {
      throw new ApiError(
        "This application is no longer in the active interview workflow. Reconcile withdrawal, rejection, selection, or joining state before another round decision.",
        409,
      );
    }
    if (!["ROUND_COMPLETE", "ON_HOLD"].includes(interview.roundProgress.status)) throw new ApiError("All required interviewer feedback must be finalized before a round decision.", 409);
    const requiredFeedbackMissing = await prisma.interviewRoundInterviewer.count({
      where: { roundId: interview.roundProgress.roundId, required: true, user: { interviewFeedbacks: { none: { interviewId: id, finalizedAt: { not: null } } } } },
    });
    if (requiredFeedbackMissing > 0) throw new ApiError("Required panel feedback is incomplete.", 409);

    if (body.action === "PROCEED") {
      const nextRoundPreview = await prisma.interviewRound.findUnique({
        where: {
          processId_sequence: {
            processId: interview.roundProgress.round.processId,
            sequence: interview.roundProgress.round.sequence + 1,
          },
        },
        select: { id: true },
      });

      if (!nextRoundPreview) {
        const expectedAction = { interviewId: id, applicationId: interview.applicationId, action: "SELECT" as const };
        const correlationId = `interview-selection:${id}`;
        let workflow = await prisma.workflowInstance.findUnique({ where: { correlationId } });
        if (!workflow) {
          workflow = await WorkflowEngine.startWorkflow({
            workflowType: "SHORTLISTING",
            companyId: interview.application.job.companyId,
            jobId: interview.application.jobId,
            candidateId: interview.application.candidateProfileId,
            applicationId: interview.applicationId,
            correlationId,
            initiatedBy: session.id,
            initialStep: "FINAL_ROUND_SELECTION",
            checkpointState: { interviewId: id, source: "round-decision" },
            context: tenantContext,
          });
        }
        if (workflow.applicationId !== interview.applicationId || workflow.companyId !== interview.application.job.companyId) {
          throw new ApiError("Existing selection workflow does not match this candidate application.", 409);
        }
        if (!["RUNNING", "PAUSED_FOR_APPROVAL"].includes(workflow.status)) {
          throw new ApiError("Existing selection workflow requires reconciliation before another decision.", 409);
        }

        if (!body.approvalId || !body.workflowId) {
          let approval = await prisma.workflowApproval.findFirst({
            where: {
              workflowInstanceId: workflow.id,
              actionType: "CANDIDATE_SELECTION",
              decision: { in: ["PENDING", "APPROVED"] },
              consumedAt: null,
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
            orderBy: { requestedAt: "desc" },
          });
          if (!approval) {
            if (workflow.status !== "RUNNING") throw new ApiError("Selection workflow is paused without an active approval request.", 409);
            const requested = await WorkflowEngine.requestConsequentialAction({
              workflowId: workflow.id,
              stepName: "FINAL_ROUND_SELECTION",
              actionType: "CANDIDATE_SELECTION",
              action: expectedAction,
              context: tenantContext,
            });
            approval = await prisma.workflowApproval.findUnique({ where: { id: requested.approvalId } });
          }
          if (!approval) throw new ApiError("Unable to persist candidate-selection approval request.", 500);
          return NextResponse.json({
            success: true,
            action: "PROCEED",
            finalRound: true,
            requiresConfirmation: true,
            approvalId: approval.id,
            workflowId: workflow.id,
            message: "Final selection approval has been persisted. Confirm once more to shortlist the candidate.",
          }, { status: 202 });
        }

        if (body.workflowId !== workflow.id) throw new ApiError("Selection workflow does not match this interview.", 409);
        let approval = await WorkflowEngine.getApprovalDetails({ approvalId: body.approvalId, context: tenantContext });
        if (approval.workflowInstanceId !== workflow.id || approval.actionType !== "CANDIDATE_SELECTION" || approval.consumedAt || approval.revokedAt) {
          throw new ApiError("Valid unconsumed candidate-selection approval is required.", 409);
        }
        if (approval.workflowInstance.applicationId !== interview.applicationId) throw new ApiError("Approval does not belong to this candidate application.", 403);
        if (approval.decision === "PENDING") {
          if (!body.confirmApproval) throw new ApiError("Explicit confirmation is required to approve final candidate selection.", 409);
          await WorkflowEngine.decideApproval({
            approvalId: approval.id,
            decision: "APPROVED",
            notes: "Confirmed from final interview round decision UI.",
            context: tenantContext,
          });
          approval = await WorkflowEngine.getApprovalDetails({ approvalId: approval.id, context: tenantContext });
        }
        if (approval.decision !== "APPROVED" || !approval.decidedBy) throw new ApiError("Candidate selection approval is not approved.", 409);
        selectionAuthorization = {
          workflowId: workflow.id,
          approvalId: approval.id,
          approvedByUserId: approval.decidedBy,
          stepName: approval.stepName,
          expectedAction,
        };
      }
    }

    if (body.action === "REJECT") {
      const expectedAction = { interviewId: id, applicationId: interview.applicationId, action: "REJECT" as const };

      if (!body.approvalId || !body.workflowId) {
        const correlationId = `interview-rejection:${id}`;
        let workflow = await prisma.workflowInstance.findUnique({ where: { correlationId } });
        if (!workflow) {
          workflow = await WorkflowEngine.startWorkflow({
            workflowType: "SELECTION_REJECTION",
            companyId: interview.application.job.companyId,
            jobId: interview.application.jobId,
            candidateId: interview.application.candidateProfileId,
            applicationId: interview.applicationId,
            correlationId,
            initiatedBy: session.id,
            initialStep: "INTERVIEW_ROUND_REJECTION",
            checkpointState: { interviewId: id, source: "round-decision" },
            context: tenantContext,
          });
        }
        if (workflow.applicationId !== interview.applicationId || workflow.companyId !== interview.application.job.companyId) {
          throw new ApiError("Existing rejection workflow does not match this candidate application.", 409);
        }
        if (!["RUNNING", "PAUSED_FOR_APPROVAL"].includes(workflow.status)) {
          throw new ApiError("Existing rejection workflow requires reconciliation before another decision.", 409);
        }
        let approval = await prisma.workflowApproval.findFirst({
          where: { workflowInstanceId: workflow.id, actionType: "CANDIDATE_REJECTION", decision: { in: ["PENDING", "APPROVED"] }, consumedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { requestedAt: "desc" },
        });
        if (!approval) {
          if (workflow.status !== "RUNNING") throw new ApiError("Rejection workflow is paused without a valid approval request.", 409);
          const requested = await WorkflowEngine.requestConsequentialAction({
            workflowId: workflow.id,
            stepName: "INTERVIEW_ROUND_REJECTION",
            actionType: "CANDIDATE_REJECTION",
            action: expectedAction,
            context: tenantContext,
          });
          approval = await prisma.workflowApproval.findUnique({ where: { id: requested.approvalId } });
        }
        if (!approval) throw new ApiError("Unable to persist rejection approval request.", 500);
        return NextResponse.json({
          success: true,
          action: "REJECT",
          requiresConfirmation: true,
          approvalId: approval.id,
          workflowId: workflow.id,
          message: "Rejection approval has been persisted. Confirm once more to execute the candidate rejection.",
        }, { status: 202 });
      }

      let approval = await WorkflowEngine.getApprovalDetails({ approvalId: body.approvalId, context: tenantContext });
      if (approval.workflowInstanceId !== body.workflowId || approval.actionType !== "CANDIDATE_REJECTION" || approval.consumedAt || approval.revokedAt) {
        throw new ApiError("Valid unconsumed candidate-rejection approval is required.", 409);
      }
      if (approval.workflowInstance.applicationId !== interview.applicationId) throw new ApiError("Approval does not belong to this candidate application.", 403);
      if (approval.decision === "PENDING") {
        if (!body.confirmApproval) throw new ApiError("Explicit confirmation is required to approve this candidate rejection.", 409);
        await WorkflowEngine.decideApproval({ approvalId: body.approvalId, decision: "APPROVED", notes: "Confirmed from interview round decision UI.", context: tenantContext });
        approval = await WorkflowEngine.getApprovalDetails({ approvalId: body.approvalId, context: tenantContext });
      }
      if (approval.decision !== "APPROVED" || !approval.decidedBy) throw new ApiError("Candidate rejection approval is not approved.", 409);
      rejectionAuthorization = {
        workflowId: body.workflowId,
        approvalId: approval.id,
        approvedByUserId: approval.decidedBy,
        stepName: approval.stepName,
        expectedAction,
      };
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      // Keep lifecycle lock order aligned with withdrawal and offer flows:
      // Application first, then round progress.
      await tx.$queryRaw`SELECT id FROM "Application" WHERE id = ${interview.applicationId} FOR UPDATE`;
      const lockedApplication = await tx.application.findUnique({
        where: { id: interview.applicationId },
        select: { status: true },
      });
      if (!lockedApplication || lockedApplication.status !== "AI_INTERVIEW") {
        throw new ApiError(
          "Application left the active interview workflow before this round decision could be executed.",
          409,
        );
      }

      await tx.$queryRaw`SELECT id FROM "InterviewRoundProgress" WHERE id = ${interview.roundProgress!.id} FOR UPDATE`;
      const lockedProgress = await tx.interviewRoundProgress.findUnique({
        where: { id: interview.roundProgress!.id },
        select: { status: true, roundId: true },
      });
      if (!lockedProgress || !["ROUND_COMPLETE", "ON_HOLD"].includes(lockedProgress.status)) {
        throw new ApiError("This interview round decision was already processed.", 409);
      }
      const lockedRequiredFeedbackMissing = await tx.interviewRoundInterviewer.count({
        where: {
          roundId: lockedProgress.roundId,
          required: true,
          user: { interviewFeedbacks: { none: { interviewId: id, finalizedAt: { not: null } } } },
        },
      });
      if (lockedRequiredFeedbackMissing > 0) throw new ApiError("Required panel feedback is incomplete.", 409);

      const persistDecisionAudit = async (
        decision: "HOLD" | "REJECT" | "PROCEED" | "FINAL_ROUND_COMPLETE",
        nextRoundName: string | null = null,
      ) => {
        const auditLog = await tx.auditLog.create({
          data: {
            userId: session.id,
            companyId: interview.application.job.companyId,
            action: "INTERVIEW_ROUND_DECISION",
            resource: `Interview:${id}`,
            details: JSON.stringify({
              applicationId: interview.applicationId,
              roundId: lockedProgress.roundId,
              decision,
              nextRoundName,
              selectionWorkflowId: selectionAuthorization?.workflowId || null,
              rejectionWorkflowId: rejectionAuthorization?.workflowId || null,
              decidedAt: now.toISOString(),
            }),
          },
        });
        await enqueueSecurityAuditEvent(tx, auditLog, session.id);
      };

      if (body.action === "HOLD") {
        if (lockedProgress.status === "ON_HOLD") {
          return { action: "HOLD" as const, nextRound: null, idempotent: true };
        }
        const held = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: "ROUND_COMPLETE" },
          data: { status: "ON_HOLD" },
        });
        if (held.count !== 1) {
          throw new ApiError("This interview round decision changed before HOLD could be saved.", 409);
        }
        await persistDecisionAudit("HOLD");
        return { action: "HOLD" as const, nextRound: null, idempotent: false };
      }

      if (body.action === "REJECT") {
        if (!rejectionAuthorization) throw new ApiError("Approved rejection authorization is required.", 409);
        await WorkflowEngine.consumeApprovedActionInTransaction(tx, {
          workflowId: rejectionAuthorization.workflowId,
          stepName: rejectionAuthorization.stepName,
          action: rejectionAuthorization.expectedAction,
          context: tenantContext,
        });
        const claimed = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "ON_HOLD"] } },
          data: { status: "TRANSFERRED", completedAt: interview.roundProgress!.completedAt || now },
        });
        if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
        const rejected = await tx.application.updateMany({
          where: { id: interview.applicationId, status: { notIn: ["HIRED", "REJECTED", "WITHDRAWN"] } },
          data: { status: "REJECTED" },
        });
        if (rejected.count !== 1) throw new ApiError("Application is already in a terminal state and cannot be rejected from this interview round.", 409);
        const completedWorkflow = await tx.workflowInstance.updateMany({
          where: { id: rejectionAuthorization.workflowId, status: "RUNNING" },
          data: {
            status: "COMPLETED",
            currentStep: "CANDIDATE_REJECTED",
            updatedAt: now,
          },
        });
        if (completedWorkflow.count !== 1) {
          throw new ApiError("Candidate-rejection workflow did not reach a terminal state.", 409);
        }
        await persistDecisionAudit("REJECT");
        return { action: "REJECT" as const, nextRound: null, idempotent: false };
      }
      const nextRound = await tx.interviewRound.findUnique({
        where: { processId_sequence: { processId: interview.roundProgress!.round.processId, sequence: interview.roundProgress!.round.sequence + 1 } },
        include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      if (!nextRound) {
        if (!selectionAuthorization) throw new ApiError("Approved final selection authorization is required.", 409);
        await WorkflowEngine.consumeApprovedActionInTransaction(tx, {
          workflowId: selectionAuthorization.workflowId,
          stepName: selectionAuthorization.stepName,
          action: selectionAuthorization.expectedAction,
          context: tenantContext,
        });
        const claimed = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "ON_HOLD"] } },
          data: { status: "FINAL_ROUND_COMPLETE", completedAt: interview.roundProgress!.completedAt || now },
        });
        if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
        const selected = await tx.application.updateMany({
          where: { id: interview.applicationId, status: { notIn: ["HIRED", "REJECTED", "WITHDRAWN"] } },
          data: { status: "SHORTLISTED" },
        });
        if (selected.count !== 1) throw new ApiError("Application is already in a terminal state and cannot be selected.", 409);
        const completedWorkflow = await tx.workflowInstance.updateMany({
          where: { id: selectionAuthorization.workflowId, status: "RUNNING" },
          data: {
            status: "COMPLETED",
            currentStep: "CANDIDATE_SELECTED",
            updatedAt: now,
          },
        });
        if (completedWorkflow.count !== 1) {
          throw new ApiError("Candidate-selection workflow did not reach a terminal state.", 409);
        }
        await persistDecisionAudit("FINAL_ROUND_COMPLETE");
        return { action: "FINAL_ROUND_COMPLETE" as const, nextRound: null, idempotent: false };
      }
      const claimed = await tx.interviewRoundProgress.updateMany({
        where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "ON_HOLD"] } },
        data: { status: "TRANSFERRED", completedAt: interview.roundProgress!.completedAt || now },
      });
      if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: interview.applicationId, roundId: nextRound.id } },
        update: {},
        create: { applicationId: interview.applicationId, roundId: nextRound.id, status: "PENDING" },
      });
      await persistDecisionAudit("PROCEED", nextRound.name);
      return { action: "PROCEED" as const, nextRound: { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) }, idempotent: false };
    });
    const candidate = interview.application.candidateProfile.user;
    const variables = { candidate_name: candidate.name || "Candidate", company_name: interview.application.job.company.name, job_title: interview.application.job.title };

    if (
      result.action === "FINAL_ROUND_COMPLETE" &&
      selectionAuthorization
    ) {
      const authorizationProof = {
        workflowId: selectionAuthorization.workflowId,
        approvalId: selectionAuthorization.approvalId,
        approvedByUserId: selectionAuthorization.approvedByUserId,
      };
      if (candidate.email) {
        await dispatchDecisionCommunication({
          eventKey: "CANDIDATE_SELECTED",
          channel: "EMAIL",
          audience: "CANDIDATE",
          recipient: candidate.email,
          variables: {
            ...variables,
            next_step: "The employer will follow up with the offer-stage next steps.",
          },
          idempotencyKey: `interview:${id}:final-selection:candidate:email`,
          correlationId: interview.applicationId,
          recipientRef: candidate.id,
          authorizationProof,
          copilotMetering: copilotManagedForInterview ? {
            companyId: interview.application.job.companyId,
            idempotencyKey: `copilot-communication:${id}:final-selection:email`,
            reference: {
              jobId: interview.application.jobId,
              applicationId: interview.applicationId,
              candidateId: interview.application.candidateProfileId,
              interviewId: id,
            },
          } : undefined,
        }).catch(() => null);
      }
      if (candidate.phoneNumber) {
        await dispatchDecisionCommunication({
          eventKey: "CANDIDATE_SELECTED",
          channel: "WHATSAPP",
          audience: "CANDIDATE",
          recipient: candidate.phoneNumber,
          variables: {
            ...variables,
            next_step: "The employer will follow up with the offer-stage next steps.",
          },
          idempotencyKey: `interview:${id}:final-selection:candidate:whatsapp`,
          correlationId: interview.applicationId,
          recipientRef: candidate.id,
          authorizationProof,
          copilotMetering: copilotManagedForInterview ? {
            companyId: interview.application.job.companyId,
            idempotencyKey: `copilot-communication:${id}:final-selection:whatsapp`,
            reference: {
              jobId: interview.application.jobId,
              applicationId: interview.applicationId,
              candidateId: interview.application.candidateProfileId,
              interviewId: id,
            },
          } : undefined,
        }).catch(() => null);
      }
    }

    if (result.action === "REJECT" && rejectionAuthorization) {
      const authorizationProof = {
        workflowId: rejectionAuthorization.workflowId,
        approvalId: rejectionAuthorization.approvalId,
        approvedByUserId: rejectionAuthorization.approvedByUserId,
      };
      if (candidate.email) {
        await dispatchDecisionCommunication({
          eventKey: "APPLICATION_REJECTED",
          channel: "EMAIL",
          audience: "CANDIDATE",
          recipient: candidate.email,
          variables,
          idempotencyKey: `interview:${id}:rejection:candidate:email`,
          correlationId: interview.applicationId,
          recipientRef: candidate.id,
          authorizationProof,
          copilotMetering: copilotManagedForInterview ? {
            companyId: interview.application.job.companyId,
            idempotencyKey: `copilot-communication:${id}:rejection:email`,
            reference: {
              jobId: interview.application.jobId,
              applicationId: interview.applicationId,
              candidateId: interview.application.candidateProfileId,
              interviewId: id,
            },
          } : undefined,
        }).catch(() => null);
      }
      if (candidate.phoneNumber) {
        await dispatchDecisionCommunication({
          eventKey: "APPLICATION_REJECTED",
          channel: "WHATSAPP",
          audience: "CANDIDATE",
          recipient: candidate.phoneNumber,
          variables,
          idempotencyKey: `interview:${id}:rejection:candidate:whatsapp`,
          correlationId: interview.applicationId,
          recipientRef: candidate.id,
          authorizationProof,
          copilotMetering: copilotManagedForInterview ? {
            companyId: interview.application.job.companyId,
            idempotencyKey: `copilot-communication:${id}:rejection:whatsapp`,
            reference: {
              jobId: interview.application.jobId,
              applicationId: interview.applicationId,
              candidateId: interview.application.candidateProfileId,
              interviewId: id,
            },
          } : undefined,
        }).catch(() => null);
      }
    }

    const eventKey = result.action === "PROCEED" ? "INTERVIEW_NEXT_ROUND" : null;
    if (eventKey && candidate.email) await dispatchCommunication({
      eventKey,
      channel: "EMAIL",
      audience: "CANDIDATE",
      recipient: candidate.email,
      variables: { ...variables, next_round: result.nextRound?.name || "Next interview round" },
      idempotencyKey: `interview:${id}:decision:${result.action}:candidate:email`,
      correlationId: interview.applicationId,
      recipientRef: candidate.id,
      copilotMetering: copilotManagedForInterview ? {
        companyId: interview.application.job.companyId,
        idempotencyKey: `copilot-communication:${id}:decision:${result.action}:email`,
        reference: {
          jobId: interview.application.jobId,
          applicationId: interview.applicationId,
          candidateId: interview.application.candidateProfileId,
          interviewId: id,
        },
      } : undefined,
    }).catch(() => null);
    if (eventKey && candidate.phoneNumber) await dispatchCommunication({
      eventKey,
      channel: "WHATSAPP",
      audience: "CANDIDATE",
      recipient: candidate.phoneNumber,
      variables: { ...variables, next_round: result.nextRound?.name || "Next interview round" },
      idempotencyKey: `interview:${id}:decision:${result.action}:candidate:whatsapp`,
      correlationId: interview.applicationId,
      recipientRef: candidate.id,
      copilotMetering: copilotManagedForInterview ? {
        companyId: interview.application.job.companyId,
        idempotencyKey: `copilot-communication:${id}:decision:${result.action}:whatsapp`,
        reference: {
          jobId: interview.application.jobId,
          applicationId: interview.applicationId,
          candidateId: interview.application.candidateProfileId,
          interviewId: id,
        },
      } : undefined,
    }).catch(() => null);
    return NextResponse.json({
      success: true,
      ...result,
      applicationId: interview.applicationId,
      ...(result.action === "HOLD"
        ? { message: "Candidate is on hold after this round. Proceed or reject later to resume the workflow." }
        : {}),
    });
  } catch (e) { return handleApiError(e); }
}
