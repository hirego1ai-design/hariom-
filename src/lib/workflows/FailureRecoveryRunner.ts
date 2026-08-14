import { OutboxPoller } from '../events/Outbox';
import { BudgetManager } from '../governance/BudgetManager';
import { prisma } from '@/lib/prisma';
import { DlqManager } from '../reliability/DlqManager';

export interface RecoveryReport {
  reclaimedOutboxEntries: number;
  expiredReservations: number;
  failedWorkflowsEnqueued: number;
}

export class FailureRecoveryRunner {
  /**
   * Periodically recovers system state from worker crashes, database disconnects, or timeouts.
   */
  static async runRecoveryPass(): Promise<RecoveryReport> {
    // 1. Reclaim abandoned Outbox PROCESSING rows & process PENDING rows
    await OutboxPoller.pollAndProcess(20, 60000);

    // 2. Expire stale held budget reservations
    const expiredReservations = await BudgetManager.expireStaleReservations();

    // 3. Scan for hung/stuck workflow instances past 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckWorkflows = await prisma.workflowInstance.findMany({
      where: {
        status: 'RUNNING',
        updatedAt: { lt: tenMinutesAgo },
      },
    });

    let failedWorkflowsEnqueued = 0;
    for (const workflow of stuckWorkflows) {
      await prisma.workflowInstance.update({
        where: { id: workflow.id },
        data: { status: 'FAILED', updatedAt: new Date() },
      });

      await DlqManager.enqueue({
        sourceType: 'WorkflowInstance',
        sourceId: workflow.id,
        correlationId: workflow.correlationId,
        errorType: 'WorkflowStuckTimeout',
        errorMessage: `Workflow ${workflow.id} stuck in RUNNING state past 10 minutes`,
      });

      failedWorkflowsEnqueued++;
    }

    return {
      reclaimedOutboxEntries: 0,
      expiredReservations,
      failedWorkflowsEnqueued,
    };
  }
}
