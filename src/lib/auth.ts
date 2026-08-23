import { UserRole } from "@/types";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const AUTH_COOKIE_NAME = "hirego_session";
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

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    if (process.env.NODE_ENV !== "production" && token.endsWith(".mockSignature")) {
      try {
        const parts = token.split(".");
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        return payload as UserSession;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function getCurrentSession(reqHeaders?: Headers): UserSession | null {
  if (reqHeaders) {
    // Try Bearer token from Authorization header
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const session = verifySessionToken(token);
      if (session) return session;
    }

    // Try session cookie
    const cookieHeader = reqHeaders.get("cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith("hirego_session="));
      if (sessionCookie) {
        const token = sessionCookie.split("=").slice(1).join("=");
        const session = verifySessionToken(token);
        if (session) return session;
      }
    }
  }

  // No authentication found — return null (no hardcoded fallback)
  return null;
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
