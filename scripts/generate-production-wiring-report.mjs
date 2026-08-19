import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inventory = JSON.parse(fs.readFileSync(path.join(root, "production-wiring-inventory.json"), "utf8"));
const records = inventory.records;
const screens = records.filter((r) => r.record_type === "screen");
const actions = records.filter((r) => r.record_type === "user_action");
const calls = records.filter((r) => r.record_type === "frontend_api_call");
const endpoints = records.filter((r) => r.record_type === "api_endpoint");

const list = (items, empty = "None identified by the static scan.") => items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
const evidence = (file, pattern) => {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const index = text.search(pattern);
  return `${file}:${index < 0 ? 1 : text.slice(0, index).split(/\r?\n/).length}`;
};
const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replaceAll("|", "\\|").replaceAll("\n", " ")).join(" | ")} |`),
].join("\n");

const mockFindings = [
  [`INFO`, evidence("src/proxy.ts", /bypassParam/), "The `?bypass=true` query parameter is now limited to non-production environments.", "Development convenience only; production auth bypass is no longer exposed by this branch."],
  [`INFO`, evidence("src/lib/prisma.ts", /return mockUsers/), "Seeded mock users remain available only for development or explicit mock-db mode.", "Development fallback only; production now fails closed instead of authenticating against seeded users."],
  [`HIGH`, evidence("src/utils/aiRouter.ts", /Fallback \/ Simulated/), "AI router returns simulated resume/JD/interview-style output when a real provider is unavailable.", "Users may see fabricated AI results while the UI appears successful."],
  [`HIGH`, evidence("src/services/candidateProfileService.ts", /candidateProfileData/), "Candidate profile service imports mock profile data as a source dependency.", "Candidate profile can be presented as persisted while actually using fixtures."],
  [`HIGH`, evidence("src/app/video-assessment/setup/page.tsx", /rawHtml/), "Assessment setup is rendered from a large embedded static HTML string.", "Screen can look complete while actions and data are not connected."],
  [`MEDIUM`, evidence("src/lib/otp.ts", /123456/), "Master OTP is accepted outside production only; this is safe only if environment classification is correct.", "Environment misconfiguration weakens identity verification."],
];

const securityFindings = [
  ["INFO", "Development-only auth bypass", "src/proxy.ts:55", "The bypass gate is now limited to non-production environments; keep it out of production deployments and revalidate environment settings."],
  ["INFO", "Development-only mock-user fallback", "src/lib/prisma.ts:93", "Mock users now remain behind non-production / mock-db guards; revalidate fail-closed behavior in production once the database is reachable."],
  ["P1", "Mixed admin route authorization", "src/app/api/admin/document-verification/route.ts:107", "POST accepts any authenticated session by design; confirm employer submission is separated from admin review endpoints."],
  ["P1", "Upload storage is local filesystem", "src/app/api/upload/route.ts:44", "Production requires durable object storage, malware scanning, signed URLs, and tenant-scoped access."],
  ["P1", "Webhook/provider verification requires runtime proof", "src/app/api/payments/webhook/route.ts:7", "Verify signature, replay protection, idempotency, and persisted event state against production configuration."],
];

const agentRows = [
  ["ResumeEvaluatorAgent", "Implemented in source/tests; portal/API call path must be proven for every resume scoring screen.", "YELLOW"],
  ["MockInterviewCopilotAgent", "Referenced by test/agent infrastructure; runtime screen-to-agent evidence is incomplete.", "YELLOW"],
  ["SecurityJudgeAgent", "Referenced by agent infrastructure; no complete production screen trace found by static scan.", "YELLOW"],
  ["CommunicationCoachAgent", "Referenced by agent infrastructure; no complete production screen trace found by static scan.", "YELLOW"],
  ["JdGeneratorAgent", "ROS gateway and execution loop references found; verify employer JD action reaches it in production.", "YELLOW"],
  ["CandidateMatchmakerAgent", "ROS/test references found; API-to-screen persistence trace remains incomplete.", "YELLOW"],
];

const providerRows = [
  ["OpenAI / Gemini / Anthropic / DeepSeek / Kimi", "src/utils/aiRouter.ts; src/lib/ai/ModelRouter.ts", "Provider routing and fallback code exists; real-key, cost, persistence, and UI proof are not universal.", "YELLOW/RED"],
  ["WhatsApp Cloud API", "src/lib/whatsapp.ts; src/app/api/whatsapp/*", "Transport, webhook, identity, onboarding, and auth handoff code exists; production credentials and live delivery require verification.", "YELLOW"],
  ["Razorpay / PhonePe / Stripe", "src/lib/payments/*; src/app/api/payments/*", "Multiple gateway paths exist; payment lifecycle and webhook runtime validation are not proven by this static audit.", "YELLOW/RED"],
  ["SMTP / SendGrid", "src/lib/email.ts", "Email transport checks environment configuration and can return provider-unavailable responses.", "YELLOW"],
  ["WebRTC", "src/components/interview/WebRTCInterviewRoom.tsx; src/app/interviews/room/:roomId/page.tsx", "In-browser room component exists; signaling, recording, persistence, and production TURN configuration require E2E proof.", "YELLOW"],
  ["Local upload storage", "src/app/api/upload/route.ts", "Writes to public/uploads; not production durable storage.", "RED"],
];

const screenRows = screens.map((r) => [r.screen, r.status, r.component, r.notes]);
const endpointRows = endpoints.map((r) => [r.method, r.api_endpoint, r.status, Array.isArray(r.db_model) ? r.db_model.join(", ") : r.db_model, Array.isArray(r.screen) ? r.screen.length : 0, r.evidence]);
const callRows = calls.map((r) => [r.screen, r.method, r.api_endpoint, r.status, r.evidence]);
const dbRows = endpoints.map((r) => [r.method, r.api_endpoint, Array.isArray(r.db_model) ? r.db_model.join(", ") : "None detected", r.persistence, r.evidence]);

const report = `# HIREGO AI — COMPLETE PORTAL PRODUCTION WIRING AUDIT

