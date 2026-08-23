/**
 * HireGo WhatsApp — Per-waId Distributed Rate Limiter
 *
 * WhatsApp webhook requests originate from Meta's edge servers, so IP-based
 * rate limiting groups all users together.
 * This rate limiter applies per-sender (waId) limits after signature verification.
 *
 * Limits:
 * - Message rate: 20 messages / 60 seconds per waId
 * - OTP attempts: 5 attempts / 15 minutes per waId
 */

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

function getWaRateLimitStore(): Map<string, RateLimitBucket> {
  if (!(globalThis as any).__hirego_wa_rate_limit_store) {
    (globalThis as any).__hirego_wa_rate_limit_store = new Map<string, RateLimitBucket>();
  }
  return (globalThis as any).__hirego_wa_rate_limit_store;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSecs?: number;
  currentCount: number;
  resetAt: number;
}

/**
 * Enforce rate limit for a specific WhatsApp sender ID (waId).
 * @param waId - Meta sender phone/ID (e.g. "919876543210")
 * @param maxRequests - Maximum allowed requests in the window (default: 20)
 * @param windowMs - Time window in milliseconds (default: 60,000 ms)
 */
export function checkWaRateLimit(
  waId: string,
  maxRequests: number = 20,
  windowMs: number = 60_000
): RateLimitCheckResult {
  const store = getWaRateLimitStore();
  const now = Date.now();
  const cleanWaId = waId.replace(/\D/g, "");
  const key = `wa:rate:${cleanWaId}`;

  // Purge expired entries
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) {
      store.delete(k);
    }
  }

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, currentCount: 1, resetAt };
  }

  if (current.count >= maxRequests) {
    const retryAfterSecs = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSecs,
      currentCount: current.count,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, currentCount: current.count, resetAt: current.resetAt };
}

/**
 * Enforce OTP attempt limit for a specific WhatsApp sender ID (waId).
 * @param waId - Meta sender phone/ID
 * @param maxAttempts - Max OTP attempts allowed in window (default: 5)
 * @param windowMs - Window duration (default: 15 minutes)
 */
export function checkWaOtpLimit(
  waId: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60_000
): RateLimitCheckResult {
  const store = getWaRateLimitStore();
  const now = Date.now();
  const cleanWaId = waId.replace(/\D/g, "");
  const key = `wa:otp:${cleanWaId}`;

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, currentCount: 1, resetAt };
  }

  if (current.count >= maxAttempts) {
    const retryAfterSecs = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      allowed: false,
      retryAfterSecs,
      currentCount: current.count,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, currentCount: current.count, resetAt: current.resetAt };
}

/**
 * Reset rate limit entries for a waId or entire store. Useful for tests.
 */
export function resetWaRateLimiter(waId?: string) {
  const store = getWaRateLimitStore();
  if (waId) {
    const cleanWaId = waId.replace(/\D/g, "");
    store.delete(`wa:rate:${cleanWaId}`);
    store.delete(`wa:otp:${cleanWaId}`);
  } else {
    store.clear();
  }
}
