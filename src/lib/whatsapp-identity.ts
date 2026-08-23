/**
 * HireGo WhatsApp — Identity Resolution Engine
 *
 * Rules:
 * 1. Normalize phone to E.164 before any DB lookup.
 * 2. Always look up by Meta waId first (most authoritative).
 * 3. Fall back to normalized phone on User.phoneNumber.
 * 4. If multiple records match → AMBIGUOUS; never auto-merge.
 * 5. A WhatsApp message proves control of the conversation only,
 *    NOT automatic authorization to access an existing HireGo account.
 *    Existing-account linking requires additional OTP verification.
 * 6. Sanitize raw webhook payloads to redact unnecessary PII.
 */

import { prisma } from "./prisma";
import { logAuditEvent } from "./auditLogger";

// ─── Phone normalization ──────────────────────────────────────────────────────

/**
 * Normalize any phone string to E.164 format.
 * Handles: 10-digit Indian, 0-prefix, +91-prefix, spaces/dashes/parens.
 * Does NOT assume every number is Indian — only applies +91 when the
 * cleaned number is exactly 10 digits (no existing country code).
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // Strip everything except digits and leading +
  let cleaned = raw.replace(/[^\d+]/g, "");

  // Already E.164 with explicit country code
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);
    if (digits.length >= 7 && digits.length <= 15) return "+" + digits;
    return null;
  }

  // Strip leading zeros (e.g. 09876543210 → 9876543210)
  cleaned = cleaned.replace(/^0+/, "");

  // Indian number: starts with 91 + 10 digits = 12 total
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return "+" + cleaned;
  }

  // Plain 10-digit number — assume Indian (HireGo operates in India)
  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }

  // Other lengths with no country code: return with + as-is if plausible
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return "+" + cleaned;
  }

  return null;
}

/**
 * Convert normalized E.164 phone to Meta waId format (digits only, no +).
 * e.g. "+919876543210" → "919876543210"
 */
export function phoneToWaId(e164: string): string {
  return e164.replace(/^\+/, "");
}

/**
 * Convert Meta waId (digits only) to E.164.
 * e.g. "919876543210" → "+919876543210"
 */
export function waIdToE164(waId: string): string {
  return "+" + waId.replace(/\D/g, "");
}

// ─── Resolution result types ──────────────────────────────────────────────────

export type IdentityStatus =
  | "new_contact"         // No HireGo account, no WhatsApp record — start onboarding
  | "existing_contact"    // Known WhatsApp contact already linked to a User
  | "phone_match"         // Phone matches an existing User but not yet linked via WhatsApp
  | "ambiguous"           // Phone matches multiple HireGo records — require stronger verification
  | "unlinked_contact";   // WhatsApp contact exists but not yet linked to a User

export interface ResolvedIdentity {
  status: IdentityStatus;
  waContact: Awaited<ReturnType<typeof prisma.whatsAppContact.findUnique>> | null;
  user: { id: string; email: string; name: string; role: string; emailVerified: boolean; phoneNumber: string | null } | null;
  candidateProfileId: string | null;
  normalizedPhone: string;
  waId: string;
}

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve the full identity for an inbound WhatsApp message.
 * @param waId  - Meta's waId for the sender (digits only, e.g. "919876543210")
 */
export async function resolveWhatsAppIdentity(waId: string): Promise<ResolvedIdentity> {
  const normalizedPhone = waIdToE164(waId);
  const base: Pick<ResolvedIdentity, "normalizedPhone" | "waId"> = { normalizedPhone, waId };

  // Step 1 — Look up existing WhatsApp contact by waId (most authoritative)
  const waContact = await prisma.whatsAppContact.findUnique({
    where: { waId },
    include: { user: { select: { id: true, email: true, name: true, role: true, emailVerified: true, phoneNumber: true } } },
  });

  if (waContact) {
    if (waContact.userId && waContact.user) {
      // Known contact already linked to a User
      const candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: waContact.userId },
        select: { id: true },
      });
      return {
        ...base,
        status: "existing_contact",
        waContact,
        user: waContact.user as any,
        candidateProfileId: candidateProfile?.id ?? null,
      };
    }
    // Contact exists but not yet linked
    return { ...base, status: "unlinked_contact", waContact, user: null, candidateProfileId: null };
  }

  // Step 2 — Look up User by normalized phone
  const matchingUsers = await prisma.user.findMany({
    where: { phoneNumber: normalizedPhone },
    select: { id: true, email: true, name: true, role: true, emailVerified: true, phoneNumber: true },
    take: 3, // cap to detect ambiguity
  });

  if (matchingUsers.length > 1) {
    // Multiple records with same phone — ambiguous, do not auto-resolve
    await logAuditEvent({
      action: "WHATSAPP_IDENTITY_AMBIGUOUS",
      resource: "WhatsAppIdentity",
      details: `Multiple user records matched a WhatsApp contact (${matchingUsers.length} records).`,
    });
    return { ...base, status: "ambiguous", waContact: null, user: null, candidateProfileId: null };
  }

  if (matchingUsers.length === 1) {
    const user = matchingUsers[0];
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    return {
      ...base,
      status: "phone_match",
      waContact: null,
      user: user as any,
      candidateProfileId: candidateProfile?.id ?? null,
    };
  }

  // Step 3 — Completely new contact
  return { ...base, status: "new_contact", waContact: null, user: null, candidateProfileId: null };
}

