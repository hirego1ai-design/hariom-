import { ApplicationGateStatus, ApplicationGateType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeMatchScore } from "@/lib/matching/JobMatchingEngine";
import { generateHandoffToken } from "@/lib/whatsapp-auth";
import {
  assignUniversalAssessment,
  getCandidateTargetRole,
  getUniversalValidationState,
} from "@/lib/universalSkillValidation";
import { DuplicateApplicationError, RosGateway } from "@/lib/ros/RosGateway";
import { dispatchApplicationReceivedConfirmation } from "@/lib/communications/applicationNotifications";
import { buildReferralWhatsAppSummary } from "@/lib/whatsapp-autonomous-agent";
import { dispatchAiTask } from "@/utils/aiRouter";
import { wrapUntrustedContent } from "@/lib/security/untrustedContent";
import { z } from "zod";

type CandidateIntent =
  | { type: "MENU" }
  | { type: "FIND_JOBS" }
  | { type: "APPLICATIONS" }
  | { type: "APPLICATION_STATUS" }
  | { type: "PROFILE" }
  | { type: "DASHBOARD" }
  | { type: "MOCK_INTERVIEW" }
  | { type: "VIDEO_RESUME" }
  | { type: "REFERRAL" }
  | { type: "PENDING_ASSESSMENT" }
  | { type: "SUPPORT" }
  | { type: "APPLY"; index: number }
  | { type: "UNKNOWN" };

type AssistantMemory = {
  lastJobIds?: string[];
  lastIntent?: string;
  lastOfferKey?: string;
  lastOfferAt?: string;
  pendingProactiveAction?: "PENDING_ASSESSMENT" | "MOCK_INTERVIEW" | "APPLICATION_STATUS" | null;
  pendingProactiveSetAt?: string | null;
};

type CollectedData = Record<string, unknown> & {
  assistant?: AssistantMemory;
};

const MENU =
  "Tell me what you want to do in normal language — I can continue the HireGo journey here on WhatsApp.\n\n" +
  "Examples: _show Delhi sales jobs_, _apply 2_, _my application status_, _practice mock interview_, _video resume_, or _how can I earn with referrals?_\n\n" +
  "Quick shortcuts if you prefer: 1 Jobs • 2 Applications • 3 Status • 4 Profile • 10 Dashboard • 0 Support.";

