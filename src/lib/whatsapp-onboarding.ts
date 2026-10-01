/**
 * HireGo WhatsApp — Onboarding State Machine
 *
 * State flow (new contact):
 *   START → AUDIENCE → candidate: NAME → EMAIL → ROLE → EXPERIENCE → LOCATION → CONSENT
 *                    → CONFIRMATION → CREATING → COMPLETE
 *                    → employer: EMPLOYER_LEAD → qualified lead → employer registration
 *
 * State flow (existing user — phone match):
 *   START → EXISTING_USER_VERIFY (email OTP challenge) → COMPLETE
 *
 * Commands (any state): back | edit | restart | cancel | help
 *
 * Concurrency & Security:
 *   - Account creation is wrapped in prisma.$transaction.
 *   - New user email is created with emailVerified: false (phone is verified).
 *   - Auth handoff tokens expire in 5 minutes and are single-use.
 *   - WhatsAppContact.waId @unique prevents duplicate User creation race conditions.
 */

import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { referralDb } from "./referral-db";
import { logAuditEvent } from "./auditLogger";
import { generateAndSendOtp, verifyOtpCode } from "./otp";
import { checkWaOtpLimit } from "./whatsapp-rate-limiter";
import { findRole } from "./skill-master";
import { INDIA_US_LOCATION_MASTER } from "./location-master";
import crypto from "crypto";
import {
  resolveWhatsAppIdentity,
  ensureWhatsAppContact,
  linkContactToUser,
  waIdToE164,
  setWhatsAppConsent,
  isWhatsAppOptOutCommand,
} from "./whatsapp-identity";
import { handleCompletedWhatsAppAssistant } from "./whatsapp-candidate-assistant";
import {
  classifyWhatsAppAudience,
  handleLinkedEmployerWhatsApp,
  handleUnlinkedEmployerSalesLead,
} from "./whatsapp-autonomous-agent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingStep =
  | "START"
  | "AUDIENCE"
  | "EMPLOYER_LEAD"
  | "NAME"
  | "EMAIL"
  | "ROLE"
  | "EXPERIENCE"
  | "LOCATION"
  | "CONSENT"
  | "CONFIRMATION"
  | "EXISTING_USER_VERIFY"
  | "CREATING"
  | "COMPLETE"
  | "CANCELLED"
  | "EXPIRED";

export type SessionStatus = "ACTIVE" | "COMPLETE" | "CANCELLED" | "EXPIRED";

export interface CollectedData {
  name?: string;
  email?: string;
  role?: string;
  experienceYears?: number;
  location?: string;
  existingUserId?: string;          // Set during existing-user flow
  existingUserEmail?: string;       // For OTP challenge
  handoffJti?: string;
  handoffIssuedAt?: string;
  referralCode?: string;
  [key: string]: unknown;
}

export interface ProcessResult {
  reply: string;                    // Message to send back to candidate
  nextStep: OnboardingStep;
  sessionComplete: boolean;
  handoffToken?: string;            // Present on COMPLETE for new accounts
  userId?: string;
}

