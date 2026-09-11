import { prisma } from '@/lib/prisma';
import { WorkflowInstance, Prisma } from '@prisma/client';

export class WorkflowEngine {
  static async startWorkflow(params: {
    workflowType: string;
    companyId?: string | null;
    jobId?: string | null;
    candidateId?: string | null;
    applicationId?: string | null;
    correlationId: string;
    initiatedBy: string;
    initialStep: string;
    checkpointState: Record<string, unknown>;
  }): Promise<WorkflowInstance> {
    const { initialStep, checkpointState, ...data } = params;
    return prisma.workflowInstance.create({
      data: { ...data, currentStep: initialStep, checkpointState: checkpointState as Prisma.InputJsonValue, status: 'RUNNING' },
    });
  }

  static async executeStep<T>(
    workflowId: string, stepName: string, attemptNumber: number,
    inputPayload: unknown, stepFn: () => Promise<T>
  ): Promise<T> {
    const executionKey = `${workflowId}:${stepName}:${attemptNumber}`;
    const previous = await prisma.workflowStepLog.findUnique({ where: { executionKey } });
    if (previous?.status === 'COMPLETED' && previous.sideEffectDone) return previous.outputPayload as T;
    // The unique execution key is the claim. Never execute a side effect when
    // another worker owns it, or when persistence is unavailable.
    await prisma.workflowStepLog.create({
      data: {
        executionKey, workflowInstanceId: workflowId, stepName, attemptNumber, status: 'RUNNING',
        inputPayload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue,
      },
    });
    try {
      // Do not use a non-cancelling Promise.race: it marked a live side effect
      // failed while the original operation continued in the background.
      // Providers own bounded request timeouts; recovery requires idempotency.
      const result = await stepFn();
      await prisma.$transaction(async (tx) => {
        await tx.workflowStepLog.update({
          where: { executionKey },
          data: { status: 'COMPLETED', sideEffectDone: true, outputPayload: result == null ? Prisma.JsonNull : result as Prisma.InputJsonValue },
        });
        await tx.workflowInstance.update({
          where: { id: workflowId }, data: { currentStep: stepName, updatedAt: new Date() },
        });
      });
      return result;
    } catch (error) {
      await prisma.$transaction(async (tx) => {
        const errorMessage = error instanceof Error ? error.message : 'Step execution failed';
        await tx.workflowStepLog.update({ where: { executionKey }, data: { status: 'FAILED', errorMessage } });
        const workflow = await tx.workflowInstance.update({
          where: { id: workflowId }, data: { status: 'FAILED', updatedAt: new Date() },
        });
        if (attemptNumber >= 3) {
          await tx.deadLetterJob.create({
            data: {
              sourceType: 'WorkflowStep', sourceId: executionKey, correlationId: workflow.correlationId,
              errorType: 'StepFailed', errorMessage,
              payload: inputPayload == null ? Prisma.JsonNull : inputPayload as Prisma.InputJsonValue,
              status: 'OPEN',
            },
          });
        }
      });
      throw error;
    }
  }

  static async pauseForApproval(workflowId: string, stepName: string): Promise<void> {
    await prisma.workflowInstance.update({
      where: { id: workflowId },
      data: { status: 'PAUSED_FOR_APPROVAL', currentStep: stepName, updatedAt: new Date() },
    });
  }

  static async resumeWorkflow(workflowId: string, approvedBy: string): Promise<WorkflowInstance> {
    if (!approvedBy.trim()) throw new Error('An approver is required');
    return prisma.workflowInstance.update({
      where: { id: workflowId, status: 'PAUSED_FOR_APPROVAL' },
      data: { status: 'RUNNING', updatedAt: new Date() },
    });
  }
}
