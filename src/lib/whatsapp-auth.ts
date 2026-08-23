/**
 * HireGo WhatsApp — Secure Auth Handoff
 *
 * After successful WhatsApp onboarding, we generate a short-lived (5 min)
 * single-use token delivered as an HTTPS deep-link.
 * The web app exchanges it for a standard hirego_session cookie.
 *
 * Token design:
 * - JWT signed with JWT_SECRET (same secret used for normal sessions)
 * - 5-minute expiry (reduced for tighter security)
 * - Contains jti (JWT ID) for single-use enforcement
 * - jti stored in WhatsAppOnboardingSession.collectedData
 * - Consumed atomically: jti checked + cleared in one DB write
 * - Token does NOT contain full session payload — exchange endpoint
 *   issues the real hirego_session cookie from DB-loaded user
 * - Replay attacks immediately return invalid
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { createSessionToken } from "./auth";
import { logAuditEvent } from "./auditLogger";

export const HANDOFF_EXPIRY_SECS = 5 * 60; // 5 minutes

function getJwtSecret(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production")
      throw new Error("FATAL: JWT_SECRET missing for WhatsApp auth handoff");
    return "hirego_dev_only_jwt_secret_key_2026";
  }
  return s;
}

export interface HandoffPayload {
  sub: string;   // userId
  jti: string;   // one-time token ID
  pur: "wa_handoff";
}

/**
 * Generate a short-lived, single-use auth handoff token.
 * Stores the jti in the onboarding session so we can consume it atomically.
 */
export async function generateHandoffToken(
  userId: string,
  sessionId: string
): Promise<string> {
  const jti = crypto.randomUUID();
  const secret = getJwtSecret();

  const token = jwt.sign(
    { sub: userId, jti, pur: "wa_handoff" } satisfies HandoffPayload,
    secret,
    { expiresIn: HANDOFF_EXPIRY_SECS }
  );

  // Store jti in session collectedData so we can validate + consume it
  try {
    const session = await prisma.whatsAppOnboardingSession.findUnique({
      where: { id: sessionId },
      select: { collectedData: true },
    });

    const data = (session?.collectedData as Record<string, unknown>) ?? {};
    await prisma.whatsAppOnboardingSession.update({
      where: { id: sessionId },
      data: {
        collectedData: { ...data, handoffJti: jti, handoffIssuedAt: new Date().toISOString() } as any,
      },
    });
  } catch {
    // Session write fallback
  }

  return token;
}

export type HandoffResult =
  | { valid: true; sessionCookie: string; userId: string }
  | { valid: false; reason: string };

/**
 * Validate and consume a handoff token, returning a hirego_session JWT.
 * Single-use: jti is cleared from the session on first valid exchange.
 * Any subsequent attempts fail (replay protection).
 */
export async function consumeHandoffToken(token: string): Promise<HandoffResult> {
  const secret = getJwtSecret();

  let payload: HandoffPayload;
  try {
    payload = jwt.verify(token, secret) as HandoffPayload;
  } catch (err: any) {
    return { valid: false, reason: err?.name === "TokenExpiredError" ? "Link has expired." : "Invalid auth link." };
  }

  if (payload.pur !== "wa_handoff" || !payload.jti || !payload.sub) {
    return { valid: false, reason: "Invalid token purpose." };
  }

  let user: { id: string; email: string; name: string; role: string } | null = null;

  try {
    user = await prisma.$transaction(async (tx) => {
      const sessions = await tx.whatsAppOnboardingSession.findMany({
        where: { userId: payload.sub, status: "COMPLETE" },
        select: { id: true, collectedData: true },
        take: 5,
      });

      const session = sessions.find((candidate) => {
        const data = candidate.collectedData as Record<string, unknown>;
        return data?.handoffJti === payload.jti;
      });

      if (!session) return null;

      // Atomically clear handoffJti so token can never be used again
      const data = session.collectedData as Record<string, unknown>;
      const { handoffJti: _, handoffIssuedAt: __, ...rest } = data;
      await tx.whatsAppOnboardingSession.update({
        where: { id: session.id },
        data: { collectedData: rest as any },
      });

      return tx.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true },
      });
    }, { isolationLevel: "Serializable" });
  } catch {
    return { valid: false, reason: "Auth link has already been used or is invalid." };
  }

  if (!user) {
    return { valid: false, reason: "Auth link has already been used or is invalid." };
  }

  const sessionCookie = createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as any,
  });

  await logAuditEvent({
    userId: user.id,
    action: "WHATSAPP_AUTH_HANDOFF_CONSUMED",
    resource: "WhatsAppAuth",
    details: `Auth handoff token consumed for user ${user.id} with jti ${payload.jti}`,
  });

  return { valid: true, sessionCookie, userId: user.id };
}
