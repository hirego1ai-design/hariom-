import crypto from "crypto";
import {
  clearLoginFailureState,
  getRedisTtlMs,
  recordLoginFailure,
  RedisUnavailableError,
} from "./redis";

const FAILURE_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 15 * 60_000;
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 30 * 60_000;
const LOCK_LEVEL_TTL_MS = 24 * 60 * 60_000;

export class LoginProtectionUnavailableError extends Error {
  status = 503;

  constructor(message = "Sign-in protection is temporarily unavailable.") {
    super(message);
    this.name = "LoginProtectionUnavailableError";
  }
}

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Redis keys must not include a raw email address. The JWT secret is already a
 * production requirement; a dedicated rate-limit secret can be supplied to
 * permit independent rotation.
 */
function emailKey(email: string): string {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET
    || process.env.INTERNAL_API_KEY
    || process.env.NEXTAUTH_SECRET
    || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new LoginProtectionUnavailableError("Sign-in protection is not configured for production.");
    }
    return crypto.createHash("sha256").update(`development:${normalizedEmail(email)}`).digest("hex");
  }
  return crypto.createHmac("sha256", secret).update(normalizedEmail(email)).digest("hex");
}

function keys(email: string) {
  const id = emailKey(email);
  return {
    failure: `auth:login:failure:${id}`,
    level: `auth:login:level:${id}`,
    lock: `auth:login:lock:${id}`,
  };
}

function translateRedisError(error: unknown): never {
  if (error instanceof RedisUnavailableError) {
    throw new LoginProtectionUnavailableError();
  }
  throw error;
}

export async function getLoginLockRetryAfterSeconds(email: string): Promise<number> {
  try {
    return Math.max(0, Math.ceil((await getRedisTtlMs(keys(email).lock)) / 1_000));
  } catch (error) {
    return translateRedisError(error);
  }
}

/**
 * Record a bad credential attempt. Calling this for unknown accounts is
 * intentional: it prevents attackers from using timing or policy behavior to
 * discover which email addresses have accounts.
 */
export async function registerFailedLogin(email: string): Promise<number> {
  try {
    const state = await recordLoginFailure(
      keys(email).failure,
      keys(email).level,
      keys(email).lock,
      FAILURE_THRESHOLD,
      FAILURE_WINDOW_MS,
      BASE_LOCK_MS,
      MAX_LOCK_MS,
      LOCK_LEVEL_TTL_MS,
    );
    return Math.max(0, Math.ceil(state.retryAfterMs / 1_000));
  } catch (error) {
    return translateRedisError(error);
  }
}

/** Reset progressive state only after a successful login. */
export async function clearLoginProtection(email: string): Promise<void> {
  try {
    const state = keys(email);
    await clearLoginFailureState(state.failure, state.level, state.lock);
  } catch (error) {
    return translateRedisError(error);
  }
}

