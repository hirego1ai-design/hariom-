import { z } from "zod";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { dispatchAiTask, markAiExecutionValidationFailure } from "@/utils/aiRouter";

export async function runMockInterviewStructured<TSchema extends z.ZodTypeAny>(params: {
  prompt: string;
  schema: TSchema;
}): Promise<z.infer<TSchema>> {
  let currentExecutionLogId: string | null = null;

  const { result } = await ModelRouter.executeWithFallback({
    taskType: "mock-interview",
    fn: async (endpoint, policy, isFallback) => {
      const execution = await dispatchAiTask({
        task: "INTERVIEW_EVALUATION",
        taskType: "mock-interview",
        prompt: params.prompt,
        provider: endpoint.provider,
        model: endpoint.model,
        modelConfig: endpoint.config,
        timeoutMs: policy.timeoutMs,
        temperature: policy.temperature,
        maxTokens: policy.maxTokens,
        maxCostUsdPerRequest: policy.maxCostUsdPerRequest,
        isFallback,
      });
      currentExecutionLogId = execution.log.id;
      return execution.resultText;
    },
    validateResult: async (raw) => {
      try {
        params.schema.parse(JSON.parse(raw));
      } catch (error) {
        if (currentExecutionLogId) {
          await markAiExecutionValidationFailure(currentExecutionLogId);
        }
        throw new Error(
          `Mock Interview model returned invalid structured output: ${error instanceof Error ? error.message : "unknown parse error"}`,
        );
      }
    },
  });

  return params.schema.parse(JSON.parse(result));
}
