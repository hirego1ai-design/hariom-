import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getSessionCompany } from "@/lib/routeAuthorization";
import { logAuditEvent } from "@/lib/auditLogger";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
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
    if (["TRANSFERRED", "FINAL_ROUND_COMPLETE"].includes(interview.roundProgress.status) && body.action === "PROCEED") {
      const nextRound = await prisma.interviewRound.findUnique({ where: { processId_sequence: { processId: interview.roundProgress.round.processId, sequence: interview.roundProgress.round.sequence + 1 } }, include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } } });
      return NextResponse.json({ success: true, action: nextRound ? "PROCEED" : "FINAL_ROUND_COMPLETE", nextRound: nextRound ? { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) } : null, applicationId: interview.applicationId, idempotent: true });
    }
    if (!["ROUND_COMPLETE", "HOLD"].includes(interview.roundProgress.status)) {
      throw new ApiError("All required interviewer feedback must be finalized before a round decision.", 409);
    }
    const requiredFeedbackMissing = await prisma.interviewRoundInterviewer.count({
      where: { roundId: interview.roundProgress.roundId, required: true, user: { interviewFeedbacks: { none: { interviewId: id, finalizedAt: { not: null } } } } },
    });
    if (requiredFeedbackMissing > 0) throw new ApiError("Required panel feedback is incomplete.", 409);

    if (body.action === "HOLD") {
      if (interview.roundProgress.status === "HOLD" && interview.application.status === "ON_HOLD") {
        return NextResponse.json({ success: true, action: "HOLD", applicationId: interview.applicationId, idempotent: true });
      }
      await prisma.$transaction(async (tx) => {
        const held = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: "ROUND_COMPLETE" },
          data: { status: "HOLD" },
        });
        if (held.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
        const applicationHeld = await tx.application.updateMany({
          where: { id: interview.applicationId, status: { notIn: ["HIRED", "REJECTED", "WITHDRAWN"] } },
          data: { status: "ON_HOLD" },
        });
        if (applicationHeld.count !== 1) throw new ApiError("Application cannot be placed on hold from its current state.", 409);
      });
      await logAuditEvent({ userId: session.id, companyId: interview.application.job.companyId, action: "INTERVIEW_ROUND_DECISION", resource: `Interview:${id}`, details: "Round decision: HOLD" });
      return NextResponse.json({ success: true, action: "HOLD", applicationId: interview.applicationId, message: "Candidate is on hold. A later proceed or reject decision can resume this round." });
    }

    if (body.action === "REJECT") {
      const tenantContext = createTenantContext(session.role === "ADMIN" ? null : interview.application.job.companyId, session.id, session.role as Role);
      const expectedAction = { interviewId: id, applicationId: interview.applicationId, action: "REJECT" };

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
          where: { workflowInstanceId: workflow.id, actionType: "CANDIDATE_REJECTION", decision: { in: ["PENDING", "APPROVED"] }, consumedAt: null },
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
      if (approval.workflowInstanceId !== body.workflowId || approval.actionType !== "CANDIDATE_REJECTION" || approval.consumedAt) {
        throw new ApiError("Valid unconsumed candidate-rejection approval is required.", 409);
      }
      if (approval.workflowInstance.applicationId !== interview.applicationId) throw new ApiError("Approval does not belong to this candidate application.", 403);
      if (approval.decision === "PENDING") {
        if (!body.confirmApproval) throw new ApiError("Explicit confirmation is required to approve this candidate rejection.", 409);
        await WorkflowEngine.decideApproval({ approvalId: body.approvalId, decision: "APPROVED", notes: "Confirmed from interview round decision UI.", context: tenantContext });
        approval = await WorkflowEngine.getApprovalDetails({ approvalId: body.approvalId, context: tenantContext });
      }
      if (approval.decision !== "APPROVED") throw new ApiError("Candidate rejection approval is not approved.", 409);
      await WorkflowEngine.consumeApprovedAction({ workflowId: body.workflowId, stepName: approval.stepName, action: expectedAction, context: tenantContext });
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "InterviewRoundProgress" WHERE id = ${interview.roundProgress!.id} FOR UPDATE`;
      const lockedProgress = await tx.interviewRoundProgress.findUnique({
        where: { id: interview.roundProgress!.id },
        select: { status: true, roundId: true },
      });
      if (!lockedProgress || !["ROUND_COMPLETE", "HOLD"].includes(lockedProgress.status)) {
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

      if (body.action === "REJECT") {
        const claimed = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "HOLD"] } },
          data: { status: "TRANSFERRED", completedAt: interview.roundProgress!.completedAt || now },
        });
        if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
        const rejected = await tx.application.updateMany({
          where: { id: interview.applicationId, status: { notIn: ["HIRED", "REJECTED", "WITHDRAWN"] } },
          data: { status: "REJECTED" },
        });
        if (rejected.count !== 1) throw new ApiError("Application is already in a terminal state and cannot be rejected from this interview round.", 409);
        return { action: "REJECT" as const, nextRound: null };
      }
      const nextRound = await tx.interviewRound.findUnique({
        where: { processId_sequence: { processId: interview.roundProgress!.round.processId, sequence: interview.roundProgress!.round.sequence + 1 } },
        include: { interviewers: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      if (!nextRound) {
        const claimed = await tx.interviewRoundProgress.updateMany({
          where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "HOLD"] } },
          data: { status: "FINAL_ROUND_COMPLETE", completedAt: interview.roundProgress!.completedAt || now },
        });
        if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
        const selected = await tx.application.updateMany({
          where: { id: interview.applicationId, status: { notIn: ["HIRED", "REJECTED", "WITHDRAWN"] } },
          data: { status: "SHORTLISTED" },
        });
        if (selected.count !== 1) throw new ApiError("Application is already in a terminal state and cannot be selected.", 409);
        return { action: "FINAL_ROUND_COMPLETE" as const, nextRound: null };
      }
      const claimed = await tx.interviewRoundProgress.updateMany({
        where: { id: interview.roundProgress!.id, status: { in: ["ROUND_COMPLETE", "HOLD"] } },
        data: { status: "TRANSFERRED", completedAt: interview.roundProgress!.completedAt || now },
      });
      if (claimed.count !== 1) throw new ApiError("This interview round decision was already processed.", 409);
      if (interview.application.status === "ON_HOLD") {
        await tx.application.updateMany({
          where: { id: interview.applicationId, status: "ON_HOLD" },
          data: { status: "SCREENING" },
        });
      }
      await tx.interviewRoundProgress.upsert({
        where: { applicationId_roundId: { applicationId: interview.applicationId, roundId: nextRound.id } },
        update: {},
        create: { applicationId: interview.applicationId, roundId: nextRound.id, status: "PENDING" },
      });
      return { action: "PROCEED" as const, nextRound: { id: nextRound.id, name: nextRound.name, sequence: nextRound.sequence, department: nextRound.department, interviewers: nextRound.interviewers.map(i => ({ userId: i.userId, name: i.user.name, email: i.user.email })) } };
    });
    await logAuditEvent({ userId: session.id, companyId: interview.application.job.companyId, action: "INTERVIEW_ROUND_DECISION", resource: `Interview:${id}`, details: `Round decision: ${result.action}${result.nextRound ? `; next=${result.nextRound.name}` : ""}` });
    const candidate = interview.application.candidateProfile.user;
    const variables = { candidate_name: candidate.name || "Candidate", company_name: interview.application.job.company.name, job_title: interview.application.job.title };
    const eventKey = result.action === "PROCEED" ? "INTERVIEW_NEXT_ROUND" : null;
    if (eventKey && candidate.email) await dispatchCommunication({ eventKey, channel: "EMAIL", audience: "CANDIDATE", recipient: candidate.email, variables: { ...variables, next_round: result.nextRound?.name || "Next interview round" }, idempotencyKey: `interview:${id}:decision:${result.action}:candidate:email`, correlationId: interview.applicationId, recipientRef: candidate.id }).catch(() => null);
    if (eventKey && candidate.phoneNumber) await dispatchCommunication({ eventKey, channel: "WHATSAPP", audience: "CANDIDATE", recipient: candidate.phoneNumber, variables: { ...variables, next_round: result.nextRound?.name || "Next interview round" }, idempotencyKey: `interview:${id}:decision:${result.action}:candidate:whatsapp`, correlationId: interview.applicationId, recipientRef: candidate.id }).catch(() => null);
    return NextResponse.json({ success: true, ...result, applicationId: interview.applicationId });
  } catch (e) { return handleApiError(e); }
}
