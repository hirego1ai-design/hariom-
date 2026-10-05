import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runMockInterviewStructured } from "@/lib/mockInterviewAi";
import { wrapUntrustedContent } from "@/lib/security/untrustedContent";
import {
  MockRoleFamily,
  MockSeniority,
  resolveMockRoleFamily,
  seniorityLabel,
  startingDifficulty,
} from "@/lib/mockInterview/RoleFamily";

const evidenceStatusSchema = z.enum([
  "DEMONSTRATED",
  "PARTIAL",
  "NOT_DEMONSTRATED",
  "INSUFFICIENT_EVIDENCE",
]);

export const mockTurnEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().trim().min(1).max(2_000),
  evidenceConfidence: z.number().int().min(0).max(100),
  demonstratedLevel: z.enum([
    "JUNIOR",
    "MID",
    "SENIOR",
    "STAFF_LEAD",
    "INSUFFICIENT_EVIDENCE",
  ]),
  competency: z.string().trim().min(1).max(160),
  skillTags: z.array(z.string().trim().min(1).max(120)).max(8),
  evidence: z.array(
    z.object({
      skill: z.string().trim().min(1).max(120),
      dimension: z.enum(["FUNDAMENTAL", "IMPLEMENTATION", "DEBUGGING", "TRADEOFF", "OWNERSHIP", "ROLE_SCENARIO"]),
      status: evidenceStatusSchema,
      reason: z.string().trim().min(1).max(500),
    }).strict(),
  ).max(12),
  difficultyAdjustment: z.enum(["DOWN", "SAME", "UP"]),
  nextDifficulty: z.number().int().min(1).max(5),
  supportMode: z.enum(["NONE", "GUIDED", "HINT"]),
  nextCompetency: z.string().trim().min(1).max(160).nullable(),
  nextSkillTags: z.array(z.string().trim().min(1).max(120)).max(8),
  nextQuestion: z.string().trim().min(1).max(5_000).nullable(),
}).strict();

const firstQuestionSchema = z.object({
  openingMessage: z.string().trim().min(1).max(1_500),
  nextQuestion: z.string().trim().min(1).max(5_000),
  difficulty: z.number().int().min(1).max(5),
  competency: z.string().trim().min(1).max(160),
  skillTags: z.array(z.string().trim().min(1).max(120)).max(8),
}).strict();

export type MockTurnEvaluation = z.infer<typeof mockTurnEvaluationSchema>;

type SkillContext = {
  name: string;
  claimedLevel: string;
  verificationStatus: string;
  verifiedLevel: string | null;
  latestScore: number | null;
  validUntil: Date | null;
};

type PreviousTurn = {
  questionIndex: number;
  questionText: string;
  candidateAnswerTranscript: string | null;
  difficulty: number | null;
  competency: string | null;
  skillTags: string[];
  evaluation: unknown;
};

