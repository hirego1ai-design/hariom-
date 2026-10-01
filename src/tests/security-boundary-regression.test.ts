import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { safeInternalRedirect } from "../lib/clientRedirect";

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


test("candidate post-auth redirects are internal-only and preserve selected jobs", () => {
  assert.equal(
    safeInternalRedirect("/jobs/c6c03ab1-bdfb-42e5-ac0c-50397579b4fa?from=search#apply"),
    "/jobs/c6c03ab1-bdfb-42e5-ac0c-50397579b4fa?from=search#apply",
  );
  for (const unsafe of [
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example",
    "/internal/..//evil.example/phish",
    "/internal/%2e%2e//evil.example/phish",
    "/jobs/%2F%2Fevil.example/phish",
    "/jobs/%5C%5Cevil.example/phish",
    "javascript:alert(1)",
    "",
  ]) {
    assert.equal(safeInternalRedirect(unsafe, "/dashboard"), "/dashboard");
  }

  const jobs = read("src/app/jobs/JobsClient.tsx");
  const login = read("src/app/login/page.tsx");
  const register = read("src/app/register/page.tsx");
  const onboardingComplete = read("src/app/onboarding/complete/page.tsx");

  assert.match(jobs, /\/login\?redirect=/);
  assert.match(jobs, /\/register\?redirect=/);
  assert.match(login, /safeInternalRedirect/);
  assert.match(login, /router\.replace\(requestedRedirect\)/);
  assert.match(register, /POST_AUTH_REDIRECT_STORAGE_KEY/);
  assert.doesNotMatch(register, /USR-\$\{Date\.now\(\)\}/);
  assert.doesNotMatch(register, /syncCandidateRegistrationData/);
  assert.doesNotMatch(register, /Phone Number/);
  assert.doesNotMatch(register, /Date of Birth/);
  assert.match(onboardingComplete, /Continue to selected job/);
});


