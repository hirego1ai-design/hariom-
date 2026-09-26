import test from "node:test";
import assert from "node:assert/strict";
import {
  getKnowledgeScreeningPolicy,
  MIN_QUESTIONS_PER_SKILL,
} from "../lib/knowledgeScreeningPolicy";

test("classifies technical roles into the short 15-18 question standard", () => {
  const policy = getKnowledgeScreeningPolicy("Frontend Developer", "Engineering");
  assert.equal(policy.tier, "TECHNICAL");
  assert.equal(policy.minQuestions, 15);
  assert.equal(policy.maxQuestions, 18);
  assert.equal(policy.recommendedQuestions, 16);
});

test("classifies basic and operational roles into the 10-12 question standard", () => {
  const policy = getKnowledgeScreeningPolicy("Operations Executive", "Operations");
  assert.equal(policy.tier, "BASIC_OPERATIONAL");
  assert.equal(policy.minQuestions, 10);
  assert.equal(policy.maxQuestions, 12);
});

test("uses 12-15 questions for professional roles by default", () => {
  const policy = getKnowledgeScreeningPolicy("Talent Acquisition Specialist", "Human Resources");
  assert.equal(policy.tier, "PROFESSIONAL");
  assert.equal(policy.minQuestions, 12);
  assert.equal(policy.maxQuestions, 15);
});

test("keeps per-skill evidence threshold intentionally small", () => {
  assert.equal(MIN_QUESTIONS_PER_SKILL, 3);
});
