import fs from "node:fs";
import assert from "node:assert/strict";
import {
  communicationEventDefinition,
  extractTemplateVariables,
  validateTemplateVariables,
} from "../lib/communications/catalog";

function test(name: string, fn: () => void) {
  try { fn(); console.log(`PASS communication: ${name}`); }
  catch (error) { console.error(`FAIL communication: ${name}`); throw error; }
}

test("interview event permits intended participants over email and WhatsApp", () => {
  const event = communicationEventDefinition("INTERVIEW_SCHEDULED");
  assert.deepEqual(event.audiences, ["CANDIDATE", "EMPLOYER", "RECRUITER"]);
  assert(event.channels.includes("EMAIL"));
  assert(event.channels.includes("WHATSAPP"));
});

test("template parser extracts unique merge variables", () => {
  assert.deepEqual(extractTemplateVariables("Hi {{candidate_name}} {{candidate_name}}, {{job_title}}"), ["candidate_name", "job_title"]);
});

test("approved event variables pass", () => {
  const result = validateTemplateVariables("INTERVIEW_SCHEDULED", "Interview with {{company_name}}", "{{candidate_name}} for {{job_title}} on {{interview_date}} at {{interview_time}} {{timezone}} via {{interview_mode}}: {{interview_link}}");
  assert.equal(result.valid, true);
  assert.deepEqual(result.unknown, []);
});

test("unknown variables fail closed", () => {
  const result = validateTemplateVariables("INTERVIEW_SCHEDULED", undefined, "{{candidate_name}} {{company_name}} {{job_title}} {{interview_date}} {{interview_time}} {{timezone}} {{interview_mode}} {{interview_link}} {{secret_token}}");
  assert.equal(result.valid, false);
  assert.deepEqual(result.unknown, ["secret_token"]);
});

test("missing required variables fail closed", () => {
  const result = validateTemplateVariables("JOB_OPPORTUNITY", "Hi {{candidate_name}}", "{{job_title}}");
  assert.equal(result.valid, false);
  assert.deepEqual(result.unknown, []);
  assert(result.missing.includes("company_name"));
  assert(result.missing.includes("location"));
  assert(result.missing.includes("job_link"));
});

test("agreement and invoice actions remain consequential", () => {
  assert.equal(communicationEventDefinition("AGREEMENT_APPROVAL_REQUESTED").consequential, true);
  assert.equal(communicationEventDefinition("INVOICE_GENERATED").consequential, true);
});

test("candidate rejection is consequential", () => {
  assert.equal(communicationEventDefinition("APPLICATION_REJECTED").consequential, true);
});


test("next interview round has a dedicated non-shortlist event", () => {
  const event = communicationEventDefinition("INTERVIEW_NEXT_ROUND");
  assert.deepEqual(event.audiences, ["CANDIDATE"]);
  assert(event.channels.includes("EMAIL"));
  assert(event.channels.includes("WHATSAPP"));
  assert(event.variables.includes("next_round"));
  assert.equal(event.consequential, undefined);
});

test("candidate selection and rejection remain consequential", () => {
  assert.equal(communicationEventDefinition("CANDIDATE_SELECTED").consequential, true);
  assert.equal(communicationEventDefinition("APPLICATION_REJECTED").consequential, true);
});


test("dispatcher cannot expose a public consequential test bypass", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(!source.includes("testMode?: boolean"));
  assert(source.includes("workflowId: string"));
  assert(source.includes("assertPersistedCommunicationAuthorization(input.authorizationProof, input.eventKey)"));
  assert(source.includes("AGENT_APPROVAL_CONSUMED"));
});





test("consumed hiring approvals authorize only exact candidate outcome communication", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");

  assert(source.includes("assertConsumedDecisionCommunicationAuthorization"));
  assert(source.includes('input.eventKey !== "CANDIDATE_SELECTED"'));
  assert(source.includes('input.eventKey !== "APPLICATION_REJECTED"'));
  assert(source.includes('workflow.status !== "COMPLETED"'));
  assert(source.includes('["CANDIDATE_REJECTED", "SCREENING_REJECTION_EXECUTED"]'));
  assert(source.includes('input.eventKey === "CANDIDATE_SELECTED" ? "SHORTLISTED" : "REJECTED"'));
  assert(source.includes("input.recipientRef !== candidateUser.id"));
  assert(source.includes("Decision communication address does not match the approved candidate."));
  assert(source.includes("export async function dispatchDecisionCommunication"));
});