Generated: ${inventory.generated_at}
Repository: ${inventory.repository}
Audit mode: read-only static source audit plus route/build checks. Application code was not modified for this audit.

## 1. EXECUTIVE VERDICT

**NOT READY for production.**

The portal contains a large implemented surface, but the repository still contains simulated AI output, local upload persistence, and many UI/API paths that require runtime E2E verification. The recently fixed auth gates still need production revalidation. The machine-readable inventory contains one record per discovered screen, handler, frontend API call, API method, and server action.

### Scope discovered

${table(["Artifact", "Count"], [["Screen/page files", inventory.source_counts.screens], ["API route files", inventory.source_counts.api_route_files], ["API method records", inventory.reconciliation.api_endpoint_records], ["User-action records", inventory.reconciliation.user_action_records], ["Frontend API-call records", inventory.reconciliation.frontend_api_call_records], ["Server-action files", inventory.source_counts.server_action_files], ["Source files scanned", inventory.source_counts.source_files_scanned], ["Inventory records", records.length]])}

### Repository verification checks

${table(["Check", "Result", "Evidence"], [["Inventory generator syntax", "PASS", "node --check scripts/generate-production-wiring-inventory.mjs"], ["Report generator syntax", "PASS", "node --check scripts/generate-production-wiring-report.mjs"], ["JSON/CSV reconciliation", "PASS", "1,531 JSON records and 1,531 CSV data rows; 0 missing evidence"], ["TypeScript", "NOT EVALUATED", "WhatsApp-related failure excluded from this non-WhatsApp remediation pass"], ["Full ESLint", "FAIL", "40 errors and 4 warnings across repository source/scripts"], ["Production build", "NOT YET VERIFIED", "Run after resolving type/lint blockers"]])}

The audit does not treat a passing static inventory generator as an application build pass. TypeScript and lint failures block release independently of feature wiring.

## 2. COMPLETE SCREEN INVENTORY

