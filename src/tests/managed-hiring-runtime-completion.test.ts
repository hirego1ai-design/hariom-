import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

function read(path: string) {
  return fs.readFileSync(new URL(path, import.meta.url), "utf8");
}

test("managed hiring activation creates traceable jobs and only safe sourcing relationships", () => {
  const schema = read("../../prisma/schema.prisma");
  const activation = read("../lib/managedHiring/RequirementActivation.ts");
  const requirementRoute = read("../app/api/agreements/requirements/[id]/route.ts");
  const sourcing = read("../lib/managedHiring/SourcingOrchestrator.ts");
  const consumers = read("../lib/events/ProductionConsumers.ts");

  assert.match(schema, /managedRequirementId\s+String\?/);
  assert.match(schema, /managedAgreementId\s+String\?/);
  assert.match(schema, /managedRoleKey\s+String\?/);
  assert.match(schema, /@@unique\(\[managedRequirementId, managedRoleKey\]\)/);

  assert.match(activation, /status !== "ACTIVE"/);
  assert.match(activation, /employmentType/);
  assert.match(activation, /skillsRequired\.length/);
  assert.match(activation, /managedRequirementId:/);
  assert.match(activation, /managedAgreementId:/);
  assert.match(activation, /eventType: "MANAGED_JOB_ACTIVATED"/);
  assert.doesNotMatch(activation, /Software Engineer/);
  assert.doesNotMatch(activation, /Remote\/Hybrid/);

  assert.match(requirementRoute, /body\.status === "ACTIVE"/);
  assert.match(requirementRoute, /activateManagedHiringRequirement/);
  assert.match(requirementRoute, /activatedById: session\.id/);

  assert.match(sourcing, /availabilityStatus: "ACTIVE_CONFIRMED"/);
  assert.match(sourcing, /applications: \{ none: \{ jobId: job\.id \} \}/);
  assert.match(sourcing, /status: "SOURCED"/);
  assert.match(sourcing, /invitationsSent: 0/);
  assert.match(sourcing, /applicationsCreated: 0/);
  assert.match(sourcing, /automaticRejections: 0/);
  assert.doesNotMatch(sourcing, /status: "INVITED"/);
  assert.doesNotMatch(sourcing, /status: "REJECTED"/);

  assert.match(consumers, /MANAGED_JOB_ACTIVATED/);
  assert.match(consumers, /sourceManagedJobCandidates/);
});

test("durable outbox worker is scheduled and registers production consumers", () => {
  const route = read("../app/api/cron/events-outbox/route.ts");
  const vercel = read("../../vercel.json");

  assert.match(route, /CRON_SECRET/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /registerProductionConsumers\(\)/);
  assert.match(route, /OutboxPoller\.pollAndProcess/);
  assert.match(route, /totalUnhandled/);
  assert.match(vercel, /\/api\/cron\/events-outbox/);
});

test("live interview answer evaluation is provenance-bound, advisory, and human-gated", () => {
  const schema = read("../../prisma/schema.prisma");
  const agents = read("../lib/agents/OperationalAgents.ts");
  const registry = read("../lib/agents/AgentRegistry.ts");
  const permissions = read("../lib/tools/ToolRegistry.ts");
  const entitlements = read("../lib/governance/AiEntitlements.ts");
  const callback = read("../app/api/internal/interviews/transcript/callback/route.ts");
  const evaluation = read("../app/api/employer/interviews/[id]/ai-evaluation/route.ts");
  const room = read("../app/api/interviews/room/route.ts");

  assert.match(schema, /model InterviewEvaluation/);
  assert.match(schema, /transcriptProvider\s+String\?/);
  assert.match(schema, /transcriptConfidence\s+Float\?/);
  assert.match(schema, /startedAt\s+DateTime\?/);
  assert.match(schema, /completedAt\s+DateTime\?/);
  assert.match(schema, /supportingEvidence\s+Json/);

  assert.match(agents, /class LiveInterviewEvaluatorAgent/);
  assert.match(agents, /Missing evidence must lower evidenceConfidence/);
  assert.match(agents, /automaticSelectionAllowed: false/);
  assert.match(agents, /automaticRejectionAllowed: false/);
  assert.match(registry, /new LiveInterviewEvaluatorAgent\(\)/);
  assert.match(permissions, /'live-interview-evaluator'/);
  assert.match(permissions, /updateApplicationStatus/);
  assert.match(permissions, /sendOffer/);
  assert.match(entitlements, /"live-interview-evaluator"/);

  assert.match(callback, /enforceInternalApiKey/);
  assert.match(callback, /finalized transcript already exists/i);
  assert.match(callback, /LIVE_INTERVIEW_TRANSCRIPT_FINALIZED/);
  assert.doesNotMatch(callback, /status:\s*"REJECTED"/);

  assert.match(evaluation, /WorkflowEngine\.executeStep/);
  assert.match(evaluation, /ExecutionLoop\.runTask/);
  assert.match(evaluation, /live-interview-evaluator/);
  assert.match(evaluation, /Transcript confidence is too low/);
  assert.match(evaluation, /automaticSelection: false/);
  assert.match(evaluation, /automaticRejection: false/);
  assert.match(evaluation, /humanDecisionRequired: true/);
  assert.doesNotMatch(evaluation, /data:\s*\{\s*status:\s*"REJECTED"/);

  assert.match(room, /startedAt:/);
  assert.match(room, /completedAt:/);
});
