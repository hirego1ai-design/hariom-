import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

test("mock interview v2 uses real setup, active and report pages", () => {
  const setup = read("src/app/ai/mock-interview/setup/page.tsx");
  const active = read("src/app/ai/mock-interview/active/page.tsx");
  const summary = read("src/app/ai/mock-interview/summary/page.tsx");

  assert.ok(setup.includes("/api/assessment/mock-interview/start"));
  // stream-turn is the unified SSE endpoint that replaced both /turn and /live-turn
  assert.ok(
    active.includes("/api/assessment/mock-interview/turn") ||
    active.includes("/api/assessment/mock-interview/live-turn") ||
    active.includes("/api/assessment/mock-interview/voice/stream-turn"),
  );
  assert.ok(active.includes("/api/assessment/mock-interview/finish"));
  assert.ok(summary.includes("/api/assessment/mock-interview/session"));
  assert.ok(!setup.includes('redirect("/assessment/readiness")'));
  assert.ok(!active.includes('redirect("/assessment/readiness")'));
  assert.ok(!summary.includes('redirect("/assessment/readiness")'));
});

test("setup uses the real role catalogue instead of hard-coded demo role buttons", () => {
  const setup = read("src/app/ai/mock-interview/setup/page.tsx");
  assert.ok(setup.includes('searchRoles(roleTarget)'));
  assert.ok(setup.includes('from "@/lib/skill-master"'));
  assert.ok(!setup.includes('/api/skill-master?'));
  assert.ok(!setup.includes('"Full Stack Engineer"'));
  assert.ok(!setup.includes('"Frontend Architect"'));
  assert.ok(!setup.includes('"Backend Systems"'));
  assert.ok(!setup.includes('"AI / ML Engineer"'));
});

test("skill master has no in-memory production fallback", () => {
  const route = read("src/app/api/skill-master/route.ts");
  assert.ok(route.includes("prisma.customSkillRequest.create"));
  assert.ok(!route.includes("developmentRequests"));
  assert.ok(!route.includes("developmentFallback"));
});

test("mock interview start enforces candidate ownership, credits and persisted persona configuration", () => {
  const route = read("src/app/api/assessment/mock-interview/start/route.ts");
  assert.ok(route.includes('session.role !== "CANDIDATE"'));
  assert.ok(route.includes("candidateServiceCatalog.findFirst"));
  assert.ok(route.includes("candidateCreditWallet.updateMany"));
  assert.ok(route.includes("resolveMockInterviewPersona"));
  assert.ok(route.includes("declaredSeniority"));
  assert.ok(route.includes("calibrationState"));
  assert.ok(route.includes("declaredLevelIsHypothesis: true"));
  assert.ok(route.includes("LearningEventStore.record"));
});

test("adaptive engine treats declared level as hypothesis and uses multi-angle evidence", () => {
  const engine = read("src/lib/mockInterview/MockInterviewEngineV2.ts");
  assert.ok(engine.includes("declared seniority and claimed skills are hypotheses"));
  assert.ok(engine.includes("Never infer competence from years of experience alone"));
  assert.ok(engine.includes("Do not decide the candidate's final level from a single answer"));
  assert.ok(engine.includes('"FUNDAMENTAL"'));
  assert.ok(engine.includes('"IMPLEMENTATION"'));
  assert.ok(engine.includes('"DEBUGGING"'));
  assert.ok(engine.includes('"TRADEOFF"'));
  assert.ok(engine.includes('"OWNERSHIP"'));
  assert.ok(engine.includes("nextDifficulty"));
  assert.ok(engine.includes("nextCompetency"));
  assert.ok(engine.includes("nextSkillTags"));
});

test("one adaptive turn call returns evaluation and next question together", () => {
  const route = read("src/app/api/assessment/mock-interview/turn/route.ts");
  const engine = read("src/lib/mockInterview/MockInterviewEngineV2.ts");

  assert.ok(route.includes("MockInterviewEngineV2.evaluateAndGenerateNext"));
  assert.ok(route.includes("evaluation.nextQuestion"));
  assert.ok(route.includes("evaluation.nextDifficulty"));
  assert.ok(engine.includes("mockTurnEvaluationSchema"));
  assert.ok(engine.includes("nextQuestion: z.string().trim().min(1).max(5_000).nullable()"));

  const structuredCalls = (route.match(/runMockInterviewStructured/g) || []).length;
  assert.equal(structuredCalls, 0, "route should delegate one combined AI cycle to the v2 engine");
});

