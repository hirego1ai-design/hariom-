import { prisma } from '@/lib/prisma';
import { WorkflowInstance, Prisma, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { TenantContext, validateTenantAccess } from '@/lib/security/TenantContext';
import { RbacGuard } from '@/lib/security/RbacGuard';
import { writeAgentApprovalAudit } from '@/lib/security/AgentApprovalAudit';

const APPROVER_ROLES: Role[] = [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN];
const MANAGED_HIRING_WORKFLOW_TYPES = new Set(['JOB_REQUIREMENT', 'CANDIDATE_SCREENING', 'SHORTLISTING', 'INTERVIEW_SCHEDULING', 'VIRTUAL_INTERVIEW', 'EMPLOYER_FEEDBACK', 'SELECTION_REJECTION', 'JOINING_ONBOARDING', 'BILLING_HANDOFF', 'NOTIFICATION_HANDOFF']);
const WORKFLOW_REQUIRED_RESOURCES: Record<string, Array<'jobId' | 'applicationId' | 'candidateId'>> = {
  JOB_REQUIREMENT: ['jobId'],
  CANDIDATE_SCREENING: ['jobId', 'applicationId'],
  SHORTLISTING: ['jobId', 'applicationId'],
  INTERVIEW_SCHEDULING: ['jobId', 'applicationId'],
  VIRTUAL_INTERVIEW: ['jobId', 'applicationId'],
  EMPLOYER_FEEDBACK: ['jobId', 'applicationId'],
  SELECTION_REJECTION: ['jobId', 'applicationId'],
  JOINING_ONBOARDING: ['jobId', 'applicationId'],
  BILLING_HANDOFF: ['jobId', 'applicationId'],
  NOTIFICATION_HANDOFF: ['jobId', 'applicationId'],
};

const APPROVAL_ROLE_POLICY: Record<string, Role[]> = {
  CANDIDATE_SELECTION: [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN],
  CANDIDATE_REJECTION: [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN],
  EXTERNAL_COMMUNICATION: [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN],
  INTERVIEW_SCHEDULING: [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN],
  OFFER: [Role.EMPLOYER, Role.ADMIN],
  FINANCIAL: [Role.ADMIN],
  COMMERCIAL_TERMS: [Role.ADMIN],
  DESTRUCTIVE: [Role.ADMIN],
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((out, key) => {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
      return out;
    }, {});
  }
  return value;
}

function actionDigest(action: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonicalize(action ?? null))).digest('hex');
}

export class WorkflowEngine {
  static async startWorkflow(params: {
    workflowType: string; companyId?: string | null; jobId?: string | null; candidateId?: string | null;
    applicationId?: string | null; correlationId: string; initiatedBy: string; initialStep: string;
    checkpointState: Record<string, unknown>; context: TenantContext;
  }): Promise<WorkflowInstance> {
    const { initialStep, checkpointState, context, ...data } = params;
    if (!MANAGED_HIRING_WORKFLOW_TYPES.has(data.workflowType)) throw new Error(`Unsupported managed-hiring workflow type: ${data.workflowType}`);
    const requiredResources = WORKFLOW_REQUIRED_RESOURCES[data.workflowType] ?? [];
    for (const resource of requiredResources) if (!data[resource]) throw new Error(`${resource} is required for ${data.workflowType}`);
    if (!data.correlationId || data.correlationId.length > 200) throw new Error('A bounded correlation ID is required');
    if (!initialStep || initialStep.length > 120) throw new Error('A bounded initial workflow step is required');
    if (data.initiatedBy !== context.userId) throw new Error('Workflow initiator must be derived from the authenticated server context');
    if ((data.companyId ?? null) !== context.companyId && context.userRole !== Role.ADMIN) throw new Error('Workflow company must match the authenticated tenant context');
    validateTenantAccess(context, data.companyId ?? null);
    RbacGuard.assertRole(context, [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN]);
    if (data.jobId) {
      const job = await prisma.jobListing.findUnique({ where: { id: data.jobId }, select: { companyId: true } });
      if (!job) throw new Error('Job not found');
      validateTenantAccess(context, job.companyId);
      if (data.companyId && job.companyId !== data.companyId) throw new Error('Workflow job does not belong to the workflow company');
    }
    if (data.candidateId && !data.applicationId) {
      const candidate = await prisma.candidateProfile.findUnique({ where: { id: data.candidateId }, select: { id: true } });
      if (!candidate) throw new Error('Candidate profile not found');
    }
    if (data.applicationId) {
      const application = await prisma.application.findUnique({ where: { id: data.applicationId }, select: { candidateProfileId: true, jobId: true, job: { select: { companyId: true } } } });
      if (!application) throw new Error('Application not found');
      validateTenantAccess(context, application.job.companyId);
      if (data.companyId && application.job.companyId !== data.companyId) throw new Error('Workflow application does not belong to the workflow company');
      if (data.jobId && application.jobId !== data.jobId) throw new Error('Workflow application does not belong to the referenced job');
      if (data.candidateId && application.candidateProfileId !== data.candidateId) throw new Error('Workflow candidate does not match the application candidate');
    }
    return prisma.workflowInstance.create({ data: { ...data, currentStep: initialStep, checkpointState: checkpointState as Prisma.InputJsonValue, status: 'RUNNING' } });
  }

