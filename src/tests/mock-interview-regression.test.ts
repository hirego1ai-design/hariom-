import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("mock interview setup, active, and summary pages exist with real client implementations", () => {
  const setupPath = path.resolve(process.cwd(), "src/app/ai/mock-interview/setup/page.tsx");
  const activePath = path.resolve(process.cwd(), "src/app/ai/mock-interview/active/page.tsx");
  const summaryPath = path.resolve(process.cwd(), "src/app/ai/mock-interview/summary/page.tsx");

  assert.ok(fs.existsSync(setupPath), "setup page must exist");
  assert.ok(fs.existsSync(activePath), "active page must exist");
  assert.ok(fs.existsSync(summaryPath), "summary page must exist");

  const setupSrc = fs.readFileSync(setupPath, "utf-8");
  const activeSrc = fs.readFileSync(activePath, "utf-8");
  const summarySrc = fs.readFileSync(summaryPath, "utf-8");

  // Verify none are single-line redirects
  assert.ok(!setupSrc.includes('redirect("/assessment/readiness")'), "setup page must not be a dummy redirect");
  assert.ok(!activeSrc.includes('redirect("/assessment/readiness")'), "active page must not be a dummy redirect");
  assert.ok(!summarySrc.includes('redirect("/assessment/readiness")'), "summary page must not be a dummy redirect");

  // Verify setup connects to /api/assessment/mock-interview/start
  assert.ok(setupSrc.includes("/api/assessment/mock-interview/start"), "setup must post to start API");

  // Verify active connects to /api/assessment/mock-interview/turn
  assert.ok(activeSrc.includes("/api/assessment/mock-interview/turn"), "active must post to turn API");

  // Verify summary fetches from /api/assessment/mock-interview/session
  assert.ok(summarySrc.includes("/api/assessment/mock-interview/session"), "summary must fetch session API");
});

test("mock interview session API route enforces candidate role and session ownership", () => {
  const sessionRoutePath = path.resolve(process.cwd(), "src/app/api/assessment/mock-interview/session/route.ts");
  assert.ok(fs.existsSync(sessionRoutePath), "session route must exist");

  const src = fs.readFileSync(sessionRoutePath, "utf-8");

  assert.ok(src.includes('session.role !== "CANDIDATE"'), "must enforce CANDIDATE role");
  assert.ok(src.includes("candidateProfileId !== candidateProfile.id"), "must enforce candidate ownership");
  assert.ok(src.includes("enforceRateLimit"), "must enforce rate limiting");
});

test("mock interview turn evaluation validates scores between 0 and 100", () => {
  const turnRoutePath = path.resolve(process.cwd(), "src/app/api/assessment/mock-interview/turn/route.ts");
  const src = fs.readFileSync(turnRoutePath, "utf-8");

  assert.ok(src.includes("turnEvaluationSchema"), "must use typed zod schema for AI output");
  assert.ok(src.includes("score: z.number().int().min(0).max(100)"), "score must be validated between 0 and 100");
});

test("legacy dna prototype page redirects to real mock interview setup", () => {
  const dnaPath = path.resolve(process.cwd(), "src/app/assessment/mock-interview/dna/page.tsx");
  const src = fs.readFileSync(dnaPath, "utf-8");

  assert.ok(src.includes('redirect("/ai/mock-interview/setup")'), "dna page must redirect to real setup flow");
});

test("mock interview UI enforces text-only interview flow without audio/voice dependencies", () => {
  const setupPath = path.resolve(process.cwd(), "src/app/ai/mock-interview/setup/page.tsx");
  const activePath = path.resolve(process.cwd(), "src/app/ai/mock-interview/active/page.tsx");

  const setupSrc = fs.readFileSync(setupPath, "utf-8");
  const activeSrc = fs.readFileSync(activePath, "utf-8");

  // Verify setup page has no mic check or voice mode
  assert.ok(!setupSrc.includes("handleTestMic"), "setup page must not have microphone test logic");
  assert.ok(!setupSrc.includes("navigator.mediaDevices"), "setup page must not request microphone media devices");

  // Verify active page has no speech recognition
  assert.ok(!activeSrc.includes("webkitSpeechRecognition"), "active page must not use webkitSpeechRecognition");
  assert.ok(!activeSrc.includes("SpeechRecognition"), "active page must not use SpeechRecognition");
  assert.ok(!activeSrc.includes("isListening"), "active page must not have listening state");
});

test("mock interview turn schema validates answer minimum length and score clamping", () => {
  const turnRoutePath = path.resolve(process.cwd(), "src/app/api/assessment/mock-interview/turn/route.ts");
  const src = fs.readFileSync(turnRoutePath, "utf-8");

  assert.ok(src.includes("min(5"), "turn answer must require at least 5 characters");
  assert.ok(src.includes("Math.max(0, Math.min(100"), "turn evaluation must clamp scores to [0, 100]");
});

test("mock interview finish route is idempotent for COMPLETED sessions", () => {
  const finishRoutePath = path.resolve(process.cwd(), "src/app/api/assessment/mock-interview/finish/route.ts");
  const src = fs.readFileSync(finishRoutePath, "utf-8");

  assert.ok(src.includes("interviewSession.status === 'COMPLETED'"), "finish route must handle already-completed sessions idempotently");
  assert.ok(src.includes("MOCK_INTERVIEW_COMPLETED"), "finish route must record completion audit event");
});

