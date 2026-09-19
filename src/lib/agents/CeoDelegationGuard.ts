import { TenantContext } from '../security/TenantContext';
import { RbacGuard } from '../security/RbacGuard';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { KillSwitchType } from '@prisma/client';
import { BudgetManager } from '../governance/BudgetManager';

export class DelegationDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DelegationDeniedError';
  }
}

/**
 * Governing Rule: The CEO agent (or orchestrator) is NOT a privileged super-agent.
 * CEO agent delegations must strictly obey tenant boundaries, RBAC permissions,
 * budget limits, and kill switches.
 *
 * Budget authorization is performed by the same durable reservation used by
 * ExecutionLoop. A delegation guard must never perform a disposable "probe"
 * reservation because that can double-debit AI entitlements when execution
 * subsequently reserves again.
 */
export class CeoDelegationGuard {
  private static killSwitchManager = new KillSwitchManager();

  static async assertDelegationAllowed(params: {
    callerContext: TenantContext;
    targetAgentId: string;
    resourceCompanyId: string | null;
    estimatedSpendMinor: bigint;
    executionId?: string;
    correlationId?: string;
    reserveBudget?: boolean;
    billableAgentId?: string;
  }): Promise<void> {
    try {
      RbacGuard.assertOwnership(params.callerContext, { companyId: params.resourceCompanyId });
    } catch (err) {
      throw new DelegationDeniedError(
        `CEO Delegation blocked by Tenant RBAC: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const isKilled = await this.killSwitchManager.isKilled(
      KillSwitchType.AGENT,
      params.targetAgentId
    );
    if (isKilled) {
      throw new DelegationDeniedError(
        `CEO Delegation blocked: Kill switch is ACTIVE for agent '${params.targetAgentId}'`
      );
    }

    if (params.estimatedSpendMinor < BigInt(0)) {
      throw new DelegationDeniedError('CEO Delegation blocked: estimated spend cannot be negative');
    }

    // Callers that want this guard to authorize billable execution must provide
    // the durable execution identity and opt into the reservation here. This
    // makes the budget decision real and fail-closed rather than a no-op.
    if (params.reserveBudget) {
      const companyId = params.callerContext.companyId;
      if (!companyId || !params.executionId || !params.correlationId) {
        throw new DelegationDeniedError(
          'CEO Delegation blocked: durable execution, correlation, and company identity are required for budget authorization'
        );
      }

      try {
        await BudgetManager.reserveBudget({
          companyId,
          executionId: params.executionId,
          correlationId: params.correlationId,
          estimatedMinor: params.estimatedSpendMinor,
          billableAgentId: params.billableAgentId,
        });
      } catch (err) {
        throw new DelegationDeniedError(
          `CEO Delegation blocked by Budget Guard: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }
}
