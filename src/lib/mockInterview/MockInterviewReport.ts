import { z } from "zod";
import { mockTurnEvaluationSchema } from "@/lib/mockInterview/MockInterviewEngineV2";

type TurnInput = {
  score: number | null;
  feedback: string | null;
  evidenceConfidence: number | null;
  evaluation: unknown;
  skillTags: string[];
  competency: string | null;
};

const LEVEL_VALUE: Record<string, number> = {
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  STAFF_LEAD: 4,
};

const VALUE_LEVEL: Record<number, string> = {
  1: "JUNIOR",
  2: "MID",
  3: "SENIOR",
  4: "STAFF_LEAD",
};

export type MockInterviewPracticeReport = {
  practiceScore: number | null;
  answeredTurns: number;
  estimatedLevel: string | null;
  levelConfidence: number | null;
  evidenceStatus: "ESTIMATED" | "INSUFFICIENT_EVIDENCE";
  strengths: Array<{ skill: string; reason: string }>;
  missingEvidence: Array<{ skill: string; reason: string }>;
  nextPracticePlan: Array<{ priority: number; focus: string; action: string }>;
  summary: string;
};

export function buildMockInterviewPracticeReport(
  turns: TurnInput[],
  declaredSeniority: string | null,
): MockInterviewPracticeReport {
  const scored = turns.filter((turn) => typeof turn.score === "number");
  const practiceScore = scored.length
    ? Math.round(scored.reduce((sum, turn) => sum + (turn.score ?? 0), 0) / scored.length)
    : null;

  const validEvaluations = turns.flatMap((turn) => {
    const parsed = mockTurnEvaluationSchema.safeParse(turn.evaluation);
    return parsed.success ? [parsed.data] : [];
  });

  const levelSamples = validEvaluations
    .filter((item) => item.demonstratedLevel !== "INSUFFICIENT_EVIDENCE" && item.evidenceConfidence >= 40)
    .map((item) => ({
      value: LEVEL_VALUE[item.demonstratedLevel],
      weight: Math.max(1, item.evidenceConfidence),
    }));

  const evidenceConfidenceAverage = validEvaluations.length
    ? Math.round(
        validEvaluations.reduce((sum, item) => sum + item.evidenceConfidence, 0) /
          validEvaluations.length,
      )
    : 0;

  const enoughLevelEvidence =
    levelSamples.length >= 2 &&
    evidenceConfidenceAverage >= 45;

  let estimatedLevel: string | null = null;
  let levelConfidence: number | null = null;

  if (enoughLevelEvidence) {
    const weighted =
      levelSamples.reduce((sum, item) => sum + item.value * item.weight, 0) /
      levelSamples.reduce((sum, item) => sum + item.weight, 0);
    const rounded = Math.max(1, Math.min(4, Math.round(weighted)));
    estimatedLevel = VALUE_LEVEL[rounded];
    const coverageFactor = Math.min(1, validEvaluations.length / Math.max(3, turns.length || 1));
    levelConfidence = Math.max(
      0,
      Math.min(100, Math.round(evidenceConfidenceAverage * coverageFactor)),
    );
  }

  const evidenceRows = validEvaluations.flatMap((item) => item.evidence);
  const bySkill = new Map<string, {
    demonstrated: string[];
    partial: string[];
    missing: string[];
  }>();

  for (const evidence of evidenceRows) {
    const key = evidence.skill.trim();
    if (!key) continue;
    const current = bySkill.get(key) ?? {
      demonstrated: [],
      partial: [],
      missing: [],
    };
    if (evidence.status === "DEMONSTRATED") current.demonstrated.push(evidence.reason);
    else if (evidence.status === "PARTIAL") current.partial.push(evidence.reason);
    else current.missing.push(evidence.reason);
    bySkill.set(key, current);
  }

  const strengths = Array.from(bySkill.entries())
    .filter(([, value]) => value.demonstrated.length >= 2 || (value.demonstrated.length >= 1 && value.missing.length === 0))
    .slice(0, 6)
    .map(([skill, value]) => ({
      skill,
      reason: value.demonstrated[0],
    }));

  const missingEvidence = Array.from(bySkill.entries())
    .filter(([, value]) => value.missing.length > 0 || value.partial.length > value.demonstrated.length)
    .slice(0, 8)
    .map(([skill, value]) => ({
      skill,
      reason: value.missing[0] ?? value.partial[0] ?? "More practice evidence is needed.",
    }));

  const nextPracticePlan = missingEvidence.slice(0, 5).map((item, index) => ({
    priority: index + 1,
    focus: item.skill,
    action: `Practice ${item.skill} through fundamentals, a practical example, and one deeper follow-up such as debugging, trade-offs, or ownership.`,
  }));

  if (nextPracticePlan.length === 0 && strengths.length > 0) {
    nextPracticePlan.push({
      priority: 1,
      focus: "Stretch depth",
      action: "Repeat the role practice at a higher difficulty and explain more production or real-world trade-offs.",
    });
  }

  const evidenceStatus = estimatedLevel ? "ESTIMATED" : "INSUFFICIENT_EVIDENCE";
  const declaredText = declaredSeniority ? ` You selected ${declaredSeniority} as your starting level.` : "";
  const summary = estimatedLevel
    ? `Practice evidence currently supports an estimated ${estimatedLevel.replace("_", "/")} level with ${levelConfidence}% confidence.${declaredText} This is private practice guidance, not an employer hiring evaluation.`
    : `There is not enough consistent evidence in this practice session to estimate a reliable level yet.${declaredText} Complete more role-relevant practice before treating a level as demonstrated.`;

  return {
    practiceScore,
    answeredTurns: scored.length,
    estimatedLevel,
    levelConfidence,
    evidenceStatus,
    strengths,
    missingEvidence,
    nextPracticePlan,
    summary,
  };
}

export function parseStoredMockTurnEvaluation(value: unknown) {
  return z.union([mockTurnEvaluationSchema, z.null()]).safeParse(value);
}
