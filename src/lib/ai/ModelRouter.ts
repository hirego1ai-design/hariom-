import { CircuitBreaker } from './CircuitBreaker';

export type LlmProviderName = 'google' | 'openai' | 'anthropic' | 'deepseek' | 'kimi';

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
   * Complete 5-Provider Fallback Chain:
   * Google Gemini -> OpenAI -> Anthropic -> DeepSeek -> Kimi (Moonshot AI)
   */
  public static route(params: {
    taskType: string;
    preferredModel?: string;
  }): RouteMapping {
    const { taskType, preferredModel } = params;

    switch (taskType) {
      case 'resume-screening':
      case 'communication-coach':
        return {
          primary: { provider: 'google', model: preferredModel || 'gemini-1.5-flash' },
          fallbackChain: [
            { provider: 'openai', model: 'gpt-4o-mini' },
            { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
            { provider: 'deepseek', model: 'deepseek-v3' },
            { provider: 'kimi', model: 'moonshot-v1-8k' },
          ],
        };

      case 'mock-interview':
      case 'candidate-matchmaker':
      case 'jd-generator':
        return {
          primary: { provider: 'google', model: preferredModel || 'gemini-1.5-pro' },
          fallbackChain: [
            { provider: 'openai', model: 'gpt-4o' },
            { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
            { provider: 'deepseek', model: 'deepseek-r1' },
            { provider: 'kimi', model: 'moonshot-v1-32k' },
          ],
        };

      case 'security-judge':
        return {
          primary: { provider: 'google', model: preferredModel || 'gemini-1.5-pro' },
          fallbackChain: [
            { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
            { provider: 'openai', model: 'gpt-4o' },
            { provider: 'deepseek', model: 'deepseek-r1' },
            { provider: 'kimi', model: 'moonshot-v1-32k' },
          ],
        };

      default:
        return {
          primary: { provider: 'google', model: preferredModel || 'gemini-1.5-pro' },
          fallbackChain: [
            { provider: 'openai', model: 'gpt-4o' },
            { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
            { provider: 'deepseek', model: 'deepseek-v3' },
            { provider: 'kimi', model: 'moonshot-v1-8k' },
          ],
        };
    }
  }

  public static async executeWithFallback<T>(params: {
    taskType: string;
    fn: (provider: LlmProviderName, model: string) => Promise<T>;
  }): Promise<{ result: T; usedEndpoint: ProviderModel }> {
    const { primary, fallbackChain } = this.route({ taskType: params.taskType });
    const endpoints = [primary, ...fallbackChain];

    let lastError: unknown;
    for (const endpoint of endpoints) {
      const breakerKey = `${endpoint.provider}:${endpoint.model}`;
      try {
        const result = await CircuitBreaker.execute(breakerKey, () =>
          params.fn(endpoint.provider, endpoint.model)
        );
        return { result, usedEndpoint: endpoint };
      } catch (err) {
        lastError = err;
        console.warn(
          `[ModelRouter] Provider ${endpoint.provider} (${endpoint.model}) failed or open. Trying next fallback...`
        );
      }
    }

    throw new Error(
      `All 5 model endpoints (Gemini -> OpenAI -> Anthropic -> DeepSeek -> Kimi) failed for taskType '${params.taskType}'. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }
}
