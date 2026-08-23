import crypto from "crypto";
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

function waRateKey(waId: string, purpose: "rate" | "otp"): string {
  const canonicalWaId = cleanWaId(waId);
  const secret = process.env.RATE_LIMIT_HMAC_SECRET || process.env.INTERNAL_API_KEY;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new RedisUnavailableError("RATE_LIMIT_HMAC_SECRET or INTERNAL_API_KEY is required for production WhatsApp limits.");
  }
  const digest = crypto.createHmac("sha256", secret || "hirego-development-rate-limit-key")
    .update(canonicalWaId)
    .digest("base64url")
    .slice(0, 32);
  return `wa:${purpose}:${digest}`;
}

/** Meta requests are limited by verified sender ID, never Meta edge IP. */
export function checkWaRateLimit(waId: string, maxRequests = 20, windowMs = 60_000) {
  return checkLimit(waRateKey(waId, "rate"), maxRequests, windowMs);
}

export function checkWaOtpLimit(waId: string, maxAttempts = 5, windowMs = 15 * 60_000) {
  return checkLimit(waRateKey(waId, "otp"), maxAttempts, windowMs);
}

export async function resetWaRateLimiter(waId?: string) {
  if (!waId) {
    resetDevelopmentRedisStore();
    return;
  }
  await Promise.all([deleteRedisKey(waRateKey(waId, "rate")), deleteRedisKey(waRateKey(waId, "otp"))]);
}
