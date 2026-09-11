import { OutboxPoller, type OutboxPollReport } from '../events/Outbox';
import { BudgetManager } from '../governance/BudgetManager';
import { prisma } from '@/lib/prisma';
import { registerProductionConsumers } from '../events/ProductionConsumers';

export interface RecoveryReport {
  reclaimedOutboxEntries: number;
  expiredReservations: number;
  failedWorkflowsEnqueued: number;
  outbox: OutboxPollReport;
  timeBudgetExhausted: boolean;
}

export class FailureRecoveryRunner {
  /**
   * Periodically recovers system state from worker crashes, database disconnects, or timeouts.
   */
  static async runRecoveryPass(): Promise<RecoveryReport> {
    registerProductionConsumers();
    // Cooperative deadline: stop claiming new work after 40 seconds. An
    // already-running effect must finish using its own provider timeout.
    const stopAt = Date.now() + 40_000;
    // 1. Reclaim abandoned Outbox PROCESSING rows & process PENDING rows
    const outbox = await OutboxPoller.pollAndProcess(20, 90_000, stopAt);

    // 2. Expire stale held budget reservations
    const expiredReservations = Date.now() < stopAt ? await BudgetManager.expireStaleReservations(20, stopAt) : 0;

    // 3. Scan for hung/stuck workflow instances past 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckWorkflows = Date.now() < stopAt ? await prisma.workflowInstance.findMany({
      where: {
        status: 'RUNNING',
        updatedAt: { lt: tenMinutesAgo },
      },
      take: 20,
      orderBy: { updatedAt: 'asc' },
    }) : [];

    let failedWorkflowsEnqueued = 0;
    for (const workflow of stuckWorkflows) {
      if (Date.now() >= stopAt) break;
      // Do not fail a workflow that advanced after the scan. Persist its
      // terminal status together with an actionable dead-letter record.
      const enqueued = await prisma.$transaction(async (tx) => {
        const claimed = await tx.workflowInstance.updateMany({
          where: { id: workflow.id, status: 'RUNNING', updatedAt: workflow.updatedAt },
          data: { status: 'FAILED', updatedAt: new Date() },
        });
        if (claimed.count !== 1) return false;
        await tx.deadLetterJob.create({ data: {
          sourceType: 'WorkflowInstance', sourceId: workflow.id, correlationId: workflow.correlationId,
          errorType: 'WorkflowStuckTimeout', errorMessage: 'Workflow exceeded its inactivity threshold; reconcile side effects before retrying.',
          status: 'OPEN', retryCount: 0,
        } });
        return true;
      });
      if (enqueued) failedWorkflowsEnqueued++;
    }

    return {
      reclaimedOutboxEntries: outbox.reclaimed,
      expiredReservations,
      failedWorkflowsEnqueued,
      outbox,
      timeBudgetExhausted: Date.now() >= stopAt,
    };
  }
}
