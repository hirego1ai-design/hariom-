import { deleteRedisKey, incrementWithTtl, RedisUnavailableError, resetDevelopmentRedisStore } from "./redis";

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSecs?: number;
  currentCount: number;
  resetAt: number;
}

async function checkLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitCheckResult> {
  try {
    const result = await incrementWithTtl(key, windowMs);
    return {
      allowed: result.count <= maxRequests,
      retryAfterSecs: result.count > maxRequests ? Math.max(1, Math.ceil(result.ttlMs / 1000)) : undefined,
      currentCount: result.count,
      resetAt: Date.now() + result.ttlMs,
    };
  } catch (error) {
    if (error instanceof RedisUnavailableError) throw error;
    throw new RedisUnavailableError("WhatsApp rate limiting is unavailable.");
  }
}

export function cleanWaId(waId: string): string {
  const value = waId.replace(/\D/g, "");
  if (!value) throw new Error("Invalid WhatsApp sender ID.");
  return value;
}

/** Meta requests are limited by verified sender ID, never Meta edge IP. */
export function checkWaRateLimit(waId: string, maxRequests = 20, windowMs = 60_000) {
  return checkLimit(`wa:rate:${cleanWaId(waId)}`, maxRequests, windowMs);
}

export function checkWaOtpLimit(waId: string, maxAttempts = 5, windowMs = 15 * 60_000) {
  return checkLimit(`wa:otp:${cleanWaId(waId)}`, maxAttempts, windowMs);
}

export async function resetWaRateLimiter(waId?: string) {
  if (!waId) {
    resetDevelopmentRedisStore();
    return;
  }
  const clean = cleanWaId(waId);
  await Promise.all([deleteRedisKey(`wa:rate:${clean}`), deleteRedisKey(`wa:otp:${clean}`)]);
}
