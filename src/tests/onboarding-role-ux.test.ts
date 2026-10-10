import test from "node:test";
import assert from "node:assert/strict";
import { findRole, getRoleSkillSuggestions, searchRoles } from "../lib/skill-master";

test("role autocomplete ranks direct job-title matches before broad department matches", () => {
  const matches = searchRoles("software");
  assert.equal(matches[0]?.title, "Software Developer");
  assert.ok(matches.some((role) => role.title === "Software Developer"));
});

test("role autocomplete finds aliases and industry shorthand", () => {
  assert.equal(searchRoles("full stack")[0]?.title, "Software Developer");
  assert.ok(searchRoles("hr").some((role) => role.title === "HR Recruiter"));
  assert.equal(searchRoles("BPO Executive")[0]?.title, "BPO Associate");
});

test("typing a skill also suggests a relevant role", () => {
  assert.ok(searchRoles("React").some((role) => role.title === "Frontend Developer"));
  assert.ok(searchRoles("Excel").some((role) => role.title === "Data Analyst"));
});

test("candidate skill suggestions match the selected canonical role", () => {
  const found = findRole("Full Stack Developer");
  assert.equal(found?.title, "Software Developer");
  assert.ok(getRoleSkillSuggestions(found?.title || "").some((skill) => skill.name === "React.js"));
});

test("unrelated gibberish does not create fake role recommendations", () => {
  assert.deepEqual(searchRoles("zz-no-such-role-zz"), []);
});
