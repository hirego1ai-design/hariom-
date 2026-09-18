import { Prisma, RecordedAssessmentMediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiSecurity";

export const RECORDED_ASSESSMENT_READING_SECONDS = 10;
export const RECORDED_ASSESSMENT_ANSWER_SECONDS = [30, 60] as const;

const ROLE_STOP_WORDS = new Set(["senior","junior","jr","sr","lead","associate","executive","specialist","engineer","developer"]);
function roleTokens(value: string) { return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").split(/\s+/).filter((token) => token.length > 1 && !ROLE_STOP_WORDS.has(token)); }
function roleAffinity(jobRole: string, bankRole: string) {
  const job = new Set(roleTokens(jobRole)); const bank = new Set(roleTokens(bankRole));
  if (!job.size || !bank.size) return 0;
  const overlap = [...job].filter((token) => bank.has(token)).length;
  return overlap / Math.max(job.size, bank.size);
}

type AssessmentJobContext = { title: string; department: string | null; requirements: string[]; company: { industry: string | null } };

export async function selectEligibleRecordedAssessmentQuestions(job: AssessmentJobContext, questionCount: number) {
  const roleTitle = job.title.trim();
  const industry = job.company.industry?.trim() || null;
  const department = job.department?.trim() || null;
  const requirements = job.requirements.map((value) => value.toLowerCase());
  const words = roleTokens(roleTitle);
  const pool = await prisma.recordedAssessmentQuestionBank.findMany({
    where: { isActive: true, ...(words.length ? { OR: words.map((word) => ({ roleTitle: { contains: word, mode: "insensitive" as const } })) } : { roleTitle: { equals: roleTitle, mode: "insensitive" as const } }) },
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: Math.max(questionCount * 12, 100),
  });
  const eligible = pool.filter((question) => roleAffinity(roleTitle, question.roleTitle) >= 0.5
    && (!question.industry || (!!industry && question.industry.toLowerCase() === industry.toLowerCase()))
    && (!question.department || (!!department && question.department.toLowerCase() === department.toLowerCase())));
  const score = (question: typeof eligible[number]) => roleAffinity(roleTitle, question.roleTitle) * 10
    + question.skillTags.reduce((total, tag) => total + (requirements.some((requirement) => requirement.includes(tag.toLowerCase())) ? 2 : 0), 0)
    + (question.industry ? 2 : 0) + (question.department ? 1 : 0);
  return eligible.sort((a, b) => score(b) - score(a) || b.version - a.version || a.id.localeCompare(b.id)).slice(0, questionCount);
}

export async function resolveEmployerCompanyId(userId: string) {
  const profile = await prisma.employerProfile.findUnique({ where: { userId }, select: { companyId: true } });
  if (!profile?.companyId) throw new ApiError("Employer profile not found.", 403);
  return profile.companyId;
}

export async function assertEmployerOwnsJob(userId: string, role: string, jobId: string) {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    select: { id: true, companyId: true, title: true, department: true, requirements: true, company: { select: { industry: true } } },
  });
  if (!job) throw new ApiError("Job not found.", 404);
  if (role !== "ADMIN") {
    const companyId = await resolveEmployerCompanyId(userId);
    if (job.companyId !== companyId) throw new ApiError("Job does not belong to your company.", 403);
  }
  return job;
}

async function assertRecordedAssessmentAccess(userId: string) {
  const now = new Date();
  // Expiry is evaluated at the access boundary so an expired restriction can
  // never block a candidate merely because a maintenance job has not run yet.
  await prisma.recordedAssessmentRestriction.updateMany({
    where: { userId, status: "ACTIVE", suspendedUntil: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const active = await prisma.recordedAssessmentRestriction.findFirst({
    where: { userId, status: "ACTIVE", suspendedUntil: { gt: now } },
    orderBy: { suspendedUntil: "desc" },
    select: { id: true, suspendedUntil: true },
  });
  if (active) {
    throw new ApiError(`Recorded assessment access is restricted until ${active.suspendedUntil!.toISOString()} following an administrator-reviewed restriction.`, 403);
  }
}

export async function createOrResumeRecordedAssessmentAttempt(userId: string, jobId: string) {
  await assertRecordedAssessmentAccess(userId);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!candidate) throw new ApiError("Candidate profile not found.", 403);

  const application = await prisma.application.findUnique({
    where: { candidateProfileId_jobId: { candidateProfileId: candidate.id, jobId } },
    select: { id: true, job: { select: { id: true, title: true, department: true, requirements: true, company: { select: { industry: true } }, recordedAssessmentConfig: true } } },
  });
  if (!application) throw new ApiError("You can only start an assessment for a job you applied to.", 403);
  const config = application.job.recordedAssessmentConfig;
  if (!config?.isActive) throw new ApiError("Recorded assessment is not active for this job.", 404);

  const existing = await prisma.recordedAssessmentAttempt.findFirst({
    where: { candidateProfileId: candidate.id, jobListingId: jobId, status: { in: ["CREATED", "IN_PROGRESS"] } },
    include: { questions: { orderBy: { orderIndex: "asc" }, include: { response: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  const roleTitle = application.job.title.trim();
  const selected = await selectEligibleRecordedAssessmentQuestions(application.job, config.questionCount);
  if (selected.length < config.questionCount) {
    throw new ApiError(`Question bank has only ${selected.length} eligible questions for ${roleTitle}; ${config.questionCount} are required.`, 409);
  }

  return prisma.$transaction(async (tx) => {
    const concurrent = await tx.recordedAssessmentAttempt.findFirst({
      where: { candidateProfileId: candidate.id, jobListingId: jobId, status: { in: ["CREATED", "IN_PROGRESS"] } },
      include: { questions: { orderBy: { orderIndex: "asc" }, include: { response: true } } },
    });
    if (concurrent) return concurrent;
    return tx.recordedAssessmentAttempt.create({
      data: {
        candidateProfileId: candidate.id,
        jobListingId: jobId,
        mediaType: config.mediaType,
        status: "CREATED",
        questionSetVersion: Math.max(...selected.map((q) => q.version)),
        configSnapshot: { mediaType: config.mediaType, readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS, defaultAnswerSeconds: config.defaultAnswerSeconds, questionCount: config.questionCount, proctoringEnabled: config.proctoringEnabled, answerDurationsSeconds: selected.map((q) => q.answerDurationSeconds) },
        questions: {
          create: selected.map((q, index) => ({
            sourceQuestionId: q.id,
            questionText: q.questionText,
            roleTitle,
            skillTags: q.skillTags,
            orderIndex: index,
            readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS,
            answerDurationSeconds: q.answerDurationSeconds,
            sourceVersion: q.version,
            difficulty: q.difficulty,
            industry: q.industry,
            department: q.department,
          })),
        },
      },
      include: { questions: { orderBy: { orderIndex: "asc" }, include: { response: true } } },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export function normalizeMediaType(value: string): RecordedAssessmentMediaType {
  if (value !== "AUDIO" && value !== "VIDEO") throw new ApiError("mediaType must be AUDIO or VIDEO.", 400);
  return value;
}
