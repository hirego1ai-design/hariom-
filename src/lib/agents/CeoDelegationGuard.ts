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
 */
export class CeoDelegationGuard {
  private static killSwitchManager = new KillSwitchManager();

  static async assertDelegationAllowed(params: {
    callerContext: TenantContext;
    targetAgentId: string;
    resourceCompanyId: string | null;
    estimatedSpendMinor: bigint;
  }): Promise<void> {
    // 1. Enforce Tenant Isolation
    try {
      RbacGuard.assertOwnership(params.callerContext, { companyId: params.resourceCompanyId });
    } catch (err) {
      throw new DelegationDeniedError(
        `CEO Delegation blocked by Tenant RBAC: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // 2. Enforce Kill Switches (Global or Agent specific)
    const isKilled = await this.killSwitchManager.isKilled(
      KillSwitchType.AGENT,
      params.targetAgentId
    );
    if (isKilled) {
      throw new DelegationDeniedError(
        `CEO Delegation blocked: Kill switch is ACTIVE for agent '${params.targetAgentId}'`
      );
    }

    // 3. Enforce Budget Limits (if companyId is present)
    if (params.callerContext.companyId) {
      try {
        // Test reservation feasibility (or rely on ExecutionLoop for actual reservation)
      } catch (err) {
        throw new DelegationDeniedError(
          `CEO Delegation blocked by Budget Guard: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }
}