test("public job Apply actions cannot bypass configured screening questions", () => {
  const jobs = read("src/app/jobs/JobsClient.tsx");
  const jobDetail = read("src/app/jobs/[id]/page.tsx");
  const applyFlow = read("src/app/jobs/[id]/apply/page.tsx");
  const applicationRoute = read("src/app/api/applications/route.ts");

  // Listing/detail surfaces may read application state, but they must never
  // submit an application directly. All writes go through the dedicated
  // screening-aware apply route.
  assert.doesNotMatch(jobs, /fetch\("\/api\/applications"[\s\S]{0,250}method:\s*"POST"/);
  assert.doesNotMatch(jobDetail, /fetch\("\/api\/applications"[\s\S]{0,250}method:\s*"POST"/);
  assert.match(jobs, /\/jobs\/\$\{job\.id\}\/apply/);
  assert.match(jobDetail, /\/jobs\/\$\{jobId\}\/apply/);
  assert.match(applyFlow, /fetch\("\/api\/applications"/);
  assert.match(applyFlow, /method:\s*"POST"/);
  assert.match(applyFlow, /screeningQuestions/);
  assert.match(applyFlow, /screeningAnswers/);
  assert.match(applicationRoute, /Complete all screening questions before applying/);
  assert.match(applicationRoute, /screening answers do not belong to this job/);
  assert.match(applicationRoute, /Screening answers are already locked for this application/);
  assert.match(applicationRoute, /SELECT id FROM "Application" WHERE id = \${applicationId} FOR UPDATE/);
});


test("live interview proctoring evidence requires current consent and configured signals", () => {
  const consent = read("src/app/api/proctoring/consent/route.ts");
  const telemetry = read("src/app/api/proctoring/telemetry/route.ts");
  const room = read("src/app/api/interviews/room/route.ts");
  const helper = read("src/lib/proctoringConsent.ts");

  assert.match(consent, /hasCurrentLiveProctoringConsent/);
  assert.match(consent, /enqueueSecurityAuditEvent/);
  assert.match(helper, /LIVE_INTERVIEW_PROCTORING_CONSENT/);
  assert.match(helper, /policyVersion/);

  assert.match(room, /Review and accept the current interview monitoring disclosure before entering/);
  assert.match(room, /hasCurrentLiveProctoringConsent/);

  assert.match(telemetry, /Current interview monitoring consent is required/);
  assert.match(telemetry, /Live interview browser monitoring is not enabled/);
  assert.match(telemetry, /This browser observation is not enabled by the current monitoring policy/);
  assert.match(telemetry, /policy\.trackTabSwitch/);
  assert.match(telemetry, /policy\.trackClipboard/);
  assert.match(telemetry, /policy\.trackContextMenu/);
  assert.match(telemetry, /enqueueSecurityAuditEvent/);
  assert.match(telemetry, /companyId: interview\.application\.job\.companyId/);
  assert.match(telemetry, /interview\.status !== "LIVE"/);
  assert.match(telemetry, /!interview\.startedAt/);
  assert.match(telemetry, /policyVersion: policy\.policyVersion/);
  assert.match(telemetry, /const interviewStartedAtIso = interview\.startedAt\.toISOString\(\)/);
  assert.match(telemetry, /interviewStartedAt: interviewStartedAtIso/);
});


test("WebRTC signaling is targeted and does not expose unrelated SDP/ICE payloads", () => {
  const room = read("src/app/api/interviews/room/route.ts");
  assert.match(room, /A target participant is required for signaling/);
  assert.match(room, /OFFER action requires offer SDP/);
  assert.match(room, /ANSWER action requires answer SDP/);
  assert.match(room, /payload\.targetId === session\.id/);
  assert.match(room, /visibleSignals\.filter\(\(signal\) => signal\.type === "OFFER"\)/);
  assert.match(room, /visibleSignals\.filter\(\(signal\) => signal\.type === "ANSWER"\)/);
  assert.match(room, /visibleSignals\.filter\(\(signal\) => signal\.type === "ICE_CANDIDATE"\)/);
});


test("live interview state is synchronized with round progress and blocks unsafe reschedule", () => {
  const room = read("src/app/api/interviews/room/route.ts");
  const interviewChange = read("src/app/api/employer/interviews/[id]/route.ts");
  const applications = read("src/app/api/applications/route.ts");

  assert.match(room, /tx\.interviewRoundProgress\.updateMany/);
  assert.match(room, /data: \{ status: "LIVE", startedAt \}/);
  assert.match(room, /Interview round is no longer eligible to start/);
  assert.match(applications, /status: "LIVE"/);
  assert.match(interviewChange, /A live interview cannot be rescheduled/);
});


test("final interview decisions terminate their consequential approval workflows", () => {
  const source = read("src/app/api/employer/interviews/[id]/round-decision/route.ts");

  assert.match(source, /currentStep: "CANDIDATE_SELECTED"/);
  assert.match(source, /currentStep: "CANDIDATE_REJECTED"/);
  assert.match(source, /status: "COMPLETED"/);
  assert.match(source, /Candidate-selection workflow did not reach a terminal state/);
  assert.match(source, /Candidate-rejection workflow did not reach a terminal state/);
  assert.match(source, /Candidate rejection was already completed/);
});

test("accepted offer orchestration distinguishes direct hire from managed hiring", () => {
  const source = read("src/lib/workflows/ManagedHiringOrchestrator.ts");

  assert.match(source, /application\.job\.managedAgreementId \|\| application\.job\.managedRequirementId/);
  assert.match(source, /managed-hiring placement can proceed to billing/);
  assert.match(source, /complete the direct-hire workflow/);
  assert.doesNotMatch(
    source,
    /Actual joining must be confirmed before PPH billing can proceed/,
  );
});


test("live interview signaling obeys scheduled grace windows and completion is serialized", () => {
  const room = read("src/app/api/interviews/room/route.ts");

  assert.match(room, /INTERVIEW_EARLY_START_GRACE_MS = 15 \* 60 \* 1_000/);
  assert.match(room, /INTERVIEW_LATE_START_GRACE_MS = 2 \* 60 \* 60 \* 1_000/);
  assert.match(room, /scheduled interview start window has passed/);
  assert.match(room, /if \(session\.role !== "CANDIDATE"\) \{/);
  assert.match(room, /action: "INTERVIEW_STARTED"/);
  assert.ok(
    (room.match(/enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/g) || []).length >= 2,
    "Interview start and completion must both enqueue durable security evidence.",
  );
  assert.match(room, /lifecycleStatus: interview\.status/);
  assert.match(room, /SELECT id FROM "Interview" WHERE id = \$\{interview\.id\} FOR UPDATE/);
  assert.match(room, /where: \{ id: interview\.id, status: "LIVE", completedAt: null \}/);
  assert.match(room, /action: "INTERVIEW_COMPLETED"/);
  assert.match(room, /Only a live interview can be completed/);
  assert.match(room, /SIGNALING_OPEN_STATUSES = \["SCHEDULED", "RESCHEDULED", "LIVE"\]/);
  assert.match(room, /COMPLETED_ROOM_STATUSES = \["COMPLETED", "FEEDBACK_SUBMITTED"\]/);
  assert.match(room, /Interview room is closed/);
  assert.match(room, /idempotent: true/);
});

test("candidate login does not advertise an unimplemented persistent session", () => {
  const login = read("src/app/login/page.tsx");
  assert.doesNotMatch(login, /Keep me signed in/);
});


test("candidate rejection serializes against offer send and acceptance", () => {
  const source = read("src/app/api/employer/candidates/[id]/decision/route.ts");

  assert.match(source, /SELECT id FROM "Offer" WHERE "applicationId" = \${applicationId} FOR UPDATE/);
  assert.match(source, /status: \{ in: \["DRAFT", "SENT", "ACCEPTED"\] \}/);
  assert.match(source, /already accepted an offer/);
  assert.match(source, /sent offer is awaiting the candidate response/);
  assert.match(source, /status: "WITHDRAWN", withdrawnAt/);
  assert.match(source, /revocationReason:/);
  assert.match(source, /currentStep: "APPLICATION_REJECTED"/);
  assert.match(source, /consumeApprovedActionInTransaction/);
  assert.match(source, /invalidatedDraftOfferIds/);
  assert.match(source, /workflowId: workflow\.id/);
  assert.match(source, /approvalId: approval\.id/);
  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
});


test("proctoring telemetry retries are bounded and truthfully labeled", () => {
  const engine = read("src/components/proctoring/ProctoringEngine.tsx");

  assert.match(engine, /MAX_PENDING_EVENTS = 20/);
  assert.match(engine, /MAX_DELIVERY_ATTEMPTS = 3/);
  assert.match(engine, /MAX_PENDING_AGE_MS = 15 \* 60 \* 1000/);
  assert.match(engine, /window\.sessionStorage\.setItem/);
  assert.match(engine, /window\.addEventListener\("online", onOnline\)/);
  assert.match(engine, /document\.addEventListener\("visibilitychange", onVisible\)/);
  assert.match(engine, /clientEventId: item\.id/);
  assert.match(engine, /sendTelemetry\(\{ id, violationType \}\)/);
  assert.match(engine, /response\.status === 429 \|\| response\.status >= 500/);
  assert.match(engine, /not recorded server-side/);
  assert.match(engine, /deliveryStatus === "PENDING"/);
  assert.match(engine, /"not recorded"/);
});


test("interview scheduling cannot bypass screening", () => {
  const schedule = read("src/app/api/employer/interviews/schedule/route.ts");

  assert.match(schedule, /status: \{ in: \["SCREENING", "AI_INTERVIEW"\] \}/);
  assert.match(schedule, /!\["SCREENING", "AI_INTERVIEW"\]\.includes\(application\.status\)/);
  assert.match(schedule, /!\["SCREENING", "AI_INTERVIEW"\]\.includes\(lockedApplication\.status\)/);
  assert.match(schedule, /enter Screening first/);
  assert.match(schedule, /APPLICATION_NOT_SCHEDULABLE/);
});


test("candidate offer response uses canonical application-to-offer locking", () => {
  const source = read("src/app/api/candidate/offers/[id]/route.ts");

  assert.match(source, /SELECT id FROM "Application" WHERE id = \${ownedOffer\.applicationId} FOR UPDATE/);
  assert.match(source, /SELECT id FROM "Offer" WHERE id = \${id} FOR UPDATE/);
  assert.ok(
    source.indexOf('SELECT id FROM "Application"') <
      source.indexOf('SELECT id FROM "Offer"'),
    "Application must be locked before Offer to match the canonical lifecycle lock order.",
  );
  assert.match(source, /current\.application\.status !== "SHORTLISTED"/);
  assert.match(source, /Offer response requires a shortlisted application/);
});


test("generic employer rejection cannot bypass interview or offer workflows", () => {
  const source = read("src/app/api/employer/candidates/[id]/decision/route.ts");

  assert.match(source, /!\["APPLIED", "SCREENING"\]\.includes\(application\.status\)/);
  assert.match(source, /limited to pre-interview screening/);
  assert.match(source, /!\["APPLIED", "SCREENING"\]\.includes\(lockedApplication\.status\)/);
  assert.match(source, /advanced beyond screening before rejection was executed/);
});

test("candidate withdrawal cancels future rounds and stale consequential workflows", () => {
  const source = read("src/app/api/applications/route.ts");

  assert.match(source, /status: \{ in: \["PENDING", "SCHEDULED", "ON_HOLD"\] \}/);
  assert.match(source, /status: \{ in: \["PENDING", "RUNNING", "PAUSED_FOR_APPROVAL", "FAILED"\] \}/);
  assert.match(source, /revocationReason: "Candidate withdrew the application\."/);
  assert.match(source, /currentStep: "APPLICATION_WITHDRAWN"/);
  assert.match(source, /cancelledWorkflowCount: activeWorkflows\.length/);
});


test("interview round decisions serialize with application withdrawal", () => {
  const source = read("src/app/api/employer/interviews/[id]/round-decision/route.ts");

  assert.match(source, /interview\.application\.status !== "AI_INTERVIEW"/);
  assert.match(source, /SELECT id FROM "Application" WHERE id = \${interview\.applicationId} FOR UPDATE/);
  assert.match(source, /lockedApplication\.status !== "AI_INTERVIEW"/);
  assert.ok(
    source.indexOf('SELECT id FROM "Application"') <
      source.indexOf('SELECT id FROM "InterviewRoundProgress"'),
    "Application must be locked before round progress to match withdrawal lifecycle locking.",
  );
});


test("proctoring retries use durable event identity and atomic evidence persistence", () => {
  const telemetry = read("src/app/api/proctoring/telemetry/route.ts");
  const prismaSchema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260930154500_proctoring_client_event_id/migration.sql");

  assert.match(telemetry, /clientEventId: z\.string\(\)\.uuid/);
  assert.match(telemetry, /clientEventId: body\.clientEventId/);
  assert.match(telemetry, /recorded = await prisma\.\$transaction/);
  assert.match(telemetry, /telemetryEventId: event\.id/);
  assert.match(telemetry, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.match(telemetry, /error\.code === "P2002"/);
  assert.match(telemetry, /duplicate: true/);
  assert.match(prismaSchema, /clientEventId String\?/);
  assert.match(prismaSchema, /@@unique\(\[interviewId, candidateId, clientEventId\]\)/);
  assert.match(migration, /ProctoringTelemetry_interviewId_candidateId_clientEventId_key/);
});


test("room start cannot race candidate withdrawal or leak reservations", () => {
  const room = read("src/app/api/interviews/room/route.ts");

  assert.match(room, /interview\.application\.status !== "AI_INTERVIEW"/);
  assert.match(room, /SELECT id FROM "Application" WHERE id = \${interview\.applicationId} FOR UPDATE/);
  assert.match(room, /lockedApplication\.status !== "AI_INTERVIEW"/);
  assert.match(room, /SELECT id FROM "Interview" WHERE id = \${interview\.id} FOR UPDATE/);
  assert.match(room, /Interview start state changed concurrently/);
  assert.match(room, /proctoringReservationId/);
  assert.match(room, /releaseCopilotReservation\(proctoringReservationId\)/);
  assert.match(room, /releaseCopilotReservation\(videoReservationId\)/);
  assert.ok(
    room.indexOf('SELECT id FROM "Application"') <
      room.indexOf('SELECT id FROM "Interview"'),
    "Room lifecycle must lock Application before Interview.",
  );
});

test("interview feedback cannot advance a withdrawn application", () => {
  const feedback = read("src/app/api/employer/interviews/[id]/feedback/route.ts");

  assert.match(feedback, /interview\.application\.status !== "AI_INTERVIEW"/);
  assert.match(feedback, /SELECT id FROM "Application" WHERE id = \${interview\.applicationId} FOR UPDATE/);
  assert.match(feedback, /lockedApplication\.status !== "AI_INTERVIEW"/);
  assert.match(feedback, /Interview state changed before feedback could be finalized/);
  assert.ok(
    feedback.indexOf('SELECT id FROM "Application"') <
      feedback.indexOf('SELECT id FROM "Interview"'),
    "Feedback finalization must lock Application before Interview.",
  );
});


test("interview cancel cannot overwrite a concurrent completion", () => {
  const source = read("src/app/api/employer/interviews/[id]/route.ts");

  assert.match(source, /SELECT id FROM "Application" WHERE id = \${interview\.applicationId} FOR UPDATE/);
  assert.match(source, /lockedApplication\.status !== "AI_INTERVIEW"/);
  assert.match(source, /SELECT id FROM "Interview" WHERE id = \${interview\.id} FOR UPDATE/);
  assert.match(source, /Interview completed before this change could be saved/);
  assert.match(source, /status: \{ in: \["PENDING", "SCHEDULED", "LIVE", "ON_HOLD"\] \}/);
  assert.match(source, /Interview round state changed before cancellation could be saved/);
  assert.ok(
    source.indexOf('SELECT id FROM "Application"') <
      source.indexOf('SELECT id FROM "Interview"'),
    "Interview changes must lock Application before Interview.",
  );
});


test("released Copilot reservations can be safely reacquired on retry", () => {
  const capacity = read("src/lib/copilot/capacity.ts");

  assert.match(capacity, /existing\.status === "CONSUMED"/);
  assert.match(capacity, /existing\.status === "RESERVED" && existing\.expiresAt > now/);
  assert.match(capacity, /currentExisting = await tx\.copilotUsageReservation\.findUnique/);
  assert.match(capacity, /status: \{ in: \["RELEASED", "EXPIRED"\] \}/);
  assert.match(capacity, /Copilot reservation state changed while retrying the operation/);
});

test("live interview cancellation reconciles reserved Copilot usage", () => {
  const source = read("src/app/api/employer/interviews/[id]/route.ts");

  assert.match(source, /body\.action === "CANCEL" && updated\.startedAt/);
  assert.match(source, /updated\.startedAt\.getTime\(\)/);
  assert.match(source, /actualMinutes/);
  assert.match(source, /live-interview:\$\{interview\.id\}:video/);
  assert.match(source, /live-interview:\$\{interview\.id\}:proctoring/);
  assert.match(source, /reconcileCopilotReservation/);
  assert.match(source, /lifecycleOutcome: "INTERVIEW_CANCELLED"/);
});

test("job-specific assessment start is serialized with application gate state", () => {
  const source = read("src/app/api/assessment/mcq/start/route.ts");

  assert.match(source, /application\.status !== "ASSESSMENT"/);
  assert.match(source, /Job-specific assessment can be started only while the application is in ASSESSMENT/);
  assert.match(source, /SELECT id FROM "Application" WHERE id = \${jobAssessmentContext\.applicationId} FOR UPDATE/);
  assert.match(source, /SELECT id FROM "ApplicationGate" WHERE id = \${jobAssessmentContext\.gateId} FOR UPDATE/);
  assert.match(source, /lockedApplication\.status !== "ASSESSMENT"/);
  assert.match(source, /lockedGate\.assessmentId !== assessment\.id/);
  assert.match(source, /data: \{ status: ApplicationGateStatus\.IN_PROGRESS \}/);
  assert.ok(
    source.indexOf('SELECT id FROM "Application"') <
      source.indexOf('SELECT id FROM "ApplicationGate"'),
    "Job-specific assessment start must lock Application before Gate.",
  );
});


test("candidate withdrawal cancels open assessment gates", () => {
  const source = read("src/app/api/applications/route.ts");

  assert.match(source, /cancelledAssessmentGates = await tx\.applicationGate\.updateMany/);
  assert.match(source, /ApplicationGateStatus\.REQUIRED/);
  assert.match(source, /ApplicationGateStatus\.IN_PROGRESS/);
  assert.match(source, /status: ApplicationGateStatus\.CANCELLED/);
  assert.match(source, /cancelledAssessmentGateCount: cancelledAssessmentGates\.count/);
});


test("job-specific assessment completion serializes with withdrawal", () => {
  const source = read("src/app/api/assessment/mcq/submit/route.ts");

  assert.match(source, /SELECT id FROM "Application" WHERE id = \${gate\.applicationId} FOR UPDATE/);
  assert.match(source, /lockedApplication\.status !== "ASSESSMENT"/);
  assert.match(source, /SELECT id FROM "ApplicationGate" WHERE id = \${gate\.id} FOR UPDATE/);
  assert.match(source, /lockedGate\.assessmentId !== assessment\.id/);
  assert.match(source, /data: \{ status: "SCREENING" \}/);
  assert.ok(
    source.indexOf('SELECT id FROM "Application"') <
      source.indexOf('SELECT id FROM "ApplicationGate"'),
    "Assessment completion must lock Application before Gate.",
  );
});

test("candidate interview list is ownership scoped and entry-window safe", () => {
  const api = read("src/app/api/interviews/route.ts");
  const page = read("src/app/interviews/page.tsx");

  assert.match(api, /session\.role !== "CANDIDATE"/);
  assert.match(api, /application: \{ candidateProfileId: candidateProfile\.id \}/);
  assert.match(api, /status: \{ in: \["SCHEDULED", "RESCHEDULED", "LIVE"\] \}/);
  assert.match(api, /INTERVIEW_EARLY_START_GRACE_MS = 15 \* 60 \* 1_000/);
  assert.match(api, /INTERVIEW_LATE_START_GRACE_MS = 2 \* 60 \* 60 \* 1_000/);
  assert.match(api, /roomId: Boolean\(roomId\) && availability\.canEnterRoom \? roomId : null/);
  assert.match(page, /fetch\("\/api\/interviews"/);
  assert.match(page, /interview\.canEnterRoom/);
  assert.match(page, /interview\.mode === "OFFLINE"/);
  assert.match(page, /interview\.mode === "PHONE"/);
});


test("interview room read access obeys the scheduled entry window", () => {
  const room = read("src/app/api/interviews/room/route.ts");

  assert.match(room, /!interview\.startedAt/);
  assert.match(room, /\["SCHEDULED", "RESCHEDULED"\]\.includes\(interview\.status\)/);
  assert.match(room, /Interview room opens 15 minutes before the scheduled start time/);
  assert.match(room, /scheduled interview start window has passed/);
  assert.ok(
    room.indexOf("Interview room opens 15 minutes before") <
      room.indexOf("await prisma.interviewSignal.deleteMany"),
    "Room timing gate must run before signals or ICE configuration are returned.",
  );
});


test("screening candidates have a dedicated interview scheduling action", () => {
  const pipeline = read("src/app/employer/hiring-pipeline/page.tsx");

  assert.match(pipeline, /c\.stage === "Screening"/);
  assert.match(pipeline, /candidate\.stage === "Screening"/);
  assert.match(pipeline, /\/employer\/interview-scheduler\?applicationId=/);
  assert.match(pipeline, /Schedule interview/);
});

test("shortlisted candidates have a dedicated offer creation action", () => {
  const pipeline = read("src/app/employer/hiring-pipeline/page.tsx");

  assert.match(pipeline, /c\.stage === "Shortlisted"/);
  assert.match(pipeline, /candidate\.stage === "Shortlisted"/);
  assert.match(pipeline, /\/employer\/offer-letter-create-and-send\?applicationId=/);
  assert.match(pipeline, /Create offer/);
});


test("candidate offer responses create durable audit evidence and employer notification", () => {
  const source = read("src/app/api/candidate/offers/[id]/route.ts");

  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.match(source, /response: body\.action/);
  assert.match(source, /respondedAt: now\.toISOString\(\)/);
  assert.match(source, /title: body\.action === "ACCEPT" \? "Offer accepted" : "Offer declined"/);
  assert.match(source, /current\.createdById/);
});


test("candidate offer list hides inaccessible private documents", () => {
  const source = read("src/app/api/candidate/offers/route.ts");

  assert.match(source, /candidateVisibleOffers = offers\.map/);
  assert.match(source, /\["SENT", "ACCEPTED"\]\.includes\(offer\.status\)/);
  assert.match(source, /offer\.documentFile\?\.scanStatus === "CLEAN"/);
  assert.match(source, /documentFile:/);
});


test("PPH joining UI is bound to candidate-accepted compensation", () => {
  const api = read("src/app/api/employer/managed-hiring/join/route.ts");
  const billing = read("src/lib/pph-billing.ts");
  const page = read("src/app/employer/managed-hiring/join/page.tsx");

  assert.match(api, /offers: \{/);
  assert.match(api, /where: \{ status: "ACCEPTED" \}/);
  assert.match(api, /acceptedOffer/);
  assert.match(billing, /if \(!acceptedOffer\.compensationAmount\)/);
  assert.match(billing, /requires compensation to be stated in the candidate-accepted offer/);
  assert.match(page, /serverAcceptedOffer\?\.compensationAmount \|\| ""/);
  assert.match(page, /readOnly=\{applicationScoped\}/);
  assert.match(page, /PPH joining requires an accepted INR offer with a stated compensation amount/);
  assert.match(page, /disabled=\{saving \|\| !accepted \|\| !acceptedOfferReady\}/);
});


test("offer send and withdrawal commit with durable audit evidence", () => {
  const source = read("src/app/api/employer/offers/[id]/route.ts");

  assert.match(source, /action: "OFFER_SENT"/);
  assert.match(source, /action: "OFFER_WITHDRAWN"/);
  assert.match(source, /approvalId: approval\.id/);
  assert.match(source, /withdrawnAt: withdrawnAt\.toISOString\(\)/);
  assert.ok((source.match(/enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/g) || []).length >= 2);
  assert.doesNotMatch(source, /await logAuditEvent\(/);
});


test("PPH placement controls commit with durable audit evidence", () => {
  const route = read("src/app/api/employer/managed-hiring/join/route.ts");

  assert.match(route, /action: `PPH_PLACEMENT_\${body\.action}`/);
  assert.match(route, /previousStatus: row\.status/);
  assert.match(route, /nextStatus: updated\.status/);
  assert.match(route, /enqueueSecurityAuditEvent\(tx, auditLog, actor\.id\)/);
  assert.doesNotMatch(route, /PPH_JOINING_RECORDED/);
  assert.doesNotMatch(route, /await logAuditEvent\(/);
});

test("Copilot interview scheduling retries reconcile durable reservations", () => {
  const source = read("src/app/api/employer/interviews/schedule/route.ts");

  assert.match(source, /let schedulePersisted = false/);
  assert.match(source, /if \(body\.copilotManaged\) \{/);
  assert.match(source, /idempotencyKey: `copilot-schedule:\${scheduleRequestDigest}`/);
  assert.doesNotMatch(source, /copilot-schedule:\${crypto\.createHash\("sha256"\)\.update\(requestIdempotencyKey\)/);
  assert.doesNotMatch(source, /body\.copilotManaged && !idempotentExistingInterview/);
  assert.match(source, /idempotentExistingInterview = existingInterview;\s+schedulePersisted = true/);
  assert.match(source, /schedulePersisted = true;\s+\n?\s*if \(copilotSchedulingReservationId\)/);
  assert.match(source, /copilotSchedulingReservationId && !schedulePersisted/);
  assert.match(source, /reconcileCopilotReservation/);
});


test("interview scheduling commits audit evidence with schedule state", () => {
  const source = read("src/app/api/employer/interviews/schedule/route.ts");

  assert.match(source, /action: "INTERVIEW_SCHEDULED"/);
  assert.match(source, /scheduleRequestDigest/);
  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.doesNotMatch(source, /await logAuditEvent\(/);
  assert.ok(
    source.indexOf("const created = await tx.interview.create") <
      source.indexOf('action: "INTERVIEW_SCHEDULED"'),
    "Schedule audit must be created inside the same transaction after interview creation.",
  );
});


test("interview cancel and reschedule commit audit evidence atomically", () => {
  const source = read("src/app/api/employer/interviews/[id]/route.ts");

  assert.match(source, /return \{ interview: row, changed: false \}/);
  assert.match(source, /if \(!changeResult\.changed\)/);
  assert.match(source, /idempotent: true/);
  assert.match(source, /action: body\.action === "CANCEL" \? "INTERVIEW_CANCELLED" : "INTERVIEW_RESCHEDULED"/);
  assert.match(source, /previousStatus: lockedInterview\.status/);
  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.doesNotMatch(source, /await logAuditEvent\(/);
});


test("round decisions commit human-approved state with durable audit evidence", () => {
  const source = read("src/app/api/employer/interviews/[id]/round-decision/route.ts");

  assert.match(source, /persistDecisionAudit/);
  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.match(source, /await persistDecisionAudit\("HOLD"\)/);
  assert.match(source, /await persistDecisionAudit\("REJECT"\)/);
  assert.match(source, /await persistDecisionAudit\("FINAL_ROUND_COMPLETE"\)/);
  assert.match(source, /await persistDecisionAudit\("PROCEED", nextRound\.name\)/);
  assert.match(source, /lockedProgress\.status === "ON_HOLD"/);
  assert.doesNotMatch(source, /await logAuditEvent\(/);
});


test("feedback finalization commits immutable evidence with audit outbox", () => {
  const source = read("src/app/api/employer/interviews/[id]/feedback/route.ts");

  assert.match(source, /action: "INTERVIEW_FEEDBACK_FINALIZED"/);
  assert.match(source, /feedbackId: feedback\.id/);
  assert.match(source, /recommendation: body\.recommendation/);
  assert.match(source, /roundComplete: complete/);
  assert.match(source, /enqueueSecurityAuditEvent\(tx, auditLog, session\.id\)/);
  assert.doesNotMatch(source, /await logAuditEvent\(/);
});


test("candidate proctoring starts only after interviewer-owned live transition", () => {
  const page = read("src/app/interviews/room/[roomId]/page.tsx");
  const room = read("src/components/interview/WebRTCInterviewRoom.tsx");

  assert.match(page, /lifecycleStatus === "LIVE"/);
  assert.match(page, /Browser monitoring begins only after an assigned interviewer starts the live interview/);
  assert.match(page, /onLifecycleStatusChange=\{setLifecycleStatus\}/);
  assert.match(room, /lifecycleStatus: string/);
  assert.match(room, /onLifecycleStatusChange\?\.\(room\.lifecycleStatus\)/);
  assert.match(room, /onLifecycleStatusChange\?\.\(latest\.lifecycleStatus\)/);
});


test("PPH billing worker financial transitions emit durable security evidence", () => {
  const source = read("src/lib/pph-billing.ts");

  assert.match(source, /action: "PPH_BILLING_HELD"/);
  assert.match(source, /action: "PPH_INVOICE_CREATED"/);
  assert.match(source, /resource: `Invoice:\${invoice\.id}`/);
  assert.match(source, /invoiceNumber: invoice\.invoiceNumber/);
  assert.match(source, /totalAmount: invoice\.totalAmount\.toString\(\)/);
  assert.ok(
    (source.match(/enqueueSecurityAuditEvent\(tx, auditLog\)/g) || []).length >= 3,
    "Managed joining and both billing terminal paths must enqueue security evidence.",
  );
});


test("approved hiring outcomes notify only through decision-bound communication", () => {
  const round = read("src/app/api/employer/interviews/[id]/round-decision/route.ts");
  const screening = read("src/app/api/employer/candidates/[id]/decision/route.ts");

  assert.match(round, /dispatchDecisionCommunication/);
  assert.match(round, /eventKey: "CANDIDATE_SELECTED"/);
  assert.match(round, /eventKey: "APPLICATION_REJECTED"/);
  assert.match(round, /approvalId: selectionAuthorization\.approvalId/);
  assert.match(round, /approvalId: rejectionAuthorization\.approvalId/);
  assert.match(screening, /dispatchDecisionCommunication/);
  assert.match(screening, /eventKey: "APPLICATION_REJECTED"/);
  assert.match(screening, /approvedByUserId: approval\.decidedBy/);
  assert.match(screening, /recipientRef: candidate\.id/);
});
