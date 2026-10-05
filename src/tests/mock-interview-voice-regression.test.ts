import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (relative: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

test("Voice Mode start is fail-closed and persists VOICE only after runtime readiness", () => {
  const start = read(
    "src/app/api/assessment/mock-interview/start/route.ts",
  );
  assert.ok(start.includes('z.enum(["TEXT", "VOICE"])'));
  assert.ok(start.includes('body.mode === "VOICE"'));
  assert.ok(start.includes("assertMockVoiceReady"));
  assert.ok(start.includes("mode: body.mode"));

  const readinessIndex = start.indexOf("assertMockVoiceReady");
  const debitIndex = start.indexOf("candidateCreditWallet.updateMany");
  assert.ok(readinessIndex >= 0 && debitIndex > readinessIndex);
});

test("Voice transcription uses authenticated transient Whisper worker with strict bounds", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/voice/transcribe/route.ts",
  );
  const worker = read("video-analysis-worker/main.py");

  assert.ok(route.includes('auth.role !== "CANDIDATE"'));
  assert.ok(route.includes('interviewSession.mode !== "VOICE"'));
  assert.ok(route.includes("candidateAnswerTranscript !== null"));
  assert.ok(route.includes("MAX") || route.includes("maxAudioBytes"));
  assert.ok(route.includes("requiresRepeat"));
  assert.ok(route.includes("minTranscriptConfidence"));
  assert.ok(route.includes("createVoiceTranscriptReceipt"));
  assert.ok(!route.includes("mockInterviewTurn.update"));
  assert.ok(!route.includes("score:"));

  assert.ok(worker.includes('@app.post("/transcribe-turn")'));
  assert.ok(worker.includes("tempfile.mkdtemp(prefix=\"mock_voice_\""));
  assert.ok(worker.includes("shutil.rmtree(work_dir, ignore_errors=True)"));
  assert.ok(worker.includes("faster-whisper") || worker.includes("get_whisper_model"));
  assert.ok(worker.includes("vad_filter=True"));
});

test("low-confidence voice transcript is repeated rather than scored", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/voice/transcribe/route.ts",
  );
  assert.ok(route.includes("result.lowConfidence"));
  assert.ok(route.includes("result.confidence < config.minTranscriptConfidence"));
  assert.ok(route.includes("requiresRepeat: true"));
  assert.ok(route.includes("Please answer again"));
  const repeatBlock = route.slice(
    route.indexOf("if (requiresRepeat)"),
    route.indexOf("const receipt ="),
  );
  assert.ok(!repeatBlock.includes("createVoiceTranscriptReceipt"));
});

test("Voice turn accepts only one-time server transcription receipt and hides turn scores", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/turn/route.ts",
  );
  assert.ok(route.includes("transcriptionReceiptId"));
  assert.ok(route.includes("takeVoiceTranscriptReceipt"));
  assert.ok(route.includes('interviewSession.mode === "VOICE"'));
  assert.ok(route.includes("transcriptProvider"));
  assert.ok(route.includes("transcriptConfidence"));

  const voiceResponse = route.slice(
    route.lastIndexOf("if (isVoice)"),
    route.lastIndexOf("return NextResponse.json({"),
  );
  assert.ok(voiceResponse.includes("voiceMode: true"));
  assert.ok(!voiceResponse.includes("turnScore"));
  assert.ok(!voiceResponse.includes("feedback: evaluation.feedback"));
});

test("voice speech endpoint never accepts arbitrary TTS text", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/voice/speech/route.ts",
  );
  assert.ok(route.includes('z.literal("OPENING")'));
  assert.ok(route.includes('z.literal("QUESTION")'));
  assert.ok(route.includes('z.literal("FINAL_SUMMARY")'));
  assert.ok(!route.includes("text: z.string"));
  assert.ok(route.includes("interviewSession.openingMessage"));
  assert.ok(route.includes("turn.questionIndex === body.questionIndex"));
  assert.ok(route.includes("interviewSession.finalReport"));
  assert.ok(route.includes("synthesizeMockInterviewSpeech"));
});

test("TTS uses approved routed models and contains no hard-coded production model", () => {
  const tts = read(
    "src/lib/mockInterview/TextToSpeechService.ts",
  );
  assert.ok(tts.includes('taskType: "mock-interview-tts"'));
  assert.ok(tts.includes('requiredCapabilities: ["TTS"]'));
  assert.ok(tts.includes("endpoint.model"));
  assert.ok(tts.includes("voiceKey"));
  assert.ok(!tts.includes("gpt-4o-mini-tts"));
  assert.ok(!tts.includes("tts-1"));
});

