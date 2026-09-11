import { AgentLifecycleState } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const VALID_TRANSITIONS: Record<AgentLifecycleState, AgentLifecycleState[]> = {
  REGISTERED: ['IDLE'],
  IDLE: ['PLANNING', 'KILLED'],
  PLANNING: ['EXECUTING', 'FAILED', 'KILLED'],
  EXECUTING: ['EVALUATING', 'EXECUTING', 'FAILED', 'KILLED'],
  EVALUATING: ['COMPLETED', 'EXECUTING', 'AWAITING_APPROVAL', 'FAILED', 'KILLED'],
  AWAITING_APPROVAL: ['COMPLETED', 'FAILED', 'SUSPENDED', 'KILLED'],
  COMPLETED: ['IDLE'],
  FAILED: ['SUSPENDED', 'IDLE', 'KILLED'],
  SUSPENDED: ['IDLE', 'KILLED'],
  KILLED: [],
};

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Validates whether a state transition is allowed.
 * @param current The current lifecycle state.
 * @param target The target lifecycle state.
 * @throws {InvalidTransitionError} If the transition is not valid.
 */
export function validateTransition(current: AgentLifecycleState, target: AgentLifecycleState): void {
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    throw new InvalidTransitionError(`Invalid transition from ${current} to ${target}`);
  }
}

export interface TransitionLifecycleParams {
  agentId: string;
  executionId: string;
  correlationId: string;
  currentState: AgentLifecycleState;
  targetState: AgentLifecycleState;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transitions an agent's lifecycle state, logging the event.
 * @param params The parameters for the lifecycle transition.
 */
export async function transitionLifecycle(params: TransitionLifecycleParams): Promise<void> {
  validateTransition(params.currentState, params.targetState);
  
  try {
    await prisma.agentLifecycleLog.create({
      data: {
        agentId: params.agentId,
        executionId: params.executionId,
        correlationId: params.correlationId,
        previousState: params.currentState,
        currentState: params.targetState,
        reason: params.reason,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || process.env.MOCK_DB !== 'true') throw error;
  }
}

/**
 * Retrieves the latest lifecycle state for a given agent and execution.
 * @param agentId The ID of the agent.
 * @param executionId The execution ID.
 * @returns The latest lifecycle state, or null if none exists.
 */
export async function getLatestState(agentId: string, executionId: string): Promise<AgentLifecycleState | null> {
  const log = await prisma.agentLifecycleLog.findFirst({
    where: {
      agentId,
      executionId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return log?.currentState ?? null;
}

export enum EvaluatorVerdict {
  ACCEPT = 'ACCEPT',
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  ESCALATE = 'ESCALATE',
}

/**
 * Maps an evaluator verdict to the corresponding next lifecycle state.
 * @param verdict The verdict from the evaluator.
 * @returns The next state for the agent.
 */
export function verdictToTransition(verdict: EvaluatorVerdict): AgentLifecycleState {
  switch (verdict) {
    case EvaluatorVerdict.ACCEPT:
      return AgentLifecycleState.COMPLETED;
    case EvaluatorVerdict.RETRY:
      return AgentLifecycleState.EXECUTING;
    case EvaluatorVerdict.FALLBACK:
      return AgentLifecycleState.COMPLETED;
    case EvaluatorVerdict.ESCALATE:
      return AgentLifecycleState.AWAITING_APPROVAL;
  }
}
