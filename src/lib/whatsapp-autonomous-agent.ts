import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dispatchAiTask } from "@/utils/aiRouter";
import { wrapUntrustedContent } from "@/lib/security/untrustedContent";
import { generateHandoffToken } from "@/lib/whatsapp-auth";
import { listPublicCopilotPlans } from "@/lib/copilot/commerce";
import { referralDb } from "@/lib/referral-db";
import { getReferralProgramConfig } from "@/lib/referral-rules";

export type WhatsAppAudience = "CANDIDATE" | "EMPLOYER" | "UNKNOWN";

export type EmployerIntent =
  | "HIRING_HELP"
  | "COPILOT"
  | "PLANS"
  | "MANAGED_HIRING"
  | "JOBS"
  | "REFERRAL"
  | "DASHBOARD"
  | "SUPPORT"
  | "UNKNOWN";

const employerIntentSchema = z.object({
  intent: z.enum([
    "HIRING_HELP",
    "COPILOT",
    "PLANS",
    "MANAGED_HIRING",
    "JOBS",
    "REFERRAL",
    "DASHBOARD",
    "SUPPORT",
    "UNKNOWN",
  ]),
}).strict();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://hiregoai.com").replace(/\/$/, "");
}

export function classifyWhatsAppAudience(raw: string): WhatsAppAudience {
  const text = normalize(raw);
  if (!text) return "UNKNOWN";

  const employerSignals = [
    /\b(hire|hiring|recruit|recruitment|talent|candidates?|vacanc(?:y|ies)|openings?)\b/,
    /\b(employer|hr|recruiter|company|business)\b/,
    /\b(staff|manpower|workforce)\b.*\b(need|chahiye|hire)\b/,
    /\b(copilot|managed hiring|pay per hire|pph)\b/,
  ];
  if (employerSignals.some((pattern) => pattern.test(text))) return "EMPLOYER";

  const candidateSignals = [
    /\b(job|jobs|naukri|career|apply|application)\b/,
    /\b(interview|resume|cv|assessment)\b/,
    /\b(job seeker|candidate|fresher)\b/,
    /\b(mujhe|mere liye|i need|looking for)\b.*\b(job|naukri)\b/,
  ];
  if (candidateSignals.some((pattern) => pattern.test(text))) return "CANDIDATE";

  return "UNKNOWN";
}

export function routeEmployerIntentDeterministically(raw: string): EmployerIntent {
  const text = normalize(raw);
  if (!text) return "UNKNOWN";
  if (/\b(copilot|co-pilot|automate hiring|automation|24.?7 recruiter)\b/.test(text)) return "COPILOT";
  if (/\b(plan|plans|pricing|price|subscription|cost|kitna|charges?)\b/.test(text)) return "PLANS";
  if (/\b(managed hiring|pay per hire|pph|bulk hiring|mass hiring|end.?to.?end hiring)\b/.test(text)) return "MANAGED_HIRING";
  if (/\b(my jobs|job posts?|open jobs|vacanc(?:y|ies)|job listing)\b/.test(text)) return "JOBS";
  if (/\b(referral|refer|earn|earning|make money|paisa|paise)\b/.test(text)) return "REFERRAL";
  if (/\b(dashboard|open hirego|account)\b/.test(text)) return "DASHBOARD";
  if (/\b(support|help|human|issue|problem|madad)\b/.test(text)) return "SUPPORT";
  if (/\b(hire|hiring|recruit|candidate|talent|screening|interview scheduling)\b/.test(text)) return "HIRING_HELP";
  return "UNKNOWN";
}

async function classifyEmployerIntentWithAi(raw: string): Promise<EmployerIntent> {
  const bounded = raw.trim().slice(0, 600);
  if (bounded.length < 3) return "UNKNOWN";

  try {
    const result = await dispatchAiTask({
      task: "GENERAL",
      taskType: "general",
      maxTokens: 80,
      temperature: 0,
      maxCostUsdPerRequest: 0.01,
      prompt: [
        "Classify a HireGo employer WhatsApp message into exactly one allowed intent.",
        "This is classification only. Do not answer the user and do not execute any action.",
        "Allowed intents: HIRING_HELP, COPILOT, PLANS, MANAGED_HIRING, JOBS, REFERRAL, DASHBOARD, SUPPORT, UNKNOWN.",
        'Return strict JSON only: {"intent":"ALLOWED_VALUE"}.',
        wrapUntrustedContent({ message: bounded }, "whatsapp-employer-message"),
      ].join("\n"),
    });
    return employerIntentSchema.parse(JSON.parse(result.resultText)).intent;
  } catch {
    return "UNKNOWN";
  }
}

