import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { activePublicJobWhere } from "@/lib/publicJobs";
import { computeMatchScore } from "@/lib/matching/JobMatchingEngine";
import { ModelRouter } from "@/lib/ai/ModelRouter";
import { dispatchAiTask, markAiExecutionValidationFailure } from "@/utils/aiRouter";
import { wrapUntrustedContent } from "@/lib/security/untrustedContent";
import { classifyCandidateDirectIntent } from "@/lib/jarvis/CandidateIntentRouter";
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

function deepReasoningRequested(message: string, config: CandidateJarvisConfig) {
  const normalized = normalize(message);
  return config.deepReasoningKeywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
}

async function loadCandidateContext(userId: string, config: CandidateJarvisConfig, scope: "FULL" | "APPLICATIONS" | "INTERVIEWS" | "RECOMMENDATIONS" = "FULL") {
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
    (scope === "FULL" || scope === "APPLICATIONS") ? prisma.application.findMany({
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
    }) : Promise.resolve([]),
    (scope === "FULL" || scope === "INTERVIEWS") ? prisma.interview.findMany({
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
    }) : Promise.resolve([]),
    (scope === "FULL" || scope === "RECOMMENDATIONS") ? prisma.jobListing.findMany({
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
    }) : Promise.resolve([]),
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
      path: "FAST",
      message: "I did not find a currently published job matching those filters. You can broaden the search from the jobs page.",
      actions: [{ label: "Browse jobs", href: "/jobs" }],
      model: null,
    };
  }

  return {
    path: "FAST",
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
  const intent = classifyCandidateDirectIntent(message);
  if (!intent) return null;
  switch (intent.kind) {
    case "GREETING":
      return {
        path: "FAST",
        message: "Hi! I'm Jarvis, your HireGo career assistant. I can help you explore jobs, check applications, prepare for interviews or review your profile. What would you like to do?",
        actions: [
          { label: "Explore jobs", href: "/jobs" },
          { label: "Mock interview", href: "/ai/mock-interview/setup" },
          { label: "My profile", href: "/profile" },
        ],
        model: null,
      };
    case "APPLICATION_STATUS":
      return applicationStatusReply(context);
    case "NEXT_INTERVIEW":
      return nextInterviewReply(context);
    case "RECOMMENDATIONS":
      return recommendationsReply(context);
    case "OPEN_PROFILE":
      return {
        path: "FAST",
        message: "You can view and edit your profile here.",
        actions: [{ label: "Open profile", href: "/profile" }],
        model: null,
      };
    case "OPEN_MOCK_INTERVIEW":
      return {
        path: "FAST",
        message: "Open interview practice from here.",
        actions: [{ label: "Start Mock Interview", href: "/ai/mock-interview/setup" }],
        model: null,
      };
    case "OPEN_CREDITS":
      return {
        path: "FAST",
        message: "See your available credits and transaction history.",
        actions: [{ label: "Open credits", href: "/credits" }],
        model: null,
      };
    case "OPEN_JOBS":
      return {
        path: "FAST",
        message: "Browse currently published jobs.",
        actions: [{ label: "Browse jobs", href: "/jobs" }],
        model: null,
      };
    case "OPEN_DASHBOARD":
      return {
        path: "FAST",
        message: "Your candidate dashboard is here.",
        actions: [{ label: "Open dashboard", href: "/dashboard" }],
        model: null,
      };
    case "CONFIRM_IN_PORTAL":
      return {
        path: "FAST",
        message: "For account, application, scheduling or payment changes, open the relevant HireGo page to review and confirm the action. I haven't submitted or changed anything.",
        actions: [
          { label: "Applications", href: "/applications" },
          { label: "Interviews", href: "/interviews" },
          { label: "Credits", href: "/credits" },
        ],
        model: null,
      };
    case "SEARCH_JOBS":
      return null; // Database query is handled separately, never through an LLM.
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

  // Hybrid first: classify before querying candidate history or touching a
  // billable AI provider. Read-only actions stay available during LLM outages.
  const intent = classifyCandidateDirectIntent(message);
  if (intent) {
    if (intent.kind === "SEARCH_JOBS") {
      return searchJobs(intent.query, intent.location);
    }

    if (intent.kind === "APPLICATION_COUNT" || intent.kind === "CREDIT_BALANCE") {
      // Session-to-profile ownership is resolved server-side; the model and
      // client never get to supply another candidate's profile identifier.
      const ownedProfile = await prisma.candidateProfile.findUnique({
        where: { userId: params.userId },
        select: { id: true },
      });
      if (!ownedProfile) {
        return {
          path: "FAST", model: null,
          message: "Complete your profile to view your personal account details.",
          actions: [{ label: "My profile", href: "/profile" }],
        };
      }
      if (intent.kind === "APPLICATION_COUNT") {
        const count = await prisma.application.count({
          where: { candidateProfileId: ownedProfile.id },
        });
        return {
          path: "FAST", model: null,
          message: count === 0
            ? "You have not submitted any applications on HireGo yet."
            : `You have ${count} job application${count === 1 ? "" : "s"} on HireGo.`,
          actions: [{ label: "View applications", href: "/applications" }],
        };
      }
      const wallet = await prisma.candidateCreditWallet.findUnique({
        where: { candidateProfileId: ownedProfile.id },
        select: { balance: true },
      });
      return {
        path: "FAST", model: null,
        message: wallet ? `You currently have ${wallet.balance} candidate credits.`
          : "You have no candidate credits recorded in your wallet yet.",
        actions: [{ label: "View credit history", href: "/credits" }],
      };
    }

    const scope = intent.kind === "APPLICATION_STATUS" ? "APPLICATIONS"
      : intent.kind === "NEXT_INTERVIEW" ? "INTERVIEWS"
      : intent.kind === "RECOMMENDATIONS" ? "RECOMMENDATIONS"
      : null;
    const fastContext: CandidateContext = scope
      ? await loadCandidateContext(params.userId, config, scope)
      : { candidate: null, applications: [], interviews: [], recommendations: [] };
    const direct = directCommand(message, fastContext);
    if (direct) return direct;
  }

  const context = await loadCandidateContext(params.userId, config);
  const path: "SMART" | "DEEP" = deepReasoningRequested(message, config)
    ? "DEEP"
    : "SMART";

  const ai = await runAiDecision({
    message,
    context,
    config,
    path,
  });

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
