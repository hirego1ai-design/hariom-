import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { activePublicJobWhere } from "@/lib/publicJobs";
import { computeMatchScore } from "@/lib/matching/JobMatchingEngine";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { dispatchAiTask, markAiExecutionValidationFailure } from "@/utils/aiRouter";
import { wrapUntrustedContent } from "@/lib/security/untrustedContent";
import {
  CandidateJarvisConfig,
  getCandidateJarvisConfig,
} from "@/lib/jarvis/CandidateJarvisConfig";

export type CandidateJarvisPath = "FAST" | "SMART" | "DEEP";

export type CandidateJarvisAction = {
  label: string;
  href: string;
};

export type CandidateJarvisReply = {
  path: CandidateJarvisPath;
  message: string;
  actions: CandidateJarvisAction[];
  model: null | {
    provider: string;
    model: string;
    taskType: string;
  };
};

const aiDecisionSchema = z.object({
  intent: z.enum([
    "SEARCH_JOBS",
    "RECOMMENDED_JOBS",
    "APPLICATION_STATUS",
    "NEXT_INTERVIEW",
    "OPEN_PROFILE",
    "OPEN_MOCK_INTERVIEW",
    "OPEN_CREDITS",
    "GENERAL_ADVICE",
  ]),
  query: z.string().trim().max(160).nullable(),
  location: z.string().trim().max(160).nullable(),
  answer: z.string().trim().min(1).max(2200),
}).strict();

type AiDecision = z.infer<typeof aiDecisionSchema>;

type CandidateContext = Awaited<ReturnType<typeof loadCandidateContext>>;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function looksLikeAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function deepReasoningRequested(message: string, config: CandidateJarvisConfig) {
  const normalized = normalize(message);
  return config.deepReasoningKeywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
}