export async function resolveEmployerIntent(raw: string): Promise<EmployerIntent> {
  const deterministic = routeEmployerIntentDeterministically(raw);
  if (deterministic !== "UNKNOWN") return deterministic;
  return classifyEmployerIntentWithAi(raw);
}

async function makeHandoffLink(
  userId: string,
  sessionId: string,
  destination:
    | "employer-dashboard"
    | "employer-plans"
    | "employer-copilot"
    | "employer-managed-hiring"
    | "employer-jobs"
    | "employer-referrals",
) {
  const token = await generateHandoffToken(userId, sessionId);
  const query = new URLSearchParams({ token, dest: destination });
  return `${appBaseUrl()}/api/whatsapp/auth/handoff?${query.toString()}`;
}

function money(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

export async function buildReferralWhatsAppSummary(userId: string): Promise<string> {
  try {
    const [stats, config] = await Promise.all([
      referralDb.getUserReferralStats(userId),
      getReferralProgramConfig(),
    ]);
    if (!stats.programEnabled) {
      return "HireGo's referral program is currently paused. I won't promise a reward while it is disabled.";
    }

    const rewardExamples = [
      config.candidateRewardAmount > 0
        ? `candidate qualifying purchase: up to ${money("INR", config.candidateRewardAmount)} per eligible transaction`
        : null,
      config.employerJobRewardAmount > 0
        ? `eligible employer job transaction: up to ${money("INR", config.employerJobRewardAmount)}`
        : null,
      config.managedHiringRewardAmount > 0
        ? `eligible Managed Hiring / PPH conversion: up to ${money("INR", config.managedHiringRewardAmount)}`
        : null,
    ].filter(Boolean);

    return [
      "💸 *HireGo Referral Program*",
      "",
      "Yes — you can earn from eligible referrals. Rewards are credited only when the server-side qualification rules are satisfied; sharing a link alone does not guarantee a payout.",
      rewardExamples.length ? `Current examples: ${rewardExamples.join("; ")}.` : "",
      "",
      `Your referral link:\n${stats.referralLink}`,
      `Available balance: ${money(stats.currency || "INR", stats.availableBalance)} • Lifetime earnings: ${money(stats.currency || "INR", stats.lifetimeEarnings)}`,
      `Minimum payout: ${money(stats.currency || "INR", stats.minPayoutAmount)}`,
      "",
      "Want me to explain which referral type is easiest for you to start with? Reply *yes*.",
    ].filter(Boolean).join("\n");
  } catch {
    return "Referral details are temporarily unavailable, so I won't guess a reward amount. You can open your referral dashboard and check the current server-confirmed rules.";
  }
}

type EmployerLeadState = {
  stage?: "COMPANY" | "ROLE" | "OPENINGS" | "LOCATION" | "TIMELINE" | "EMAIL" | "COMPLETE";
  companyName?: string;
  hiringRole?: string;
  openings?: number;
  location?: string;
  timeline?: string;
  email?: string;
  initialMessage?: string;
};

type SessionData = Record<string, unknown> & {
  autonomousSales?: EmployerLeadState;
};

async function readSessionData(sessionId: string): Promise<SessionData> {
  const session = await prisma.whatsAppOnboardingSession.findUnique({
    where: { id: sessionId },
    select: { collectedData: true },
  });
  return session?.collectedData && typeof session.collectedData === "object"
    ? session.collectedData as SessionData
    : {};
}

async function writeEmployerLeadState(sessionId: string, state: EmployerLeadState) {
  const current = await readSessionData(sessionId);
  await prisma.whatsAppOnboardingSession.update({
    where: { id: sessionId },
    data: {
      collectedData: {
        ...current,
        autonomousSales: state,
      },
    },
  });
}

function boundedText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export async function handleUnlinkedEmployerSalesLead(params: {
  sessionId: string;
  message: string;
}): Promise<string | null> {
  const current = await readSessionData(params.sessionId);
  const lead = current.autonomousSales || {};
  const message = boundedText(params.message, 500);

  // Do not hijack a new candidate conversation. Once an employer lead has
  // started, however, keep routing subsequent short answers through the same
  // durable session even when those answers do not contain employer keywords.
  if (!lead.stage && classifyWhatsAppAudience(message) !== "EMPLOYER") {
    return null;
  }

  if (!lead.stage) {
    await writeEmployerLeadState(params.sessionId, {
      stage: "COMPANY",
      initialMessage: message,
    });
    return [
      "Absolutely — I can help you hire through HireGo.",
      "I’ll keep this short and collect only what is needed to recommend the right hiring route.",
      "",
      "*What is your company name?*",
    ].join("\n");
  }

  if (lead.stage === "COMPANY") {
    const companyName = boundedText(message, 160);
    if (companyName.length < 2) return "Please send the company name so I can continue.";
    await writeEmployerLeadState(params.sessionId, { ...lead, companyName, stage: "ROLE" });
    return "*Which role are you hiring for?*\nExample: Customer Support Executive, Sales Manager, Software Engineer";
  }

  if (lead.stage === "ROLE") {
    const hiringRole = boundedText(message, 160);
    if (hiringRole.length < 2) return "Please send the role or job title you need to hire.";
    await writeEmployerLeadState(params.sessionId, { ...lead, hiringRole, stage: "OPENINGS" });
    return "*How many people do you need to hire?*\nReply with a number, for example *10*.";
  }

  if (lead.stage === "OPENINGS") {
    const match = message.match(/\d{1,5}/);
    const openings = match ? Number(match[0]) : NaN;
    if (!Number.isInteger(openings) || openings < 1 || openings > 10000) {
      return "Please send the number of openings, for example *10*.";
    }
    await writeEmployerLeadState(params.sessionId, { ...lead, openings, stage: "LOCATION" });
    return "*Where is the role based?*\nYou can also reply *Remote*.";
  }

  if (lead.stage === "LOCATION") {
    const location = boundedText(message, 160);
    if (location.length < 2) return "Please send the hiring location or *Remote*.";
    await writeEmployerLeadState(params.sessionId, { ...lead, location, stage: "TIMELINE" });
    return "*When do you want these hires to join?*\nExample: within 2 weeks, this month, or flexible.";
  }

  if (lead.stage === "TIMELINE") {
    const timeline = boundedText(message, 160);
    if (timeline.length < 2) return "Please tell me the target joining timeline.";
    await writeEmployerLeadState(params.sessionId, { ...lead, timeline, stage: "EMAIL" });
    return "*What work email should HireGo use for your employer account and hiring follow-up?*";
  }

  if (lead.stage === "EMAIL") {
    const email = message.toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 320) return "Please send a valid work email address.";
    const completed: EmployerLeadState = { ...lead, email, stage: "COMPLETE" };
    await writeEmployerLeadState(params.sessionId, completed);

    await prisma.systemEvent.upsert({
      where: { idempotencyKey: `whatsapp-employer-lead:${params.sessionId}` },
      update: {},
      create: {
        scope: "GLOBAL",
        eventType: "WHATSAPP_EMPLOYER_LEAD_QUALIFIED",
        correlationId: params.sessionId,
        idempotencyKey: `whatsapp-employer-lead:${params.sessionId}`,
        payload: {
          companyName: completed.companyName,
          hiringRole: completed.hiringRole,
          openings: completed.openings,
          location: completed.location,
          timeline: completed.timeline,
          email: completed.email,
          initialMessage: completed.initialMessage,
          source: "WHATSAPP",
        },
      },
    });

    return [
      "✅ Got it. Your hiring requirement is qualified.",
      "",
      `Company: *${completed.companyName}*`,
      `Role: *${completed.hiringRole}*`,
      `Openings: *${completed.openings}*`,
      `Location: *${completed.location}*`,
      `Timeline: *${completed.timeline}*`,
      "",
      "For repetitive screening, coordination and interview workflow, HireGo Copilot can operate the workflow continuously without requiring a recruiter for every routine step. Final consequential hiring decisions remain with an authorized human.",
      "",
      `Create/verify your employer account here:\n${appBaseUrl()}/employer/employer-registration-business-model`,
      "",
      "Reply *Copilot* if you want me to explain the automation before you register.",
    ].join("\n");
  }

  return [
    "Your hiring requirement is already captured.",
    `Continue employer setup here: ${appBaseUrl()}/employer/employer-registration-business-model`,
    "You can also ask me about *Copilot*, *Managed Hiring*, or *pricing*.",
  ].join("\n");
}

