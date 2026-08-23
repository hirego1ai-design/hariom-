import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getCurrentSession } from "./auth";
import { deleteRedisKey, incrementWithTtl, RedisUnavailableError, resetDevelopmentRedisStore } from "./redis";

const MAX_JSON_BYTES = 32 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status = 400, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function jsonError(message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error: message }, { status, headers });
}

export function getClientIp(request: Request) {
  if (!request) return "unknown";
  const trustProxyHeaders = process.env.VERCEL === "1" || process.env.TRUST_PROXY_HEADERS === "true";
  if (trustProxyHeaders && request.headers && typeof request.headers.get === "function") {
    const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("X-Forwarded-For");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

    const realIp = request.headers.get("x-real-ip") || request.headers.get("X-Real-IP");
    if (realIp) return realIp.trim();
  } else if (trustProxyHeaders && request.headers) {
    const h = request.headers as any;
    const forwardedFor = h["x-forwarded-for"] || h["X-Forwarded-For"];
    if (forwardedFor) return String(forwardedFor).split(",")[0]?.trim() || "unknown";

    const realIp = h["x-real-ip"] || h["X-Real-IP"];
    if (realIp) return String(realIp).trim();
  }

  return (request as any).ip || "unknown";
}

export async function enforceRateLimit(
  request: Request,
  keyPrefix: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
) {
  const session = getCurrentSession(request.headers);
  const subject = session ? `user:${session.id}` : `ip:${getClientIp(request)}`;
  const key = `ratelimit:${keyPrefix}:${subject}`;

  try {
    const result = await incrementWithTtl(key, windowMs);
    if (result.count > maxRequests) {
      throw new ApiError(
        "Too many requests. Please retry shortly.",
        429,
        Math.max(1, Math.ceil(result.ttlMs / 1000)),
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof RedisUnavailableError) {
      throw new ApiError("Rate limiting service is temporarily unavailable.", 503);
    }
    throw error;
  }
}

export async function resetRateLimitStore(key?: string) {
  if (process.env.NODE_ENV === "production") return;
  if (key) await deleteRedisKey(`ratelimit:${key}`);
  resetDevelopmentRedisStore();
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

export async function readBoundedTextBody(request: Request, maxBytes = MAX_JSON_BYTES): Promise<string> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxBytes) throw new ApiError("Request body is too large.", 413);

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new ApiError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function readValidatedJson<T>(request: Request, schema: ZodSchema<T>, maxBytes = MAX_JSON_BYTES) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("Content-Type must be application/json.", 415);
  }

  let json: unknown;
  try {
    json = JSON.parse(await readBoundedTextBody(request, maxBytes));
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
    const retryAfterSeconds = (error as any).retryAfterSeconds;
    return jsonError(
      (error as any).message,
      (error as any).status,
      retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    );
  }

  console.error("Unhandled API error", error);
  return jsonError("Internal server error.", 500);
}