  static async retryWorkflow(params: { workflowId: string; context: TenantContext }): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (workflow.status !== 'FAILED') throw new Error(`Only FAILED workflows can be retried; current status is ${workflow.status}`);
    if (workflow.failureCount < 1 || workflow.failureCount >= 3) throw new Error('Workflow retry budget is exhausted or invalid');
    const unresolved = await prisma.workflowStepLog.count({ where: { workflowInstanceId: workflow.id, status: 'RUNNING' } });
    if (unresolved > 0) throw new Error('Interrupted RUNNING steps must be recovered before retry');
    return prisma.workflowInstance.update({ where: { id: workflow.id, status: 'FAILED', failureCount: workflow.failureCount }, data: { status: 'RUNNING', updatedAt: new Date() } });
  }

  static async executeStep<T>(workflowId: string, stepName: string, attemptNumber: number, inputPayload: unknown, stepFn: () => Promise<T>): Promise<T> {
    if (!Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 3) throw new Error('Workflow step attempt must be between 1 and 3');
    const workflowState = await prisma.workflowInstance.findUnique({ where: { id: workflowId }, select: { status: true, failureCount: true } });
    if (!workflowState) throw new Error('Workflow not found');
    if (workflowState.status !== 'RUNNING') throw new Error(`Workflow is not executable while status is ${workflowState.status}`);
    if (attemptNumber > workflowState.failureCount + 1) throw new Error('Workflow retry attempt cannot skip prior failed attempts');
    const executionKey = `${workflowId}:${stepName}:${attemptNumber}`;
    const previous = await prisma.workflowStepLog.findUnique({ where: { executionKey } });
    if (previous?.status === 'COMPLETED' && previous.sideEffectDone) return previous.outputPayload as T;
    if (previous) throw new Error(`Workflow step execution already claimed: ${executionKey}`);
    try {
      await prisma.workflowStepLog.create({ data: { executionKey, workflowInstanceId: workflowId, stepName, attemptNumber, status: 'RUNNING', inputPayload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const raced = await prisma.workflowStepLog.findUnique({ where: { executionKey } });
        if (raced?.status === 'COMPLETED' && raced.sideEffectDone) return raced.outputPayload as T;
        throw new Error(`Workflow step execution already claimed: ${executionKey}`);
      }
      throw error;
    }
    try {
      const result = await stepFn();
      await prisma.$transaction(async (tx) => {
        await tx.workflowStepLog.update({ where: { executionKey }, data: { status: 'COMPLETED', sideEffectDone: true, outputPayload: result == null ? Prisma.JsonNull : result as Prisma.InputJsonValue } });
        await tx.workflowInstance.update({ where: { id: workflowId }, data: { currentStep: stepName, updatedAt: new Date() } });
      });
      return result;
    } catch (error) {
      await prisma.$transaction(async (tx) => {
        const errorMessage = error instanceof Error ? error.message : 'Step execution failed';
        await tx.workflowStepLog.update({ where: { executionKey }, data: { status: 'FAILED', errorMessage } });
        const workflow = await tx.workflowInstance.update({ where: { id: workflowId }, data: { status: 'FAILED', failureCount: { increment: 1 }, updatedAt: new Date() } });
        if (attemptNumber >= 3) await tx.deadLetterJob.upsert({ where: { sourceType_sourceId: { sourceType: 'WorkflowStep', sourceId: executionKey } }, update: { errorType: 'StepFailed', errorMessage, payload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue, status: 'OPEN' }, create: { sourceType: 'WorkflowStep', sourceId: executionKey, correlationId: workflow.correlationId, errorType: 'StepFailed', errorMessage, payload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue, status: 'OPEN' } });
      });
      throw error;
    }
  }

  static async assertNoUnresolvedConsequentialActions(workflowId: string): Promise<void> {
    const unresolved = await prisma.workflowApproval.count({ where: { workflowInstanceId: workflowId, OR: [{ decision: 'PENDING' }, { decision: 'APPROVED', consumedAt: null }] } });
    if (unresolved > 0) throw new Error('Workflow has unresolved consequential actions');
  }

  static async resumeApprovedWorkflow(params: { workflowId: string; context: TenantContext }): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (workflow.status !== 'PAUSED_FOR_APPROVAL') throw new Error(`Workflow is not pending approval: ${workflow.status}`);
    const [pending, rejected] = await Promise.all([
      prisma.workflowApproval.count({ where: { workflowInstanceId: workflow.id, decision: 'PENDING' } }),
      prisma.workflowApproval.count({ where: { workflowInstanceId: workflow.id, decision: 'REJECTED' } }),
    ]);
    if (rejected > 0) throw new Error('Workflow has a rejected consequential action');
    const invalidApproval = await prisma.workflowApproval.findFirst({ where: { workflowInstanceId: workflow.id, decision: 'APPROVED', OR: [{ decidedBy: null }, { decidedAt: null }, { decidedByRole: null }] }, select: { id: true } });
    if (invalidApproval) throw new Error('Workflow contains incomplete approval evidence');
    if (pending > 0) throw new Error('Workflow still has pending consequential approvals');
    const unconsumed = await prisma.workflowApproval.count({ where: { workflowInstanceId: workflow.id, decision: 'APPROVED', consumedAt: null } });
    if (unconsumed > 0) throw new Error('Approved consequential actions must be consumed before workflow resume');
    return prisma.workflowInstance.update({ where: { id: workflow.id, status: 'PAUSED_FOR_APPROVAL' }, data: { status: 'RUNNING', updatedAt: new Date() } });
  }

  static async failWorkflow(params: { workflowId: string; context: TenantContext; errorType: string; errorMessage: string }): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (!['RUNNING', 'PAUSED_FOR_APPROVAL'].includes(workflow.status)) throw new Error(`Workflow cannot fail from ${workflow.status}`);
    const errorType = params.errorType.trim().slice(0, 120);
    const errorMessage = params.errorMessage.trim().slice(0, 2000);
    if (!errorType || !errorMessage) throw new Error('Bounded workflow failure details are required');
    return prisma.$transaction(async (tx) => {
      await tx.deadLetterJob.upsert({ where: { sourceType_sourceId: { sourceType: 'WORKFLOW', sourceId: workflow.id } }, create: { sourceType: 'WORKFLOW', sourceId: workflow.id, correlationId: workflow.correlationId, errorType, errorMessage, payload: { workflowId: workflow.id, currentStep: workflow.currentStep } as Prisma.InputJsonValue, status: 'PENDING' }, update: { correlationId: workflow.correlationId, errorType, errorMessage, payload: { workflowId: workflow.id, currentStep: workflow.currentStep } as Prisma.InputJsonValue, status: 'PENDING' } });
      return tx.workflowInstance.update({ where: { id: workflow.id, status: workflow.status }, data: { status: 'FAILED', failureCount: { increment: 1 }, updatedAt: new Date() } });
    });
  }

  static async requestConsequentialAction(params: { workflowId: string; stepName: string; actionType: string; action: unknown; context: TenantContext }): Promise<{ approvalId: string; status: 'PENDING_APPROVAL' }> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (workflow.status !== 'RUNNING') throw new Error(`Consequential action cannot be requested while workflow is ${workflow.status}`);
    const rejected = await prisma.workflowApproval.count({ where: { workflowInstanceId: workflow.id, decision: 'REJECTED' } });
    if (rejected > 0) throw new Error('Rejected consequential actions make this workflow terminal');
    const approvalId = await this.pauseForApproval(params);
    return { approvalId, status: 'PENDING_APPROVAL' };
  }

  static async cancelWorkflow(params: { workflowId: string; context: TenantContext; reason: string }): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    const reason = params.reason.trim();
    if (!reason || reason.length > 1000) throw new Error('A bounded cancellation reason is required');
    if (!['RUNNING', 'PAUSED_FOR_APPROVAL', 'FAILED'].includes(workflow.status)) throw new Error(`Workflow cannot be cancelled from ${workflow.status}`);
    const runningSteps = await prisma.workflowStepLog.count({ where: { workflowInstanceId: workflow.id, status: 'RUNNING' } });
    if (runningSteps > 0) throw new Error('Recover or finish RUNNING steps before cancellation');
    return prisma.workflowInstance.update({ where: { id: workflow.id, status: workflow.status }, data: { status: 'CANCELLED', checkpointState: { ...(workflow.checkpointState as Record<string, unknown>), cancellationReason: reason, cancelledBy: params.context.userId, cancelledAt: new Date().toISOString() } as Prisma.InputJsonValue, updatedAt: new Date() } });
  }

  static async getApprovalDetails(params: { approvalId: string; context: TenantContext }) {
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    const approval = await prisma.workflowApproval.findUnique({
      where: { id: params.approvalId },
      select: { id: true, workflowInstanceId: true, companyId: true, stepName: true, actionType: true, actionDigest: true, decision: true, requestedBy: true, decidedBy: true, decidedByRole: true, decisionNotes: true, requestedAt: true, decidedAt: true, consumedAt: true,
        workflowInstance: { select: { workflowType: true, status: true, currentStep: true, correlationId: true, jobId: true, candidateId: true, applicationId: true } } },
    });
    if (!approval) throw new Error('Approval not found');
    validateTenantAccess(params.context, approval.companyId);
    const requiredRoles = APPROVAL_ROLE_POLICY[approval.actionType];
    if (!requiredRoles) throw new Error(`Unknown consequential approval action type: ${approval.actionType}`);
    RbacGuard.assertRole(params.context, requiredRoles);
    return approval;
  }

  static async listPendingApprovals(params: { context: TenantContext; limit?: number }) {
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const allowedActionTypes = Object.entries(APPROVAL_ROLE_POLICY).filter(([, roles]) => roles.includes(params.context.userRole)).map(([actionType]) => actionType);
    const where: Prisma.WorkflowApprovalWhereInput = params.context.userRole === Role.ADMIN
      ? { decision: 'PENDING' }
      : { decision: 'PENDING', companyId: params.context.companyId, actionType: { in: allowedActionTypes } };
    return prisma.workflowApproval.findMany({
      where,
      orderBy: { requestedAt: 'asc' },
      take: limit,
      select: { id: true, workflowInstanceId: true, companyId: true, stepName: true, actionType: true, decision: true, requestedBy: true, requestedAt: true, workflowInstance: { select: { workflowType: true, status: true, currentStep: true, correlationId: true } } },
    });
  }

  static async getWorkflowStatus(params: { workflowId: string; context: TenantContext }) {
    const workflow = await prisma.workflowInstance.findUnique({
      where: { id: params.workflowId },
      select: { id: true, companyId: true, workflowType: true, status: true, currentStep: true, failureCount: true, correlationId: true, createdAt: true, updatedAt: true,
        approvals: { where: { decision: 'PENDING' }, select: { id: true, stepName: true, actionType: true, requestedAt: true } },
        steps: { orderBy: { createdAt: 'desc' }, take: 10, select: { stepName: true, attemptNumber: true, status: true, sideEffectDone: true, errorMessage: true, createdAt: true } } },
    });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    return {
      id: workflow.id, workflowType: workflow.workflowType, status: workflow.status, currentStep: workflow.currentStep,
      failureCount: workflow.failureCount, correlationId: workflow.correlationId, createdAt: workflow.createdAt, updatedAt: workflow.updatedAt,
      pendingApprovals: workflow.approvals,
      recentSteps: workflow.steps,
    };
  }

  static async completeWorkflow(params: { workflowId: string; context: TenantContext }): Promise<WorkflowInstance> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (workflow.status !== 'RUNNING') throw new Error(`Only RUNNING workflows can complete; current status is ${workflow.status}`);
    const activeSteps = await prisma.workflowStepLog.count({ where: { workflowInstanceId: workflow.id, status: 'RUNNING' } });
    if (activeSteps > 0) throw new Error('Workflow cannot complete while steps are still RUNNING');
    const stepLogs = await prisma.workflowStepLog.findMany({ where: { workflowInstanceId: workflow.id }, orderBy: [{ stepName: 'asc' }, { attemptNumber: 'desc' }] });
    const latestByStep = new Map<string, (typeof stepLogs)[number]>();
    for (const log of stepLogs) if (!latestByStep.has(log.stepName)) latestByStep.set(log.stepName, log);
    if ([...latestByStep.values()].some((log) => log.status === 'FAILED')) throw new Error('Workflow cannot complete with an unresolved failed step');
    await WorkflowEngine.assertNoUnresolvedConsequentialActions(workflow.id);
    return prisma.workflowInstance.update({ where: { id: workflow.id, status: 'RUNNING' }, data: { status: 'COMPLETED', updatedAt: new Date() } });
  }

  static async pauseForApproval(params: { workflowId: string; stepName: string; actionType: string; action: unknown; context: TenantContext }): Promise<string> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    if (workflow.status !== 'RUNNING' && workflow.status !== 'PAUSED_FOR_APPROVAL') throw new Error(`Workflow cannot request approval from status ${workflow.status}`);
    if (!APPROVAL_ROLE_POLICY[params.actionType]) throw new Error(`Unknown consequential approval action type: ${params.actionType}`);
    const digest = actionDigest(params.action);
    const approval = await prisma.$transaction(async (tx) => {
      const existing = await tx.workflowApproval.findUnique({ where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: digest } } });
      if (existing && existing.actionType !== params.actionType) throw new Error('Approval action type does not match the persisted action');
      if (existing?.decision === 'REJECTED') throw new Error('This exact consequential action was already rejected');
      if (existing?.decision === 'APPROVED') return existing;
      const record = await tx.workflowApproval.upsert({
        where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: digest } },
        update: {},
        create: { workflowInstanceId: params.workflowId, companyId: workflow.companyId, stepName: params.stepName, actionType: params.actionType, actionDigest: digest, requestedBy: params.context.userId },
      });
      if (record.decision !== 'PENDING') throw new Error('This exact consequential action was already decided');
      await tx.workflowInstance.update({ where: { id: params.workflowId }, data: { status: 'PAUSED_FOR_APPROVAL', currentStep: params.stepName } });
      if (record.decision === 'PENDING') await writeAgentApprovalAudit(tx, { userId: params.context.userId, companyId: workflow.companyId, action: 'AGENT_APPROVAL_REQUESTED', workflowId: params.workflowId, approvalId: record.id, stepName: params.stepName, actionType: params.actionType, actionDigest: digest, role: params.context.userRole });
      return record;
    });
    return approval.id;
  }

  static async decideApproval(params: { approvalId: string; decision: 'APPROVED' | 'REJECTED'; notes?: string; context: TenantContext }): Promise<WorkflowInstance> {
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    return prisma.$transaction(async (tx) => {
      const approval = await tx.workflowApproval.findUnique({ where: { id: params.approvalId }, include: { workflowInstance: true } });
      if (!approval || approval.decision !== 'PENDING') throw new Error('Pending approval not found');
      validateTenantAccess(params.context, approval.companyId);
      const requiredRoles = APPROVAL_ROLE_POLICY[approval.actionType];
      if (!requiredRoles) throw new Error(`Unknown consequential approval action type: ${approval.actionType}`);
      RbacGuard.assertRole(params.context, requiredRoles);
      const updated = await tx.workflowApproval.updateMany({
        where: { id: approval.id, decision: 'PENDING' },
        data: { decision: params.decision, decidedBy: params.context.userId, decidedByRole: params.context.userRole, decisionNotes: params.notes?.slice(0, 2000), decidedAt: new Date() },
      });
      if (updated.count !== 1) throw new Error('Approval was already decided');
      await writeAgentApprovalAudit(tx, { userId: params.context.userId, companyId: approval.companyId, action: params.decision === 'APPROVED' ? 'AGENT_APPROVAL_APPROVED' : 'AGENT_APPROVAL_REJECTED', workflowId: approval.workflowInstanceId, approvalId: approval.id, stepName: approval.stepName, actionType: approval.actionType, actionDigest: approval.actionDigest, role: params.context.userRole });

      // A workflow may have more than one consequential action awaiting human
      // review. Approving one must never resume execution while another is
      // still pending. Rejection remains terminal for the workflow.
      let nextStatus: 'RUNNING' | 'PAUSED_FOR_APPROVAL' | 'CANCELLED' = 'CANCELLED';
      if (params.decision === 'APPROVED') {
        const remainingPending = await tx.workflowApproval.count({
          where: { workflowInstanceId: approval.workflowInstanceId, decision: 'PENDING' },
        });
        // Approval is authorization, not execution. Keep the workflow paused
        // until the exact approved action has been durably consumed/executed.
        nextStatus = 'PAUSED_FOR_APPROVAL';
      }
      return tx.workflowInstance.update({
        where: { id: approval.workflowInstanceId, status: 'PAUSED_FOR_APPROVAL' },
        data: { status: nextStatus, updatedAt: new Date() },
      });
    });
  }

  static async consumeApprovedAction(params: { workflowId: string; stepName: string; action: unknown; context: TenantContext }): Promise<void> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    const approval = await prisma.workflowApproval.findUnique({
      where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: actionDigest(params.action) } },
    });
    if (!approval || approval.decision !== 'APPROVED' || !approval.decidedBy || !approval.decidedAt) throw new Error('Persisted human approval is required for this exact action');
    const requiredRoles = APPROVAL_ROLE_POLICY[approval.actionType];
    if (!requiredRoles || !approval.decidedByRole || !requiredRoles.includes(approval.decidedByRole)) throw new Error('Persisted approval was not granted by an authorized role');
    const consumedAt = new Date();
    const consumed = await prisma.$transaction(async (tx) => {
      const updated = await tx.workflowApproval.updateMany({ where: { id: approval.id, decision: 'APPROVED', consumedAt: null }, data: { consumedAt } });
      if (updated.count !== 1) throw new Error('Approval has already been consumed');
      await writeAgentApprovalAudit(tx, { userId: params.context.userId, companyId: workflow.companyId, action: 'AGENT_APPROVAL_CONSUMED', workflowId: params.workflowId, approvalId: approval.id, stepName: approval.stepName, actionType: approval.actionType, actionDigest: approval.actionDigest, role: params.context.userRole });
      return updated;
    });
    if (consumed.count !== 1) throw new Error('Approval consumption failed');
    const pending = await prisma.workflowApproval.count({ where: { workflowInstanceId: params.workflowId, decision: 'PENDING' } });
    const unconsumed = await prisma.workflowApproval.count({ where: { workflowInstanceId: params.workflowId, decision: 'APPROVED', consumedAt: null } });
    const rejected = await prisma.workflowApproval.count({ where: { workflowInstanceId: params.workflowId, decision: 'REJECTED' } });
    if (pending === 0 && unconsumed === 0 && rejected === 0) {
      await prisma.workflowInstance.updateMany({ where: { id: params.workflowId, status: 'PAUSED_FOR_APPROVAL' }, data: { status: 'RUNNING', updatedAt: new Date() } });
    }
  }

  static async recoverInterruptedSteps(workflowId: string, context: TenantContext): Promise<number> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(context, workflow.companyId);
    RbacGuard.assertRole(context, APPROVER_ROLES);
    // A RUNNING row does not prove whether an external side effect happened.
    // Never replay it automatically. Mark it failed for explicit idempotent
    // recovery and preserve evidence for operators/workers.
    const interrupted = await prisma.workflowStepLog.findMany({
      where: { workflowInstanceId: workflowId, status: 'RUNNING', sideEffectDone: false },
      select: { id: true, executionKey: true },
    });
    if (!interrupted.length) return 0;
    await prisma.$transaction(async (tx) => {
      await tx.workflowStepLog.updateMany({
        where: { id: { in: interrupted.map((step) => step.id) }, status: 'RUNNING', sideEffectDone: false },
        data: { status: 'FAILED', errorMessage: 'Interrupted execution requires idempotent recovery; automatic side-effect replay is blocked.' },
      });
      await tx.workflowInstance.update({ where: { id: workflowId }, data: { status: 'FAILED', failureCount: { increment: 1 } } });
      for (const step of interrupted) {
        await tx.deadLetterJob.upsert({
          where: { sourceType_sourceId: { sourceType: 'WorkflowStep', sourceId: step.executionKey } },
          update: { errorType: 'InterruptedExecution', errorMessage: 'Worker/process interruption detected; verify provider state before retry.', status: 'OPEN' },
          create: { sourceType: 'WorkflowStep', sourceId: step.executionKey, correlationId: workflow.correlationId, errorType: 'InterruptedExecution', errorMessage: 'Worker/process interruption detected; verify provider state before retry.', status: 'OPEN' },
        });
      }
    });
    return interrupted.length;
  }
}
