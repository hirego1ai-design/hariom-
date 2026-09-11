import { Redis } from "@upstash/redis";
import { requireRedisEnv } from "./env";

const DEV_MAX_KEYS = 2_000;

type DevelopmentEntry = { value: string; expiresAt: number };

let client: Redis | undefined;
const developmentStore = new Map<string, DevelopmentEntry>();

export class RedisUnavailableError extends Error {
  constructor(message = "Shared Redis is unavailable.") {
    super(message);
    this.name = "RedisUnavailableError";
  }
}

export type DistributedCounterResult = {
  count: number;
  ttlMs: number;
};

export type LoginFailureResult = {
  locked: boolean;
  retryAfterMs: number;
  failures: number;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getConfiguredClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const { url, token } = isProduction()
    ? requireRedisEnv()
    : { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };

  client ??= new Redis({ url, token });
  return client;
}

function incrementDevelopmentCounter(key: string, windowMs: number): DistributedCounterResult {
  const now = Date.now();
  for (const [storedKey, entry] of developmentStore) {
    if (entry.expiresAt <= now) developmentStore.delete(storedKey);
  }
  if (developmentStore.size >= DEV_MAX_KEYS && !developmentStore.has(key)) {
    throw new RedisUnavailableError("Development Redis fallback reached its bounded key limit.");
  }

  const existing = developmentStore.get(key);
  if (!existing || existing.expiresAt <= now) {
    const expiresAt = now + windowMs;
    developmentStore.set(key, { value: "1", expiresAt });
    return { count: 1, ttlMs: windowMs };
  }

  existing.value = String(Number(existing.value) + 1);
  return { count: Number(existing.value), ttlMs: Math.max(1, existing.expiresAt - now) };
}

export async function setRedisValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    if (developmentStore.size >= DEV_MAX_KEYS && !developmentStore.has(key)) throw new RedisUnavailableError("Development Redis fallback reached its bounded key limit.");
    developmentStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1_000 : Number.MAX_SAFE_INTEGER });
    return;
  }
  try {
    if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
    else await redis.set(key, value);
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

export async function getRedisValue(key: string): Promise<string | null> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    const item = developmentStore.get(key);
    if (!item || item.expiresAt <= Date.now()) { developmentStore.delete(key); return null; }
    return item.value;
  }
  try {
    const value = await redis.get<string>(key);
    return value ?? null;
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

/**
 * Atomically increments a short-lived shared counter and applies its TTL only
 * on the first increment. Production never falls back to process-local state.
 */
export async function incrementWithTtl(key: string, windowMs: number): Promise<DistributedCounterResult> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) {
      throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    }
    return incrementDevelopmentCounter(key, windowMs);
  }

  try {
    const result = await redis.eval<[number], [number, number]>(
      "local count = redis.call('INCR', KEYS[1])\n" +
        "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end\n" +
        "return {count, redis.call('PTTL', KEYS[1])}",
      [key],
      [windowMs],
    );
    return { count: Number(result[0]), ttlMs: Math.max(1, Number(result[1])) };
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

export async function deleteRedisKey(key: string): Promise<void> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) throw new RedisUnavailableError();
    developmentStore.delete(key);
    return;
  }
  try {
    await redis.del(key);
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

/**
 * Record a failed sign-in without a read/modify/write race. A group of failed
 * attempts creates a temporary lock, and each subsequent group within the
 * level retention period increases the lock duration.  This is deliberately
 * Redis-backed: production auth protection must work across all instances.
 */
export async function recordLoginFailure(
  failureKey: string,
  levelKey: string,
  lockKey: string,
  threshold: number,
  failureWindowMs: number,
  baseLockMs: number,
  maxLockMs: number,
  levelTtlMs: number,
): Promise<LoginFailureResult> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) {
      throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    }

    const now = Date.now();
    const lock = developmentStore.get(lockKey);
    if (lock && lock.expiresAt > now) {
      return { locked: true, retryAfterMs: lock.expiresAt - now, failures: 0 };
    }
    if (lock) developmentStore.delete(lockKey);

    const failures = incrementDevelopmentCounter(failureKey, failureWindowMs).count;
    if (failures < threshold) return { locked: false, retryAfterMs: 0, failures };

    developmentStore.delete(failureKey);
    const currentLevel = developmentStore.get(levelKey);
    const level = Number(currentLevel?.value ?? "0") + 1;
    const lockMs = Math.min(maxLockMs, baseLockMs * (2 ** Math.min(level - 1, 20)));
    developmentStore.set(levelKey, { value: String(level), expiresAt: now + levelTtlMs });
    developmentStore.set(lockKey, { value: "1", expiresAt: now + lockMs });
    return { locked: true, retryAfterMs: lockMs, failures: threshold };
  }

  try {
  const result = await redis.eval<[number, number, number, number, number], [number, number, number]>(
      "local currentLockTtl = redis.call('PTTL', KEYS[3])\n" +
        "if currentLockTtl > 0 then return {1, currentLockTtl, 0} end\n" +
        "local failures = redis.call('INCR', KEYS[1])\n" +
        "if failures == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end\n" +
        "if failures < tonumber(ARGV[1]) then return {0, 0, failures} end\n" +
        "redis.call('DEL', KEYS[1])\n" +
        "local level = redis.call('INCR', KEYS[2])\n" +
        "if level == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[5]) end\n" +
        "local exponent = math.min(level - 1, 20)\n" +
        "local duration = math.min(tonumber(ARGV[4]), tonumber(ARGV[3]) * (2 ^ exponent))\n" +
        "redis.call('PSETEX', KEYS[3], duration, '1')\n" +
        "return {1, duration, failures}",
      [failureKey, levelKey, lockKey],
      [threshold, failureWindowMs, baseLockMs, maxLockMs, levelTtlMs],
    );
    return { locked: Number(result[0]) === 1, retryAfterMs: Math.max(0, Number(result[1])), failures: Number(result[2]) };
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

/** Return an account lock's remaining duration without exposing Redis details. */
export async function getRedisTtlMs(key: string): Promise<number> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) {
      throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    }
    const entry = developmentStore.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      developmentStore.delete(key);
      return 0;
    }
    return Math.max(1, entry.expiresAt - Date.now());
  }
  try {
    return Math.max(0, Number(await redis.pttl(key)));
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

/** Clear transient failure state only after a successful credential check. */
export async function clearLoginFailureState(failureKey: string, levelKey: string, lockKey: string): Promise<void> {
  const redis = getConfiguredClient();
  if (!redis) {
    if (isProduction()) {
      throw new RedisUnavailableError("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
    }
    developmentStore.delete(failureKey);
    developmentStore.delete(levelKey);
    developmentStore.delete(lockKey);
    return;
  }
  try {
    await redis.del(failureKey, levelKey, lockKey);
  } catch (error) {
    throw new RedisUnavailableError(error instanceof Error ? error.message : "Shared Redis request failed.");
  }
}

/** Test-only helper. Production callers must never use process-local fallback state. */
export function resetDevelopmentRedisStore(): void {
  if (!isProduction()) developmentStore.clear();
}
