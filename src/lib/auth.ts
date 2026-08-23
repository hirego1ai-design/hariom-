import { UserRole } from "@/types";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getRedisValue, setRedisValue } from "./redis";

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  sessionVersion?: number;
  jti?: string;
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
const getJwtSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET or NEXTAUTH_SECRET environment variable is missing.");
    }
    return "hirego_dev_only_jwt_secret_key_2026";
  }
  return secret;
};

const JWT_SECRET = getJwtSecret();

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

  return jwt.sign({ ...payload, sessionVersion: payload.sessionVersion ?? 0 }, JWT_SECRET, { expiresIn: "12h", jwtid: crypto.randomUUID() });
}

export async function revokeSessionToken(token: string): Promise<void> {
  const decoded = jwt.verify(token, JWT_SECRET) as { jti?: string; exp?: number };
  if (!decoded?.jti) throw new SessionValidationError("Session token has no revocation identifier.");
  const ttlSeconds = decoded.exp ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1_000)) : 12 * 60 * 60;
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
    return jwt.verify(token, JWT_SECRET) as UserSession;
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
 * Authoritative server-side session verification.  JWT claims are only a
 * transport mechanism: production checks Redis revocation/version state and
 * refreshes identity and role from the database on every protected request.
 */
export async function getCurrentSession(reqHeaders?: Headers): Promise<UserSession | null> {
  const token = getSessionToken(reqHeaders);
  if (!token) return null;

  const tokenSession = verifySessionToken(token) as (UserSession & { jti?: string }) | null;
  if (!tokenSession?.id || !tokenSession.jti) return null;

  try {
    const [revoked, cachedVersion] = await Promise.all([
      getRedisValue(`session:revoked:${tokenSession.jti}`),
      getRedisValue(`session:version:${tokenSession.id}`),
    ]);
    if (revoked) return null;

    if (process.env.NODE_ENV !== "production") {
      const currentVersion = cachedVersion === null ? (tokenSession.sessionVersion ?? 0) : Number(cachedVersion);
      return currentVersion === (tokenSession.sessionVersion ?? 0) ? tokenSession : null;
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionVersion: user.sessionVersion,
      jti: tokenSession.jti,
    };
  } catch (error) {
    throw new SessionValidationError(error instanceof Error ? error.message : undefined);
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