// ─── Create or upsert WhatsApp contact ───────────────────────────────────────

/**
 * Ensure a WhatsAppContact row exists for the given waId.
 * Safe to call on every inbound message (upsert — no duplicate creation).
 */
export async function ensureWhatsAppContact(waId: string): Promise<NonNullable<Awaited<ReturnType<typeof prisma.whatsAppContact.findUnique>>>> {
  const normalizedPhone = waIdToE164(waId);

  return prisma.whatsAppContact.upsert({
    where: { waId },
    update: { lastSeenAt: new Date() },
    create: {
      waId,
      normalizedPhone,
      verificationStatus: "UNVERIFIED",
      linkStatus: "UNLINKED",
      optInStatus: "OPTED_IN",
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
}

// ─── Link verified contact to User ───────────────────────────────────────────

/**
 * Atomically link a verified WhatsApp contact to a canonical HireGo User.
 * Must only be called AFTER OTP/email verification succeeds.
 */
export async function linkContactToUser(
  waId: string,
  userId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Ensure no other contact is already linked to this user
    const existing = await tx.whatsAppContact.findFirst({ where: { userId } });
    if (existing && existing.waId !== waId) {
      throw new Error(`User ${userId} already has a linked WhatsApp contact (${existing.waId}).`);
    }

    await tx.whatsAppContact.update({
      where: { waId },
      data: {
        userId,
        verificationStatus: "VERIFIED",
        linkStatus: "LINKED",
      },
    });

    // Also write the normalized phone to User.phoneNumber if not set
    const user = await tx.user.findUnique({ where: { id: userId }, select: { phoneNumber: true } });
    if (!user?.phoneNumber) {
      await tx.user.update({
        where: { id: userId },
        data: { phoneNumber: waIdToE164(waId) },
      });
    }
  });

  await logAuditEvent({
    userId,
    action: "WHATSAPP_CONTACT_LINKED",
    resource: "WhatsAppContact",
    details: "Verified WhatsApp contact linked to user.",
  });
}

// ─── PII Sanitization for Inbound Payloads ────────────────────────────────────

/**
 * Sanitizes inbound raw payloads to avoid storing sensitive extraneous data
 * or tokens while retaining necessary debug/correlation fields.
 */
export function sanitizeRawPayload(payload: any): object {
  if (!payload || typeof payload !== "object") return {};

  return {
    id: payload.id ?? undefined,
    from: payload.from ? `${String(payload.from).slice(0, 4)}***${String(payload.from).slice(-3)}` : undefined,
    type: payload.type ?? "text",
    timestamp: payload.timestamp ?? undefined,
    hasText: Boolean(payload.text?.body),
    hasInteractive: Boolean(payload.interactive),
  };
}

// ─── Persist inbound event (idempotency) ──────────────────────────────────────

/**
 * Persist an inbound WhatsApp webhook event.
 * Returns { isDuplicate: true } if providerEventId already exists.
 */
export async function persistInboundEvent(params: {
  providerEventId: string;
  waId: string;
  messageType: string;
  messageText?: string;
  rawPayload: object;
}): Promise<{ isDuplicate: boolean; eventId: string }> {
  const existing = await prisma.whatsAppInboundEvent.findUnique({
    where: { providerEventId: params.providerEventId },
    select: { id: true },
  });

  if (existing) {
    return { isDuplicate: true, eventId: existing.id };
  }

  // Ensure contact row exists so the FK is satisfied
  await ensureWhatsAppContact(params.waId);

  // Sanitize payload to protect user privacy & limit PII retention
  const sanitized = sanitizeRawPayload(params.rawPayload);

  try {
    const event = await prisma.whatsAppInboundEvent.create({
      data: {
        providerEventId: params.providerEventId,
        waId: params.waId,
        messageType: params.messageType,
        messageText: params.messageText?.slice(0, 4_000) || null,
        rawPayload: sanitized as any,
        processed: false,
      },
      select: { id: true },
    });

    return { isDuplicate: false, eventId: event.id };
  } catch (error) {
    // Concurrent Meta retries can both pass the pre-check. The unique index is
    // the final idempotency guard, so resolve that race as a duplicate.
    const duplicate = await prisma.whatsAppInboundEvent.findUnique({
      where: { providerEventId: params.providerEventId },
      select: { id: true },
    });
    if (duplicate) return { isDuplicate: true, eventId: duplicate.id };
    throw error;
  }
}

/**
 * Mark an inbound event as processed (or failed).
 */
export async function markEventProcessed(eventId: string, error?: string): Promise<void> {
  await prisma.whatsAppInboundEvent.update({
    where: { id: eventId },
    data: {
      processed: !error,
      processingError: error ?? null,
      processedAt: new Date(),
    },
  });
}
