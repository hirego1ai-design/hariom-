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

test("consequential deliveries are never marked automatically retryable", () => {
  const source = fs.readFileSync(new URL("../lib/communications/dispatcher.ts", import.meta.url), "utf8");
  assert(source.includes("retryable: !definition.consequential && failure.retryable"));
  assert(source.includes('lastErrorCode: "AMBIGUOUS_PROVIDER_ERROR"'));
});


test("communication retry Prisma fields remain in schema", () => {
  const schema = fs.readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  assert(schema.includes("nextAttemptAt     DateTime?"));
  assert(schema.includes("maxAttempts       Int      @default(3)"));
  assert(schema.includes("retryable         Boolean  @default(false)"));
  assert(schema.includes("@@index([status, retryable, nextAttemptAt])"));
});

test("admin delivery filters fail closed", () => {
  const source = fs.readFileSync(new URL("../app/api/admin/communications/deliveries/route.ts", import.meta.url), "utf8");
  assert(source.includes("Invalid communication delivery status filter."));
  assert(source.includes("Invalid communication channel filter."));
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