async function loadCandidateContext(userId: string, config: CandidateJarvisConfig) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      candidateSkills: {
        where: { isVisible: true },
        select: {
          name: true,
          claimedLevel: true,
          verifiedLevel: true,
          verificationStatus: true,
          latestScore: true,
        },
      },
    },
  });

  if (!candidate) {
    return {
      candidate: null,
      applications: [],
      interviews: [],
      recommendations: [],
    };
  }

  const [applications, interviews, jobs] = await Promise.all([
    prisma.application.findMany({
      where: { candidateProfileId: candidate.id },
      select: {
        id: true,
        status: true,
        matchScore: true,
        aiSummary: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: config.maxApplicationsContext,
    }),
    prisma.interview.findMany({
      where: {
        application: { candidateProfileId: candidate.id },
        status: { in: ["SCHEDULED", "RESCHEDULED", "LIVE"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        application: {
          select: {
            job: {
              select: {
                id: true,
                title: true,
                company: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      take: config.maxInterviewsContext,
    }),
    prisma.jobListing.findMany({
      where: activePublicJobWhere(new Date()),
      select: {
        id: true,
        title: true,
        department: true,
        location: true,
        type: true,
        workMode: true,
        experienceLevel: true,
        description: true,
        requirements: true,
        salaryRange: true,
        company: { select: { name: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: Math.max(config.maxJobsContext * 4, 20),
    }),
  ]);

  const recommendations = jobs
    .map((job) => {
      const match = computeMatchScore(candidate, job);
      return {
        id: job.id,
        title: job.title,
        company: job.company?.name ?? null,
        location: job.location,
        score:
          match.breakdown.skillScore !== null ||
          match.breakdown.experienceScore !== null
            ? match.matchScore
            : null,
        matchingSkills: match.matchingSkills.slice(0, 8),
        missingEvidenceSkills: match.notEvidencedRequiredSkills.slice(0, 8),
      };
    })
    .sort((left, right) => (right.score ?? -1) - (left.score ?? -1))
    .slice(0, config.maxJobsContext);

  return {
    candidate: {
      id: candidate.id,
      headline: candidate.headline,
      location: candidate.location,
      experienceYears: candidate.experienceYears,
      availabilityStatus: candidate.availabilityStatus,
      skills: candidate.candidateSkills.map((skill) => ({
        name: skill.name,
        claimedLevel: skill.claimedLevel,
        verifiedLevel: skill.verifiedLevel,
        verificationStatus: skill.verificationStatus,
        latestScore: skill.latestScore,
      })),
    },
    applications,
    interviews,
    recommendations,
  };
}

function applicationStatusReply(context: CandidateContext): CandidateJarvisReply {
  if (!context.candidate) {
    return {
      path: "FAST",
      message: "Complete your candidate profile first so I can read your application history.",
      actions: [{ label: "Complete profile", href: "/profile" }],
      model: null,
    };
  }

  if (!context.applications.length) {
    return {
      path: "FAST",
      message: "You do not have any applications yet.",
      actions: [
        { label: "Browse jobs", href: "/jobs" },
        { label: "Applications", href: "/applications" },
      ],
      model: null,
    };
  }

  const summary = context.applications
    .slice(0, 5)
    .map(
      (application) =>
        `${application.job?.title ?? "Job"} at ${application.job?.company?.name ?? "Employer"} — ${application.status}`,
    )
    .join("\n");

  return {
    path: "FAST",
    message: `Your latest application status:\n${summary}`,
    actions: [{ label: "Open applications", href: "/applications" }],
    model: null,
  };
}

function nextInterviewReply(context: CandidateContext): CandidateJarvisReply {
  const next = context.interviews[0];
  if (!next) {
    return {
      path: "FAST",
      message: "You do not currently have an upcoming interview on HireGo.",
      actions: [
        { label: "Interviews", href: "/interviews" },
        { label: "Practice mock interview", href: "/ai/mock-interview/setup" },
      ],
      model: null,
    };
  }

  const when = next.scheduledAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    path: "FAST",
    message: `Your next interview is ${next.application.job.title} with ${next.application.job.company?.name ?? "the employer"} on ${when}. Status: ${next.status}.`,
    actions: [{ label: "Open interviews", href: "/interviews" }],
    model: null,
  };
}

function recommendationsReply(context: CandidateContext): CandidateJarvisReply {
  if (!context.candidate) {
    return {
      path: "FAST",
      message: "Complete your profile so HireGo can calculate evidence-based job matches.",
      actions: [{ label: "Complete profile", href: "/profile" }],
      model: null,
    };
  }

  if (!context.recommendations.length) {
    return {
      path: "FAST",
      message: "I could not find an evidence-based recommendation from currently published jobs.",
      actions: [{ label: "Browse all jobs", href: "/jobs" }],
      model: null,
    };
  }

  const top = context.recommendations.slice(0, 5);
  return {
    path: "FAST",
    message: [
      "Your current evidence-based job matches:",
      ...top.map(
        (job, index) =>
          `${index + 1}. ${job.title} at ${job.company ?? "Employer"}${typeof job.score === "number" ? ` — ${job.score}% match` : ""}`,
      ),
    ].join("\n"),
    actions: [
      ...top.slice(0, 3).map((job) => ({
        label: job.title,
        href: `/jobs/${job.id}`,
      })),
      { label: "Browse all jobs", href: "/jobs" },
    ],
    model: null,
  };
}

async function searchJobs(query: string | null, location: string | null): Promise<CandidateJarvisReply> {
  const q = query?.trim() ?? "";
  const loc = location?.trim() ?? "";
  const where: Prisma.JobListingWhereInput = activePublicJobWhere(new Date());

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
    ];
  }

  if (loc) {
    where.location = { contains: loc, mode: "insensitive" };
  }

  const jobs = await prisma.jobListing.findMany({
    where,
    select: {
      id: true,
      title: true,
      location: true,
      company: { select: { name: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  if (!jobs.length) {
    return {
      path: "SMART",
      message: "I did not find a currently published job matching those filters. You can broaden the search from the jobs page.",
      actions: [{ label: "Browse jobs", href: "/jobs" }],
      model: null,
    };
  }

  return {
    path: "SMART",
    message: [
      "I found these currently published jobs:",
      ...jobs.map(
        (job, index) =>
          `${index + 1}. ${job.title} at ${job.company?.name ?? "Employer"} — ${job.location}`,
      ),
    ].join("\n"),
    actions: jobs.slice(0, 4).map((job) => ({
      label: job.title,
      href: `/jobs/${job.id}`,
    })),
    model: null,
  };
}

function directCommand(message: string, context: CandidateContext): CandidateJarvisReply | null {
  const text = normalize(message);

  // Greetings are deterministic, safe and work even when a paid AI provider is down.
  if (/^(hi|hello|hey|namaste|namaskar|good morning|good afternoon|good evening)[!?. ]*$/i.test(message.trim())) {
    return {
      path: "FAST",
      message: "Hello! I can help you explore jobs, review your applications, find your next interview, or start interview practice. What would you like to do?",
      actions: [
        { label: "Browse jobs", href: "/jobs" },
        { label: "My applications", href: "/applications" },
        { label: "Mock Interview", href: "/ai/mock-interview/setup" },
      ],
      model: null,
    };
  }

  if (
    looksLikeAny(text, ["my applications", "application status", "applications status", "applied jobs"]) ||
    (text.includes("application") && looksLikeAny(text, ["show", "open", "status", "track"]))
  ) {
    return applicationStatusReply(context);
  }

  if (
    looksLikeAny(text, ["next interview", "upcoming interview", "my interview", "interview schedule"]) ||
    (text.includes("interview") && looksLikeAny(text, ["when", "schedule", "show", "open"]))
  ) {
    return nextInterviewReply(context);
  }

  if (
    looksLikeAny(text, ["recommended jobs", "matching jobs", "best matching jobs", "jobs for me"])
  ) {
    return recommendationsReply(context);
  }

  if (
    looksLikeAny(text, ["open profile", "my profile", "edit profile", "profile kholo"])
  ) {
    return {
      path: "FAST",
      message: "Opening your candidate profile.",
      actions: [{ label: "Open profile", href: "/profile" }],
      model: null,
    };
  }

  if (
    looksLikeAny(text, ["mock interview", "practice interview", "interview practice"])
  ) {
    return {
      path: "FAST",
      message: "Opening Mock Interview practice.",
      actions: [{ label: "Start Mock Interview", href: "/ai/mock-interview/setup" }],
      model: null,
    };
  }

  if (
    looksLikeAny(text, ["career credits", "credits", "buy mock", "pricing"])
  ) {
    return {
      path: "FAST",
      message: "Opening candidate credits and purchase history.",
      actions: [{ label: "Open credits", href: "/credits" }],
      model: null,
    };
  }

  if (
    looksLikeAny(text, ["open jobs", "browse jobs", "job list", "jobs kholo"])
  ) {
    return {
      path: "FAST",
      message: "Opening currently published jobs.",
      actions: [{ label: "Browse jobs", href: "/jobs" }],
      model: null,
    };
  }

  return null;
}

async function runAiDecision(params: {
  message: string;
  context: CandidateContext;
  config: CandidateJarvisConfig;
  path: "SMART" | "DEEP";
}): Promise<{ decision: AiDecision; provider: string; model: string; taskType: string }> {
  const taskType =
    params.path === "DEEP"
      ? params.config.qualityTaskType
      : params.config.smartTaskType;

  const context = {
    candidate: params.context.candidate,
    applications: params.context.applications.map((application) => ({
      status: application.status,
      matchScore: application.aiSummary ? application.matchScore : null,
      title: application.job?.title ?? null,
      company: application.job?.company?.name ?? null,
      location: application.job?.location ?? null,
    })),
    interviews: params.context.interviews.map((interview) => ({
      scheduledAt: interview.scheduledAt.toISOString(),
      status: interview.status,
      title: interview.application.job.title,
      company: interview.application.job.company?.name ?? null,
    })),
    recommendations: params.context.recommendations,
  };

  const prompt = [
    "You are Candidate Jarvis inside HireGo.",
    "Choose exactly one allowed intent and return strict JSON only.",
    "Never claim that an application, withdrawal, payment, profile edit, message, or other side effect happened. This endpoint is read/navigation only.",
    "SEARCH_JOBS: extract a short role/skill/company query and optional location. Do not invent job results; the application will query the database.",
    "RECOMMENDED_JOBS, APPLICATION_STATUS, NEXT_INTERVIEW, OPEN_PROFILE, OPEN_MOCK_INTERVIEW, and OPEN_CREDITS are application actions; keep answer short because the application will render authoritative data.",
    "GENERAL_ADVICE is only for explanation, preparation, career reasoning, job-fit reasoning, or other read-only advice. Base it only on supplied HireGo context. If evidence is missing, say so.",
    "Output shape: {\"intent\": string, \"query\": string|null, \"location\": string|null, \"answer\": string}.",
    wrapUntrustedContent({ userMessage: params.message }, "candidate-jarvis-message"),
    wrapUntrustedContent(context, "candidate-jarvis-context"),
  ].join("\n");

  let currentExecutionLogId: string | null = null;
  const routed = await ModelRouter.executeWithFallback({
    taskType,
    requiredCapabilities: ["TEXT", "STRUCTURED_OUTPUT"],
    fn: async (endpoint, policy, isFallback) => {
      const execution = await dispatchAiTask({
        task: "GENERAL",
        taskType,
        prompt,
        provider: endpoint.provider,
        model: endpoint.model,
        modelConfig: endpoint.config,
        timeoutMs: policy.timeoutMs,
        temperature: policy.temperature,
        maxTokens: policy.maxTokens,
        maxCostUsdPerRequest: policy.maxCostUsdPerRequest,
        isFallback,
      });
      currentExecutionLogId = execution.log.id;

      let parsed: unknown;
      try {
        parsed = JSON.parse(execution.resultText);
      } catch (error) {
        await markAiExecutionValidationFailure(execution.log.id).catch(() => undefined);
        throw new Error("Candidate Jarvis model returned invalid JSON.");
      }

      const decision = aiDecisionSchema.safeParse(parsed);
      if (!decision.success) {
        await markAiExecutionValidationFailure(execution.log.id).catch(() => undefined);
        throw new Error("Candidate Jarvis model returned invalid structured output.");
      }

      return decision.data;
    },
    validateResult: async (result) => {
      aiDecisionSchema.parse(result);
    },
  });

  if (!routed.result && currentExecutionLogId) {
    await markAiExecutionValidationFailure(currentExecutionLogId).catch(() => undefined);
  }

  return {
    decision: routed.result,
    provider: routed.usedEndpoint.provider,
    model: routed.usedEndpoint.model,
    taskType,
  };
}

export async function executeCandidateJarvis(params: {
  userId: string;
  message: string;
}): Promise<CandidateJarvisReply> {
  const config = await getCandidateJarvisConfig();
  if (!config.enabled) {
    throw Object.assign(new Error("Candidate Jarvis is currently disabled by Super Admin."), {
      status: 503,
    });
  }

  const message = params.message.trim().slice(0, config.maxInputChars);
  const context = await loadCandidateContext(params.userId, config);

  const direct = directCommand(message, context);
  if (config.hybridRoutingEnabled && direct) return direct;

  const path: "SMART" | "DEEP" = deepReasoningRequested(message, config)
    ? "DEEP"
    : "SMART";

  // Keep honest, read-only navigation available during an upstream LLM outage.
  // A failed provider must never become a fabricated AI answer or a generic 500.
  let ai: Awaited<ReturnType<typeof runAiDecision>> | null = null;
  try {
    ai = await runAiDecision({
      message,
      context,
      config,
      path,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "";
    if (!/All configured AI endpoints failed|No enabled, configured model|No AI routing policy/.test(messageText)) {
      throw error;
    }
    return {
      path: "FAST",
      message: "My AI answers are temporarily unavailable. You can still browse jobs, check your applications and open interview practice. Please try your question again later.",
      actions: [
        { label: "Browse jobs", href: "/jobs" },
        { label: "My applications", href: "/applications" },
        { label: "Mock Interview", href: "/ai/mock-interview/setup" },
      ],
      model: null,
    };
  }

  let reply: CandidateJarvisReply;
  switch (ai.decision.intent) {
    case "SEARCH_JOBS":
      reply = await searchJobs(ai.decision.query, ai.decision.location);
      break;
    case "RECOMMENDED_JOBS":
      reply = recommendationsReply(context);
      break;
    case "APPLICATION_STATUS":
      reply = applicationStatusReply(context);
      break;
    case "NEXT_INTERVIEW":
      reply = nextInterviewReply(context);
      break;
    case "OPEN_PROFILE":
      reply = {
        path,
        message: "Opening your candidate profile.",
        actions: [{ label: "Open profile", href: "/profile" }],
        model: null,
      };
      break;
    case "OPEN_MOCK_INTERVIEW":
      reply = {
        path,
        message: "Opening Mock Interview practice.",
        actions: [{ label: "Start Mock Interview", href: "/ai/mock-interview/setup" }],
        model: null,
      };
      break;
    case "OPEN_CREDITS":
      reply = {
        path,
        message: "Opening candidate credits and purchase history.",
        actions: [{ label: "Open credits", href: "/credits" }],
        model: null,
      };
      break;
    case "GENERAL_ADVICE":
    default:
      reply = {
        path,
        message: ai.decision.answer,
        actions: [],
        model: null,
      };
      break;
  }

  return {
    ...reply,
    path,
    model: {
      provider: ai.provider,
      model: ai.model,
      taskType: ai.taskType,
    },
  };
}
