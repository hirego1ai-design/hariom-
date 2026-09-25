import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { enforceRateLimit, handleApiError, readValidatedJson, ApiError } from "@/lib/apiSecurity";
import { getAiRoutingConfig, getProviderRuntime } from "@/lib/ai/AiRoutingConfig";
import { dispatchAiTask } from "@/utils/aiRouter";

const requestSchema = z.object({
  modelKeys: z.array(z.string().trim().min(3).max(160)).min(1).max(5),
}).strict();

const outputSchema = z.object({
  summary: z.string().trim().min(1).max(800),
  skills: z.array(z.string().trim().min(1).max(120)).max(8),
}).strict();

const SYNTHETIC_PROMPT = [
  "This is a synthetic HireGo model benchmark. No real candidate or employer data is present.",
  "Summarize the fictional profile below and return strict JSON only.",
  '{"role":"Backend Engineer","experienceYears":4,"skills":["TypeScript","PostgreSQL","REST APIs"],"project":"Built a fictional order-processing API."}',
  'Return exactly: {"summary": string, "skills": string[]}.',
].join("\n");

function parseJson(raw: string) {
  const value = raw.trim();
  const unfenced = value.startsWith("```")
    ? value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : value;
  return JSON.parse(unfenced);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, `admin_model_benchmark:${admin.id}`, 3, 60_000);
    const { modelKeys } = await readValidatedJson(request, requestSchema, 8 * 1024);
    const config = await getAiRoutingConfig();
    const byKey = new Map(config.models.map((model) => [model.key, model]));

    const selected = modelKeys.map((key) => {
      const model = byKey.get(key);
      if (!model) throw new ApiError(`Unknown model key: ${key}`, 400);
      if (!model.enabled) throw new ApiError(`Model '${key}' is disabled.`, 409);
      if (!getProviderRuntime(model.provider).configured) {
        throw new ApiError(`Provider '${model.provider}' is not configured.`, 409);
      }
      return model;
    });

    const results = [];
    for (const model of selected) {
      const started = Date.now();
      try {
        const execution = await dispatchAiTask({
          task: "GENERAL",
          taskType: "admin-synthetic-benchmark",
          prompt: SYNTHETIC_PROMPT,
          provider: model.provider,
          model: model.modelId,
          modelConfig: model,
          timeoutMs: 30_000,
          temperature: 0,
          maxTokens: 500,
          maxCostUsdPerRequest: 0.25,
          bypassCache: true,
        });

        let schemaPass = false;
        try {
          schemaPass = outputSchema.safeParse(parseJson(execution.resultText)).success;
        } catch {
          schemaPass = false;
        }

        results.push({
          key: model.key,
          provider: model.provider,
          model: model.modelId,
          label: model.label,
          success: true,
          schemaPass,
          latencyMs: execution.log.latencyMs || Date.now() - started,
          promptTokens: execution.log.promptTokens,
          completionTokens: execution.log.completionTokens,
          totalTokens: execution.log.totalTokens,
          costUsd: execution.log.costEstUsd,
          output: execution.resultText,
          error: null,
        });
      } catch (error) {
        results.push({
          key: model.key,
          provider: model.provider,
          model: model.modelId,
          label: model.label,
          success: false,
          schemaPass: false,
          latencyMs: Date.now() - started,
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          costUsd: null,
          output: null,
          error: error instanceof Error ? error.message : "Benchmark failed.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      benchmark: "SYNTHETIC_STRUCTURED_SUMMARY_V1",
      containsRealUserData: false,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
