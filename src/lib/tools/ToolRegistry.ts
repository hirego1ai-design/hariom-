import { z, ZodSchema } from 'zod';
import { TenantContext } from '@/lib/security/TenantContext';

export interface ToolExecutionContext {
  tenantContext: TenantContext;
  correlationId: string;
  executionId: string;
  agentId: string;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  hasSideEffect: boolean;
  inputSchema: ZodSchema<TInput>;
  outputSchema: ZodSchema<TOutput>;
  handler: (params: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}

export class ToolNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolNotFoundError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class ToolValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolValidationError';
  }
}

export interface AgentPermissions {
  agentId: string;
  allowedTools: string[];
  deniedTools: string[];
  maxCostPerTask: number;
  maxToolCalls: number;
}

export const AGENT_PERMISSIONS: Record<string, AgentPermissions> = {
  'resume-evaluator': {
    agentId: 'resume-evaluator',
    allowedTools: ['parseResume', 'extractSkills', 'computeHireScore', 'readCandidateProfile', 'sendEmailNotification', 'scheduleInterviewSession', 'generateCommercialInvoice'],
    deniedTools: ['deductCredits', 'deleteRecord', 'sendOffer'],
    maxCostPerTask: 5000,
    maxToolCalls: 8,
  },
  'mock-interview-copilot': {
    agentId: 'mock-interview-copilot',
    allowedTools: ['generateQuestion', 'evaluateResponse', 'recordTranscript'],
    deniedTools: ['deductCredits', 'updateJobStatus', 'deleteRecord'],
    maxCostPerTask: 10000,
    maxToolCalls: 8,
  },
  'security-judge': {
    agentId: 'security-judge',
    allowedTools: ['logViolation', 'readProctoringStream', 'flagCandidate'],
    deniedTools: ['deductCredits', 'deleteRecord', 'updateJobStatus', 'sendOffer', 'publishJob'],
    maxCostPerTask: 1000,
    maxToolCalls: 3,
  },
  'communication-coach': {
    agentId: 'communication-coach',
    allowedTools: ['analyzeAudio', 'computeWPM', 'countFillers', 'generateFeedback'],
    deniedTools: ['deductCredits', 'updateApplicationStatus'],
    maxCostPerTask: 3000,
    maxToolCalls: 5,
  },
  'jd-generator': {
    agentId: 'jd-generator',
    allowedTools: ['generateJobDescription', 'readCompanyProfile', 'readJobTemplate'],
    deniedTools: ['publishJob', 'deductCredits', 'deleteRecord'],
    maxCostPerTask: 2000,
    maxToolCalls: 4,
  },
  'candidate-matchmaker': {
    agentId: 'candidate-matchmaker',
    allowedTools: ['searchCandidates', 'computeCompatibility', 'readJobRequirements'],
    deniedTools: ['sendOffer', 'deductCredits', 'deleteRecord'],
    maxCostPerTask: 8000,
    maxToolCalls: 6,
  },
};

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private executionToolCounts: Map<string, number> = new Map();

  /**
   * Registers a tool in the registry.
   * @param tool The tool definition to register.
   */
  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Gets a tool by name.
   * @param name The name of the tool.
   * @returns The tool definition, or undefined if not found.
   */
  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Executes a tool with sandboxing, permission enforcement, and validation.
   * @param agentId The ID of the agent calling the tool.
   * @param toolName The name of the tool to execute.
   * @param params The parameters for the tool call.
   * @param context The execution context.
   * @returns The validated result of the tool handler.
   */
  public async execute(
    agentId: string,
    toolName: string,
    params: unknown,
    context: ToolExecutionContext
  ): Promise<unknown> {
    // 1. Verify tool exists
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new ToolNotFoundError(`Tool '${toolName}' not found.`);
    }

    // 2. Verify agentId is allowed to call this tool
    const permissions = AGENT_PERMISSIONS[agentId];
    if (!permissions) {
      throw new PermissionDeniedError(`Agent '${agentId}' is not configured in permissions.`);
    }

    if (permissions.deniedTools.includes(toolName)) {
      throw new PermissionDeniedError(`Agent '${agentId}' is explicitly denied from using tool '${toolName}'.`);
    }

    if (!permissions.allowedTools.includes(toolName)) {
      throw new PermissionDeniedError(`Agent '${agentId}' is not allowed to use tool '${toolName}'.`);
    }

    const currentCount = this.executionToolCounts.get(context.executionId) || 0;
    if (currentCount >= permissions.maxToolCalls) {
      throw new PermissionDeniedError(`Execution '${context.executionId}' has exceeded the maximum allowed tool calls (${permissions.maxToolCalls}).`);
    }

    this.executionToolCounts.set(context.executionId, currentCount + 1);

    // 3. Validate input against inputSchema (Zod)
    const parsedInputResult = tool.inputSchema.safeParse(params);
    if (!parsedInputResult.success) {
      throw new ToolValidationError(`Invalid input for tool '${toolName}': ${parsedInputResult.error.message}`);
    }

    // 4. If hasSideEffect = true, require an 'idempotencyKey' in params
    if (tool.hasSideEffect) {
      if (!params || typeof params !== 'object' || !('idempotencyKey' in params) || typeof (params as Record<string, unknown>).idempotencyKey !== 'string') {
        throw new ToolValidationError(`Tool '${toolName}' has side effects and requires an 'idempotencyKey' parameter.`);
      }
    }

    // 5. Execute the handler
    const result = await tool.handler(parsedInputResult.data, context);

    // 6. Validate output against outputSchema (Zod)
    const parsedOutputResult = tool.outputSchema.safeParse(result);
    if (!parsedOutputResult.success) {
      throw new ToolValidationError(`Invalid output from tool '${toolName}': ${parsedOutputResult.error.message}`);
    }

    // 7. Return validated output
    return parsedOutputResult.data;
  }
}