function normalizedText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function routeWhatsAppCandidateIntent(raw: string): CandidateIntent {
  const text = normalizedText(raw);
  if (!text || ["hi", "hello", "hey", "menu", "start", "help"].includes(text)) return { type: "MENU" };

  const applyMatch = text.match(/^(?:apply|apply for|i want to apply|mujhe apply karna hai)\s*(?:job\s*)?#?(\d{1,2})$/i);
  if (applyMatch) {
    const index = Number(applyMatch[1]);
    return Number.isInteger(index) && index >= 1 && index <= 20
      ? { type: "APPLY", index }
      : { type: "UNKNOWN" };
  }

  if (text === "1" || /\b(find|search|show|recommend|matching)\b.*\b(job|jobs|naukri)\b/.test(text) || /\b(job|jobs|naukri)\b.*\b(find|search|show|chahiye|dikhao)\b/.test(text)) {
    return { type: "FIND_JOBS" };
  }
  if (text === "2" || /\b(my applications|applications|applied jobs|meri applications|maine apply)\b/.test(text)) {
    return { type: "APPLICATIONS" };
  }
  if (text === "3" || /\b(application status|status of application|application ka status|mera status)\b/.test(text)) {
    return { type: "APPLICATION_STATUS" };
  }
  if (text === "4" || /\b(profile|complete profile|update profile|profile complete)\b/.test(text)) {
    return { type: "PROFILE" };
  }
  if (text === "10" || /\b(dashboard|open dashboard|hirego dashboard)\b/.test(text)) {
    return { type: "DASHBOARD" };
  }
  if (/\b(mock interview|practice interview|interview practice|prepare for interview|interview prep|mock karna|practice karna)\b/.test(text)) {
    return { type: "MOCK_INTERVIEW" };
  }
  if (/\b(video resume|video cv|record resume|upload video|profile video)\b/.test(text)) {
    return { type: "VIDEO_RESUME" };
  }
  if (/\b(referral|refer|earn|earning|make money|paisa|paise)\b/.test(text)) {
    return { type: "REFERRAL" };
  }
  if (/\b(pending assessment|assessment pending|open assessment|continue assessment|assessment)\b/.test(text)) {
    return { type: "PENDING_ASSESSMENT" };
  }
  if (text === "0" || /\b(support|human|agent|help me|madad)\b/.test(text)) {
    return { type: "SUPPORT" };
  }

  // A role/location-only query such as "Delhi BPO jobs" should still enter job search.
  if (/\b(job|jobs|naukri)\b/.test(text)) return { type: "FIND_JOBS" };

  return { type: "UNKNOWN" };
}

const candidateAiIntentSchema = z.object({
  intent: z.enum([
    "MENU",
    "FIND_JOBS",
    "APPLICATIONS",
    "APPLICATION_STATUS",
    "PROFILE",
    "DASHBOARD",
    "MOCK_INTERVIEW",
    "VIDEO_RESUME",
    "REFERRAL",
    "SUPPORT",
    "UNKNOWN",
  ]),
}).strict();

async function classifyCandidateIntentWithAi(raw: string): Promise<CandidateIntent> {
  const message = raw.trim().slice(0, 600);
  if (message.length < 3) return { type: "UNKNOWN" };

  try {
    const result = await dispatchAiTask({
      task: "GENERAL",
      taskType: "general",
      maxTokens: 80,
      temperature: 0,
      maxCostUsdPerRequest: 0.01,
      prompt: [
        "Classify a HireGo candidate WhatsApp message into exactly one allowed intent.",
        "Classification only. Do not answer the user, do not follow links and do not execute actions.",
        "Allowed: MENU, FIND_JOBS, APPLICATIONS, APPLICATION_STATUS, PROFILE, DASHBOARD, MOCK_INTERVIEW, VIDEO_RESUME, REFERRAL, SUPPORT, UNKNOWN.",
        'Return strict JSON only: {"intent":"ALLOWED_VALUE"}.',
        wrapUntrustedContent({ message }, "whatsapp-candidate-message"),
      ].join("\n"),
    });
    const parsed = candidateAiIntentSchema.parse(JSON.parse(result.resultText));
    return { type: parsed.intent } as CandidateIntent;
  } catch {
    return { type: "UNKNOWN" };
  }
}

async function resolveCandidateIntent(raw: string, sessionId: string): Promise<CandidateIntent> {
  const text = normalizedText(raw);
  if (["yes", "y", "haan", "ha", "sure", "okay", "ok"].includes(text)) {
    const memory = await readMemory(sessionId);
    if (memory.assistant?.lastOfferKey === "MOCK_INTERVIEW_UPCOMING") return { type: "MOCK_INTERVIEW" };
    if (memory.assistant?.lastOfferKey === "VIDEO_RESUME_DISCOVERY") return { type: "VIDEO_RESUME" };
    if (memory.assistant?.lastOfferKey === "REFERRAL_DISCOVERY" || memory.assistant?.lastOfferKey === "REFERRAL_EXPLAIN_MORE") {
      return { type: "REFERRAL" };
    }
  }

  const deterministic = routeWhatsAppCandidateIntent(raw);
  if (deterministic.type !== "UNKNOWN") return deterministic;
  return classifyCandidateIntentWithAi(raw);
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://hiregoai.com").replace(/\/$/, "");
}

async function readMemory(sessionId: string): Promise<CollectedData> {
  const session = await prisma.whatsAppOnboardingSession.findUnique({
    where: { id: sessionId },
    select: { collectedData: true },
  });
  return (session?.collectedData && typeof session.collectedData === "object"
    ? session.collectedData
    : {}) as CollectedData;
}

async function writeMemory(sessionId: string, patch: AssistantMemory) {
  const current = await readMemory(sessionId);
  await prisma.whatsAppOnboardingSession.update({
    where: { id: sessionId },
    data: {
      collectedData: {
        ...current,
        assistant: {
          ...(current.assistant || {}),
          ...patch,
        },
      },
    },
  });
}

async function makeHandoffLink(
  userId: string,
  sessionId: string,
  destination:
    | "dashboard"
    | "profile"
    | "jobs"
    | "skill-validation"
    | "job-assessment"
    | "mock-interview"
    | "video-resume"
    | "referrals" = "dashboard",
  params: { assessmentId?: string; applicationId?: string } = {},
) {
  const token = await generateHandoffToken(userId, sessionId);
  const query = new URLSearchParams({
    token,
    dest: destination,
    ...(params.assessmentId ? { assessmentId: params.assessmentId } : {}),
    ...(params.applicationId ? { applicationId: params.applicationId } : {}),
  });
  return `${appBaseUrl()}/api/whatsapp/auth/handoff?${query.toString()}`;
}

function compact(value: string | null | undefined, max = 70) {
  const trimmed = (value || "").replace(/\s+/g, " ").trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

async function findRecommendedJobs(userId: string, sessionId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      candidateSkills: { where: { isVisible: true } },
    },
  });
  if (!candidate) {
    return "I couldn't find your candidate profile. Reply *4* to reopen profile setup.";
  }

  const jobs = await prisma.jobListing.findMany({
    where: {
      status: "ACTIVE",
      publishedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      company: { select: { name: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  if (!jobs.length) return "There are no active jobs available right now. Please try again later.";

  const preferences = candidate.preferences && typeof candidate.preferences === "object"
    ? candidate.preferences as Record<string, unknown>
    : {};
  const preferredTitles = Array.isArray(preferences.preferredTitles)
    ? preferences.preferredTitles.filter((v): v is string => typeof v === "string")
    : [];
  const targetRole = (preferredTitles[0] || candidate.headline || "").toLowerCase();
  const location = (candidate.location || "").toLowerCase();

  const ranked = jobs.map((job) => {
    const match = computeMatchScore(candidate, job);
    const titleBoost = targetRole && job.title.toLowerCase().includes(targetRole) ? 25 : 0;
    const locationBoost = location && (job.location || "").toLowerCase().includes(location) ? 10 : 0;
    return {
      job,
      match,
      sortScore: (match.evidenceAvailable ? match.matchScore : 0) + titleBoost + locationBoost,
    };
  }).sort((a, b) => b.sortScore - a.sortScore).slice(0, 5);

  await writeMemory(sessionId, {
    lastJobIds: ranked.map(({ job }) => job.id),
    lastIntent: "FIND_JOBS",
  });

  const lines = ranked.map(({ job, match }, index) => {
    const measured = match.evidenceAvailable ? ` • Match ${match.matchScore}%` : "";
    const company = job.company?.name ? ` — ${compact(job.company.name, 45)}` : "";
    const locationText = job.location ? ` • ${compact(job.location, 45)}` : "";
    return `*${index + 1}. ${compact(job.title, 70)}*${company}\n${locationText}${measured}`;
  });

  return (
    `Here are your top active HireGo jobs:\n\n${lines.join("\n\n")}\n\n` +
    "To apply, reply *apply 1*, *apply 2*, etc.\n" +
    "_HireGo only shows a match percentage when enough profile evidence is available._"
  );
}

async function maybeInterviewPracticeOffer(userId: string, sessionId: string): Promise<string> {
  const memory = await readMemory(sessionId);
  const lastOfferAt = memory.assistant?.lastOfferAt ? Date.parse(memory.assistant.lastOfferAt) : 0;
  if (memory.assistant?.lastOfferKey === "MOCK_INTERVIEW_UPCOMING" && Date.now() - lastOfferAt < 48 * 60 * 60 * 1000) {
    return "";
  }

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return "";

  const upcoming = await prisma.interview.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      scheduledAt: { gt: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: { application: { include: { job: { select: { title: true } } } } },
  });
  if (!upcoming) return "";

  const recentPractice = await prisma.mockInterviewSession.findFirst({
    where: {
      candidateProfileId: candidate.id,
      status: "COMPLETED",
      updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recentPractice) return "";

  await writeMemory(sessionId, {
    lastOfferKey: "MOCK_INTERVIEW_UPCOMING",
    lastOfferAt: new Date().toISOString(),
  });

  return (
    "\n\n🎯 You have an upcoming interview for *" +
    compact(upcoming.application.job.title, 70) +
    "*. Want to do a quick AI Mock Interview practice before it? Reply *mock interview*."
  );
}

async function candidateGreeting(userId: string, sessionId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      videoResumes: { select: { id: true }, take: 1 },
    },
  });
  if (!candidate) {
    return "Your HireGo account is connected, but your candidate profile still needs attention. Reply *profile* and I’ll open the secure profile step.";
  }

  const pendingGate = await prisma.applicationGate.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
    },
    include: { application: { include: { job: { select: { title: true } } } } },
    orderBy: { updatedAt: "desc" },
  });
  if (pendingGate) {
    return (
      "Welcome back. You have a required step pending for *" +
      compact(pendingGate.application.job.title, 70) +
      "*. Reply *application status* and I’ll take you to the correct secure action."
    );
  }

  const practiceOffer = await maybeInterviewPracticeOffer(userId, sessionId);
  if (practiceOffer) {
    return "Welcome back. 👋" + practiceOffer;
  }

  const memory = await readMemory(sessionId);
  const lastOfferAt = memory.assistant?.lastOfferAt ? Date.parse(memory.assistant.lastOfferAt) : 0;
  const offerCoolingDown = Number.isFinite(lastOfferAt) && Date.now() - lastOfferAt < 30 * 24 * 60 * 60 * 1000;

  if (!candidate.videoResumes.length && !offerCoolingDown) {
    await writeMemory(sessionId, {
      lastOfferKey: "VIDEO_RESUME_DISCOVERY",
      lastOfferAt: new Date().toISOString(),
    });
    return "Your core HireGo profile is ready. Want to add a *Video Resume* so employers can review richer evidence? Reply *yes* or *video resume*.";
  }

  if (!offerCoolingDown) {
    await writeMemory(sessionId, {
      lastOfferKey: "REFERRAL_DISCOVERY",
      lastOfferAt: new Date().toISOString(),
    });
    return "Welcome back. 👋 Did you know HireGo also has a referral program where eligible qualifying referrals can earn rewards? Reply *yes* or *referral* and I’ll show your real current rules and link.";
  }

  return "Welcome back. Tell me the outcome you want in normal language — jobs, application status, interview practice, Video Resume, referrals, profile or support.";
}

