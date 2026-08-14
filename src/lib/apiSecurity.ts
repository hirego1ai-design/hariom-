import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

const MAX_JSON_BYTES = 32 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip") || "unknown";
}

export function enforceRateLimit(request: Request, keyPrefix: string) {
  const now = Date.now();
  const key = `${keyPrefix}:${getClientIp(request)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new ApiError("Too many requests. Please retry shortly.", 429);
  }

  current.count += 1;
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
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }

  console.error("Unhandled API error", error);
  return jsonError("Internal server error.", 500);
}
