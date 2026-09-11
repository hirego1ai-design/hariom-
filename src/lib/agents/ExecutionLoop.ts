import { AgentRegistry } from './AgentRegistry';
import { ToolExecutionContext } from '../tools/ToolRegistry';
import { transitionLifecycle, verdictToTransition, EvaluatorVerdict } from './AgentLifecycle';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { KillSwitchType, AgentLifecycleState } from '@prisma/client';
import { BudgetManager } from '../governance/BudgetManager';
import { AgentEvaluator } from '../governance/AgentEvaluator';
import { isBillableAiAgent } from '../governance/AiEntitlements';
import { validateTenantAccess } from '../security/TenantContext';

export class ExecutionLoopError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionLoopError';
  }
}

export class ExecutionLoop {
  private static killSwitchManager = new KillSwitchManager();
  private static MAX_ATTEMPTS = 3;

  /**
   * Runs a bounded autonomous execution loop for an agent task.
   */
  static async runTask(params: {
    agentId: string;
    taskInput: Record<string, unknown>;
    context: ToolExecutionContext;
    companyId: string;
    estimatedSpendMinor: bigint;
  }): Promise<Record<string, unknown>> {
    const registry = AgentRegistry.getInstance();
    const agent = registry.get(params.agentId);

    validateTenantAccess(params.context.tenantContext, params.companyId);
    if (params.context.agentId !== params.agentId) throw new ExecutionLoopError('Agent context mismatch');
    const billable = isBillableAiAgent(params.agentId);
    const estimatedMinor = billable ? params.estimatedSpendMinor : BigInt(0);
    if (billable && estimatedMinor <= BigInt(0)) throw new ExecutionLoopError('Billable agents require a positive budget reservation');

    // 1. Assert Kill Switch is NOT active
    await this.killSwitchManager.assertNotKilled(KillSwitchType.AGENT, params.agentId);

    // 2. Lifecycle: REGISTERED -> IDLE -> PLANNING
    let currentState: AgentLifecycleState = AgentLifecycleState.IDLE;
    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState: AgentLifecycleState.REGISTERED,
      targetState: AgentLifecycleState.IDLE,
      reason: 'Agent initialized',
    });

    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState,
      targetState: AgentLifecycleState.PLANNING,
      reason: 'Planning task execution',
    });
    currentState = AgentLifecycleState.PLANNING;

    // 3. Reserve Budget
    await BudgetManager.reserveBudget({
      companyId: params.companyId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      estimatedMinor,
      billableAgentId: billable ? params.agentId : undefined,
    });

    let executionStarted = false;
    let result: Record<string, unknown> | null = null;
    try {
    // 4. Lifecycle: PLANNING -> EXECUTING
    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState,
      targetState: AgentLifecycleState.EXECUTING,
      reason: 'Executing agent logic',
    });
    currentState = AgentLifecycleState.EXECUTING;

    let attempt = 1;
    let lastError: unknown;
    // A timed-out or invalid model response may already be billed. There is
    // no provider idempotency contract here, so billable calls are not replayed.
    const maxAttempts = billable ? 1 : this.MAX_ATTEMPTS;

    // 5. Bounded Loop: Max 3 attempts
    while (attempt <= maxAttempts) {
      try {
        await this.killSwitchManager.assertNotKilled(KillSwitchType.AGENT, params.agentId);
        executionStarted = true;
        result = await agent.execute(params.taskInput, params.context);
        break; // Success
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt <= maxAttempts) {
          // Retry transition
          await transitionLifecycle({
            agentId: params.agentId,
            executionId: params.context.executionId,
            correlationId: params.context.correlationId,
            currentState,
            targetState: AgentLifecycleState.EXECUTING,
            reason: `Retrying execution attempt ${attempt}`,
          });
        }
      }
    }

    if (!result) {
      // Failed after max attempts
      await transitionLifecycle({
        agentId: params.agentId,
        executionId: params.context.executionId,
        correlationId: params.context.correlationId,
        currentState,
        targetState: AgentLifecycleState.FAILED,
        reason: lastError instanceof Error ? lastError.message : 'Execution failed after max attempts',
      });
      throw new ExecutionLoopError(
        `Agent '${params.agentId}' failed execution after ${maxAttempts} attempts.`
      );
    }

    // 6. Lifecycle: EXECUTING -> EVALUATING
    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState,
      targetState: AgentLifecycleState.EVALUATING,
      reason: 'Evaluating agent output',
    });
    currentState = AgentLifecycleState.EVALUATING;

    // 7. Evaluate Output
    const evalResult = await AgentEvaluator.evaluate({
      companyId: params.companyId,
      correlationId: params.context.correlationId,
      executionId: params.context.executionId,
      agentId: params.agentId,
      output: result,
    });

    const targetState = evalResult.verdict === 'ESCALATE'
      ? AgentLifecycleState.AWAITING_APPROVAL
      : evalResult.verdict === 'ACCEPT'
        ? verdictToTransition(evalResult.verdict as EvaluatorVerdict)
        : AgentLifecycleState.FAILED;

    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState,
      targetState,
      reason: `Evaluator verdict: ${evalResult.verdict}`,
    });

    if (evalResult.verdict !== 'ACCEPT') {
      throw new ExecutionLoopError(`Agent output was not accepted: ${evalResult.verdict}. Review is required.`);
    }

    return result;
    } finally {
      // Every path after reservation settles, including evaluation/logging
      // failures. Unknown provider spend remains conservatively accounted for.
      if (!executionStarted) {
        await BudgetManager.releaseBudget(params.context.executionId, billable);
      } else {
        const actualSpend = result?.actualCostMinorUnits;
        const knownSpend = (typeof actualSpend === 'bigint' && actualSpend >= BigInt(0)) ||
          (typeof actualSpend === 'number' && Number.isSafeInteger(actualSpend) && actualSpend >= 0);
        await BudgetManager.reconcileBudget({
          executionId: params.context.executionId,
          actualMinor: billable && knownSpend ? BigInt(actualSpend as bigint | number) : estimatedMinor,
        });
      }
    }
  }
}
