import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

const HOUR_MS = 60 * 60 * 1000;
const MIN_FOLLOWUP_AGE_MS = 18 * HOUR_MS;
const MAX_FOLLOWUP_AGE_MS = 23 * HOUR_MS + 30 * 60 * 1000;

export function isWhatsAppFollowupAgeEligible(lastInboundAt: Date, nowMs = Date.now()): boolean {
  const ageMs = nowMs - lastInboundAt.getTime();
  return ageMs >= MIN_FOLLOWUP_AGE_MS && ageMs <= MAX_FOLLOWUP_AGE_MS;
}

export type WhatsAppFollowupDecision =
  | { eligible: false; reason: string }
  | { eligible: true; message: string; eventKey: string };

async function candidateFollowupMessage(userId: string): Promise<WhatsAppFollowupDecision> {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return { eligible: false, reason: "candidate_profile_missing" };

  const pendingGate = await prisma.applicationGate.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: ["REQUIRED", "IN_PROGRESS"] },
    },
    include: {
      application: {
        include: {
          job: { select: { title: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (pendingGate) {
    const step = pendingGate.type === "UNIVERSAL_SKILL_VALIDATION"
      ? "HireGo Skill Validation"
      : "job assessment";
    return {
      eligible: true,
      eventKey: "WHATSAPP_PENDING_ASSESSMENT_NUDGE",
      message:
        "Your *" + step + "* for *" + pendingGate.application.job.title + "* is still pending. " +
        "Want me to open the secure assessment step? Reply *assessment*.",
    };
  }

  const upcomingInterview = await prisma.interview.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      scheduledAt: {
        gte: new Date(),
        lte: new Date(Date.now() + 48 * HOUR_MS),
      },
    },
    include: {
      application: {
        include: {
          job: { select: { title: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  if (upcomingInterview) {
    return {
      eligible: true,
      eventKey: "WHATSAPP_UPCOMING_INTERVIEW_NUDGE",
      message:
        "Your *" + upcomingInterview.application.job.title + "* interview is coming up. " +
        "Want a quick role-focused practice first? Reply *mock interview*.",
    };
  }

  return { eligible: false, reason: "no_high_value_pending_action" };
}

export async function shouldScheduleWhatsAppFollowup(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== "CANDIDATE") return false;
  const decision = await candidateFollowupMessage(userId);
  return decision.eligible;
}

export async function evaluateWhatsAppFollowup(anchorEventId: string): Promise<WhatsAppFollowupDecision> {
  const anchor = await prisma.whatsAppInboundEvent.findUnique({
    where: { id: anchorEventId },
    select: { id: true, waId: true, receivedAt: true },
  });
  if (!anchor) return { eligible: false, reason: "anchor_event_missing" };

  const ageMs = Date.now() - anchor.receivedAt.getTime();
  if (!isWhatsAppFollowupAgeEligible(anchor.receivedAt)) {
    return {
      eligible: false,
      reason: ageMs < MIN_FOLLOWUP_AGE_MS ? "too_early" : "conversation_window_not_safely_open",
    };
  }

  const [contact, latestInbound] = await Promise.all([
    prisma.whatsAppContact.findUnique({
      where: { waId: anchor.waId },
      select: { userId: true, optInStatus: true },
    }),
    prisma.whatsAppInboundEvent.findFirst({
      where: { waId: anchor.waId },
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      select: { id: true },
    }),
  ]);

  if (!contact?.userId) return { eligible: false, reason: "contact_not_linked" };
  if (contact.optInStatus !== "OPTED_IN") return { eligible: false, reason: "not_opted_in" };
  if (!latestInbound || latestInbound.id !== anchor.id) {
    return { eligible: false, reason: "user_replied_since_anchor" };
  }

  const user = await prisma.user.findUnique({
    where: { id: contact.userId },
    select: { role: true },
  });
  if (!user || user.role !== "CANDIDATE") {
    return { eligible: false, reason: "no_proactive_sales_nudge_for_non_candidate" };
  }

  return candidateFollowupMessage(contact.userId);
}

export async function runWhatsAppFollowupCheck(anchorEventId: string) {
  const decision = await evaluateWhatsAppFollowup(anchorEventId);
  if (!decision.eligible) return { sent: false, skipped: true, reason: decision.reason };

  const anchor = await prisma.whatsAppInboundEvent.findUniqueOrThrow({
    where: { id: anchorEventId },
    select: { waId: true, contact: { select: { userId: true } } },
  });
  const idempotencyKey = "whatsapp-followup:" + anchorEventId + ":" + decision.eventKey;

  let deliveryId: string;
  try {
    const delivery = await prisma.communicationDelivery.create({
      data: {
        eventKey: decision.eventKey,
        channel: "WHATSAPP",
        audience: "CANDIDATE",
        recipientRef: anchor.contact.userId || undefined,
        provider: "META_WHATSAPP",
        idempotencyKey,
        status: "PROCESSING",
        attemptCount: 1,
        maxAttempts: 1,
        retryable: false,
      },
      select: { id: true },
    });
    deliveryId = delivery.id;
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { sent: false, skipped: true, reason: "already_processed" };
    }
    throw error;
  }

  const sent = await sendWhatsAppTextMessage(anchor.waId, decision.message);
  if (!sent.sent) {
    await prisma.communicationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        lastErrorCode: "WHATSAPP_FOLLOWUP_SEND_FAILED",
        lastError: "WhatsApp provider did not accept the in-window follow-up.",
      },
    });
    return { sent: false, skipped: false, reason: "provider_rejected" };
  }

  await prisma.communicationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      providerMessageId: sent.messageId,
    },
  });

  return { sent: true, skipped: false };
}
