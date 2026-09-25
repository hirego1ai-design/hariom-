import { prisma } from "@/lib/prisma";
import { validateKnowledgeScreeningAssessment } from "@/lib/assessmentPolicyValidation";
import { generateAssessmentQuestions } from "@/lib/universalSkillValidation";
import { getJobSpecificAssessmentPolicy } from "@/lib/jobSpecificAssessmentPolicy";
import { assertCompanyFeatureEntitlement } from "@/lib/governance/AiEntitlements";

function extractPreferredJobSkills(value: unknown) {
  if (!Array.isArray(value)) return [];
  const required: string[] = [];
  const preferred: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const name = (item as Record<string, unknown>).name;
    const priority = (item as Record<string, unknown>).priority;
    if (typeof name !== "string" || !name.trim()) continue;
    if (priority === "required") required.push(name.trim());
    else preferred.push(name.trim());
  }
  return Array.from(new Set([...required, ...preferred]));
}

export async function ensureJobSpecificAssessment(jobId: string, companyId: string) {
  const job = await prisma.jobListing.findFirst({
    where: { id: jobId, companyId },
    select: {
      id: true,
      companyId: true,
      title: true,
      department: true,
      skillRequirements: true,
      requiresJobSpecificAssessment: true,
      mcqAssessments: {
        where: { scope: "EMPLOYER_JOB", isActive: true },
        include: {
          questions: { select: { category: true, skillTags: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!job) throw new Error("Job listing not found for job-specific assessment.");
  if (!job.requiresJobSpecificAssessment) return null;

  const existing = job.mcqAssessments.find((assessment) =>
    validateKnowledgeScreeningAssessment({
      roleTitle: assessment.roleTitle ?? job.title,
      department: job.department,
      questions: assessment.questions,
    }).valid
  );
  if (existing) return existing;

  await assertCompanyFeatureEntitlement(companyId, ["JOB_SPECIFIC_ASSESSMENT"]);
  const policy = await getJobSpecificAssessmentPolicy();
  const generated = await generateAssessmentQuestions({
    roleTitle: job.title,
    department: job.department,
    preferredSkills: extractPreferredJobSkills(job.skillRequirements),
    assessmentType: "job-specific-assessment",
  });

  return prisma.$transaction(async (tx) => {
    const lockKey = `hirego:job-specific-assessment:${job.id}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const candidates = await tx.mcqAssessment.findMany({
      where: {
        jobListingId: job.id,
        scope: "EMPLOYER_JOB",
        isActive: true,
      },
      include: {
        questions: { select: { category: true, skillTags: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    const winner = candidates.find((assessment) =>
      validateKnowledgeScreeningAssessment({
        roleTitle: assessment.roleTitle ?? job.title,
        department: job.department,
        questions: assessment.questions,
      }).valid
    );
    if (winner) return winner;

    const assessment = await tx.mcqAssessment.create({
      data: {
        title: `${job.title} — Job-specific assessment`,
        description: "Additional HireGo assessment generated from this job's role and approved skill requirements.",
        instructions: "Answer each question independently. Scoring is deterministic and server-side.",
        durationMinutes: generated.policy.recommendedDurationMinutes,
        passingPercentage: policy.passingPercentage,
        validityDays: policy.validityDays,
        retakeCooldownHours: policy.retakeCooldownHours,
        authoringProvider: generated.provider,
        authoringModel: generated.model,
        authoringVersion: "assessment-authoring-v1",
        authoringSource: "AI_GENERATED",
        isActive: true,
        scope: "EMPLOYER_JOB",
        roleTitle: job.title,
        jobListingId: job.id,
        questions: {
          create: generated.questions.map((question, index) => ({
            questionText: question.questionText,
            explanation: question.explanation ?? null,
            points: 1,
            difficulty: question.difficulty,
            category: question.skillTag,
            skillTags: [question.skillTag],
            orderIndex: index,
            options: {
              create: question.options.map((option) => ({
                optionText: option.text,
                isCorrect: option.correct,
              })),
            },
          })),
        },
      },
      include: {
        questions: { select: { category: true, skillTags: true } },
      },
    });

    const validation = validateKnowledgeScreeningAssessment({
      roleTitle: assessment.roleTitle ?? job.title,
      department: job.department,
      questions: assessment.questions,
    });
    if (!validation.valid) {
      throw new Error(`Generated job-specific assessment failed final validation: ${validation.reasons.join(" ")}`);
    }
    return assessment;
  }, { maxWait: 10_000, timeout: 30_000 });
}
