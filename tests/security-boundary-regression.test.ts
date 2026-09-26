import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("quarantined files cannot reach analysis workers", () => {
  const recorded = read("src/lib/recordedAssessmentAnalysis.ts");
  assert.match(recorded, /isStoredFileSafeForProcessing/);
  assert.match(recorded, /getWorkerDownloadUrlForCleanStoredFile/);
  assert.ok(
    recorded.indexOf("if (!isStoredFileSafeForProcessing") < recorded.indexOf("const downloadUrl = await getWorkerDownloadUrlForCleanStoredFile"),
    "recorded-assessment CLEAN gate must run before signed worker URL creation",
  );

  const video = read("src/app/api/candidate/video-resume/route.ts");
  assert.match(video, /scanStatus:\s*"CLEAN"/);
  assert.match(video, /Security scan has not produced a CLEAN file/);

  const response = read("src/app/api/candidate/recorded-assessment/attempts/[id]/responses/route.ts");
  assert.match(response, /scanStatus:\s*"CLEAN"/);
});

test("uploads reject active documents and normalize raster images", () => {
  const upload = read("src/app/api/upload/route.ts");
  const policy = read("src/lib/uploadSecurity.ts");
  assert.match(upload, /validatePassiveDocumentContent/);
  assert.match(upload, /sharp\(buffer/);
  assert.doesNotMatch(upload, /application\/msword/);
  assert.match(policy, /\/javascript/);
  assert.match(policy, /vbaproject\.bin/);
  assert.match(policy, /audio\/webm/);
});

test("AI entry points enforce zero-trust prompt boundaries", () => {
  const router = read("src/utils/aiRouter.ts");
  assert.match(router, /AI_SECURITY_SYSTEM_POLICY/);
  assert.match(router, /role:\s*"system"/);
  assert.match(router, /untrusted data/i);

  const interview = read("src/app/api/assessment/mock-interview/turn/route.ts");
  assert.match(interview, /wrapUntrustedContent/);
  assert.match(interview, /candidate-answer/);
  assert.match(interview, /nextQuestionSchema/);
});

test("critical candidate/admin render surfaces do not use raw HTML sinks", () => {
  const paths = [
    "src/app/employer/full-candidate-profile-employer-view/page.tsx",
    "src/app/employer/video-resume/[videoId]/VideoReview.tsx",
    "src/app/admin/document-verification/page.tsx",
    "src/app/candidate/universal-profile/page.tsx",
    "src/app/admin/communications/page.tsx",
  ];
  for (const path of paths) {
    const source = read(path);
    assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
    assert.doesNotMatch(source, /\.innerHTML\s*=/);
    assert.doesNotMatch(source, /document\.write\s*\(/);
  }
});

test("outbound service configuration blocks obvious SSRF targets", () => {
  const env = read("src/lib/env.ts");
  for (const marker of ["localhost", "metadata.google.internal", "169\\.254", "192\\.168", "172\\."]) {
    assert.ok(env.includes(marker), `missing SSRF deny marker: ${marker}`);
  }
  assert.match(env, /assertSafeHttpsServiceUrl\("VIDEO_ANALYSIS_WORKER_URL"/);
  assert.match(env, /assertSafeHttpsServiceUrl\("MALWARE_SCANNER_URL"/);
});

test("DNS-resolved outbound targets fail closed before scanner or worker fetches", () => {
  const outbound = read("src/lib/security/outboundUrl.ts");
  const uploadSecurity = read("src/lib/uploadSecurity.ts");
  const recorded = read("src/lib/recordedAssessmentAnalysis.ts");
  const video = read("src/app/api/candidate/video-resume/route.ts");
  assert.match(outbound, /lookup\(host, \{ all: true, verbatim: true \}\)/);
  assert.match(outbound, /isPrivateOrReservedAddress/);
  assert.match(uploadSecurity, /assertSafeOutboundNetworkTarget\(endpoint/);
  assert.match(recorded, /assertSafeOutboundNetworkTarget\(config\.workerUrl/);
  assert.match(video, /assertSafeOutboundNetworkTarget\(params\.workerUrl/);
});

test("tenant and privileged tool boundaries fail closed", () => {
  const tools = read("src/lib/tools/SideEffectTools.ts");
  const registry = read("src/lib/tools/ToolRegistry.ts");
  const agentRules = read("AGENTS.md");

  assert.ok((tools.match(/validateTenantAccess\(/g) || []).length >= 3);
  assert.doesNotMatch(tools, /Database fallback/);
  assert.match(registry, /requires the durable approved-action executor/);
  assert.match(agentRules, /untrusted data/i);
  assert.match(agentRules, /Never execute an MCP\/tool action/i);
});
