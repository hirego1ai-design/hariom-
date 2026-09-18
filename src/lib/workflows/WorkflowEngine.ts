import { prisma } from '@/lib/prisma';
import { WorkflowInstance, Prisma, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { TenantContext, validateTenantAccess } from '@/lib/security/TenantContext';
import { RbacGuard } from '@/lib/security/RbacGuard';
import { writeAgentApprovalAudit } from '@/lib/security/AgentApprovalAudit';

const APPROVER_ROLES: Role[] = [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN];
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
    if (data.applicationId) {
      const application = await prisma.application.findUnique({ where: { id: data.applicationId }, select: { job: { select: { companyId: true } } } });
      if (!application) throw new Error('Application not found');
      validateTenantAccess(context, application.job.companyId);
      if (data.companyId && application.job.companyId !== data.companyId) throw new Error('Workflow application does not belong to the workflow company');
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

  static async listPendingApprovals(params: { context: TenantContext; limit?: number }) {
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const where = params.context.userRole === Role.ADMIN ? { decision: 'PENDING' as const } : { decision: 'PENDING' as const, companyId: params.context.companyId };
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
        stepLogs: { orderBy: { createdAt: 'desc' }, take: 10, select: { stepName: true, attemptNumber: true, status: true, sideEffectDone: true, errorMessage: true, createdAt: true } } },
    });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    RbacGuard.assertRole(params.context, APPROVER_ROLES);
    return {
      id: workflow.id, workflowType: workflow.workflowType, status: workflow.status, currentStep: workflow.currentStep,
      failureCount: workflow.failureCount, correlationId: workflow.correlationId, createdAt: workflow.createdAt, updatedAt: workflow.updatedAt,
      pendingApprovals: workflow.approvals,
      recentSteps: workflow.stepLogs,
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
    const failedSteps = await prisma.workflowStepLog.count({ where: { workflowInstanceId: workflow.id, status: 'FAILED' } });
    if (failedSteps > 0) throw new Error('Workflow cannot complete with failed steps');
    const pendingApprovals = await prisma.workflowApproval.count({ where: { workflowInstanceId: workflow.id, decision: 'PENDING' } });
    if (pendingApprovals > 0) throw new Error('Workflow cannot complete with pending approvals');
    return prisma.workflowInstance.update({ where: { id: workflow.id, status: 'RUNNING' }, data: { status: 'COMPLETED', updatedAt: new Date() } });
  }

  static async pauseForApproval(params: { workflowId: string; stepName: string; actionType: string; action: unknown; context: TenantContext }): Promise<string> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    if (!APPROVAL_ROLE_POLICY[params.actionType]) throw new Error(`Unknown consequential approval action type: ${params.actionType}`);
    const digest = actionDigest(params.action);
    const approval = await prisma.$transaction(async (tx) => {
      const record = await tx.workflowApproval.upsert({
        where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: digest } },
        update: {},
        create: { workflowInstanceId: params.workflowId, companyId: workflow.companyId, stepName: params.stepName, actionType: params.actionType, actionDigest: digest, requestedBy: params.context.userId },
      });
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
      return tx.workflowInstance.update({
        where: { id: approval.workflowInstanceId, status: 'PAUSED_FOR_APPROVAL' },
        data: { status: params.decision === 'APPROVED' ? 'RUNNING' : 'CANCELLED', updatedAt: new Date() },
      });
    });
  }

  static async consumeApprovedAction(params: { workflowId: string; stepName: string; action: unknown; context: TenantContext }): Promise<void> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    const approval = await prisma.workflowApproval.findUnique({
      where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: actionDigest(params.action) } },
    });
    if (!approval || approval.decision !== 'APPROVED' || !approval.decidedBy || !approval.decidedAt) throw new Error('Persisted human approval is required for this exact action');
    const consumed = await prisma.workflowApproval.updateMany({ where: { id: approval.id, decision: 'APPROVED', consumedAt: null }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) throw new Error('Approval has already been consumed');
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