async function listApplications(userId: string, sessionId: string, statusOnly = false) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return "Candidate profile not found.";

  const applications = await prisma.application.findMany({
    where: { candidateProfileId: candidate.id },
    include: {
      job: { include: { company: { select: { name: true } } } },
      gates: {
        where: { status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] } },
        select: { type: true, assessmentId: true, status: true },
      },
      offers: {
        where: { status: { in: ["SENT", "ACCEPTED"] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (!applications.length) {
    return "You haven't applied to any jobs yet. Reply *1* and I'll find active jobs for you.";
  }

  const lines = applications.map((application, index) => {
    const company = application.job.company?.name ? ` — ${compact(application.job.company.name, 40)}` : "";
    const pendingGate = application.gates[0];
    const gate = pendingGate
      ? pendingGate.type === ApplicationGateType.UNIVERSAL_SKILL_VALIDATION
        ? " • Skill validation pending"
        : " • Job assessment pending"
      : "";
    const offer = application.offers[0] ? ` • Offer ${application.offers[0].status.toLowerCase()}` : "";
    return `*${index + 1}. ${compact(application.job.title, 65)}*${company}\nStatus: ${application.status.replace(/_/g, " ")}${gate}${offer}`;
  });

  let pendingAction = "";
  const actionable = applications.find((application) => application.gates[0]?.assessmentId);
  if (actionable?.gates[0]?.assessmentId) {
    const gate = actionable.gates[0];
    const assessmentId = gate.assessmentId;
    if (!assessmentId) throw new Error("Assessment handoff requires an assessment id.");
    const link = gate.type === ApplicationGateType.UNIVERSAL_SKILL_VALIDATION
      ? await makeHandoffLink(userId, sessionId, "skill-validation", {
          assessmentId,
          applicationId: actionable.id,
        })
      : await makeHandoffLink(userId, sessionId, "job-assessment", {
          assessmentId,
        });
    pendingAction = `\n\nContinue your pending assessment securely:\n${link}`;
  }

  const practiceOffer = await maybeInterviewPracticeOffer(userId, sessionId);
  return `${statusOnly ? "Your latest application status:" : "Your recent applications:"}\n\n${lines.join("\n\n")}\n\nReply *1* to find more jobs.${pendingAction}${practiceOffer}`;
}

async function applyToRememberedJob(userId: string, sessionId: string, index: number) {
  const memory = await readMemory(sessionId);
  const jobId = memory.assistant?.lastJobIds?.[index - 1];
  if (!jobId) {
    return "That job selection has expired or isn't in your latest list. Reply *1* to refresh jobs, then reply *apply 1*.";
  }

  const [candidate, job] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { userId } }),
    prisma.jobListing.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, companyId: true, status: true, expiresAt: true },
    }),
  ]);
  if (!candidate) return "Candidate profile not found. Reply *4* to complete your profile.";
  if (!job || job.status !== "ACTIVE" || (job.expiresAt && job.expiresAt <= new Date())) {
    return "That job is no longer accepting applications. Reply *1* and I'll refresh the active jobs.";
  }

  const existing = await prisma.application.findUnique({
    where: {
      candidateProfileId_jobId: {
        candidateProfileId: candidate.id,
        jobId: job.id,
      },
    },
    include: {
      gates: {
        where: { status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] } },
        select: { type: true, assessmentId: true },
        take: 1,
      },
    },
  });
  if (existing) {
    const gate = existing.gates[0];
    if (gate?.assessmentId) {
      const link = gate.type === ApplicationGateType.UNIVERSAL_SKILL_VALIDATION
        ? await makeHandoffLink(userId, sessionId, "skill-validation", { assessmentId: gate.assessmentId, applicationId: existing.id })
        : await makeHandoffLink(userId, sessionId, "job-assessment", { assessmentId: gate.assessmentId });
      return `You've already started applying for *${compact(job.title)}*.\n\nComplete the pending assessment here:\n${link}`;
    }
    return `You've already applied for *${compact(job.title)}*. Current status: *${existing.status.replace(/_/g, " ")}*.`;
  }

  const targetRole = getCandidateTargetRole(candidate.preferences) || job.title;
  const validationState = await getUniversalValidationState(candidate.id, targetRole);

  try {
    if (!validationState.completedAndCurrent) {
      const pending = await RosGateway.handleApplicationValidationIntent({
        userId,
        jobId: job.id,
        candidateProfileId: candidate.id,
        companyId: job.companyId,
      });
      const assignment = await assignUniversalAssessment(candidate.id, targetRole);
      await RosGateway.attachUniversalAssessment({
        applicationId: pending.application.id,
        candidateProfileId: candidate.id,
        assessmentId: assignment.assessment.id,
      });
      const link = await makeHandoffLink(userId, sessionId, "skill-validation", {
        assessmentId: assignment.assessment.id,
        applicationId: pending.application.id,
      });
      await writeMemory(sessionId, { lastIntent: "APPLY_PENDING_VALIDATION" });
      return (
        `Your application for *${compact(job.title)}* is saved. ✅\n\n` +
        "HireGo Skill Validation is required before the application is released to the employer.\n" +
        `Continue securely here:\n${link}`
      );
    }

    const submission = await RosGateway.handleApplicationSubmission({
      userId,
      jobId: job.id,
      candidateProfileId: candidate.id,
      companyId: job.companyId,
    });
    await dispatchApplicationReceivedConfirmation({
      applicationId: submission.application.id,
      userId,
      jobId: job.id,
    });

    await writeMemory(sessionId, { lastIntent: "APPLICATION_SUBMITTED" });

    if (submission.jobSpecificAssessmentId) {
      const link = await makeHandoffLink(userId, sessionId, "job-assessment", {
        assessmentId: submission.jobSpecificAssessmentId,
      });
      return (
        `Application submitted for *${compact(job.title)}*. ✅\n\n` +
        "This employer requires an additional job-specific assessment.\n" +
        `Start it here:\n${link}`
      );
    }

    return `Application submitted for *${compact(job.title)}*. ✅\n\nI'll keep your application status available here on WhatsApp. Reply *3* anytime.`;
  } catch (error) {
    if (error instanceof DuplicateApplicationError || (error as { code?: string })?.code === "P2002") {
      return `You've already applied for *${compact(job.title)}*. Reply *3* to check the status.`;
    }
    return "I couldn't complete that application safely right now. Your existing data has not been duplicated. Please try again shortly.";
  }
}

