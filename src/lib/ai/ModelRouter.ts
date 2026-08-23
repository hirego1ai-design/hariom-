import { CircuitBreaker } from "./CircuitBreaker";

/**
 * Historical provider identifiers retained for compatibility with existing
 * diagnostics. ModelRouter itself returns OpenAI only until real adapters are
 * implemented for the other providers.
 */
export type LlmProviderName = "google" | "openai" | "anthropic" | "deepseek" | "kimi";

export interface ProviderModel {
  provider: LlmProviderName;
  model: string;
}

export interface RouteMapping {
  primary: ProviderModel;
  fallbackChain: ProviderModel[];
}

export class ModelRouter {
  /**
   * Returns only providers that the production dispatcher can actually invoke.
   * Add a provider here only alongside a real authenticated dispatcher adapter.
   */
  public static route(params: { taskType: string; preferredModel?: string }): RouteMapping {
    return {
      primary: { provider: "openai", model: params.preferredModel || "gpt-4o" },
      fallbackChain: [],
    };
  }

  public static async executeWithFallback<T>(params: {
    taskType: string;
    fn: (provider: LlmProviderName, model: string) => Promise<T>;
  }): Promise<{ result: T; usedEndpoint: ProviderModel }> {
    const { primary } = this.route({ taskType: params.taskType });
    const breakerKey = `${primary.provider}:${primary.model}`;

    try {
      const result = await CircuitBreaker.execute(breakerKey, () => params.fn(primary.provider, primary.model));
      return { result, usedEndpoint: primary };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OpenAI (${primary.model}) failed for taskType '${params.taskType}': ${message}`);
    }
  }
}
