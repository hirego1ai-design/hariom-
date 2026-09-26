import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateMcqSkillEvidence,
  MIN_SKILL_QUESTIONS_FOR_VALIDATION,
  normalizeSkillName,
  qualifiesMcqSkillEvidence,
} from "../lib/skillValidation";

test("normalizes skill names without changing their semantic identity", () => {
  assert.equal(normalizeSkillName("  React   JS  "), "react js");
});

test("aggregates MCQ evidence by universal skill tags with category fallback", () => {
  const evidence = aggregateMcqSkillEvidence([
    { skillTags: ["React", "JavaScript"], points: 2, correct: true },
    { skillTags: ["React"], points: 1, correct: false },
    { category: "React", points: 1, correct: true },
    { skillTags: ["SQL"], points: 2, correct: true },
  ]);

  const react = evidence.find((item) => item.normalizedName === "react");
  const javascript = evidence.find((item) => item.normalizedName === "javascript");
  const sql = evidence.find((item) => item.normalizedName === "sql");

  assert.deepEqual(
    react && {
      questionCount: react.questionCount,
      earnedPoints: react.earnedPoints,
      totalPoints: react.totalPoints,
      score: react.score,
    },
    { questionCount: 3, earnedPoints: 3, totalPoints: 4, score: 75 },
  );
  assert.equal(javascript?.score, 100);
  assert.equal(sql?.score, 100);
});

test("does not validate a skill from too little evidence", () => {
  const [evidence] = aggregateMcqSkillEvidence([
    { skillTags: ["React"], points: 1, correct: true },
    { skillTags: ["React"], points: 1, correct: true },
  ]);
  assert.equal(MIN_SKILL_QUESTIONS_FOR_VALIDATION, 3);
  assert.equal(qualifiesMcqSkillEvidence(evidence, 70), false);
});

test("validates only when both evidence depth and score threshold are satisfied", () => {
  const [passing] = aggregateMcqSkillEvidence([
    { skillTags: ["React"], points: 1, correct: true },
    { skillTags: ["React"], points: 1, correct: true },
    { skillTags: ["React"], points: 1, correct: true },
  ]);
  const [failing] = aggregateMcqSkillEvidence([
    { skillTags: ["React"], points: 1, correct: true },
    { skillTags: ["React"], points: 1, correct: false },
    { skillTags: ["React"], points: 1, correct: false },
  ]);

  assert.equal(qualifiesMcqSkillEvidence(passing, 70), true);
  assert.equal(qualifiesMcqSkillEvidence(failing, 70), false);
});
