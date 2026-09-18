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

export async function createOrResumeRecordedAssessmentAttempt(userId: string, jobId: string) {
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
  const industry = application.job.company.industry?.trim() || null;
  const department = application.job.department?.trim() || null;
  const requirements = application.job.requirements.map((v) => v.toLowerCase());

  // Retrieve a bounded role-family pool, then rank deterministically. Exact
  // title equality is too brittle for real job titles such as "Sr React
  // Developer" vs "React Developer", while unrestricted fuzzy matching risks
  // serving unrelated questions.
  const roleWords = roleTokens(roleTitle);
  const candidates = await prisma.recordedAssessmentQuestionBank.findMany({
    where: {
      isActive: true,
      ...(roleWords.length ? { OR: roleWords.map((word) => ({ roleTitle: { contains: word, mode: "insensitive" as const } })) } : { roleTitle: { equals: roleTitle, mode: "insensitive" as const } }),
    },
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
    take: Math.max(config.questionCount * 12, 100),
  });
  const eligible = candidates.filter((q) => {
    const roleScore = roleAffinity(roleTitle, q.roleTitle);
    const industryMatch = !q.industry || (!!industry && q.industry.toLowerCase() === industry.toLowerCase());
    const departmentMatch = !q.department || (!!department && q.department.toLowerCase() === department.toLowerCase());
    return roleScore >= 0.5 && industryMatch && departmentMatch;
  });
  const ranked = [...eligible].sort((a, b) => {
    const score = (q: typeof a) => {
      const skillScore = q.skillTags.reduce((n, tag) => n + (requirements.some((r) => r.includes(tag.toLowerCase())) ? 1 : 0), 0);
      const contextScore = (q.industry ? 2 : 0) + (q.department ? 1 : 0);
      return roleAffinity(roleTitle, q.roleTitle) * 10 + skillScore * 2 + contextScore;
    };
    return score(b) - score(a) || b.version - a.version || a.id.localeCompare(b.id);
  });
  const selected = ranked.slice(0, config.questionCount);
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
        configSnapshot: { mediaType: config.mediaType, readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS, defaultAnswerSeconds: config.defaultAnswerSeconds, questionCount: config.questionCount, proctoringEnabled: config.proctoringEnabled },
        questions: {
          create: selected.map((q, index) => ({
            sourceQuestionId: q.id,
            questionText: q.questionText,
            roleTitle,
            skillTags: q.skillTags,
            orderIndex: index,
            readingTimeSeconds: RECORDED_ASSESSMENT_READING_SECONDS,
            answerDurationSeconds: config.defaultAnswerSeconds,
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
