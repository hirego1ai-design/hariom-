import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

test("Candidate Jarvis is hybrid: deterministic actions bypass LLM and reasoning is routed", () => {
  const service = read("src/lib/jarvis/CandidateJarvisService.ts");
  assert.ok(service.includes('path: "FAST"'));
  assert.ok(service.includes("directCommand(message, context)"));
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

test("Candidate Jarvis UI exposes actual execution path and does not use browser speech recognition", () => {
  const page = read("src/app/candidate/jarvis/page.tsx");
  assert.ok(page.includes("Path:"));
  assert.ok(page.includes("no LLM"));
  assert.ok(!page.includes("SpeechRecognition"));
  assert.ok(!page.includes("webkitSpeechRecognition"));
});


test("Candidate Jarvis voice uses only the authenticated self-hosted HireGo Voice Engine", () => {
  const client = read("src/lib/voice/HireGoVoiceEngine.ts");
  const stt = read("src/app/api/candidate/jarvis/voice/transcribe/route.ts");
  const tts = read("src/app/api/candidate/jarvis/voice/speech/route.ts");
  const receipt = read("src/lib/jarvis/CandidateJarvisVoiceReceipt.ts");
  assert.ok(client.includes("HIREGO_VOICE_ENGINE_URL"));
  assert.ok(client.includes("HIREGO_VOICE_ENGINE_TOKEN"));
  assert.ok(!client.includes("OPENAI_API_KEY"));
  assert.ok(!client.includes("GEMINI_API_KEY"));
  assert.ok(stt.includes("transcribeHireGoVoice"));
  assert.ok(stt.includes("requiresConfirmation: true"));
  assert.ok(tts.includes("takeCandidateJarvisSpeechReceipt"));
  assert.ok(!tts.includes("text: z.string"));
  assert.ok(receipt.includes("takeRedisValue"), "speech receipt must be one-time");
});

test("self-hosted voice worker provides bounded Whisper STT and IndicVoice TTS", () => {
  const worker = read("voice-engine/main.py");
  const requirements = read("voice-engine/requirements.txt");
  assert.ok(worker.includes('app.post("/v1/stt")'));
  assert.ok(worker.includes('app.post("/v1/tts")'));
  assert.ok(worker.includes("faster_whisper"));
  assert.ok(worker.includes("IndicPipeline"));
  assert.ok(worker.includes("hmac.compare_digest"));
  assert.ok(requirements.includes("indic-voice.git@57240e779560e8c3d022836f4191e0db6dff9018"));
  assert.ok(requirements.includes("indic-g2p.git@6bc9ca45fb06955bb19057344ac6a4e400ed4c95"));
});
