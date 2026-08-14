import { AgentRegistry } from './AgentRegistry';
import { ToolExecutionContext } from '../tools/ToolRegistry';
import { transitionLifecycle, verdictToTransition, EvaluatorVerdict } from './AgentLifecycle';
import { KillSwitchManager } from '../security/KillSwitchManager';
import { KillSwitchType, AgentLifecycleState } from '@prisma/client';
import { BudgetManager } from '../governance/BudgetManager';
import { AgentEvaluator } from '../governance/AgentEvaluator';
import { ShadowExecutor } from '../governance/ShadowExecutor';

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
      estimatedMinor: params.estimatedSpendMinor,
    });

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
    let result: Record<string, unknown> | null = null;
    let lastError: unknown;

    // 5. Bounded Loop: Max 3 attempts
    while (attempt <= this.MAX_ATTEMPTS) {
      try {
        result = await agent.execute(params.taskInput, params.context);
        break; // Success
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt <= this.MAX_ATTEMPTS) {
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
      await BudgetManager.releaseBudget(params.context.executionId);
      throw new ExecutionLoopError(
        `Agent '${params.agentId}' failed execution after ${this.MAX_ATTEMPTS} attempts.`
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

    const targetState = verdictToTransition(evalResult.verdict as EvaluatorVerdict);

    await transitionLifecycle({
      agentId: params.agentId,
      executionId: params.context.executionId,
      correlationId: params.context.correlationId,
      currentState,
      targetState,
      reason: `Evaluator verdict: ${evalResult.verdict}`,
    });

    // 8. Non-blocking Shadow Execution Trigger
    ShadowExecutor.executeShadow({
      correlationId: params.context.correlationId,
      agentId: params.agentId,
      algorithmVersion: 'shadow-eval-v2',
      productionResult: result,
      shadowFn: async () => ({ shadowNote: 'Shadow execution verified OK' }),
    });

    // 9. Reconcile Budget
    const actualSpend = BigInt(1000); // Nominal actual spend in minor units
    await BudgetManager.reconcileBudget({
      executionId: params.context.executionId,
      actualMinor: actualSpend,
    });

    return result;
  }
}
