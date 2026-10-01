import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { routeWhatsAppCandidateIntent } from "@/lib/whatsapp-candidate-assistant";
import {
  classifyWhatsAppAudience,
  routeEmployerIntentDeterministically,
} from "@/lib/whatsapp-autonomous-agent";
import { isWhatsAppFollowupAgeEligible } from "@/lib/whatsapp-followup";

test("candidate WhatsApp routes high-value product intents without LLM", () => {
  assert.equal(routeWhatsAppCandidateIntent("I want to practice mock interview").type, "MOCK_INTERVIEW");
  assert.equal(routeWhatsAppCandidateIntent("how do I upload video resume").type, "VIDEO_RESUME");
  assert.equal(routeWhatsAppCandidateIntent("How can I earn money with referrals?").type, "REFERRAL");
});

test("audience routing recognizes employer acquisition and candidate acquisition", () => {
  assert.equal(classifyWhatsAppAudience("We need to hire 25 customer support executives"), "EMPLOYER");
  assert.equal(classifyWhatsAppAudience("Mujhe Delhi mein job chahiye"), "CANDIDATE");
  assert.equal(classifyWhatsAppAudience("hello"), "UNKNOWN");
});

test("employer common intents are deterministic so LLM is fallback-only", () => {
  assert.equal(routeEmployerIntentDeterministically("Can Copilot automate screening?"), "COPILOT");
  assert.equal(routeEmployerIntentDeterministically("show pricing plans"), "PLANS");
  assert.equal(routeEmployerIntentDeterministically("we need bulk hiring managed end to end"), "MANAGED_HIRING");
  assert.equal(routeEmployerIntentDeterministically("show my open jobs"), "JOBS");
  assert.equal(routeEmployerIntentDeterministically("how can I earn from referral"), "REFERRAL");
});

test("proactive WhatsApp nudge is eligible only near the end of the open service window", () => {
  const now = Date.parse("2026-10-01T12:00:00.000Z");
  assert.equal(isWhatsAppFollowupAgeEligible(new Date(now - 19 * 60 * 60 * 1000), now), false);
  assert.equal(isWhatsAppFollowupAgeEligible(new Date(now - 20 * 60 * 60 * 1000), now), true);
  assert.equal(isWhatsAppFollowupAgeEligible(new Date(now - 23 * 60 * 60 * 1000), now), true);
  assert.equal(isWhatsAppFollowupAgeEligible(new Date(now - 23.5 * 60 * 60 * 1000), now), false);
  assert.equal(isWhatsAppFollowupAgeEligible(new Date(now - 24 * 60 * 60 * 1000), now), false);
});

test("WhatsApp handoff remains allowlist-based for new candidate and employer surfaces", () => {
  const file = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/whatsapp/auth/handoff/route.ts"),
    "utf8",
  );
  for (const destination of [
    '"mock-interview": "/ai/mock-interview/setup"',
    '"video-resume": "/profile/video-resume"',
    'referrals: "/referrals/dashboard"',
    '"employer-dashboard": "/employer/dashboard"',
    '"employer-copilot": "/employer/ai-hiring-copilot-hub"',
  ]) {
    assert.ok(file.includes(destination), `Missing allowlisted handoff: ${destination}`);
  }
  assert.match(file, /ALLOWED_DESTINATIONS\[dest\] \?\? ALLOWED_DESTINATIONS\.default/);
  assert.doesNotMatch(file, /new URL\(dest\s*,/);
});

test("inbound WhatsApp worker schedules one durable delayed follow-up check", () => {
  const worker = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/internal/whatsapp/process/route.ts"),
    "utf8",
  );
  assert.match(worker, /scheduleWhatsAppFollowupCheck/);
  assert.match(worker, /shouldScheduleWhatsAppFollowup/);
});
