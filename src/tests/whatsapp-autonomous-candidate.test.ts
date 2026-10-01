import test from "node:test";
import assert from "node:assert/strict";
import { routeWhatsAppCandidateIntent } from "@/lib/whatsapp-candidate-assistant";
import { sanitizeRawPayload } from "@/lib/whatsapp-identity";

test("WhatsApp candidate intent router handles menu shortcuts", () => {
  assert.deepEqual(routeWhatsAppCandidateIntent("1"), { type: "FIND_JOBS" });
  assert.deepEqual(routeWhatsAppCandidateIntent("2"), { type: "APPLICATIONS" });
  assert.deepEqual(routeWhatsAppCandidateIntent("3"), { type: "APPLICATION_STATUS" });
  assert.deepEqual(routeWhatsAppCandidateIntent("10"), { type: "DASHBOARD" });
});

test("WhatsApp candidate intent router requires explicit apply commands", () => {
  assert.deepEqual(routeWhatsAppCandidateIntent("apply 2"), { type: "APPLY", index: 2 });
  assert.deepEqual(routeWhatsAppCandidateIntent("apply job #3"), { type: "APPLY", index: 3 });
  assert.deepEqual(routeWhatsAppCandidateIntent("2"), { type: "APPLICATIONS" });
});

test("WhatsApp candidate intent router understands common English and Hinglish job-search phrases", () => {
  assert.deepEqual(routeWhatsAppCandidateIntent("show me jobs in Delhi"), { type: "FIND_JOBS" });
  assert.deepEqual(routeWhatsAppCandidateIntent("mujhe naukri chahiye"), { type: "FIND_JOBS" });
  assert.deepEqual(routeWhatsAppCandidateIntent("my application status"), { type: "APPLICATION_STATUS" });
});

test("WhatsApp candidate intent router fails closed for unknown actions", () => {
  assert.deepEqual(routeWhatsAppCandidateIntent("delete my account"), { type: "UNKNOWN" });
});

test("Meta CTWA sanitization preserves campaign identifiers without retaining full sender number", () => {
  const sanitized = sanitizeRawPayload({
    id: "wamid.123",
    from: "919876543210",
    type: "text",
    text: { body: "Hi" },
    referral: {
      source_type: "ad",
      source_id: "120000000000001",
      source_url: "https://www.facebook.com/ads/example",
      headline: "Find your next job",
      body: "Join HireGo",
      ctwa_clid: "click-123",
    },
  }) as Record<string, any>;

  assert.equal(sanitized.from, "9198***210");
  assert.equal(sanitized.referral.source_id, "120000000000001");
  assert.equal(sanitized.referral.ctwa_clid, "click-123");
  assert.doesNotMatch(JSON.stringify(sanitized), /919876543210/);
});
