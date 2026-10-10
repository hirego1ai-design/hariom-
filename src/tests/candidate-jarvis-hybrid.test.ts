import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

test("Candidate Jarvis is hybrid: deterministic actions bypass LLM and reasoning is routed", () => {
  const service = read("src/lib/jarvis/CandidateJarvisService.ts");
  assert.ok(service.includes('path: "FAST"'));
  assert.ok(service.includes("directCommand(message, fastContext)"));
  assert.ok(service.includes("ModelRouter.executeWithFallback"));
  assert.ok(service.includes('taskType ='));
  assert.ok(service.includes('"candidate-jarvis"') || read("src/lib/jarvis/CandidateJarvisConfig.ts").includes('"candidate-jarvis"'));
  assert.ok(service.includes("activePublicJobWhere"));
  assert.ok(service.includes("computeMatchScore"));
});

test("Candidate Jarvis never executes consequential application side effects", () => {
  const service = read("src/lib/jarvis/CandidateJarvisService.ts");
  const api = read("src/app/api/candidate/jarvis/route.ts");
  assert.ok(service.includes("read/navigation only"));
  assert.ok(!service.includes("application.create("));
  assert.ok(!service.includes("application.update("));
  assert.ok(!service.includes("paymentOrder.create("));
  assert.ok(!service.includes("paymentTransaction.create("));
  assert.ok(!service.includes("candidateCreditWallet.update("));
  assert.ok(!api.includes("DELETE"));
});

test("Jarvis SMART and DEEP defaults use reciprocal GPT/Gemini fallback", () => {
  const migration = read("prisma/migrations/20261006130000_candidate_jarvis_hybrid/migration.sql");
  assert.ok(migration.includes("'candidate-jarvis'"));
  assert.ok(migration.includes("'openai:gpt-6-luna'"));
  assert.ok(migration.includes("'gemini:2.5-flash-lite'"));
  assert.ok(migration.includes("'candidate-jarvis-quality'"));
  assert.ok(migration.includes("'gemini:2.5-flash'"));
  assert.ok(migration.includes("'openai:gpt-6-sol'"));
  assert.ok(!migration.includes("UPDATE") || !migration.includes("deepseek'") || !migration.includes("'enabled',false"));
});

test("Jarvis remains Super Admin controlled and voice defaults fail closed", () => {
  const adminApi = read("src/app/api/admin/candidate-jarvis/route.ts");
  const config = read("src/lib/jarvis/CandidateJarvisConfig.ts");
  const adminPage = read("src/app/admin/candidate-jarvis/page.tsx");
  assert.ok(adminApi.includes("requireAdminSession"));
  assert.ok(adminApi.includes("CANDIDATE_JARVIS_CONFIG_UPDATED"));
  assert.ok(config.includes("voiceEnabled: z.boolean().default(false)"));
  assert.ok(adminPage.includes("self-hosted HireGo Voice Engine"));
});

test("Candidate Jarvis UI presents discoverable voice controls without internal AI metadata", () => {
  const page = read("src/app/candidate/jarvis/page.tsx");
  assert.ok(page.includes("Speak to Jarvis"));
  assert.ok(page.includes("<Mic2"));
  assert.ok(page.includes("<Volume2"));
  assert.ok(page.includes("Tap Speak to record"));
  assert.ok(page.includes("chatScrollRef.current.scrollTo"));
  assert.ok(!page.includes("Path:"));
  assert.ok(!page.includes("no LLM"));
  assert.ok(!page.includes("Super Admin model routes"));
  const api = read("src/app/api/candidate/jarvis/route.ts");
  assert.ok(api.includes("reply: { message: reply.message, actions: reply.actions, speechReceiptId }"));
  assert.ok(!api.includes("reply: { ...reply, speechReceiptId }"));
  assert.ok(!api.includes("hybridRoutingEnabled: config.hybridRoutingEnabled"));
  assert.ok(!page.includes("SpeechRecognition"));
  assert.ok(!page.includes("webkitSpeechRecognition"));
});

test("Jarvis basic greetings do not depend on AI provider credentials", () => {
  const service = read("src/lib/jarvis/CandidateJarvisService.ts");
  const api = read("src/app/api/candidate/jarvis/route.ts");
  const intents = read("src/lib/jarvis/CandidateIntentRouter.ts");
  assert.ok(intents.includes("good morning|good afternoon|good evening"));
  assert.ok(service.includes("Hi! I'm Jarvis"));
  assert.ok(api.includes("All configured AI endpoints failed"));
  assert.ok(api.includes("503"));
  assert.ok(!api.includes("Incorrect API key provided"));
});

test("Candidate wallet never advertises disabled checkout but automatically shows verified checkout when ready", () => {
  const page = read("src/app/credits/page.tsx");
  const api = read("src/app/api/candidate/credits/route.ts");
  assert.ok(page.includes('purchaseStatus === "READY" && packages.length > 0'));
  assert.ok(!page.includes("Credit purchase is temporarily unavailable because no production payment route is enabled"));
  assert.ok(api.includes("stripeConfigured"));
  assert.ok(api.includes("payuConfigured"));
  assert.ok(api.includes('gatewayConfig.gatewaysStatus.STRIPE !== "DISABLED"'));
  assert.ok(api.includes('gatewayConfig.gatewaysStatus.PAYU !== "DISABLED"'));
  assert.ok(api.includes('purchaseStatus,'));
});


test("Candidate Jarvis voice uses only the authenticated self-hosted HireGo Voice Engine", () => {
  const client = read("src/lib/voice/HireGoVoiceEngine.ts");
  const stt = read("src/app/api/candidate/jarvis/voice/transcribe/route.ts");
  const tts = read("src/app/api/candidate/jarvis/voice/speech/route.ts");
  const receipt = read("src/lib/jarvis/CandidateJarvisVoiceReceipt.ts");
  assert.ok(client.includes("HIREGO_VOICE_ENGINE_URL"));
  assert.ok(client.includes("HIREGO_VOICE_ENGINE_TOKEN"));
  assert.ok(client.includes("v1/audio/transcriptions"));
  assert.ok(client.includes("v1/audio/speech"));
  assert.ok(client.includes("HIREGO_VOICE_ENGINE_E2E_VERIFIED"));
  assert.ok(client.includes("v1/models"));
  assert.ok(client.includes("e2eVerified: true"));
  assert.ok(!client.includes("OPENAI_API_KEY"));
  assert.ok(!client.includes("GEMINI_API_KEY"));
  assert.ok(stt.includes("transcribeHireGoVoice"));
  assert.ok(stt.includes("requiresConfirmation: true"));
  assert.ok(tts.includes("takeCandidateJarvisSpeechReceipt"));
  assert.ok(!tts.includes("text: z.string"));
  assert.ok(receipt.includes("takeRedisValue"), "speech receipt must be one-time");
});


test("self-hosted voice defaults fit the Railway CPU runtime", () => {
  const client = read("src/lib/voice/HireGoVoiceEngine.ts");
  const config = read("src/lib/jarvis/CandidateJarvisConfig.ts");
  assert.ok(client.includes("Systran/faster-whisper-base"));
  assert.ok(client.includes("speaches-ai/piper-en_US-hfc_female-medium"));
  assert.ok(config.includes('default("hfc_female")'));
});