test("consequential communication idempotent replay does not require a second approval", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");

  const existingLookup = source.indexOf("const existing = await prisma.communicationDelivery.findUnique");
  const approvalValidation = source.indexOf("await assertPersistedCommunicationAuthorization");
  assert(existingLookup >= 0);
  assert(approvalValidation >= 0);
  assert(existingLookup < approvalValidation);
  assert(source.includes("Communication idempotency key is already bound to a different delivery."));
  assert(source.includes("existing.recipientAddressHash === recipientAddressHash"));
  assert(source.includes("(existing.correlationId ?? null) === (input.correlationId ?? null)"));
});



test("consequential approval consumption and delivery persistence are atomic", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");

  const transactionStart = source.indexOf("consequentialApprovalId && input.authorizationProof");
  const consume = source.indexOf("const consumed = await tx.workflowApproval.updateMany", transactionStart);
  const deliveryCreate = source.indexOf("return tx.communicationDelivery.create({ data: deliveryData })", transactionStart);
  assert(transactionStart >= 0);
  assert(consume > transactionStart);
  assert(deliveryCreate > consume);
  assert(source.includes("const deliveryData = {"));
});



test("concurrent communication idempotency races reuse the winning delivery", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");

  assert(source.includes("const resolveExistingDelivery = async () =>"));
  assert(source.includes("const racedDelivery = await resolveExistingDelivery()"));
  assert(source.includes("Never issue a second provider call"));
  assert(source.includes("return racedDelivery"));
  assert(source.includes("Communication idempotency key is already bound to a different delivery."));
  assert(
    source.indexOf("const racedDelivery = await resolveExistingDelivery()") <
      source.indexOf("providerAttempted = true"),
  );
});

test("consequential deliveries are never marked automatically retryable", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(source.includes("!definition.consequential"));
  assert(source.includes("failure.retryable"));
  assert(source.includes("definition.consequential)"));
  assert(source.includes("RETRY_NOT_ALLOWED"));
  assert(source.includes('"AMBIGUOUS_PROVIDER_ERROR"'));
  assert(source.includes('lastErrorCode: retryable ? failure.code : "AMBIGUOUS_PROVIDER_ERROR"'));
});


test("communication retry Prisma fields remain in schema", () => {
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  assert(/\bnextAttemptAt\s+DateTime\?/.test(schema));
  assert(/\bmaxAttempts\s+Int\s+@default\(3\)/.test(schema));
  assert(/\bretryable\s+Boolean\s+@default\(false\)/.test(schema));
  assert(/\breplayEnvelopeEncrypted\s+String\?/.test(schema));
  assert(/\breplayEnvelopeVersion\s+Int\?/.test(schema));
  assert(/\breplayExpiresAt\s+DateTime\?/.test(schema));
  assert(/\bretryLeaseId\s+String\?/.test(schema));
  assert(/\bretryLeasedUntil\s+DateTime\?/.test(schema));
  assert(schema.includes("@@index([status, retryable, nextAttemptAt])"));
  assert(schema.includes("@@index([status, retryLeasedUntil])"));
});



test("communication template preflight failures leave PII-safe durable evidence", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");

  assert(source.includes('action: "COMMUNICATION_DISPATCH_BLOCKED"'));
  assert(source.includes('"TEMPLATE_NOT_CONFIGURED"'));
  assert(source.includes('"TEMPLATE_CONTRACT_INVALID"'));
  assert(source.includes("recipientAddressHash"));
  assert(source.includes("idempotencyKeySha256"));
  assert(source.includes("enqueueSecurityAuditEvent(tx, auditLog)"));
  assert(!source.includes("recipient: input.recipient,\n          recipientAddressHash"));
});