export async function resolveMockInterviewPersona(roleTarget: string) {
  const roleFamily = resolveMockRoleFamily(roleTarget);
  const persona = await prisma.mockInterviewPersona.findFirst({
    where: { roleFamily, isActive: true },
    orderBy: { updatedAt: "desc" },
  }) ?? await prisma.mockInterviewPersona.findFirst({
    where: { roleFamily: "GENERAL", isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!persona) {
    throw new Error(
      "Mock Interview persona configuration is not published. An administrator must publish an active persona.",
    );
  }
  return { roleFamily, persona };
}

function safeSkillContext(skills: SkillContext[]) {
  const now = new Date();
  return skills.slice(0, 40).map((skill) => {
    const expired = Boolean(skill.validUntil && skill.validUntil <= now);
    return {
      name: skill.name,
      claimedLevel: skill.claimedLevel,
      verificationStatus: expired ? "EXPIRED" : skill.verificationStatus,
      verifiedLevel: expired ? null : skill.verifiedLevel,
      latestScore: expired ? null : skill.latestScore,
    };
  });
}

function personaContext(persona: {
  displayName: string;
  roleFamily: string;
  tone: string;
  questionMethodology: unknown;
  competencyDimensions: unknown;
  rubricVersion: string;
}) {
  return {
    displayName: persona.displayName,
    roleFamily: persona.roleFamily,
    tone: persona.tone,
    questionMethodology: persona.questionMethodology,
    competencyDimensions: persona.competencyDimensions,
    rubricVersion: persona.rubricVersion,
  };
}

const GLOBAL_RULES = [
  "This is a private practice interview, not a hiring decision.",
  "The candidate's declared seniority and claimed skills are hypotheses, not verified truth.",
  "Never infer competence from years of experience alone.",
  "Never infer or score protected traits, accent, personality, emotion, appearance, or psychological state.",
  "Missing evidence is not proof of incompetence.",
  "Do not decide the candidate's final level from a single answer.",
  "Calibrate gradually. If the candidate struggles, simplify or guide before increasing difficulty again.",
  "Be professional, friendly, conversational and supportive. Never shame or rush the candidate.",
  "Preserve technical/business terms when translating would reduce clarity.",
];

export class MockInterviewEngineV2 {
  static async generateFirstQuestion(params: {
    roleTarget: string;
    declaredSeniority: MockSeniority;
    focusSkills: string[];
    candidateSkills: SkillContext[];
    practiceContext?: string | null;
    language: string;
    totalQuestions: number;
    persona: {
      displayName: string;
      roleFamily: string;
      tone: string;
      questionMethodology: unknown;
      competencyDimensions: unknown;
      rubricVersion: string;
    };
  }) {
    const initialDifficulty = Math.max(1, startingDifficulty(params.declaredSeniority) - 1);
    const prompt = [
      "You are running HireGo Mock Interview V2.",
      ...GLOBAL_RULES,
      `Conduct the conversation in language tag '${params.language}' unless the candidate asks to switch later.`,
      "Start with a short warm, professional introduction. Position yourself as a practice partner, not a friend or hiring authority.",
      "If practice context is supplied, acknowledge it briefly without making a diagnosis.",
      "Then ask exactly one calibration question relevant to the role.",
      "The first question should usually be slightly below or around the declared level so the system can establish a knowledge floor.",
      "Return strict JSON only.",
      wrapUntrustedContent({ roleTarget: params.roleTarget }, "mock-role"),
      wrapUntrustedContent({ declaredSeniority: seniorityLabel(params.declaredSeniority) }, "declared-seniority"),
      wrapUntrustedContent({ focusSkills: params.focusSkills }, "focus-skills"),
      wrapUntrustedContent({ candidateSkills: safeSkillContext(params.candidateSkills) }, "candidate-skill-evidence"),
      wrapUntrustedContent({ practiceContext: params.practiceContext ?? null }, "candidate-practice-context"),
      wrapUntrustedContent({ persona: personaContext(params.persona) }, "interviewer-persona"),
      `Question 1 of ${params.totalQuestions}. Suggested starting difficulty: ${initialDifficulty}/5.`,
      'Output: {"openingMessage":string,"nextQuestion":string,"difficulty":integer 1-5,"competency":string,"skillTags":string[]}.',
    ].join("\n");

    return runMockInterviewStructured({
      prompt,
      schema: firstQuestionSchema,
    });
  }

  static async evaluateAndGenerateNext(params: {
    roleTarget: string;
    declaredSeniority: MockSeniority;
    focusSkills: string[];
    candidateSkills: SkillContext[];
    language: string;
    totalQuestions: number;
    questionIndex: number;
    currentQuestion: string;
    answer: string;
    durationMs?: number;
    currentDifficulty: number;
    currentCompetency?: string | null;
    currentSkillTags: string[];
    previousTurns: PreviousTurn[];
    persona: {
      displayName: string;
      roleFamily: string;
      tone: string;
      questionMethodology: unknown;
      competencyDimensions: unknown;
      rubricVersion: string;
    };
  }): Promise<MockTurnEvaluation> {
    const isFinal = params.questionIndex >= params.totalQuestions - 1;

    const priorEvidence = params.previousTurns
      .filter((turn) => turn.questionIndex < params.questionIndex)
      .slice(-6)
      .map((turn) => ({
        questionIndex: turn.questionIndex,
        question: turn.questionText.slice(0, 1_500),
        answerExcerpt: turn.candidateAnswerTranscript?.slice(0, 1_500) ?? null,
        difficulty: turn.difficulty,
        competency: turn.competency,
        skillTags: turn.skillTags,
        evaluation: turn.evaluation,
      }));

    const prompt = [
      "You are evaluating and adapting one turn in HireGo Mock Interview V2.",
      ...GLOBAL_RULES,
      `Conduct feedback and the next question in language tag '${params.language}', while preserving technical/business terms.`,
      "Evaluate the meaning and job-relevant reasoning in the answer, not grammar/accent unless communication is explicitly the competency being practiced.",
      "Use multiple angles over the interview before treating a claimed skill as demonstrated: fundamentals, implementation, debugging, trade-offs, ownership, or role scenarios as appropriate.",
      "If this answer is weak, lower difficulty or use a guided next question. Do not abruptly abandon the skill.",
      "If this answer is strong, increase difficulty gradually and probe deeper rather than rewarding keyword use.",
      "A score is a private practice-turn metric only. It is not a hiring score and must not become employer evidence.",
      isFinal
        ? "This is the final planned question. nextQuestion MUST be null."
        : "Generate exactly one adaptive next question. It may probe the same skill from another angle when evidence is still weak or uncertain.",
      "Return strict JSON only matching the requested schema.",
      wrapUntrustedContent({ roleTarget: params.roleTarget }, "mock-role"),
      wrapUntrustedContent({ declaredSeniority: seniorityLabel(params.declaredSeniority) }, "declared-seniority"),
      wrapUntrustedContent({ focusSkills: params.focusSkills }, "focus-skills"),
      wrapUntrustedContent({ candidateSkills: safeSkillContext(params.candidateSkills) }, "candidate-skill-evidence"),
      wrapUntrustedContent({ persona: personaContext(params.persona) }, "interviewer-persona"),
      wrapUntrustedContent({ priorEvidence }, "prior-practice-evidence"),
      wrapUntrustedContent({
        questionIndex: params.questionIndex,
        question: params.currentQuestion,
        currentDifficulty: params.currentDifficulty,
        competency: params.currentCompetency ?? null,
        skillTags: params.currentSkillTags,
      }, "current-question"),
      wrapUntrustedContent({ answer: params.answer }, "candidate-answer"),
      params.durationMs === undefined ? "" : `Measured response duration: ${params.durationMs} ms.`,
      'Output: {"score":integer 0-100,"feedback":string,"evidenceConfidence":integer 0-100,"demonstratedLevel":"JUNIOR"|"MID"|"SENIOR"|"STAFF_LEAD"|"INSUFFICIENT_EVIDENCE","competency":string,"skillTags":string[],"evidence":[{"skill":string,"dimension":"FUNDAMENTAL"|"IMPLEMENTATION"|"DEBUGGING"|"TRADEOFF"|"OWNERSHIP"|"ROLE_SCENARIO","status":"DEMONSTRATED"|"PARTIAL"|"NOT_DEMONSTRATED"|"INSUFFICIENT_EVIDENCE","reason":string}],"difficultyAdjustment":"DOWN"|"SAME"|"UP","nextDifficulty":integer 1-5,"supportMode":"NONE"|"GUIDED"|"HINT","nextCompetency":string|null,"nextSkillTags":string[],"nextQuestion":string|null}.',
    ].filter(Boolean).join("\n");

    return runMockInterviewStructured({
      prompt,
      schema: mockTurnEvaluationSchema,
    });
  }

  static roleFamily(roleTarget: string): MockRoleFamily {
    return resolveMockRoleFamily(roleTarget);
  }
}
