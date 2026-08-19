import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

const MAX_JSON_BYTES = 32 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function getRateLimitStore(): Map<string, RateLimitEntry> {
  if (!(globalThis as any).__hirego_rate_limit_store) {
    (globalThis as any).__hirego_rate_limit_store = new Map<string, RateLimitEntry>();
  }
  return (globalThis as any).__hirego_rate_limit_store;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function getClientIp(request: Request) {
  if (!request) return "unknown";
  if (request.headers && typeof request.headers.get === "function") {
    const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("X-Forwarded-For");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

    const realIp = request.headers.get("x-real-ip") || request.headers.get("X-Real-IP");
    if (realIp) return realIp.trim();
  } else if (request.headers) {
    const h = request.headers as any;
    const forwardedFor = h["x-forwarded-for"] || h["X-Forwarded-For"];
    if (forwardedFor) return String(forwardedFor).split(",")[0]?.trim() || "unknown";

    const realIp = h["x-real-ip"] || h["X-Real-IP"];
    if (realIp) return String(realIp).trim();
  }

  return (request as any).ip || "unknown";
}

export function enforceRateLimit(
  request: Request,
  keyPrefix: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
) {
  const store = getRateLimitStore();
  const now = Date.now();

  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) {
      store.delete(k);
    }
  }

  const ip = getClientIp(request);
  const key = `${keyPrefix}:${ip}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= maxRequests) {
    const error = new ApiError("Too many requests. Please retry shortly.", 429);
    (error as any).status = 429;
    throw error;
  }

  current.count += 1;
  store.set(key, current);
}

export function resetRateLimitStore(keyPrefix?: string) {
  const store = getRateLimitStore();
  if (keyPrefix) {
    for (const key of store.keys()) {
      if (key.startsWith(`${keyPrefix}:`)) {
        store.delete(key);
      }
    }
  } else {
    store.clear();
  }
}

export function enforceInternalApiKey(request: Request) {
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Service is not configured for production access.", 503);
    }
    return;
  }

  const providedKey =
    request.headers.get("x-api-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (providedKey !== expectedKey) {
    throw new ApiError("Unauthorized", 401);
  }
}

export async function readValidatedJson<T>(request: Request, schema: ZodSchema<T>) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("Content-Type must be application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_JSON_BYTES) {
    throw new ApiError("Request body is too large.", 413);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiError("Invalid JSON body.", 400);
  }

  try {
    return schema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(error.issues[0]?.message || "Invalid request body.", 422);
    }

    throw error;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError || (error && typeof (error as any).status === "number")) {
    return jsonError((error as any).message, (error as any).status);
  }

  console.error("Unhandled API error", error);
  return jsonError("Internal server error.", 500);
}
