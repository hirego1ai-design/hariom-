import { ToolExecutionContext } from '../tools/ToolRegistry';

export abstract class BaseAgent {
  public abstract readonly agentId: string;
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly allowedTools: string[];
  /**
   * Canonical ModelRouter task key for agents that invoke an LLM.
   * Null means this agent is deterministic/non-LLM and must not be presented
   * as using a model in Admin telemetry.
   */
  public readonly routingTaskType: string | null = null;

  /**
   * Executes the agent logic. Returns structured JSON output.
   */
  public abstract execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>>;
}
