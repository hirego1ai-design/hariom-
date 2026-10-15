import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path: string) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("mock interview setup uses the HireGo logo and text-only practice copy", () => {
  const setup = read("../app/ai/mock-interview/setup/page.tsx");
  assert.match(setup, /<Image src="\\/marketing\\/hirego-logo-hd\\.png" alt="HireGo AI"/);
  assert.match(setup, /role-based text questions/);
  assert.match(setup, /const mode = "TEXT" as const/);
  assert.doesNotMatch(setup, /Checking voice practice availability|Practise with voice|Real Voice Mode|\\/voice\\/readiness/);
  assert.doesNotMatch(setup, /Whisper|TTS routing|speech-to-text service|production voice infrastructure|self-hosted worker/);
});

test("voice playback never discloses internal provider or model response headers", () => {
  const speech = read("../app/api/assessment/mock-interview/voice/speech/route.ts");
  const active = read("../app/ai/mock-interview/active/page.tsx");
  const session = read("../app/api/assessment/mock-interview/session/route.ts");
  assert.doesNotMatch(session, /transcriptProvider: turn\.transcriptProvider|transcriptModel: turn\.transcriptModel|transcriptVersion: turn\.transcriptVersion/);
  assert.doesNotMatch(speech, /X-HireGo-TTS-(Provider|Model)/);
  assert.doesNotMatch(active, /future self-hosted worker|Provider\s+transcripts/);
});

test("private profile and dashboard show persisted onboarding qualifications", () => {
  const page = read("../app/profile/page.tsx");
  const dashboard = read("../app/dashboard/page.tsx");
  const api = read("../app/api/candidate/profile/route.ts");
  assert.match(page, /Your saved onboarding details/);
  assert.match(page, /targetRole/);
  assert.match(page, /savedEducation/);
  assert.match(page, /savedExperience/);
  assert.match(page, /savedSkills/);
  assert.match(dashboard, /careerSnapshot/);
  assert.match(dashboard, /view=dashboard/);
  assert.match(page, /view=overview/);
  assert.match(api, /view === "overview" \|\| view === "dashboard"/);
  assert.match(api, /where: \{ isVisible: true \}/);
  assert.match(page, /ASSESSMENT_VALIDATED/);
});
