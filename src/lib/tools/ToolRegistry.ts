import { z, ZodSchema } from 'zod';
import { TenantContext } from '@/lib/security/TenantContext';
import { WorkflowEngine } from '@/lib/workflows/WorkflowEngine';

export interface ToolExecutionContext {
  tenantContext: TenantContext; correlationId: string; executionId: string; agentId: string;
  workflowId?: string; workflowStep?: string;
}
export interface ToolDefinition<TInput = unknown, TOutput = unknown> { name: string; description: string; hasSideEffect: boolean; inputSchema: ZodSchema<TInput>; outputSchema: ZodSchema<TOutput>; handler: (params: TInput, context: ToolExecutionContext) => Promise<TOutput>; }
export class ToolNotFoundError extends Error { constructor(message: string) { super(message); this.name = 'ToolNotFoundError'; } }
export class PermissionDeniedError extends Error { constructor(message: string) { super(message); this.name = 'PermissionDeniedError'; } }
export class ToolValidationError extends Error { constructor(message: string) { super(message); this.name = 'ToolValidationError'; } }
export interface AgentPermissions { agentId: string; allowedTools: string[]; deniedTools: string[]; maxCostPerTask: number; maxToolCalls: number; }

export const CONSEQUENTIAL_AGENT_TOOLS = new Set([
  'sendEmailNotification', 'sendWhatsAppNotification', 'scheduleInterviewSession',
  'generateCommercialInvoice', 'sendOffer', 'updateApplicationStatus',
  'updateJobStatus', 'publishJob', 'deductCredits', 'deleteRecord',
]);

export const AGENT_PERMISSIONS: Record<string, AgentPermissions> = {
  'resume-evaluator': { agentId: 'resume-evaluator', allowedTools: ['parseResume', 'extractSkills', 'computeHireScore', 'readCandidateProfile'], deniedTools: ['sendEmailNotification', 'scheduleInterviewSession', 'generateCommercialInvoice', 'deductCredits', 'deleteRecord', 'sendOffer'], maxCostPerTask: 5000, maxToolCalls: 8 },
  'mock-interview-copilot': { agentId: 'mock-interview-copilot', allowedTools: ['generateQuestion', 'evaluateResponse', 'recordTranscript'], deniedTools: ['deductCredits', 'updateJobStatus', 'deleteRecord'], maxCostPerTask: 10000, maxToolCalls: 8 },
  'security-judge': { agentId: 'security-judge', allowedTools: ['logViolation', 'readProctoringStream', 'flagCandidate'], deniedTools: ['deductCredits', 'deleteRecord', 'updateJobStatus', 'sendOffer', 'publishJob'], maxCostPerTask: 1000, maxToolCalls: 3 },
  'communication-coach': { agentId: 'communication-coach', allowedTools: ['analyzeAudio', 'computeWPM', 'countFillers', 'generateFeedback'], deniedTools: ['deductCredits', 'updateApplicationStatus'], maxCostPerTask: 3000, maxToolCalls: 5 },
  'jd-generator': { agentId: 'jd-generator', allowedTools: ['generateJobDescription', 'readCompanyProfile', 'readJobTemplate'], deniedTools: ['publishJob', 'deductCredits', 'deleteRecord'], maxCostPerTask: 2000, maxToolCalls: 4 },
  'candidate-matchmaker': { agentId: 'candidate-matchmaker', allowedTools: ['searchCandidates', 'computeCompatibility', 'readJobRequirements'], deniedTools: ['sendOffer', 'deductCredits', 'deleteRecord'], maxCostPerTask: 8000, maxToolCalls: 6 },
};

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private executionToolCounts: Map<string, number> = new Map();
  public register(tool: ToolDefinition): void { this.tools.set(tool.name, tool); }
  public get(name: string): ToolDefinition | undefined { return this.tools.get(name); }

  public async execute(agentId: string, toolName: string, params: unknown, context: ToolExecutionContext): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) throw new ToolNotFoundError(`Tool '${toolName}' not found.`);
    if (context.agentId !== agentId) throw new PermissionDeniedError('Agent execution context mismatch.');

    const permissions = AGENT_PERMISSIONS[agentId];
    if (!permissions) throw new PermissionDeniedError(`Agent '${agentId}' is not configured in permissions.`);

    const isConsequential = CONSEQUENTIAL_AGENT_TOOLS.has(toolName);
    // Consequential tools stay denied to agents unless the policy explicitly
    // grants the tool AND the exact workflow action has durable human approval.
    if (permissions.deniedTools.includes(toolName)) throw new PermissionDeniedError(`Agent '${agentId}' is explicitly denied from using tool '${toolName}'.`);
    if (!permissions.allowedTools.includes(toolName)) throw new PermissionDeniedError(`Agent '${agentId}' is not allowed to use tool '${toolName}'.`);

    const parsedInputResult = tool.inputSchema.safeParse(params);
    if (!parsedInputResult.success) throw new ToolValidationError(`Invalid input for tool '${toolName}': ${parsedInputResult.error.message}`);
    if (tool.hasSideEffect && (!params || typeof params !== 'object' || !('idempotencyKey' in params) || typeof (params as Record<string, unknown>).idempotencyKey !== 'string' || !(params as Record<string, unknown>).idempotencyKey)) {
      throw new ToolValidationError(`Tool '${toolName}' has side effects and requires a non-empty 'idempotencyKey' parameter.`);
    }

    if (isConsequential) {
      if (!context.workflowId || !context.workflowStep) throw new PermissionDeniedError(`Consequential tool '${toolName}' requires workflow-bound human approval.`);
      try {
        await WorkflowEngine.consumeApprovedAction({
          workflowId: context.workflowId,
          stepName: context.workflowStep,
          action: { toolName, params: parsedInputResult.data },
          context: context.tenantContext,
        });
      } catch (error) {
        throw new PermissionDeniedError(`Consequential tool '${toolName}' approval denied: ${error instanceof Error ? error.message : 'approval unavailable'}`);
      }
    }

    const currentCount = this.executionToolCounts.get(context.executionId) || 0;
    if (currentCount >= permissions.maxToolCalls) throw new PermissionDeniedError(`Execution '${context.executionId}' has exceeded the maximum allowed tool calls (${permissions.maxToolCalls}).`);
    this.executionToolCounts.set(context.executionId, currentCount + 1);

    const result = await tool.handler(parsedInputResult.data, context);
    const parsedOutputResult = tool.outputSchema.safeParse(result);
    if (!parsedOutputResult.success) throw new ToolValidationError(`Invalid output from tool '${toolName}': ${parsedOutputResult.error.message}`);
    return parsedOutputResult.data;
  }
}