test("communication retries use encrypted bounded replay and leased worker claims", () => {
  const dispatcher = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  const worker = fs.readFileSync(new URL("../lib/communications/RetryWorker.ts", import.meta.url), "utf8");

  assert(dispatcher.includes("function communicationHashSecret()"));
  assert(dispatcher.includes("secret.length < 32"));
  assert(dispatcher.includes("placeholder|your[-_ ]|change[-_ ]me|set-a-long"));
  // Assert the actual fail-closed guard rather than a brittle exact error sentence.
  // Formatting/copy edits must not make the security regression fail when the
  // production enforcement is still present.
  assert(dispatcher.includes('process.env.NODE_ENV === "production"'));
  assert(dispatcher.includes("secret.length < 32"));
  assert(dispatcher.includes("placeholder|your[-_ ]|change[-_ ]me|set-a-long"));
  assert(/non-placeholder\s+secret\s+of\s+at\s+least\s+32\s+characters\s+in\s+production/i.test(dispatcher));

  assert(dispatcher.includes('reason.match(/(?:returned|API returned)\\s+(\\d{3})/i)'));
  assert(!dispatcher.includes('reason.match(/(?:returned|API returned)\\\\s+(\\\\d{3})/i)'));

  assert(dispatcher.includes('createCipheriv("aes-256-gcm"'));
  assert(dispatcher.includes("COMMUNICATION_REPLAY_TTL_MS = 15 * 60 * 1000"));
  assert(dispatcher.includes("COMMUNICATION_REPLAY_VERSION = 2"));
  assert(dispatcher.includes("communicationTemplateReplayDigest"));
  assert(dispatcher.includes("templateDigest"));
  assert(dispatcher.includes("The original communication template changed after the first delivery attempt."));
  assert(dispatcher.includes("replayEnvelopeEncrypted"));
  assert(dispatcher.includes("retryPersistedCommunicationDelivery"));
  assert(dispatcher.includes("replayEnvelopeEncrypted: null"));
  assert(worker.includes("randomUUID()"));
  assert(worker.includes("COMMUNICATION_REPLAY_VERSION"));
  assert(worker.includes("row.replayEnvelopeVersion !== COMMUNICATION_REPLAY_VERSION"));
  assert(!worker.includes("row.replayEnvelopeVersion !== 1"));
  assert(worker.includes('status: "PROCESSING"'));
  assert(worker.includes("attemptCount: { increment: 1 }"));
  assert(worker.includes("retryPersistedCommunicationDelivery"));
  assert(worker.includes("COMMUNICATION_REPLAY_VERSION"));
  assert(worker.includes("row.replayEnvelopeVersion !== COMMUNICATION_REPLAY_VERSION"));
  assert(!worker.includes("row.replayEnvelopeVersion !== 1"));
  assert(worker.includes("AMBIGUOUS_RETRY_LEASE_EXPIRED"));
  assert(worker.includes("AMBIGUOUS_INITIAL_ATTEMPT_TIMEOUT"));
  assert(worker.includes("STALE_INITIAL_PROCESSING_MS"));
  assert(worker.includes("MIN_PROVIDER_ATTEMPT_BUDGET_MS = 12_000"));
  assert(worker.includes("Date.now() + MIN_PROVIDER_ATTEMPT_BUDGET_MS > stopAt"));
  assert(worker.includes("report.timeBudgetExhausted = true"));
  assert(!worker.includes("MANUAL_REDISPATCH_REQUIRED"));
});

test("admin email configuration presents Zoho / ZeptoMail as the production primary", () => {
  const page = fs.readFileSync(new URL("../app/settings/smtp/page.tsx", import.meta.url), "utf8");
  const adminPage = fs.readFileSync(new URL("../app/admin/settings/smtp/page.tsx", import.meta.url), "utf8");

  assert(page.includes('primaryProvider: "ZEPTOMAIL"'));
  assert(page.includes('fallbackProvider: "SENDGRID"'));
  assert(page.includes("Zoho / ZeptoMail is the production primary and SendGrid is the fallback"));
  assert(page.includes("Use SendGrid as the configured transactional fallback"));
  assert(page.includes("Use Zoho / ZeptoMail as HireGo's primary transactional email provider"));
  assert(adminPage.includes("Transactional Email Configuration (G04)"));
});


test("SendGrid fallback preserves approved HTML while escaping merge values", () => {
  const dispatcher = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  const templates = fs.readFileSync(new URL("../../config/approved-email-templates.json", import.meta.url), "utf8");

  assert(dispatcher.includes("function renderCommunicationHtmlTemplate"));
  assert(dispatcher.includes("escapeCommunicationHtml(String(variables[key] ?? \"\"))"));
  assert(dispatcher.includes("const html = renderCommunicationHtmlTemplate(template.body, input.variables)"));
  assert(dispatcher.includes("html: communicationEmailHtml(html)"));
  assert(dispatcher.includes("const text = communicationEmailText(html)"));
  assert(!dispatcher.includes("communicationPlainTextHtml(text)"));
  assert(!templates.includes("hariom-mu.vercel.app"));
  assert(templates.includes("https://hiregoai.com/marketing/hirego-logo-hd.png"));
});


