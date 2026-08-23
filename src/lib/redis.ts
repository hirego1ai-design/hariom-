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

/** Test-only helper. Production callers must never use process-local fallback state. */
export function resetDevelopmentRedisStore(): void {
  if (!isProduction()) developmentStore.clear();
}
