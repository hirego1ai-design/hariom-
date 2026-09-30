import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  INTERVIEW_DURATION_PRESETS,
  MAX_INTERVIEW_DURATION_MINS,
  MIN_INTERVIEW_DURATION_MINS,
  isPresetInterviewDurationMins,
  isValidInterviewDurationMins,
} from "@/lib/interviewDuration";

function source(path: string) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("interview duration contract supports presets plus custom whole-minute values", () => {
  assert.deepEqual([...INTERVIEW_DURATION_PRESETS], [15, 30, 45, 60]);
  assert.equal(MIN_INTERVIEW_DURATION_MINS, 10);
  assert.equal(MAX_INTERVIEW_DURATION_MINS, 60);

  for (const value of [10, 11, 17, 20, 25, 35, 59, 60]) {
    assert.equal(isValidInterviewDurationMins(value), true, `${value} should be valid`);
  }
  for (const value of [9, 60.5, 61, 90, 120]) {
    assert.equal(isValidInterviewDurationMins(value), false, `${value} should be rejected`);
  }

  for (const value of [15, 30, 45, 60]) assert.equal(isPresetInterviewDurationMins(value), true);
  for (const value of [10, 20, 25, 35]) assert.equal(isPresetInterviewDurationMins(value), false);
});

test("round builder visibly exposes fixed presets and a custom duration input", () => {
  const ui = source("app/employer/interview-round-builder/page.tsx");

  assert.match(ui, /INTERVIEW_DURATION_PRESETS/);
  assert.match(ui, /<option value="CUSTOM">Custom<\/option>/);
  assert.match(ui, /Custom duration \(10–60 minutes\)/);
  assert.match(ui, /min=\{MIN_INTERVIEW_DURATION_MINS\}/);
  assert.match(ui, /max=\{MAX_INTERVIEW_DURATION_MINS\}/);
  assert.doesNotMatch(ui, /90,\s*120/);
});

test("process API and scheduler enforce the same 10-60 minute configured-round contract", () => {
  const processApi = source("app/api/employer/jobs/[id]/interview-process/route.ts");
  const schedulerApi = source("app/api/employer/interviews/schedule/route.ts");

  assert.match(processApi, /min\(MIN_INTERVIEW_DURATION_MINS\)\.max\(MAX_INTERVIEW_DURATION_MINS\)/);
  assert.match(schedulerApi, /const durationMins = round\.durationMins/);
  assert.match(schedulerApi, /isValidInterviewDurationMins\(round\.durationMins\)/);
  assert.match(schedulerApi, /isValidInterviewDurationMins\(durationMins\)/);
  assert.doesNotMatch(processApi, /max\(240\)/);
});