export interface WhatsAppProcessContext {
  campaignMeta?: Record<string, unknown>;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const SESSION_TTL_DAYS = 7;

async function getOrCreateSession(waId: string, contactId: string) {
  const existing = await prisma.whatsAppOnboardingSession.findUnique({
    where: { whatsAppContactId: contactId },
  });

  if (existing) {
    // Check expiry
    if (existing.status === "ACTIVE" && new Date() > existing.expiresAt) {
      await prisma.whatsAppOnboardingSession.update({
        where: { id: existing.id },
        data: { status: "EXPIRED" },
      });
      return { ...existing, status: "EXPIRED" as SessionStatus, currentStep: "EXPIRED" as OnboardingStep };
    }
    return existing;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  return prisma.whatsAppOnboardingSession.create({
    data: {
      whatsAppContactId: contactId,
      currentStep: "START",
      status: "ACTIVE",
      collectedData: {},
      expiresAt,
    },
  });
}

async function saveStep(sessionId: string, step: OnboardingStep, data?: CollectedData) {
  await prisma.whatsAppOnboardingSession.update({
    where: { id: sessionId },
    data: {
      currentStep: step,
      ...(data ? { collectedData: data as any } : {}),
    },
  });
}

async function reactivateSession(sessionId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  await prisma.whatsAppOnboardingSession.update({
    where: { id: sessionId },
    data: {
      currentStep: "START",
      status: "ACTIVE",
      collectedData: {},
      completedAt: null,
      expiresAt,
    },
  });
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,60}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractWhatsAppReferralCode(raw: string): string | null {
  const bounded = raw.trim().slice(0, 2_000);
  const match =
    bounded.match(/[?&]ref=([A-Za-z0-9_-]{4,64})(?:[&#\s]|$)/i) ||
    bounded.match(/(?:^|\s)(?:ref|referral)\s*[:=\-]?\s*([A-Za-z0-9_-]{4,64})(?:\s|$)/i);
  return match?.[1] ? match[1].toUpperCase() : null;
}


function validateName(raw: string): { valid: boolean; value?: string; error?: string } {
  const v = raw.trim();
  if (!NAME_RE.test(v)) return { valid: false, error: "Please enter a valid full name (2–60 letters)." };
  return { valid: true, value: v.replace(/\s+/g, " ") };
}

function validateEmail(raw: string): { valid: boolean; value?: string; error?: string } {
  const v = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(v)) return { valid: false, error: "That doesn't look like a valid email.\n\nPlease enter your email, e.g. rahul@example.com" };
  return { valid: true, value: v };
}

/** Parse experience from text: "3 years", "fresher", "0", "5+", etc. */
function parseExperience(raw: string): { valid: boolean; years?: number; error?: string } {
  const lower = raw.trim().toLowerCase();
  if (["fresher", "fresher.", "0", "no experience", "none"].includes(lower)) return { valid: true, years: 0 };
  if (lower.includes("fresher") || lower === "0 years") return { valid: true, years: 0 };

  const match = lower.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const n = parseFloat(match[1]);
    if (n >= 0 && n <= 50) return { valid: true, years: n };
  }
  return { valid: false, error: "Please enter your years of experience as a number, e.g. *3* or *Fresher* for no experience." };
}

function validateRole(raw: string): { valid: boolean; value?: string; error?: string } {
  const found = findRole(raw.trim());
  if (found) return { valid: true, value: found.title };
  // Accept free-text role with basic sanity
  const v = raw.trim();
  if (v.length >= 2 && v.length <= 80) return { valid: true, value: v };
  return { valid: false, error: "Please enter your target role, e.g. *Software Developer* or *HR Recruiter*." };
}

function validateLocation(raw: string): { valid: boolean; value?: string; error?: string } {
  const v = raw.trim();
  if (!v || v.length < 2) return { valid: false, error: "Please enter a city or location." };
  // Accept canonical or free text
  const canonical = INDIA_US_LOCATION_MASTER.find(
    (loc) => loc.toLowerCase().includes(v.toLowerCase())
  );
  return { valid: true, value: canonical ?? v };
}

// ─── Command detection ────────────────────────────────────────────────────────

const COMMANDS: Record<string, OnboardingStep | "back" | "edit" | "restart" | "cancel" | "help"> = {
  back: "back",
  "go back": "back",
  edit: "edit",
  change: "edit",
  restart: "restart",
  "start over": "restart",
  cancel: "cancel",
  help: "help",
  hi: "help",
  hello: "help",
  hey: "help",
};

function detectCommand(msg: string) {
  return COMMANDS[msg.trim().toLowerCase()] ?? null;
}

const STEP_ORDER: OnboardingStep[] = ["NAME", "EMAIL", "ROLE", "EXPERIENCE", "LOCATION", "CONSENT", "CONFIRMATION"];

function prevStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx > 0) return STEP_ORDER[idx - 1];
  return "NAME";
}

function stepPrompt(step: OnboardingStep, data: CollectedData, stepNum?: number): string {
  const total = STEP_ORDER.length;
  const num = stepNum ?? STEP_ORDER.indexOf(step) + 1;

  switch (step) {
    case "NAME":
      return `*${num}/${total} — What's your full name?*`;
    case "EMAIL":
      return `*${num}/${total} — What's your email address?*\n\nYou'll use this to log in to HireGo on the web.`;
    case "ROLE":
      return `*${num}/${total} — What role or job title are you looking for?*\n\nExample: _Software Developer_, _HR Recruiter_, _Data Analyst_`;
    case "EXPERIENCE":
      return `*${num}/${total} — How many years of experience do you have?*\n\nReply *Fresher* if you're just starting out.`;
    case "LOCATION":
      return `*${num}/${total} — What's your current city or location?*\n\nExample: _Bangalore_, _Mumbai_, _Delhi_`;
    case "CONSENT":
      return (
        `*${num}/${total} — WhatsApp updates*\n\n` +
        "Would you like HireGo to send job, application, assessment and interview updates to this WhatsApp number?\n\n" +
        "Reply *YES* to opt in or *NO* to continue without proactive WhatsApp updates. You can reply *STOP* anytime."
      );
    default:
      return "Please continue.";
  }
}

function confirmationMessage(data: CollectedData): string {
  return (
    `Please confirm your details:\n\n` +
    `*Name:* ${data.name}\n` +
    `*Email:* ${data.email}\n` +
    `*Role:* ${data.role}\n` +
    `*Experience:* ${data.experienceYears === 0 ? "Fresher" : data.experienceYears + " years"}\n` +
    `*Location:* ${data.location}\n\n` +
    `Reply *1* to confirm and create your account.\n` +
    `Reply *2* to edit a detail.\n` +
    `Reply *cancel* to exit.`
  );
}

function editMenu(): string {
  return (
    `Which detail would you like to edit?\n\n` +
    `1. Name\n2. Email\n3. Role\n4. Experience\n5. Location\n\n` +
    `Reply with the number.`
  );
}

const EDIT_STEP_MAP: Record<string, OnboardingStep> = {
  "1": "NAME",
  "2": "EMAIL",
  "3": "ROLE",
  "4": "EXPERIENCE",
  "5": "LOCATION",
  name: "NAME",
  email: "EMAIL",
  role: "ROLE",
  experience: "EXPERIENCE",
  location: "LOCATION",
};

// ─── Account creation transaction ────────────────────────────────────────────

async function createAccountTransaction(
  waId: string,
  data: CollectedData,
  sessionId: string
): Promise<{ userId: string; candidateId: string }> {
  return prisma.$transaction(async (tx) => {
    // Re-check for duplicate email inside transaction
    const existingByEmail = await tx.user.findUnique({ where: { email: data.email! } });
    if (existingByEmail) {
      // Edge case: email was registered between collection and confirmation
      throw new Error(`EMAIL_CONFLICT:${existingByEmail.id}`);
    }

    // Create User with a random strong password (passwordless — they'll use WhatsApp to log in)
    const randomPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = hashPassword(randomPassword);

    // Phone is verified by WhatsApp session; email remains unverified until verified via email OTP
    const user = await tx.user.create({
      data: {
        email: data.email!,
        passwordHash,
        name: data.name!,
        role: "CANDIDATE",
        phoneNumber: waIdToE164(waId),
        emailVerified: false,
      },
    });

    // Create CandidateProfile
    const candidate = await tx.candidateProfile.create({
      data: {
        userId: user.id,
        headline: data.role ?? "",
        location: data.location ?? "",
        experienceYears: data.experienceYears ?? 0,
        skills: [],
        education: [],
        experience: [],
        preferences: {
          preferredTitles: data.role ? [data.role] : [],
          source: "whatsapp",
        },
      },
    });

    // Link WhatsApp contact to User
    await tx.whatsAppContact.update({
      where: { waId },
      data: {
        userId: user.id,
        verificationStatus: "VERIFIED",
        linkStatus: "LINKED",
      },
    });

    // Update session
    await tx.whatsAppOnboardingSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETE",
        userId: user.id,
        candidateId: candidate.id,
        currentStep: "COMPLETE",
        completedAt: new Date(),
      },
    });