async function pendingAssessmentHandoff(userId: string, sessionId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!candidate) return "Candidate profile not found.";

  const gate = await prisma.applicationGate.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      status: { in: [ApplicationGateStatus.REQUIRED, ApplicationGateStatus.IN_PROGRESS] },
      assessmentId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    select: {
      type: true,
      assessmentId: true,
      applicationId: true,
      application: { select: { job: { select: { title: true } } } },
    },
  });
  if (!gate?.assessmentId) {
    return "I checked your current applications and there is no pending assessment right now.";
  }

  const link = gate.type === ApplicationGateType.UNIVERSAL_SKILL_VALIDATION
    ? await makeHandoffLink(userId, sessionId, "skill-validation", {
        assessmentId: gate.assessmentId,
        applicationId: gate.applicationId,
      })
    : await makeHandoffLink(userId, sessionId, "job-assessment", {
        assessmentId: gate.assessmentId,
      });

  return `Your pending assessment for *${compact(gate.application.job.title, 80)}* is ready.\n\nContinue securely here:\n${link}`;
}

async function mockInterviewHandoff(userId: string, sessionId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      headline: true,
      preferences: true,
    },
  });
  if (!candidate) return "Complete your candidate profile first, then I can start interview practice.";

  const upcoming = await prisma.interview.findFirst({
    where: {
      application: { candidateProfileId: candidate.id },
      scheduledAt: { gt: new Date() },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: { application: { include: { job: { select: { title: true } } } } },
  });
  const targetRole = upcoming?.application.job.title || getCandidateTargetRole(candidate.preferences) || candidate.headline || "your target role";
  const link = await makeHandoffLink(userId, sessionId, "mock-interview");
  return [
    upcoming
      ? `You have an upcoming *${compact(targetRole, 80)}* interview. A role-focused mock practice is a useful next step.`
      : `I can help you practice for *${compact(targetRole, 80)}* with HireGo AI Mock Interview.`,
    "",
    `Start securely here:\n${link}`,
    "",
    "The mock interview is practice feedback; it does not automatically change an employer's hiring decision.",
  ].join("\n");
}

