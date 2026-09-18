import { OutboxPoller, type OutboxPollReport } from '../events/Outbox';
import { BudgetManager } from '../governance/BudgetManager';
import { prisma } from '@/lib/prisma';
import { registerProductionConsumers } from '../events/ProductionConsumers';
import { PphBillingWorker } from '../pph-billing';
import { WhatsAppQueueRecovery, type WhatsAppRecoveryReport } from '../whatsapp-queue';
import { SecurityAuditDeliveryWorker, type SecurityAuditDeliveryReport } from '../securityAuditDelivery';
import { recoverStaleVideoAnalysisJobs } from '../videoAnalysisQueue';

export interface RecoveryReport {
  pphBilling?: { invoiced: number; held: number };
  reclaimedOutboxEntries: number;
  expiredReservations: number;
  failedWorkflowsEnqueued: number;
  outbox: OutboxPollReport;
  whatsapp?: WhatsAppRecoveryReport;
  securityAudit?: SecurityAuditDeliveryReport;
  videoAnalysis?: { scanned: number; retried: number; exhausted: number };
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
    const pphBilling = await PphBillingWorker.run(20, Math.min(stopAt, Date.now() + 15_000));
    // 1. Reclaim abandoned Outbox PROCESSING rows & process PENDING rows
    const outbox = await OutboxPoller.pollAndProcess(20, 90_000, stopAt);

    // Republish durable WhatsApp records that lost queue delivery, and drain
    // the security audit outbox when an external SIEM is configured.
    const whatsapp = Date.now() < stopAt
      ? await WhatsAppQueueRecovery.run(5, stopAt)
      : { eligible: 0, scheduled: 0, failed: 0, timeBudgetExhausted: true };
    const securityAudit = Date.now() < stopAt
      ? await SecurityAuditDeliveryWorker.run(4)
      : { configured: Boolean(process.env.SIEM_WEBHOOK_URL && process.env.SIEM_WEBHOOK_TOKEN), pending: 0, delivered: 0, retried: 0, failed: 0, unclaimed: 0 };

    const videoAnalysis = Date.now() < stopAt
      ? await recoverStaleVideoAnalysisJobs(10)
      : { scanned: 0, retried: 0, exhausted: 0 };

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
      pphBilling,
      reclaimedOutboxEntries: outbox.reclaimed,
      expiredReservations,
      failedWorkflowsEnqueued,
      outbox,
      whatsapp,
      securityAudit,
      videoAnalysis,
      timeBudgetExhausted: Date.now() >= stopAt,
    };
  }
}
