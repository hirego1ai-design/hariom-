import test from "node:test";
import assert from "node:assert/strict";
import { validateKnowledgeScreeningAssessment } from "../lib/assessmentPolicyValidation";

function questions(count: number, skill = "React") {
  return Array.from({ length: count }, () => ({ category: null, skillTags: [skill] }));
}

test("rejects legacy technical assessments with only one or two questions", () => {
  for (const count of [1, 2]) {
    const result = validateKnowledgeScreeningAssessment({
      roleTitle: "Frontend Developer",
      department: "Engineering",
      questions: questions(count),
    });
    assert.equal(result.valid, false);
    assert.match(result.reasons.join(" "), /15-18 questions/);
  }
});

test("accepts a compliant technical screening with at least three questions per assessed skill", () => {
  const result = validateKnowledgeScreeningAssessment({
    roleTitle: "Frontend Developer",
    department: "Engineering",
    questions: [
      ...questions(8, "React"),
      ...questions(8, "JavaScript"),
    ],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.questionsPerSkill, { React: 8, JavaScript: 8 });
});

test("rejects untagged questions even when total count is in range", () => {
  const result = validateKnowledgeScreeningAssessment({
    roleTitle: "Talent Acquisition Specialist",
    department: "Human Resources",
    questions: Array.from({ length: 13 }, () => ({ category: null, skillTags: [] })),
  });
  assert.equal(result.valid, false);
  assert.match(result.reasons.join(" "), /no skill tag\/category/);
});

test("rejects a skill represented by fewer than three questions", () => {
  const result = validateKnowledgeScreeningAssessment({
    roleTitle: "Talent Acquisition Specialist",
    department: "Human Resources",
    questions: [
      ...questions(10, "Recruiting"),
      ...questions(2, "Sourcing"),
    ],
  });
  assert.equal(result.valid, false);
  assert.match(result.reasons.join(" "), /Sourcing \(2\/3\)/);
});

test("uses category as a legacy tag only when skillTags are absent", () => {
  const result = validateKnowledgeScreeningAssessment({
    roleTitle: "Operations Executive",
    department: "Operations",
    questions: Array.from({ length: 11 }, () => ({ category: "Operations", skillTags: [] })),
  });
  assert.equal(result.valid, true);
  assert.equal(result.questionsPerSkill.Operations, 11);
});