    return { userId: user.id, candidateId: candidate.id };
  });
}

// ─── Main processor ───────────────────────────────────────────────────────────

/**
 * Process an inbound WhatsApp message for a given sender.
 * Returns the reply message and next state.
 */
export async function processWhatsAppMessage(
  waId: string,
  rawMessage: string,
  context: WhatsAppProcessContext = {}
): Promise<ProcessResult> {
  const msg = rawMessage.trim();

  // Ensure contact row exists
  const contact = await ensureWhatsAppContact(waId);

  // Get or create session
  const session = await getOrCreateSession(waId, contact.id);

  // STOP/UNSUBSCRIBE must take effect regardless of onboarding state. Do not
  // continue the assistant after opt-out, which could otherwise look like a
  // marketing reply after the user explicitly revoked messaging consent.
  if (isWhatsAppOptOutCommand(msg)) {
    await setWhatsAppConsent(waId, "OPTED_OUT", "whatsapp_inbound_command");
    return {
      reply: "You have been opted out of proactive HireGo WhatsApp updates. You can still use HireGo on the web at https://hiregoai.com.",
      nextStep: session.currentStep as OnboardingStep,
      sessionComplete: session.status === "COMPLETE",
      userId: session.userId ?? undefined,
    };
  }

  // Click-to-WhatsApp referral metadata is accepted only from the signed Meta
  // webhook path and is first-touch attributed. Later messages cannot overwrite it.
  if (context.campaignMeta && !session.campaignMeta) {
    await prisma.whatsAppOnboardingSession.update({
      where: { id: session.id },
      data: {
        campaignMeta: context.campaignMeta as any,
        attributionSource: "meta_click_to_whatsapp",
      },
    });
  }

  const currentStep = session.currentStep as OnboardingStep;
  let data = (session.collectedData ?? {}) as CollectedData;

  // QR/share/referral links can pre-fill a referral code in the first message.
  // Capture it once; never let a later message overwrite first-touch attribution.
  const inboundReferralCode = extractWhatsAppReferralCode(msg);
  if (inboundReferralCode && !data.referralCode && session.status !== "COMPLETE") {
    data = { ...data, referralCode: inboundReferralCode };
    await prisma.whatsAppOnboardingSession.update({
      where: { id: session.id },
      data: {
        collectedData: data as any,
        referralCode: inboundReferralCode,
        attributionSource:
          session.attributionSource && session.attributionSource !== "whatsapp"
            ? session.attributionSource
            : "whatsapp_referral",
      },
    });
  }

  // ── Expired/cancelled session recovery ────────────────────────────────────
  if (currentStep === "EXPIRED" || session.status === "EXPIRED") {
    await reactivateSession(session.id);
    return processWhatsAppMessage(waId, rawMessage, context);
  }

  if (currentStep === "CANCELLED" || session.status === "CANCELLED") {
    const normalized = msg.toLowerCase();
    if (["hi", "hello", "hey", "start", "restart", "start over"].includes(normalized)) {
      await reactivateSession(session.id);
      return processWhatsAppMessage(waId, rawMessage, context);
    }
    return {
      reply: "Registration is currently cancelled. Reply *Hi* or *restart* whenever you want to begin again.",
      nextStep: "CANCELLED",
      sessionComplete: false,
    };
  }

  // ── Completed session / autonomous linked-user agent ───────────────────────
  if (currentStep === "COMPLETE" || session.status === "COMPLETE") {
    const userId = session.userId;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const reply = user?.role === "CANDIDATE"
        ? await handleCompletedWhatsAppAssistant({
            waId,
            userId,
            sessionId: session.id,
            message: msg,
          })
        : user && ["EMPLOYER", "RECRUITER"].includes(user.role)
          ? await handleLinkedEmployerWhatsApp({
              userId,
              sessionId: session.id,
              message: msg,
            })
          : "Admin operations remain in the secured HireGo admin portal.";
      return {
        reply,
        nextStep: "COMPLETE",
        sessionComplete: true,
        userId,
      };
    }
  }

  // ── START / Identity resolution ────────────────────────────────────────────
  if (currentStep === "START") {
    const identity = await resolveWhatsAppIdentity(waId);

    if (identity.status === "existing_contact") {
      // Already linked — bind this onboarding session to the canonical user so
      // every later WhatsApp message uses the role-aware autonomous agent.
      await prisma.whatsAppOnboardingSession.update({
        where: { id: session.id },
        data: {
          status: "COMPLETE",
          currentStep: "COMPLETE",
          userId: identity.user!.id,
          candidateId: identity.candidateProfileId,
          completedAt: session.completedAt ?? new Date(),
        },
      });
      const reply = identity.user!.role === "CANDIDATE"
        ? await handleCompletedWhatsAppAssistant({
            waId,
            userId: identity.user!.id,
            sessionId: session.id,
            message: msg,
          })
        : ["EMPLOYER", "RECRUITER"].includes(identity.user!.role)
          ? await handleLinkedEmployerWhatsApp({
              userId: identity.user!.id,
              sessionId: session.id,
              message: msg,
            })
          : "Admin operations remain in the secured HireGo admin portal.";
      return {
        reply,
        nextStep: "COMPLETE",
        sessionComplete: true,
        userId: identity.user!.id,
      };
    }

    if (identity.status === "ambiguous") {
      return {
        reply:
          `Welcome to HireGo AI.\n\nWe found multiple accounts associated with this number. ` +
          `Please contact support at support@hiregoai.com to verify your identity.`,
        nextStep: "START",
        sessionComplete: false,
      };
    }

    if (identity.status === "phone_match") {
      // Existing HireGo account — verify before linking
      const updatedData: CollectedData = {
        ...data,
        existingUserId: identity.user!.id,
        existingUserEmail: identity.user!.email,
      };
      await saveStep(session.id, "EXISTING_USER_VERIFY", updatedData);

      // Send email OTP to registered address — account enumeration safe
      const otpRequestLimit = await checkWaOtpLimit(waId, 5, 15 * 60_000);
      if (!otpRequestLimit.allowed) {
        return {
          reply: "Too many verification attempts. Please wait before requesting another code.",
          nextStep: "EXISTING_USER_VERIFY",
          sessionComplete: false,
        };
      }
      await generateAndSendOtp(identity.user!.email, "VERIFY_EMAIL");

      return {
        reply:
          `Welcome back to HireGo AI! 👋\n\n` +
          `We found an existing HireGo account associated with this number.\n\n` +
          `To verify, we've sent a 6-digit code to your registered email address.\n\n` +
          `Please reply with the code to continue.`,
        nextStep: "EXISTING_USER_VERIFY",
        sessionComplete: false,
      };
    }

    // New/unlinked contact — route by intent before choosing candidate or employer flow.
    const audience = classifyWhatsAppAudience(msg);
    if (audience === "EMPLOYER") {
      await saveStep(session.id, "EMPLOYER_LEAD", data);
      const reply = await handleUnlinkedEmployerSalesLead({
        sessionId: session.id,
        message: msg,
      });
      return {
        reply: reply ?? "Tell me whether you are hiring people or looking for a job.",
        nextStep: "EMPLOYER_LEAD",
        sessionComplete: false,
      };
    }
    if (audience === "CANDIDATE") {
      await saveStep(session.id, "NAME", {});
      return {
        reply:
          `Welcome to HireGo AI! 👋\n\nI'll set up your candidate profile in a few quick WhatsApp questions.\n\n` +
          stepPrompt("NAME", {}, 1),
        nextStep: "NAME",
        sessionComplete: false,
      };
    }

    await saveStep(session.id, "AUDIENCE", data);
    return {
      reply:
        "Welcome to HireGo AI! 👋\n\nI can continue the journey here on WhatsApp. Are you *looking for a job* or *hiring people*?",
      nextStep: "AUDIENCE",
      sessionComplete: false,
    };
  }

  // ── EXISTING USER VERIFY ──────────────────────────────────────────────────
  if (currentStep === "EXISTING_USER_VERIFY") {
    const userEmail = data.existingUserEmail;
    const userId = data.existingUserId;

    if (!userEmail || !userId) {
      await saveStep(session.id, "START", {});
      return { reply: "Something went wrong. Let's start over.", nextStep: "START", sessionComplete: false };
    }

    const otpAttemptLimit = await checkWaOtpLimit(waId, 5, 15 * 60_000);
    if (!otpAttemptLimit.allowed) {
      return {
        reply: "Too many verification attempts. Please wait before trying again.",
        nextStep: "EXISTING_USER_VERIFY",
        sessionComplete: false,
      };
    }
    const verification = await verifyOtpCode(userEmail, msg, "VERIFY_EMAIL");
    if (!verification.valid) {
      return {
        reply: `❌ ${verification.error ?? "Invalid code."}\n\nPlease try again or reply *cancel* to exit.`,
        nextStep: "EXISTING_USER_VERIFY",
        sessionComplete: false,
      };
    }

    // OTP verified — link contact to user
    await linkContactToUser(waId, userId);

    // Mark session complete
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    await prisma.whatsAppOnboardingSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETE",
        userId,
        candidateId: candidateProfile?.id ?? null,
        currentStep: "COMPLETE",
        completedAt: new Date(),
      },
    });

    // Generate role-aware handoff token (5 min expiry)
    const { generateHandoffToken } = await import("./whatsapp-auth");
    const token = await generateHandoffToken(userId, session.id);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } });
    const dest = user?.role === "CANDIDATE" ? "dashboard" : "employer-dashboard";
    const handoffUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hiregoai.com"}/api/whatsapp/auth/handoff?token=${token}&dest=${dest}`;

    return {
      reply:
        `✅ Verified! Welcome back, ${user?.name}.\n\nYour WhatsApp agent is connected to the same HireGo account state. Open your secure dashboard here:\n${handoffUrl}\n\n_This link expires in 5 minutes._`,
      nextStep: "COMPLETE",
      sessionComplete: true,
      handoffToken: token,
      userId,
    };
  }

  // ── Audience selection / unlinked employer sales flow ────────────────────
  if (currentStep === "AUDIENCE") {
    const audience = classifyWhatsAppAudience(msg);
    if (audience === "EMPLOYER") {
      await saveStep(session.id, "EMPLOYER_LEAD", data);
      const reply = await handleUnlinkedEmployerSalesLead({ sessionId: session.id, message: msg });
      return { reply: reply ?? "Tell me the hiring outcome you need.", nextStep: "EMPLOYER_LEAD", sessionComplete: false };
    }
    if (audience === "CANDIDATE") {
      await saveStep(session.id, "NAME", {});
      return {
        reply: `Great — let's build your candidate profile.\n\n${stepPrompt("NAME", {}, 1)}`,
        nextStep: "NAME",
        sessionComplete: false,
      };
    }
    return {
      reply: "Please tell me which journey you want: *I am looking for a job* or *I am hiring*.",
      nextStep: "AUDIENCE",
      sessionComplete: false,
    };
  }

  if (currentStep === "EMPLOYER_LEAD") {
    const normalized = msg.trim().toLowerCase();
    if (["restart", "start over", "candidate", "job seeker", "looking for a job"].includes(normalized)) {
      await reactivateSession(session.id);
      await saveStep(session.id, "AUDIENCE", {});
      return {
        reply: "No problem. Are you *looking for a job* or *hiring people*?",
        nextStep: "AUDIENCE",
        sessionComplete: false,
      };
    }
    if (["cancel", "stop"].includes(normalized)) {
      await saveStep(session.id, "CANCELLED");
      await prisma.whatsAppOnboardingSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
      return { reply: "Conversation paused. Send *Hi* whenever you want to continue.", nextStep: "CANCELLED", sessionComplete: false };
    }
    const reply = await handleUnlinkedEmployerSalesLead({ sessionId: session.id, message: msg });
    return { reply: reply ?? "Tell me the hiring outcome you need.", nextStep: "EMPLOYER_LEAD", sessionComplete: false };
  }

  // ── Command handling (any active step) ────────────────────────────────────
  const command = detectCommand(msg);

  if (command === "cancel") {
    await saveStep(session.id, "CANCELLED");
    await prisma.whatsAppOnboardingSession.update({
      where: { id: session.id },
      data: { status: "CANCELLED" },
    });
    return {
      reply: "Registration cancelled. Send *Hi* anytime to start again. 👋",
      nextStep: "CANCELLED",
      sessionComplete: false,
    };
  }

  if (command === "restart") {
    await saveStep(session.id, "NAME", {});
    return {
      reply: `Starting over! 🔄\n\n${stepPrompt("NAME", {}, 1)}`,
      nextStep: "NAME",
      sessionComplete: false,
    };
  }

  if (command === "help") {
    const currentLabel = currentStep === "COMPLETE" ? "account ready" : `current step: ${currentStep}`;
    return {
      reply:
        `HireGo AI Help 👇\n\n` +
        `• Reply *back* to go to the previous question\n` +
        `• Reply *edit* to change a detail\n` +
        `• Reply *restart* to start over\n` +
        `• Reply *cancel* to exit\n\n` +
        `Status: ${currentLabel}`,
      nextStep: currentStep,
      sessionComplete: false,
    };
  }

  if (command === "back") {
    const prev = prevStep(currentStep);
    await saveStep(session.id, prev);
    return {
      reply: stepPrompt(prev, data),
      nextStep: prev,
      sessionComplete: false,
    };
  }

  if (command === "edit") {
    await saveStep(session.id, "CONFIRMATION");
    return {
      reply: editMenu(),
      nextStep: "CONFIRMATION",
      sessionComplete: false,
    };
  }

  // ── Step handlers ─────────────────────────────────────────────────────────

  switch (currentStep) {
    // ── NAME ────────────────────────────────────────────────────────────────
    case "NAME": {
      const result = validateName(msg);
      if (!result.valid) {
        return { reply: `❌ ${result.error}\n\n${stepPrompt("NAME", data, 1)}`, nextStep: "NAME", sessionComplete: false };
      }
      const updated = { ...data, name: result.value };
      await saveStep(session.id, "EMAIL", updated);
      return { reply: stepPrompt("EMAIL", updated, 2), nextStep: "EMAIL", sessionComplete: false };
    }

    // ── EMAIL ───────────────────────────────────────────────────────────────
    case "EMAIL": {
      const result = validateEmail(msg);
      if (!result.valid) {
        return { reply: `❌ ${result.error}`, nextStep: "EMAIL", sessionComplete: false };
      }
      // Check for duplicate email
      const existing = await prisma.user.findUnique({ where: { email: result.value! } });
      if (existing) {
        return {
          reply:
            `An account with that email already exists.\n\nIf this is your account, please reply *cancel* ` +
            `and contact support@hiregoai.com, or use a different email address.`,
          nextStep: "EMAIL",
          sessionComplete: false,
        };
      }
      const updated = { ...data, email: result.value };
      await saveStep(session.id, "ROLE", updated);
      return { reply: stepPrompt("ROLE", updated, 3), nextStep: "ROLE", sessionComplete: false };
    }

    // ── ROLE ────────────────────────────────────────────────────────────────
    case "ROLE": {
      const result = validateRole(msg);
      if (!result.valid) {
        return { reply: `❌ ${result.error}`, nextStep: "ROLE", sessionComplete: false };
      }
      const updated = { ...data, role: result.value };
      await saveStep(session.id, "EXPERIENCE", updated);
      return { reply: stepPrompt("EXPERIENCE", updated, 4), nextStep: "EXPERIENCE", sessionComplete: false };
    }

    // ── EXPERIENCE ──────────────────────────────────────────────────────────
    case "EXPERIENCE": {
      const result = parseExperience(msg);
      if (!result.valid) {
        return { reply: `❌ ${result.error}`, nextStep: "EXPERIENCE", sessionComplete: false };
      }
      const updated = { ...data, experienceYears: result.years };
      await saveStep(session.id, "LOCATION", updated);
      return { reply: stepPrompt("LOCATION", updated, 5), nextStep: "LOCATION", sessionComplete: false };
    }

    // ── LOCATION ────────────────────────────────────────────────────
    case "LOCATION": {
      const result = validateLocation(msg);
      if (!result.valid) {
        return { reply: `❌ ${result.error}`, nextStep: "LOCATION", sessionComplete: false };
      }
      const updated = { ...data, location: result.value };
      await saveStep(session.id, "CONSENT", updated);
      return { reply: stepPrompt("CONSENT", updated, 6), nextStep: "CONSENT", sessionComplete: false };
    }

    // ── CONSENT ─────────────────────────────────────────────────────────────
    case "CONSENT": {
      const answer = msg.trim().toLowerCase();
      const yes = ["yes", "y", "haan", "ha", "1", "opt in", "agree"].includes(answer);
      const no = ["no", "n", "nahi", "nahin", "2", "skip"].includes(answer);
      if (!yes && !no) {
        return {
          reply: "Please reply *YES* to receive proactive HireGo WhatsApp updates or *NO* to continue without them.",
          nextStep: "CONSENT",
          sessionComplete: false,
        };
      }
      if (yes) {
        await setWhatsAppConsent(waId, "OPTED_IN", "whatsapp_onboarding_explicit_consent");
      } else {
        await setWhatsAppConsent(waId, "OPTED_OUT", "whatsapp_onboarding_explicit_decline");
      }
      const updated = { ...data, whatsappUpdatesOptIn: yes };
      await saveStep(session.id, "CONFIRMATION", updated);
      return {
        reply: (yes ? "✅ WhatsApp updates enabled.\n\n" : "No problem — proactive WhatsApp updates are off.\n\n") + confirmationMessage(updated),
        nextStep: "CONFIRMATION",
        sessionComplete: false,
      };
    }

    // ── CONFIRMATION ────────────────────────────────────────────────────────
    case "CONFIRMATION": {
      const trimmed = msg.trim();

      // Edit field selection
      if (EDIT_STEP_MAP[trimmed.toLowerCase()]) {
        const targetStep = EDIT_STEP_MAP[trimmed.toLowerCase()];
        await saveStep(session.id, targetStep);
        return { reply: stepPrompt(targetStep, data), nextStep: targetStep, sessionComplete: false };
      }

      if (trimmed === "2" || trimmed.toLowerCase() === "edit") {
        return { reply: editMenu(), nextStep: "CONFIRMATION", sessionComplete: false };
      }

      if (trimmed !== "1" && trimmed.toLowerCase() !== "confirm") {
        return { reply: `Please reply *1* to confirm or *2* to edit.\n\n${confirmationMessage(data)}`, nextStep: "CONFIRMATION", sessionComplete: false };
      }

      // Confirm — validate required fields before creation
      if (!data.name || !data.email || !data.role) {
        await saveStep(session.id, "NAME", {});
        return { reply: "Some details are missing. Let's collect them again.\n\n" + stepPrompt("NAME", {}), nextStep: "NAME", sessionComplete: false };
      }

      await saveStep(session.id, "CREATING");

      try {
        const { userId, candidateId } = await createAccountTransaction(waId, data, session.id);

        // Referral attribution
        if (data.referralCode) {
          try {
            const referrerId = await referralDb.resolveReferralCode(data.referralCode);
            if (referrerId && referrerId !== userId) {
              await referralDb.createAttribution({
                referrerId,
                referredUserId: userId,
                referralCode: data.referralCode,
                attributionSource: "WHATSAPP_REGISTRATION",
                userType: "CANDIDATE",
              });
            }
          } catch {
            // Non-critical — referral failure must not block account creation
          }
        }

        // Generate auth handoff token (5 min expiry)
        const { generateHandoffToken } = await import("./whatsapp-auth");
        const token = await generateHandoffToken(userId, session.id);
        const handoffUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://hiregoai.com"}/api/whatsapp/auth/handoff?token=${token}`;

        await logAuditEvent({
          userId,
          action: "WHATSAPP_ACCOUNT_CREATED",
          resource: "WhatsAppOnboarding",
          details: `New candidate created via WhatsApp onboarding. CandidateId: ${candidateId}`,
        });

        return {
          reply:
            `✅ Your HireGo account is ready, ${data.name}!\n\n` +
            `Tap the link below to open your dashboard:\n${handoffUrl}\n\n` +
            `_This link expires in 5 minutes._\n\n` +
            `Complete your profile there to improve your job matches 🚀`,
          nextStep: "COMPLETE",
          sessionComplete: true,
          handoffToken: token,
          userId,
        };
      } catch (err: any) {
        if (err.message?.startsWith("EMAIL_CONFLICT:")) {
          await saveStep(session.id, "EMAIL", { ...data, email: undefined });
          return {
            reply:
              `An account with that email was just registered.\n\n` +
              `Please enter a different email address.`,
            nextStep: "EMAIL",
            sessionComplete: false,
          };
        }
        // Generic creation failure — do not corrupt state
        await saveStep(session.id, "CONFIRMATION");
        return {
          reply: `We encountered a problem creating your account. Please try again by replying *1*.`,
          nextStep: "CONFIRMATION",
          sessionComplete: false,
        };
      }
    }

    default:
      return {
        reply: `Welcome back! Send *Hi* to continue or *help* for options.`,
        nextStep: currentStep,
        sessionComplete: false,
      };
  }
}
