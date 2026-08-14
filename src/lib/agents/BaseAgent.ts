import { ToolExecutionContext } from '../tools/ToolRegistry';

export abstract class BaseAgent {
  public abstract readonly agentId: string;
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly allowedTools: string[];

  /**
   * Executes the agent logic. Returns structured JSON output.
   */
  public abstract execute(
    taskInput: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<Record<string, unknown>>;
}
