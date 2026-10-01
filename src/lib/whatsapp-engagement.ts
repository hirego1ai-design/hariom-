import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

const MIN_INACTIVITY_MS = 20 * 60 * 60 * 1000;
const MAX_WINDOW_AGE_MS = 23 * 60 * 60 * 1000 + 15 * 60 * 1000;
const EVENT_KEY = "WHATSAPP_VALUE_REENGAGEMENT";

type PendingAction = "PENDING_ASSESSMENT" | "MOCK_INTERVIEW" | "APPLICATION_STATUS";

type EngagementCandidate = {
  key: PendingAction;
  message: string;
};

type SessionData = Record<string, unknown> & {
  assistant?: Record<string, unknown> & {
    pendingProactiveAction?: PendingAction | null;
    pendingProactiveSetAt?: string | null;
  };
};

function sessionData(value: unknown): SessionData {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as SessionData
    : {};
}

async function findHighValueAction(userId: string): Promise<EngagementCandidate | null> {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return null;

  const now = new Date();

  const offer = await prisma.offer.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: "SENT",
      expiresAt: { gt: now },
    },
    orderBy: { sentAt: "desc" },
    select: { id: true },
  });
  if (offer) {
    return {
      key: "APPLICATION_STATUS",
      message:
        "You have a HireGo offer waiting for your attention. Want me to show the current offer/application status here? Reply *YES*.",
    };
  }

  const gate = await prisma.applicationGate.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: ["REQUIRED", "IN_PROGRESS"] },
      assessmentId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true },
  });
  if (gate) {
    return {
      key: "PENDING_ASSESSMENT",
      message:
        "Your HireGo assessment is still pending. Want me to open the secure assessment step for you? Reply *YES*.",
    };
  }

  const interview = await prisma.interview.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      scheduledAt: {
        gt: now,
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      application: { include: { job: { select: { title: true } } } },
    },
  });
  if (interview) {
    return {
      key: "MOCK_INTERVIEW",
      message:
        `Your interview for *${interview.application.job.title.slice(0, 80)}* is coming up. Want to do a quick HireGo AI Mock Interview practice first? Reply *YES*.`,
    };
  }

  return null;
}

async function setPendingAction(sessionId: string, action: PendingAction) {
  const session = await prisma.whatsAppOnboardingSession.findUnique({
    where: { id: sessionId },
    select: { collectedData: true },
  });
  if (!session) return;
  const current = sessionData(session.collectedData);
  await prisma.whatsAppOnboardingSession.update({
    where: { id: sessionId },
    data: {
      collectedData: {
        ...current,
        assistant: {
          ...(current.assistant || {}),
          pendingProactiveAction: action,
          pendingProactiveSetAt: new Date().toISOString(),
        },
      },
    },
  });
}

export type WhatsAppEngagementReport = {
  scanned: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  timeBudgetExhausted: boolean;
};

export class WhatsAppEngagementWorker {
  static async run(limit = 20, stopAt = Date.now() + 10_000): Promise<WhatsAppEngagementReport> {
    const nowMs = Date.now();
    const lowerBound = new Date(nowMs - MAX_WINDOW_AGE_MS);
    const upperBound = new Date(nowMs - MIN_INACTIVITY_MS);

    const contacts = await prisma.whatsAppContact.findMany({
      where: {
        userId: { not: null },
        optInStatus: "OPTED_IN",
        lastSeenAt: { gt: lowerBound, lte: upperBound },
        onboardingSession: { is: { status: "COMPLETE" } },
      },
      include: {
        onboardingSession: {
          select: { id: true, userId: true, status: true },
        },
        user: {
          select: { id: true, role: true },
        },
      },
      orderBy: { lastSeenAt: "asc" },
      take: Math.max(1, Math.min(limit, 100)),
    });

    const report: WhatsAppEngagementReport = {
      scanned: contacts.length,
      eligible: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      timeBudgetExhausted: false,
    };

    for (const contact of contacts) {
      if (Date.now() >= stopAt) {
        report.timeBudgetExhausted = true;
        break;
      }
      const userId = contact.userId;
      const onboardingSession = contact.onboardingSession;
      if (!userId || !onboardingSession?.id || onboardingSession.status !== "COMPLETE") {
        report.skipped += 1;
        continue;
      }

      // Sales nudges are intentionally not pushed proactively. This worker is
      // limited to candidate actions that already exist in authoritative state.
      if (contact.user?.role !== "CANDIDATE") {
        report.skipped += 1;
        continue;
      }

      const inbound = await prisma.whatsAppInboundEvent.findFirst({
        where: { waId: contact.waId },
        orderBy: { receivedAt: "desc" },
        select: { id: true, receivedAt: true },
      });
      if (!inbound) {
        report.skipped += 1;
        continue;
      }

      const age = Date.now() - inbound.receivedAt.getTime();
      if (age < MIN_INACTIVITY_MS || age > MAX_WINDOW_AGE_MS) {
        report.skipped += 1;
        continue;
      }

      const action = await findHighValueAction(userId);
      if (!action) {
        report.skipped += 1;
        continue;
      }
      report.eligible += 1;

      const idempotencyKey = `wa-window-nudge:${inbound.id}:${action.key}`;
      const existing = await prisma.communicationDelivery.findUnique({
        where: { idempotencyKey },
        select: { id: true, status: true, attemptCount: true },
      });
      if (existing && ["ACCEPTED", "DELIVERED", "READ", "SENT"].includes(existing.status)) {
        report.skipped += 1;
        continue;
      }
      if (existing && existing.attemptCount >= 2) {
        report.skipped += 1;
        continue;
      }

      const delivery = existing || await prisma.communicationDelivery.create({
        data: {
          eventKey: EVENT_KEY,
          channel: "WHATSAPP",
          audience: "CANDIDATE",
          recipientRef: userId,
          idempotencyKey,
          correlationId: inbound.id,
          status: "PENDING",
          maxAttempts: 2,
          retryable: false,
        },
        select: { id: true, status: true, attemptCount: true },
      });

      await setPendingAction(onboardingSession.id, action.key);
      const sent = await sendWhatsAppTextMessage(contact.waId, action.message);

      if (sent.sent) {
        await prisma.communicationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "ACCEPTED",
            provider: "META_WHATSAPP_CLOUD",
            providerMessageId: sent.messageId || null,
            acceptedAt: new Date(),
            attemptCount: { increment: 1 },
            lastError: null,
            lastErrorCode: null,
          },
        });
        report.sent += 1;
      } else {
        await prisma.communicationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "FAILED",
            attemptCount: { increment: 1 },
            failedAt: new Date(),
            lastError: (sent.reason || "WhatsApp provider rejected engagement message").slice(0, 1000),
            lastErrorCode: "WHATSAPP_ENGAGEMENT_SEND_FAILED",
          },
        });
        report.failed += 1;
      }
    }

    return report;
  }
}
