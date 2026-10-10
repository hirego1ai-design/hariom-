import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { requireAdminSession } from "@/lib/routeAuthorization";
import { ApiError, enforceRateLimit, handleApiError, readValidatedJson } from "@/lib/apiSecurity";
import { getAiRoutingConfig, llmProviderSchema } from "@/lib/ai/AiRoutingConfig";
import { resolveAiProvider } from "@/lib/ai/AiProviderCredentials";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testSchema = z.object({
  provider: llmProviderSchema,
  modelKey: z.string().trim().min(3).max(160),
}).strict();

/** Explicit, billable synthetic provider test. Never accepts arbitrary user prompts or URLs. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession(request);
    await enforceRateLimit(request, "ai_provider_connection_test:" + admin.id, 3, 60_000);
    const body = await readValidatedJson(request, testSchema, 4 * 1024);
    const registry = await getAiRoutingConfig();
    const model = registry.models.find((item) => item.key === body.modelKey && item.provider === body.provider);
    if (!model || !model.enabled) throw new ApiError("Choose an enabled model registered for this provider.", 422);
    const config = await resolveAiProvider(body.provider);
    if (!config.configured || !config.apiKey) {
      throw new ApiError(config.reason || "Provider is not configured.", 422);
    }

    // Avoid sending credentials to private/reserved destinations. Custom Admin
    // endpoints are separately subject to a strict host allowlist at save.
    const destination = config.baseURL || "https://api.openai.com/v1";
    await assertSafeOutboundNetworkTarget(destination, { label: "AI provider endpoint", requireHttps: true });
    const client = new OpenAI({
      apiKey: config.apiKey, ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      timeout: 12_000, maxRetries: 0,
    });
    try {
      const reply = await client.chat.completions.create({
        model: model.modelId,
        messages: [{ role: "user", content: "Reply with the word OK only." }],
        ...(body.provider === "openai" ? { max_completion_tokens: 16 } : { max_tokens: 16 }),
      });
      return NextResponse.json({
        success: true, connected: Boolean(reply.choices?.length),
        provider: body.provider, modelId: model.modelId,
        message: reply.choices?.length ? "Provider returned a response." : "Provider returned an empty response.",
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      // Never echo provider response bodies or raw errors, which may include
      // credentials or upstream request details.
      const status = typeof error === "object" && error !== null && "status" in error
        ? Number((error as { status?: unknown }).status) : NaN;
      const safeStatus = [400, 401, 403, 404, 408, 429, 500, 502, 503].includes(status) ? status : null;
      return NextResponse.json({
        success: true, connected: false, provider: body.provider, modelId: model.modelId,
        message: safeStatus ? "Provider rejected the test (HTTP " + safeStatus + ")." : "Provider connection failed or timed out.",
      }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
