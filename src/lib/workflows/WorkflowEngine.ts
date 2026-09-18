import { prisma } from '@/lib/prisma';
import { WorkflowInstance, Prisma, Role } from '@prisma/client';
import { createHash } from 'crypto';
import { TenantContext, validateTenantAccess } from '@/lib/security/TenantContext';
import { RbacGuard } from '@/lib/security/RbacGuard';

const APPROVER_ROLES: Role[] = [Role.EMPLOYER, Role.RECRUITER, Role.ADMIN];

function actionDigest(action: unknown): string {
  return createHash('sha256').update(JSON.stringify(action ?? null)).digest('hex');
}

export class WorkflowEngine {
  static async startWorkflow(params: {
    workflowType: string; companyId?: string | null; jobId?: string | null; candidateId?: string | null;
    applicationId?: string | null; correlationId: string; initiatedBy: string; initialStep: string;
    checkpointState: Record<string, unknown>;
  }): Promise<WorkflowInstance> {
    const { initialStep, checkpointState, ...data } = params;
    return prisma.workflowInstance.create({ data: { ...data, currentStep: initialStep, checkpointState: checkpointState as Prisma.InputJsonValue, status: 'RUNNING' } });
  }

  static async executeStep<T>(workflowId: string, stepName: string, attemptNumber: number, inputPayload: unknown, stepFn: () => Promise<T>): Promise<T> {
    const executionKey = `${workflowId}:${stepName}:${attemptNumber}`;
    const previous = await prisma.workflowStepLog.findUnique({ where: { executionKey } });
    if (previous?.status === 'COMPLETED' && previous.sideEffectDone) return previous.outputPayload as T;
    await prisma.workflowStepLog.create({ data: { executionKey, workflowInstanceId: workflowId, stepName, attemptNumber, status: 'RUNNING', inputPayload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue } });
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
        const workflow = await tx.workflowInstance.update({ where: { id: workflowId }, data: { status: 'FAILED', updatedAt: new Date() } });
        if (attemptNumber >= 3) await tx.deadLetterJob.create({ data: { sourceType: 'WorkflowStep', sourceId: executionKey, correlationId: workflow.correlationId, errorType: 'StepFailed', errorMessage, payload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue, status: 'OPEN' } });
      });
      throw error;
    }
  }

  static async pauseForApproval(params: { workflowId: string; stepName: string; actionType: string; action: unknown; context: TenantContext }): Promise<string> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    const digest = actionDigest(params.action);
    const approval = await prisma.$transaction(async (tx) => {
      const record = await tx.workflowApproval.upsert({
        where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: digest } },
        update: {},
        create: { workflowInstanceId: params.workflowId, companyId: workflow.companyId, stepName: params.stepName, actionType: params.actionType, actionDigest: digest, requestedBy: params.context.userId },
      });
      await tx.workflowInstance.update({ where: { id: params.workflowId }, data: { status: 'PAUSED_FOR_APPROVAL', currentStep: params.stepName } });
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
      const updated = await tx.workflowApproval.updateMany({
        where: { id: approval.id, decision: 'PENDING' },
        data: { decision: params.decision, decidedBy: params.context.userId, decidedByRole: params.context.userRole, decisionNotes: params.notes?.slice(0, 2000), decidedAt: new Date() },
      });
      if (updated.count !== 1) throw new Error('Approval was already decided');
      return tx.workflowInstance.update({
        where: { id: approval.workflowInstanceId, status: 'PAUSED_FOR_APPROVAL' },
        data: { status: params.decision === 'APPROVED' ? 'RUNNING' : 'CANCELLED', updatedAt: new Date() },
      });
    });
  }

  static async assertApprovedAction(params: { workflowId: string; stepName: string; action: unknown; context: TenantContext }): Promise<void> {
    const workflow = await prisma.workflowInstance.findUnique({ where: { id: params.workflowId } });
    if (!workflow) throw new Error('Workflow not found');
    validateTenantAccess(params.context, workflow.companyId);
    const approval = await prisma.workflowApproval.findUnique({
      where: { workflowInstanceId_stepName_actionDigest: { workflowInstanceId: params.workflowId, stepName: params.stepName, actionDigest: actionDigest(params.action) } },
    });
    if (!approval || approval.decision !== 'APPROVED' || !approval.decidedBy || !approval.decidedAt) throw new Error('Persisted human approval is required for this exact action');
  }
}
