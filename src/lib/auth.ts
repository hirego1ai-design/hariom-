import { UserRole } from "@/types";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getRedisValue, setRedisValue } from "./redis";
import { sessionCache } from "./cache/SessionCache";

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  sessionVersion?: number;
  jti?: string;
  authMethod?: "API_KEY" | "SESSION_COOKIE";
}

export const AUTH_COOKIE_NAME = "hirego_session";

/**
 * A protected request cannot be safely authorized while the shared session
 * store is unavailable.  API error handling recognizes the status property
 * and returns a fail-closed 503 instead of treating the token as valid.
 */
export class SessionValidationError extends Error {
  status = 503;

  constructor(message = "Session validation is temporarily unavailable.") {
    super(message);
    this.name = "SessionValidationError";
  }
}
let _jwtSecretCache: string | undefined;
const getJwtSecret = (): string => {
  if (_jwtSecretCache) return _jwtSecretCache;
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET or NEXTAUTH_SECRET environment variable is missing.");
    }
    return "hirego_dev_only_jwt_secret_key_2026";
  }
  _jwtSecretCache = secret;
  return secret;
};

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long." };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: "Password must contain both letters and numbers." };
  }
  return { valid: true };
}

export function verifyPassword(plain: string, hashed: string): boolean {
  if (!plain || !hashed) return false;
  if (hashed.startsWith("$2a$") || hashed.startsWith("$2b$")) {
    try {
      return bcrypt.compareSync(plain, hashed);
    } catch {
      return false;
    }
  }
  return process.env.NODE_ENV !== "production" && plain === hashed;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function createSessionToken(payload: UserSession): string {
  if (!payload.id || !payload.email || !payload.name || !payload.role) {
    throw new Error("Session tokens require an explicit user ID, email, name, and role.");
  }

  return jwt.sign({ ...payload, sessionVersion: payload.sessionVersion ?? 0 }, getJwtSecret(), { expiresIn: "7d", jwtid: crypto.randomUUID() });
}

export async function revokeSessionToken(token: string): Promise<void> {
  const decoded = jwt.verify(token, getJwtSecret()) as { jti?: string; exp?: number };
  if (!decoded?.jti) throw new SessionValidationError("Session token has no revocation identifier.");
  const ttlSeconds = decoded.exp ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1_000)) : 7 * 24 * 60 * 60;
  try {
    await setRedisValue(`session:revoked:${decoded.jti}`, "1", ttlSeconds);
  } catch (error) {
    throw new SessionValidationError(error instanceof Error ? error.message : undefined);
  }
}

export async function revokeAllUserSessions(userId: string, sessionVersion: number): Promise<void> {
  await setRedisValue(`session:version:${userId}`, String(sessionVersion));
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, getJwtSecret()) as UserSession;
  } catch {
    return null;
  }
}

export function getSessionToken(reqHeaders?: Headers): string | null {
  if (!reqHeaders) return null;
  const authHeader = reqHeaders.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);

  const cookieHeader = reqHeaders.get("cookie");
  if (!cookieHeader) return null;
  const sessionCookie = cookieHeader.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
  return sessionCookie ? sessionCookie.slice(`${AUTH_COOKIE_NAME}=`.length) : null;
}

/**
 * Extract authentication method from request headers
 * Returns "API_KEY" for Bearer tokens, "SESSION_COOKIE" for cookie-based auth
 * 
 * FIX 2: Admin Bypass - distinguishes between API key and session-based authentication
 */
function getAuthMethod(reqHeaders?: Headers): "API_KEY" | "SESSION_COOKIE" {
  if (!reqHeaders) return "SESSION_COOKIE";
  const authHeader = reqHeaders.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return "API_KEY";
  return "SESSION_COOKIE";
}

/**
 * Authoritative server-side session verification with Redis fallback.
 * 
 * JWT claims are only a transport mechanism: production checks Redis revocation/version state and
 * refreshes identity and role from the database on every protected request.
 * 
 * REDIS FALLBACK (Fix 4):
 * - When Redis is unavailable, fall back to local session cache (5-minute TTL)
 * - This ensures platform availability even during Redis outages
 * - Cache is fail-closed: after TTL expires, requests are rejected
 * 
 * ADMIN BYPASS FIX (Fix 2):
 * - Extract authMethod from request headers (API_KEY vs SESSION_COOKIE)
 * - Include in returned session object
 */
export async function getCurrentSession(reqHeaders?: Headers): Promise<UserSession | null> {
  const token = getSessionToken(reqHeaders);
  if (!token) return null;

  const tokenSession = verifySessionToken(token) as (UserSession & { jti?: string }) | null;
  if (!tokenSession?.id || !tokenSession.jti) return null;

  // FIX 2: Extract and include auth method in session
  const authMethod = getAuthMethod(reqHeaders);

  try {
    const [revoked, cachedVersion] = await Promise.all([
      getRedisValue(`session:revoked:${tokenSession.jti}`),
      getRedisValue(`session:version:${tokenSession.id}`),
    ]);
    if (revoked) return null;

    if (process.env.NODE_ENV !== "production") {
      const currentVersion = cachedVersion === null ? (tokenSession.sessionVersion ?? 0) : Number(cachedVersion);
      return currentVersion === (tokenSession.sessionVersion ?? 0) 
        ? { ...tokenSession, authMethod }
        : null;
    }

    // Avoid a static auth/prisma import cycle (prisma's development helpers use
    // password hashing from this module).
    const { prisma } = await import("./prisma");
    const user = await prisma.user.findUnique({
      where: { id: tokenSession.id },
      select: { id: true, email: true, name: true, role: true, sessionVersion: true },
    });
    if (!user) return null;

    const authoritativeVersion = cachedVersion === null ? user.sessionVersion : Number(cachedVersion);
    if (!Number.isInteger(authoritativeVersion) || authoritativeVersion !== user.sessionVersion) {
      // The database is authoritative. Repair a stale/missing cache without
      // ever accepting an outdated session version.
      await setRedisValue(`session:version:${user.id}`, String(user.sessionVersion));
    }
    if ((tokenSession.sessionVersion ?? 0) !== user.sessionVersion) return null;

    // Cache successful session validation for fallback use
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion,
      jti: tokenSession.jti,
      authMethod, // FIX 2: Include auth method in cached session
    };
    sessionCache.set(user.id, sessionData, token);

    return sessionData;
  } catch (redisError) {
    // REDIS FALLBACK (Fix 4): When Redis is unavailable, use local cache
    // This ensures the platform doesn't go down during Redis outages
    
    const cachedSession = sessionCache.get(tokenSession.id);
    
    if (cachedSession) {
      // Successfully fell back to cache
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[AUTH] Using cached session for user ${tokenSession.id} due to Redis unavailability`);
      }
      return { ...cachedSession, authMethod };
    }

    // No cache available and Redis down - fail closed (return 503)
    if (process.env.NODE_ENV !== "production") {
      console.error(`[AUTH] Redis unavailable and no cache for user ${tokenSession.id}`, redisError instanceof Error ? redisError.message : "Unknown error");
    }
    throw new SessionValidationError(redisError instanceof Error ? redisError.message : undefined);
  }
}

export function hasRoleAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === "ADMIN") return true;
  return requiredRoles.includes(userRole);
}

export function sanitizeUserInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