test("email communications use configured routing with ZeptoMail primary and SendGrid fallback", () => {
  const dispatcher = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  const config = fs.readFileSync(new URL("../lib/email-delivery-config.ts", import.meta.url), "utf8");
  const route = fs.readFileSync(new URL("../app/api/admin/communications/templates/route.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/admin/communications/page.tsx", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

  assert(config.includes('DEFAULT_PRIMARY_EMAIL_PROVIDER: EmailProvider = "ZEPTOMAIL"'));
  assert(config.includes('DEFAULT_FALLBACK_EMAIL_PROVIDER: EmailProvider = "SENDGRID"'));
  assert(dispatcher.includes("getConfiguredEmailProviders"));
  assert(dispatcher.includes("canFailoverAfterDefinitiveEmailRejection"));
  assert(dispatcher.includes("sendZeptoMailTemplate"));
  assert(dispatcher.includes("{ provider: configuredProvider.provider, allowFallback: false }"));
  assert(route.includes('z.enum(["ZEPTOMAIL", "SENDGRID", "META"])'));
  assert(!route.includes("Stored email templates must use ZEPTOMAIL."));
  assert(page.includes('useState<EmailProvider>("ZEPTOMAIL")'));
  assert(page.includes('/api/admin/email-delivery/config'));
  assert(page.includes("Delivery order is controlled globally by Email Delivery settings"));
  assert(page.includes('value="SENDGRID">Provider-neutral email body'));
  assert(/primaryProvider\s+String\s+@default\("ZEPTOMAIL"\)/.test(schema));
  assert(/fallbackProvider\s+String\s+@default\("SENDGRID"\)/.test(schema));
});

test("automatic communication retries do not replay ambiguous 5xx provider outcomes", () => {
  const dispatcher = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(dispatcher.includes("const retryable = status === 429;"));
  assert(dispatcher.includes("5xx outcomes are intentionally terminal"));
  assert(!dispatcher.includes("status === 429 || (status !== null && status >= 500"));
});


test("communication retries are integrated into the existing workflow recovery pass", () => {
  const runner = fs.readFileSync(new URL("../lib/workflows/FailureRecoveryRunner.ts", import.meta.url), "utf8");
  const scheduler = fs.readFileSync(new URL("../../scripts/run-recovery-scheduler.mjs", import.meta.url), "utf8");
  const vercel = fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");

  assert(runner.includes("prepareCommunicationRetries(5, stopAt)"));
  assert(runner.includes("communicationRetries"));
  assert(scheduler.includes("/api/internal/workflows/recover"));
  assert(scheduler.includes("WORKER_RECOVERY_API_KEY"));
  assert(scheduler.includes("key.length < 32"));
  assert(scheduler.includes("result.report.communicationRetries?.terminal"));
  assert(scheduler.includes("result.report.communicationRetries?.timeBudgetExhausted"));
  assert(!scheduler.includes("CRON_SECRET"));
  assert(!vercel.includes("/api/cron/communication-retries"));
});

test("admin delivery filters fail closed", () => {
  const source = fs.readFileSync(new URL("../app/api/admin/communications/deliveries/route.ts", import.meta.url), "utf8");
  assert(source.includes("Invalid communication delivery status filter."));
  assert(source.includes("Invalid communication channel filter."));
});

test("admin communication operations expose retry and terminal evidence", () => {
  const api = fs.readFileSync(new URL("../app/api/admin/communications/deliveries/route.ts", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../app/admin/communications/page.tsx", import.meta.url), "utf8");

  assert(api.includes("maxAttempts: true"));
  assert(api.includes("retryable: true"));
  assert(api.includes("nextAttemptAt: true"));
  assert(api.includes("retryLeasedUntil: true"));
  assert(api.includes("lastErrorCode: true"));
  assert(page.includes("Retry state"));
  assert(page.includes("Last error"));
  assert(page.includes("retryStateLabel"));
  assert(page.includes('lastErrorCode?.startsWith("AMBIGUOUS_")'));
  assert(page.includes("Terminal · ambiguous outcome"));
  assert(page.includes("{delivery.attemptCount}/{delivery.maxAttempts}"));
});

test("COMMUNICATION_EVENTS array is synchronized with registry keys including INTERVIEW_NEXT_ROUND", async () => {
  const { COMMUNICATION_EVENTS, COMMUNICATION_EVENT_REGISTRY } = await import("../lib/communications/catalog");
  assert(COMMUNICATION_EVENTS.includes("INTERVIEW_NEXT_ROUND"));
  for (const eventKey of COMMUNICATION_EVENTS) {
    assert(COMMUNICATION_EVENT_REGISTRY[eventKey] !== undefined, `Missing registry definition for ${eventKey}`);
  }
  for (const registryKey of Object.keys(COMMUNICATION_EVENT_REGISTRY)) {
    assert(COMMUNICATION_EVENTS.includes(registryKey as any), `Missing event constant for ${registryKey}`);
  }
});

test("communication template route uses Prisma.JsonNull for nullable providerParameterOrder", () => {
  const source = fs.readFileSync(new URL("../app/api/admin/communications/templates/[id]/route.ts", import.meta.url), "utf8");
  assert(source.includes("Prisma.JsonNull"));
  assert(source.includes("providerParameterOrder"));
});

test("employer team invitation uses narrowed strings with escapeHtml", () => {
  const source = fs.readFileSync(new URL("../app/api/employer/team/route.ts", import.meta.url), "utf8");
  assert(source.includes("escapeHtml(inviteRole)"));
  assert(source.includes("escapeHtml(session.name ?? \"A company administrator\")"));
});

test("admin invoices route dispatches consequential notifications using dispatchAdminDirectCommunication", () => {
  const dispatcherSource = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(dispatcherSource.includes("export async function dispatchAdminDirectCommunication"));
  const invoicesSource = fs.readFileSync(new URL("../app/api/admin/invoices/route.ts", import.meta.url), "utf8");
  assert(invoicesSource.includes("dispatchAdminDirectCommunication"));
  assert(invoicesSource.includes('eventKey: "INVOICE_GENERATED"'));
});



test("approved ZeptoMail email catalogue stays complete and disabled", () => {
  const templates = JSON.parse(fs.readFileSync(new URL("../../config/approved-email-templates.json", import.meta.url), "utf8")) as Array<{
    eventKey: string; channel: string; audience: string; status: string; provider: string; providerAlias: string;
    subject: string; body: string; enabled: boolean; version: number;
  }>;
  assert.equal(templates.length, 84);
  assert.equal(new Set(templates.map((template) => template.providerAlias)).size, 84);
  assert.equal(new Set(templates.map((template) => template.eventKey)).size, 49);
  for (const template of templates) {
    assert.equal(template.channel, "EMAIL");
    assert.equal(template.provider, "ZEPTOMAIL");
    assert.equal(template.status, "DRAFT");
    assert.equal(template.enabled, false);
    assert.equal(template.version, 1);
    assert(template.body.includes("hirego-logo-hd.png"));
    assert(template.body.includes("This is a transactional email"));
    const check = validateTemplateVariables(template.eventKey as any, template.subject, template.body);
    assert.equal(check.valid, true, `${template.providerAlias}: ${JSON.stringify(check)}`);
  }
});


test("WhatsApp delivery status is monotonic and failed is terminal", () => {
  const source = fs.readFileSync(new URL("../app/api/whatsapp/webhook/route.ts", import.meta.url), "utf8");

  assert(source.includes('if (existing.status === "FAILED") return;'));
  assert(source.includes('status: "FAILED"'));
  assert(source.includes("retryable: false"));
  assert(source.includes("replayEnvelopeEncrypted: null"));
  assert(source.includes("retryLeaseId: null"));
  assert(source.includes('providerStatus === "read"'));
  assert(source.includes('providerStatus === "delivered"'));
  assert(source.includes('providerStatus === "sent"'));
});


test("full recovery endpoint requires a dedicated recovery key and never falls back to cron credentials", () => {
  const source = fs.readFileSync(new URL("../lib/workflows/RecoveryWorkerState.ts", import.meta.url), "utf8");

  assert(source.includes("process.env.WORKER_RECOVERY_API_KEY?.trim()"));
  assert(!source.includes("process.env.CRON_SECRET?.trim()"));
  assert(source.includes("expected.length < 32"));
  assert(source.includes("timingSafeEqual"));
  assert(source.includes("Recovery worker key is not configured."));
});


test("communication retries are owned by the existing workflow recovery pass", () => {
  const runner = fs.readFileSync(new URL("../lib/workflows/FailureRecoveryRunner.ts", import.meta.url), "utf8");
  const vercel = fs.readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");
  assert(runner.includes("prepareCommunicationRetries(5)"));
  assert(!vercel.includes("communication-retries"));
});


test("communication replay secret fails closed when weak in production", () => {
  const dispatcher = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(dispatcher.includes('process.env.COMMUNICATION_HASH_SECRET?.trim()'));
  assert(dispatcher.includes('process.env.NODE_ENV === "production"'));
  assert(dispatcher.includes("communicationHashSecret()"));
});