test("turn API is idempotent and never advances from stale state", () => {
  const route = read("src/app/api/assessment/mock-interview/turn/route.ts");
  assert.ok(route.includes("candidateAnswerTranscript !== null"));
  assert.ok(route.includes("questionIndex !== interviewSession.currentQuestionIndex"));
  assert.ok(route.includes("candidateAnswerTranscript: null"));
  assert.ok(route.includes("currentQuestionIndex: questionIndex"));
  assert.ok(route.includes("updateMany"));
});

test("final report needs repeated evidence before estimating a level", () => {
  const report = read("src/lib/mockInterview/MockInterviewReport.ts");
  assert.ok(report.includes("levelSamples.length >= 2"));
  assert.ok(report.includes("evidenceConfidenceAverage >= 45"));
  assert.ok(report.includes('"INSUFFICIENT_EVIDENCE"'));
  assert.ok(report.includes("missingEvidence"));
  assert.ok(report.includes("nextPracticePlan"));
});

test("practice output stays private and does not write SkillEvidence or employer decisions", () => {
  const finish = read("src/app/api/assessment/mock-interview/finish/route.ts");
  const turn = read("src/app/api/assessment/mock-interview/turn/route.ts");
  const start = read("src/app/api/assessment/mock-interview/start/route.ts");

  for (const source of [start, turn, finish]) {
    assert.ok(!source.includes("skillEvidence.create"));
    assert.ok(!source.includes("skillEvidence.update"));
    assert.ok(!source.includes("application.update"));
    assert.ok(!source.includes("SELECTED"));
    assert.ok(!source.includes("REJECTED"));
  }
  assert.ok(finish.includes("technicalScore: null"));
  assert.ok(finish.includes("communicationScore: null"));
  assert.ok(finish.includes("finalReport"));
});

test("completed session is idempotent and finish cannot complete an unfinished interview", () => {
  const finish = read("src/app/api/assessment/mock-interview/finish/route.ts");
  assert.ok(finish.includes('interviewSession.status === "COMPLETED"'));
  assert.ok(finish.includes("Complete the planned interview questions"));
  assert.ok(finish.includes("MOCK_INTERVIEW_COMPLETED"));
});

test("candidate session API enforces ownership and exposes v2 provenance", () => {
  const route = read("src/app/api/assessment/mock-interview/session/route.ts");
  assert.ok(route.includes('auth.role !== "CANDIDATE"'));
  assert.ok(route.includes("candidateProfileId !== candidateProfile.id"));
  assert.ok(route.includes("personaVersion") || route.includes("rubricVersion"));
  assert.ok(route.includes("evidenceConfidence"));
  assert.ok(route.includes("transcriptConfidence"));
  assert.ok(route.includes("finalReport"));
});

test("live conversational mock interview UI provides real-time guidance", () => {
  const active = read("src/app/ai/mock-interview/active/page.tsx");
  const setup = read("src/app/ai/mock-interview/setup/page.tsx");

  assert.ok(active.includes("Sara") || active.includes("Practice response reviewed"));
  assert.ok(active.includes("Live") || active.includes("One answer does not determine your final level"));
  assert.ok(active.includes("conversation") || active.includes("Your response"));
  assert.ok(!setup.includes("navigator.mediaDevices"));
});

test("summary uses typed-response wording and evidence based level guidance", () => {
  const summary = read("src/app/ai/mock-interview/summary/page.tsx");
  assert.ok(summary.includes("Your typed response"));
  assert.ok(summary.includes("Declared starting level"));
  assert.ok(summary.includes("Estimated level"));
  assert.ok(summary.includes("Missing or partial evidence"));
  assert.ok(summary.includes("Next practice plan"));
  assert.ok(!summary.includes("Your Recorded Response"));
  assert.ok(!summary.includes("Fluency & Technical Practice Summary"));
});

test("mock interview v2 migration is additive and seeds persisted persona configuration", () => {
  const migration = read(
    "prisma/migrations/20261005093000_mock_interview_v2/migration.sql",
  );
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS "MockInterviewPersona"'));
  assert.ok(migration.includes('ADD COLUMN IF NOT EXISTS "declaredSeniority"'));
  assert.ok(migration.includes('ADD COLUMN IF NOT EXISTS "finalReport"'));
  assert.ok(migration.includes("ON CONFLICT"));
  assert.ok(migration.includes('ENABLE ROW LEVEL SECURITY'));
  assert.ok(!migration.includes("DROP TABLE"));
  assert.ok(!migration.includes("DROP COLUMN"));
});