export async function handleLinkedEmployerWhatsApp(params: {
  userId: string;
  sessionId: string;
  message: string;
}): Promise<string> {
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: params.userId },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!employer) {
    return `I can help with employer hiring, but this account is not linked to a company profile yet. Continue setup here: ${appBaseUrl()}/employer/employer-registration-company-info`;
  }

  const intent = await resolveEmployerIntent(params.message);
  const companyId = employer.companyId;

  if (intent === "COPILOT" || intent === "PLANS" || intent === "HIRING_HELP") {
    const [activeCopilot, plans, activeJobs] = await Promise.all([
      prisma.copilotSubscription.findFirst({
        where: { companyId, status: "ACTIVE", endDate: { gt: new Date() } },
        include: { plan: { select: { name: true, monthlyCapacityUnits: true } } },
        orderBy: { endDate: "desc" },
      }),
      listPublicCopilotPlans("IN").catch(() => []),
      prisma.jobListing.count({ where: { companyId, status: "ACTIVE" } }),
    ]);

    if (activeCopilot) {
      const link = await makeHandoffLink(params.userId, params.sessionId, "employer-copilot");
      return [
        `*HireGo Copilot is already active* for ${employer.company.name}. ✅`,
        `Plan: ${activeCopilot.plan.name} • Capacity: ${activeCopilot.plan.monthlyCapacityUnits} units`,
        `Active jobs: ${activeJobs}`,
        "",
        "You don't need to buy it again. Open Copilot to manage the current hiring workflow:",
        link,
      ].join("\n");
    }

    const link = await makeHandoffLink(params.userId, params.sessionId, "employer-plans");
    const planLines = plans.slice(0, 3).map((plan) =>
      `• *${plan.name}* — ${money(plan.price.currency, plan.price.totalAmount)}${plan.price.taxLabel ? ` incl./plus applicable ${plan.price.taxLabel} per configured tax mode` : ""}`
    );

    return [
      activeJobs > 0
        ? `You currently have ${activeJobs} active job${activeJobs === 1 ? "" : "s"}. If screening and coordination are taking your team's time, Copilot is the automation layer for that repetitive work.`
        : "HireGo Copilot can run the repetitive hiring workflow once you have a role to hire for.",
      "",
      planLines.length ? "*Live plans:*\n" + planLines.join("\n") : "Live Copilot pricing is temporarily unavailable, so I won't quote a stale amount.",
      "",
      "Copilot assists with workflow automation; consequential hiring decisions remain human-approved.",
      `Open plans securely:\n${link}`,
      "",
      "If you tell me the role and number of hires, I can also explain whether Copilot or Managed Hiring fits that requirement.",
    ].join("\n");
  }

  if (intent === "MANAGED_HIRING") {
    const link = await makeHandoffLink(params.userId, params.sessionId, "employer-managed-hiring");
    return [
      "*HireGo Managed Hiring* is for employers who want HireGo to run the hiring operation rather than only provide software automation.",
      "It is especially relevant for urgent, bulk or end-to-end requirements. Commercial terms must come from the approved agreement flow; I won't invent a fee or discount in chat.",
      "",
      `Open Managed Hiring securely:\n${link}`,
    ].join("\n");
  }

  if (intent === "JOBS") {
    const jobs = await prisma.jobListing.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { title: true, status: true, numberOfOpenings: true },
    });
    const link = await makeHandoffLink(params.userId, params.sessionId, "employer-jobs");
    return [
      jobs.length
        ? "*Your recent jobs:*\n" + jobs.map((job) => `• ${job.title} — ${job.status} • ${job.numberOfOpenings} opening(s)`).join("\n")
        : "You don't have any jobs yet.",
      "",
      `Manage jobs securely:\n${link}`,
    ].join("\n");
  }

  if (intent === "REFERRAL") {
    const summary = await buildReferralWhatsAppSummary(params.userId);
    const link = await makeHandoffLink(params.userId, params.sessionId, "employer-referrals");
    return `${summary}\n\nOpen referral dashboard securely:\n${link}`;
  }

  if (intent === "DASHBOARD") {
    const link = await makeHandoffLink(params.userId, params.sessionId, "employer-dashboard");
    return `Open your secure HireGo employer dashboard here:\n${link}\n\nThis sign-in link expires shortly and can only be used once.`;
  }

  if (intent === "SUPPORT") {
    return "HireGo Support\n\nEmail: support@hiregoai.com\n\nNever share passwords, OTPs or payment secrets in WhatsApp.";
  }

  return [
    `I can work with ${employer.company.name} on the hiring journey, not just answer FAQs.`,
    "Tell me what you need in normal language — for example:",
    "• “We need to hire 20 support executives”",
    "• “Can Copilot automate screening?”",
    "• “Show my jobs”",
    "• “Explain Managed Hiring”",
    "• “How can I earn from referrals?”",
  ].join("\n");
}
