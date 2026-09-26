import { getKnowledgeScreeningPolicy, MIN_QUESTIONS_PER_SKILL } from "@/lib/knowledgeScreeningPolicy";

export type ScreeningQuestionShape = {
  category?: string | null;
  skillTags: string[];
};

export type ScreeningAssessmentShape = {
  roleTitle?: string | null;
  department?: string | null;
  questions: ScreeningQuestionShape[];
};

export type ScreeningValidationResult = {
  valid: boolean;
  reasons: string[];
  policy: ReturnType<typeof getKnowledgeScreeningPolicy>;
  questionsPerSkill: Record<string, number>;
};

export function validateKnowledgeScreeningAssessment(
  assessment: ScreeningAssessmentShape,
): ScreeningValidationResult {
  const policy = getKnowledgeScreeningPolicy(assessment.roleTitle, assessment.department);
  const reasons: string[] = [];

  if (assessment.questions.length < policy.minQuestions || assessment.questions.length > policy.maxQuestions) {
    reasons.push(
      `${policy.label} requires ${policy.minQuestions}-${policy.maxQuestions} questions; found ${assessment.questions.length}.`,
    );
  }

  const questionsPerSkill = new Map<string, number>();
  let untaggedCount = 0;

  for (const question of assessment.questions) {
    const tags = question.skillTags.length
      ? question.skillTags
      : question.category?.trim()
        ? [question.category.trim()]
        : [];

    const normalizedTags = Array.from(
      new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
    );

    if (normalizedTags.length === 0) {
      untaggedCount += 1;
      continue;
    }

    for (const tag of normalizedTags) {
      questionsPerSkill.set(tag, (questionsPerSkill.get(tag) ?? 0) + 1);
    }
  }

  if (untaggedCount > 0) {
    reasons.push(`${untaggedCount} question(s) have no skill tag/category.`);
  }

  const underTested = Array.from(questionsPerSkill.entries())
    .filter(([, count]) => count < MIN_QUESTIONS_PER_SKILL)
    .map(([skill, count]) => `${skill} (${count}/${MIN_QUESTIONS_PER_SKILL})`);

  if (underTested.length > 0) {
    reasons.push(
      `Each assessed skill needs at least ${MIN_QUESTIONS_PER_SKILL} questions. Insufficient evidence: ${underTested.join(", ")}.`,
    );
  }

  return {
    valid: reasons.length === 0,
    reasons,
    policy,
    questionsPerSkill: Object.fromEntries(questionsPerSkill),
  };
}
