import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(relative: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relative), "utf-8");
}

test("job apply persists universal validation intent and returns notice workflow", () => {
  const src = read("src/app/api/applications/route.ts");
  assert.ok(src.includes("handleApplicationValidationIntent"), "apply must persist validation intent");
  assert.ok(src.includes("assessmentType: \"UNIVERSAL_SKILL_VALIDATION\""), "apply must identify universal validation");
  assert.ok(src.includes("/assessment/skill-validation/notice"), "apply must direct candidate through notice page");
  assert.ok(src.includes("applicationPendingValidation"), "provider failure must preserve pending application intent");
});

test("universal assessment start cannot bypass acknowledgement", () => {
  const src = read("src/app/api/assessment/mcq/start/route.ts");
  assert.ok(src.includes("assessmentNoticeAcknowledgement"), "start route must read persisted notice acknowledgement");
  assert.ok(src.includes("universal-skill-validation-v1"), "start route must enforce current notice version");
  assert.ok(src.includes("428"), "notice bypass must fail closed");
});

test("candidate assessment UI does not claim unavailable surveillance", () => {
  const active = read("src/app/assessment/mcq/active/page.tsx");
  const notice = read("src/app/assessment/skill-validation/notice/page.tsx");
  assert.ok(!active.includes("Proctoring Active"), "MCQ UI must not claim proctoring is active");
  assert.ok(!active.includes("Do not switch tabs"), "MCQ UI must not imply tab monitoring");
  assert.ok(notice.includes("Webcam monitoring"), "notice must explicitly state webcam monitoring status");
  assert.ok(notice.includes("Not enabled"), "notice must render disabled monitoring truthfully");
});

test("job-specific assessment cannot overwrite universal CandidateSkill evidence", () => {
  const submit = read("src/app/api/assessment/mcq/submit/route.ts");
  assert.ok(submit.includes('assessment.scope === "PLATFORM_READINESS"'), "reusable evidence must be scoped to platform validation");
  assert.ok(submit.includes("aggregateMcqSkillEvidence(questionResults)"), "job-specific assessment may compute scoped result without persisting CandidateSkill evidence");
  assert.ok(submit.includes("JOB_SPECIFIC_ASSESSMENT"), "job-specific gate must be completed explicitly");
});

test("employer pipeline excludes pre-validation application intents", () => {
  const employer = read("src/app/api/employer/candidates/route.ts");
  assert.ok(employer.includes("UNIVERSAL_SKILL_VALIDATION"), "employer query must inspect universal gate");
  assert.ok(employer.includes("ApplicationGateStatus.REQUIRED"), "required universal gates must be excluded");
  assert.ok(employer.includes("ApplicationGateStatus.IN_PROGRESS"), "in-progress universal gates must be excluded");
});

test("job-specific assessment is generated before publication and credit debit", () => {
  const jobs = read("src/app/api/employer/jobs/route.ts");
  assert.ok(jobs.includes("requiresJobSpecificAssessment"), "job API must accept explicit assessment choice");
  assert.ok(jobs.includes("ensureJobSpecificAssessment"), "job API must generate required assessment");
  assert.ok(jobs.includes("JobStatus.DRAFT"), "required assessment job must remain draft while generation is pending");
  assert.ok(jobs.includes('jobSpecificAssessment: "READY"'), "job API must report ready only after generation");
});

test("mock interview never fabricates a fallback score", () => {
  const active = read("src/app/ai/mock-interview/active/page.tsx");
  assert.ok(!active.includes("?? 75"), "mock interview must not fabricate 75/100");
  assert.ok(active.includes('typeof data.turnScore !== "number"'), "mock interview UI must require server score");
});

test("AI routing has no hardcoded model IDs or legacy provider selector", () => {
  const router = read("src/lib/ai/ModelRouter.ts");
  const dispatcher = read("src/utils/aiRouter.ts");
  const usage = read("src/app/admin/settings/llm-usage/page.tsx");
  const source = [router, dispatcher, usage].join("\n");
  for (const legacy of ["gpt-4o", "Gemini (1.5 Pro)", "DeepSeek (V3)"]) {
    assert.ok(!source.includes(legacy), `must not hardcode legacy model label ${legacy}`);
  }
  assert.ok(router.includes("getAiRoutingConfig"), "router must load admin routing configuration");
  assert.ok(usage.includes("/api/admin/model-benchmark"), "model comparison must use safe admin benchmark endpoint");
});

test("AI provider secrets remain server side and admin routing API never returns them", () => {
  const config = read("src/lib/ai/AiRoutingConfig.ts");
  const route = read("src/app/api/admin/ai-routing/route.ts");
  assert.ok(config.includes("process.env.OPENAI_API_KEY"), "provider secret must be read server-side");
  assert.ok(config.includes("process.env.GEMINI_API_KEY"), "Gemini secret must be server-side");
  assert.ok(config.includes("process.env.DEEPSEEK_API_KEY"), "DeepSeek secret must be server-side");
  assert.ok(config.includes("process.env.KIMI_API_KEY"), "Kimi secret must be server-side");
  assert.ok(config.includes("process.env.QWEN_API_KEY"), "Qwen secret must be server-side");
  assert.ok(!route.includes("API_KEY"), "admin routing response must not expose raw provider keys");
});

test("candidate dashboard uses authoritative Skill Validation status", () => {
  const dashboard = read("src/app/dashboard/page.tsx");
  assert.ok(dashboard.includes("/api/candidate/skill-validation/status"), "dashboard must load validation status API");
  assert.ok(!dashboard.includes("AI Readiness Score"), "dashboard must not show disconnected readiness placeholder");
});

test("assessment authoring stores provider/model provenance", () => {
  const authoring = read("src/lib/universalSkillValidation.ts");
  const schema = read("prisma/schema.prisma");
  assert.ok(schema.includes("authoringProvider"), "assessment schema must store provider provenance");
  assert.ok(schema.includes("authoringModel"), "assessment schema must store model provenance");
  assert.ok(authoring.includes("authoringVersion"), "generated assessments must store authoring version");
});