async function videoResumeHandoff(userId: string, sessionId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true, videoResumes: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, analysisStatus: true } } },
  });
  if (!candidate) return "Complete your candidate profile first.";
  const latest = candidate.videoResumes[0];
  const link = await makeHandoffLink(userId, sessionId, "video-resume");
  return latest
    ? `Your latest Video Resume status is *${latest.analysisStatus}*.\n\nOpen it securely here:\n${link}`
    : `A Video Resume can add richer evidence to your HireGo profile. Recording/upload happens on the secure website, then you can continue the journey here on WhatsApp.\n\nOpen securely:\n${link}`;
}

async function referralHandoff(userId: string, sessionId: string) {
  await writeMemory(sessionId, {
    lastOfferKey: "REFERRAL_EXPLAIN_MORE",
    lastOfferAt: new Date().toISOString(),
  });
  const [summary, link] = await Promise.all([
    buildReferralWhatsAppSummary(userId),
    makeHandoffLink(userId, sessionId, "referrals"),
  ]);
  return `${summary}\n\nOpen your referral dashboard securely:\n${link}`;
}

async function profileOrDashboard(userId: string, sessionId: string, profile = false) {
  const link = await makeHandoffLink(userId, sessionId, profile ? "profile" : "dashboard");
  return profile
    ? `Open your secure HireGo profile here:\n${link}\n\nThe sign-in link expires shortly and can only be used once.`
    : `Open your secure HireGo dashboard here:\n${link}\n\nThe sign-in link expires shortly and can only be used once.`;
}