test("voice receipts are one-time and atomically consumed through Redis", () => {
  const receipt = read(
    "src/lib/mockInterview/VoiceTranscriptReceipt.ts",
  );
  const redis = read("src/lib/redis.ts");
  assert.ok(receipt.includes("takeVoiceTranscriptReceipt"));
  assert.ok(receipt.includes("takeRedisValue"));
  assert.ok(receipt.includes("RECEIPT_TTL_SECONDS"));
  assert.ok(redis.includes("export async function takeRedisValue"));
  assert.ok(redis.includes("redis.call('GET', KEYS[1])"));
  assert.ok(redis.includes("redis.call('DEL', KEYS[1])"));
});

test("Voice UI uses MediaRecorder and never browser SpeechRecognition", () => {
  const active = read(
    "src/app/ai/mock-interview/active/page.tsx",
  );
  assert.ok(active.includes("MediaRecorder"));
  assert.ok(active.includes("navigator.mediaDevices.getUserMedia"));
  assert.ok(active.includes("voice/transcribe"));
  assert.ok(active.includes("transcriptionReceiptId"));
  assert.ok(active.includes("Voice Mode does not show per-question scores"));
  assert.ok(!active.includes("SpeechRecognition"));
  assert.ok(!active.includes("webkitSpeechRecognition"));
});

test("setup exposes Voice Mode only through runtime readiness", () => {
  const setup = read(
    "src/app/ai/mock-interview/setup/page.tsx",
  );
  assert.ok(setup.includes("Real Voice Mode"));
  assert.ok(setup.includes("/voice/readiness"));
  assert.ok(setup.includes("voiceReadiness?.ready !== true"));
  assert.ok(setup.includes("mode,"));
  assert.ok(!setup.includes("Voice Mode is ready by default"));
});

test("spoken final feedback is available only after a completed Voice session", () => {
  const speech = read(
    "src/app/api/assessment/mock-interview/voice/speech/route.ts",
  );
  const summary = read(
    "src/app/ai/mock-interview/summary/page.tsx",
  );
  assert.ok(speech.includes('kind: z.literal("FINAL_SUMMARY")'));
  assert.ok(speech.includes('interviewSession.status !== "COMPLETED"'));
  assert.ok(summary.includes("Hear feedback"));
  assert.ok(summary.includes('kind: "FINAL_SUMMARY"'));
});

test("persona voices are admin-configurable and audited", () => {
  const route = read(
    "src/app/api/admin/mock-interview-personas/route.ts",
  );
  const page = read(
    "src/app/admin/mock-interview-personas/page.tsx",
  );
  assert.ok(route.includes("requireAdminSession"));
  assert.ok(route.includes("voiceKey"));
  assert.ok(route.includes("MOCK_INTERVIEW_PERSONA_UPDATED"));
  assert.ok(route.includes("enqueueSecurityAuditEvent"));
  assert.ok(page.includes("TTS voice key"));
  assert.ok(page.includes("/api/admin/mock-interview-personas"));
});

test("live Voice Mode session API redacts per-turn scoring until completion", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/session/route.ts",
  );
  assert.ok(route.includes("hideLiveVoiceEvaluation"));
  assert.ok(route.includes('interviewSession.mode === "VOICE"'));
  assert.ok(route.includes('interviewSession.status === "IN_PROGRESS"'));
  assert.ok(route.includes("score: hideLiveVoiceEvaluation ? null : turn.score"));
  assert.ok(route.includes("evaluation: hideLiveVoiceEvaluation ? null : turn.evaluation"));
});

test("candidate session payload does not expose provider voice identifiers", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/session/route.ts",
  );
  assert.ok(!route.includes("voiceKey: interviewSession.persona.voiceKey"));
});

test("voice feature configuration fails closed in production", () => {
  const env = read("src/lib/env.ts");
  assert.ok(env.includes("MOCK_INTERVIEW_VOICE_ENABLED"));
  assert.ok(env.includes("MOCK_INTERVIEW_VOICE_MIN_TRANSCRIPT_CONFIDENCE"));
  assert.ok(env.includes('requireProductionEnv("VIDEO_ANALYSIS_WORKER_URL")'));
  assert.ok(env.includes('requireProductionEnv("VIDEO_ANALYSIS_INTERNAL_TOKEN")'));
});