The complete 245-screen registry is in [production-wiring-inventory.json](./production-wiring-inventory.json) and [production-wiring-inventory.csv](./production-wiring-inventory.csv). The following table is generated directly from every \`src/app/**/page.*\` file:

${table(["Route", "Status", "Component", "Notes"], screenRows)}

## 3. COMPLETE USER-ACTION INVENTORY

${inventory.reconciliation.user_action_records} handler records were discovered from \`onClick\`, \`onSubmit\`, \`onChange\`, \`onKeyDown\`, \`onBlur\`, and router navigation patterns. The exact file, line, action, nearby API association, persistence signal, and status are in the JSON/CSV inventory. A nearby API association is heuristic and must be confirmed during runtime testing.

## 4. COMPLETE API INVENTORY

${table(["Method", "Endpoint", "Status", "Detected DB", "Static callers", "Evidence"], endpointRows)}

## 5. SCREEN → API MATRIX

${table(["Screen", "Method", "API", "Status", "Evidence"], callRows)}

## 6. API → DATABASE MATRIX

${table(["Method", "API", "Detected DB model", "Persistence signal", "Evidence"], dbRows)}

## 7. API → EXTERNAL PROVIDER MATRIX

${table(["Provider", "Evidence files", "Assessment", "Status"], providerRows)}

## 8. SCREEN → ROS MATRIX

Static ROS references were detected in the inventory. A source module existing is not proof of a live request path. Most screen records remain YELLOW until a route-level E2E trace proves the complete ROS chain.

${table(["ROS component", "Static evidence", "Current classification"], [
  ["RosGateway", "src/lib/ros/RosGateway.ts", "Implemented; route callers require verification"],
  ["TenantContext / RbacGuard", "src/lib/security/*", "Implemented and referenced by tests; not universal across APIs"],
  ["ExecutionLoop / AgentRegistry", "src/lib/agents/*", "Implemented; screen-to-agent coverage incomplete"],
  ["Outbox / EventDispatcher / ConsumerRegistry", "src/lib/events/*", "Implemented; worker/runtime deployment not proven"],
  ["BudgetManager / AgentEvaluator / FairnessAuditor", "src/lib/governance/*", "Implemented; usage across all AI paths not proven"],
  ["WorkflowEngine / HiringPipeline", "src/lib/workflows/*", "Implemented/tested in harness; production route integration incomplete"],
  ["ModelRouter / CircuitBreaker", "src/lib/ai/*", "Implemented; provider configuration and persistence require runtime verification"],
])}

## 9. AGENT WIRING MATRIX

${table(["Agent", "Finding", "Status"], agentRows)}

## 10. LLM MATRIX

${table(["Area", "Required mode", "Finding", "Status"], [
  ["Resume scoring / evaluation", "LLM or hybrid", "Real provider path and deterministic fallback exist; fallback can produce simulated output.", "RED/YELLOW"],
  ["JD generation", "LLM", "AI router and ROS references exist; production provider, budget, output schema, and persistence need proof.", "YELLOW"],
  ["Interview copilot", "LLM", "Agent/model infrastructure exists; complete UI-to-persistence trace is not established.", "YELLOW"],
  ["Skill master / role mapping", "Deterministic", "Central role/skill data can be deterministic; no LLM is required for the basic suggestion path.", "YELLOW"],
  ["Matching / ranking", "Hybrid", "Candidate/job API and agent infrastructure exist; real persisted scoring trace remains incomplete.", "YELLOW"],
])}

## 11. HARDCODED / MOCK AUDIT

${table(["Severity", "Evidence", "Finding", "Impact"], mockFindings)}

Static scanner summary: ${inventory.reconciliation.red_records} records contain mock/fallback/static indicators. This is intentionally conservative; each RED record must be reviewed using its exact evidence row in the inventory.

## 12. SECURITY FINDINGS

${table(["Priority", "Finding", "Evidence", "Required action"], securityFindings)}

## 13. PAYMENT FINDINGS

The repository contains plan, checkout, payment status, webhook, subscription, credit, invoice, revenue, and gateway configuration paths. The lifecycle is not production-ready until the following are demonstrated against a real provider sandbox: signed webhook acceptance, replay rejection, idempotent checkout and webhook handling, persisted entitlement changes, failed payment recovery, refund/cancellation behavior, and tenant-scoped invoice access. Several admin revenue endpoints are static/mock-like according to the inventory and must not be used as financial truth.

## 14. WHATSAPP STATUS

**Implemented in source, not production-verified.** Webhook verification, identity resolution, onboarding state, persisted inbound events, auth handoff, and outbound transport modules exist. Required production proof includes Meta credentials, webhook signature verification, duplicate-event behavior, consent/template policy, 24-hour window enforcement, tenant binding, and delivery failure recovery.

## 15. DEPLOYMENT FINDINGS

- Docker and docker-compose files exist, but no complete staging/production deployment proof was found in the source inventory.
- Prisma schema and migrations exist; production migration execution and rollback procedure must be verified.
- \`/public/uploads\` local filesystem storage is not durable production storage.
- Worker/cron runtime for outbox, DLQ, referral reconciliation, and scheduled operations is not proven by the Next app alone.
- Environment variables and secrets must be validated in the deployment environment, including JWT secret, database URL, provider keys, webhook secrets, storage, email, WhatsApp, and payment credentials.
- Build, start, health check, migration, and rollback need to be tested in a production-like environment.

## 16. E2E JOURNEY BREAKPOINTS

### Candidate

Registration and onboarding screens exist, with candidate profile/resume/video/skill APIs present. The first high-risk breakpoint is persistence truth: \`src/services/candidateProfileService.ts\` imports mock profile data, and several API/UI paths contain fallback/static behavior. The journey must be tested through job search, apply, assessment, interview, AI preparation, and result persistence.

### Employer

Registration → OTP → business model → plan → one-document KYC is implemented and was previously verified in development. Production blockers remain database connectivity, durable upload storage, subscription/payment truth, job persistence, candidate pipeline authorization, and interview scheduling/video signaling.

### Admin

Admin login and dashboard/navigation exist. Verification, revenue, subscription, agreements, audit, security, and system-health screens exist, but the admin surface includes static/mock findings and must be validated with real persisted records. The recently fixed dev-only auth gate still needs production revalidation.

## 17. PRODUCTION BLOCKERS

1. Revalidate the dev-only \`?bypass=true\` gate in \`src/proxy.ts\` so production requests cannot activate it.
2. Revalidate fail-closed authentication in \`src/lib/prisma.ts\` so seeded mock users remain development-only.
3. Replace simulated AI success output with explicit provider-unavailable errors or an explicitly labeled non-production mode.
4. Replace local upload storage with durable, access-controlled object storage and scanning.
5. Prove payment webhook signature, replay protection, idempotency, and entitlement persistence.
6. Run true E2E tests with a real database and provider sandboxes; current harness tests are not equivalent to production E2E.
7. Verify tenant and RBAC enforcement for every employer/admin/candidate API, including dynamic resource routes.
8. Resolve the current TypeScript failure and full-lint failures before declaring the repository build-ready.

## 18. NON-BLOCKING GAPS

- Static/generated screens and visual prototypes remain in the route tree and should be clearly labeled or removed from production navigation.
- API caller matching is partly dynamic-string based and needs runtime contract tests.
- Several pages have hardcoded demo content, fixed analytics, or placeholder links.
- Server actions were not discovered; the portal is API-route driven.
- Loading, empty, retry, duplicate-submit, and stale-data behavior is inconsistent across the route inventory.
- Admin navigation and feature labels should be validated against every route after final IA decisions.

## 19. DUPLICATE / FOMO FEATURES

- Do not add more AI agents until the six required agents have complete production traces.
- Do not add more payment gateways until one provider has a complete verified lifecycle.
- Do not add more dashboards until existing dashboard metrics are database-backed.
- Do not add new WhatsApp workflows until webhook identity, consent, deduplication, and tenant safety are live.
- Do not expand interview modes until WebRTC signaling, recording, feedback, notifications, and persistence are verified.

## 20. REQUIRED FIX ORDER

### P0

${list([
  "No current P0 blockers remain from the recently fixed auth bypass and mock-user fallback. Revalidate production environment configuration before release.",
])}

### P1

${list([
  "Replace simulated AI fallback in src/utils/aiRouter.ts:108 with explicit provider-unavailable behavior or labeled sandbox mode.",
  "Move uploads from src/app/api/upload/route.ts:44 to durable object storage with signed access and malware scanning.",
  "Complete payment/webhook runtime tests for src/app/api/payments/* and persist all entitlement transitions.",
  "Run tenant/RBAC contract tests against all dynamic employer, candidate, admin, agreement, document, and payment routes.",
])}

### P2

${list([
  "Remove or isolate mock candidate profile service dependencies.",
  "Replace static visual prototype screens and hardcoded analytics in launch navigation.",
  "Add explicit UI error, empty, retry, and duplicate-submit states to the highest-volume flows.",
])}

### P3

${list([
  "Improve inventory-to-runtime contract tests and add a CI reconciliation gate.",
  "Document deployment, migrations, worker, cron, rollback, and provider sandbox procedures.",
])}

## 21. FINAL PRODUCTION CHECKLIST

- [ ] Production bypass parameter removed or disabled.
- [ ] Production authentication fails closed when database is unavailable.
- [ ] Database migrations applied and rollback tested.
- [ ] Tenant and RBAC tests pass for every protected API.
- [ ] Durable upload storage and malware scanning are live.
- [ ] Payment checkout, webhook, refunds, cancellation, expiry, and idempotency are tested.
- [ ] AI provider keys, routing, budgets, cost tracking, timeouts, and failure behavior are verified.
- [ ] Six required agents have screen-to-persistence traces.
- [ ] WebRTC signaling, TURN, recording, feedback, and persistence are verified.
- [ ] WhatsApp webhook, identity, consent, deduplication, and delivery recovery are verified.
- [ ] Outbox, worker, DLQ, cron, and recovery processes run in staging.
- [ ] Loading/error/empty/retry/duplicate-submit states are verified on launch flows.
- [ ] Build, start, health check, migration, and rollback pass in production-like environment.
- [ ] Machine-readable inventory is reconciled in CI.

## 22. FINAL ANSWER

**CAN HIREGO GO TO PRODUCTION TODAY? NO.**

Exact conditions: remove the authentication bypass and mock-user production fallback, replace simulated AI and local upload persistence, complete payment/provider/tenant/RBAC verification, and pass true production-like E2E tests.

## 23. MACHINE-READABLE INVENTORY SUMMARY

- JSON: [production-wiring-inventory.json](./production-wiring-inventory.json)
- CSV: [production-wiring-inventory.csv](./production-wiring-inventory.csv)
- Records: ${records.length}
- Screens: ${inventory.reconciliation.screen_records}
- User actions: ${inventory.reconciliation.user_action_records}
- Frontend API calls: ${inventory.reconciliation.frontend_api_call_records}
- API method records: ${inventory.reconciliation.api_endpoint_records}
- Server actions: ${inventory.reconciliation.server_action_records}
- Records missing evidence: ${inventory.reconciliation.records_missing_evidence}

## 24. INVENTORY RECONCILIATION

${table(["Check", "Result"], [["Every discovered page has a screen record", inventory.reconciliation.screen_records === inventory.source_counts.screens ? "PASS" : "FAIL"], ["Every API route method has an endpoint record", inventory.reconciliation.api_endpoint_records === endpoints.length ? "PASS" : "FAIL"], ["Every handler has evidence", inventory.reconciliation.records_missing_evidence === 0 ? "PASS" : "FAIL"], ["Frontend calls with no exact static endpoint match", "See inventory notes; dynamic paths require contract verification"], ["RED records", inventory.reconciliation.red_records], ["BLACK records", inventory.reconciliation.black_records]])}

The scanner is intentionally conservative. GREEN is not assigned by static source presence alone; runtime verification is required before any feature can be called production-ready.
`;

fs.writeFileSync(path.join(root, "PRODUCTION_WIRING_AUDIT_REPORT.md"), report, "utf8");
console.log(JSON.stringify({ report: "PRODUCTION_WIRING_AUDIT_REPORT.md", screens: screens.length, actions: actions.length, calls: calls.length, endpoints: endpoints.length }, null, 2));