export async function handleCompletedWhatsAppAssistant(params: {
  waId: string;
  userId: string;
  sessionId: string;
  message: string;
}): Promise<string> {
  const pendingMemory = await readMemory(params.sessionId);
  const pendingAction = pendingMemory.assistant?.pendingProactiveAction;
  const pendingSetAt = pendingMemory.assistant?.pendingProactiveSetAt
    ? Date.parse(pendingMemory.assistant.pendingProactiveSetAt)
    : 0;
  const affirmative = ["yes", "y", "haan", "ha", "sure", "ok", "okay", "do it"].includes(normalizedText(params.message));

  let intent: CandidateIntent;
  if (affirmative && pendingAction && pendingSetAt > 0 && Date.now() - pendingSetAt < 26 * 60 * 60 * 1000) {
    intent = pendingAction === "PENDING_ASSESSMENT"
      ? { type: "PENDING_ASSESSMENT" }
      : pendingAction === "MOCK_INTERVIEW"
        ? { type: "MOCK_INTERVIEW" }
        : { type: "APPLICATION_STATUS" };
    await writeMemory(params.sessionId, {
      pendingProactiveAction: null,
      pendingProactiveSetAt: null,
    });
  } else {
    intent = await resolveCandidateIntent(params.message, params.sessionId);
  }

  switch (intent.type) {
    case "MENU":
      return candidateGreeting(params.userId, params.sessionId);
    case "FIND_JOBS":
      return findRecommendedJobs(params.userId, params.sessionId);
    case "APPLICATIONS":
      return listApplications(params.userId, params.sessionId, false);
    case "APPLICATION_STATUS":
      return listApplications(params.userId, params.sessionId, true);
    case "PROFILE":
      return profileOrDashboard(params.userId, params.sessionId, true);
    case "DASHBOARD":
      return profileOrDashboard(params.userId, params.sessionId, false);
    case "MOCK_INTERVIEW":
      return mockInterviewHandoff(params.userId, params.sessionId);
    case "VIDEO_RESUME":
      return videoResumeHandoff(params.userId, params.sessionId);
    case "REFERRAL":
      return referralHandoff(params.userId, params.sessionId);
    case "PENDING_ASSESSMENT":
      return pendingAssessmentHandoff(params.userId, params.sessionId);
    case "SUPPORT":
      return "HireGo Support\n\nEmail: support@hiregoai.com\n\nFor account-security issues, never share OTPs or passwords in WhatsApp.";
    case "APPLY":
      return applyToRememberedJob(params.userId, params.sessionId, intent.index);
    default:
      return `I can help with jobs and your HireGo application journey.\n\n${MENU}`;
  }
}

export { MENU as WHATSAPP_CANDIDATE_MENU };
