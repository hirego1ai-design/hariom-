test("Mock Interview setup is text-only and starts text sessions", () => {
  const setup = read("src/app/ai/mock-interview/setup/page.tsx");
  assert.ok(setup.includes("role-based text questions"));
  assert.ok(setup.includes('<form onSubmit={handleStartInterview}'));
  assert.ok(setup.includes('const mode = "TEXT" as const'));
  assert.ok(!setup.includes("Practise with voice"));
  assert.ok(!setup.includes("Real Voice Mode"));
  assert.ok(!setup.includes("<Mic2"));
  assert.ok(!setup.includes("/voice/readiness"));
});

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

test("Voice readiness requires routed TTS and STT and does not depend on Railway", () => {
  const readiness = read(
    "src/lib/mockInterview/MockInterviewVoiceService.ts",
  );
  assert.ok(readiness.includes("assertTextToSpeechRouteConfigured"));
  assert.ok(readiness.includes("assertSpeechToTextRouteConfigured"));
  assert.ok(readiness.includes('"TTS_NOT_CONFIGURED"'));
  assert.ok(readiness.includes('"STT_NOT_CONFIGURED"'));
  assert.ok(!readiness.includes("VIDEO_ANALYSIS_WORKER_URL"));
  assert.ok(!readiness.includes("voiceTurnSupported"));
});

test("provider STT uses approved routed models with no hard-coded transcription model", () => {
  const stt = read(
    "src/lib/mockInterview/SpeechToTextService.ts",
  );
  assert.ok(stt.includes('taskType: "mock-interview-stt"'));
  assert.ok(stt.includes('requiredCapabilities: ["STT"]'));
  assert.ok(stt.includes("endpoint.model"));
  assert.ok(stt.includes("audio/transcriptions"));
  assert.ok(stt.includes("Preserve technical terms"));
  assert.ok(!stt.includes("gpt-4o-transcribe"));
  assert.ok(!stt.includes("gpt-4o-mini-transcribe"));
  assert.ok(!stt.includes("whisper-1"));
});

test("voice transcription is authenticated, bounded, and cannot score directly", () => {
  const route = read(
    "src/app/api/assessment/mock-interview/voice/transcribe/route.ts",
  );
  assert.ok(route.includes('auth.role !== "CANDIDATE"'));
  assert.ok(route.includes('interviewSession.mode !== "VOICE"'));
  assert.ok(route.includes("candidateAnswerTranscript !== null"));
  assert.ok(route.includes("maxAudioBytes"));
  assert.ok(route.includes("transcribeMockInterviewAudio"));
  assert.ok(route.includes("createVoiceTranscriptDraft"));
  assert.ok(route.includes("requiresConfirmation: true"));
  assert.ok(!route.includes("createVoiceTranscriptReceipt"));
  assert.ok(!route.includes("mockInterviewTurn.update"));
  assert.ok(!route.includes("score:"));
});

test("provider transcript must be candidate-confirmed before scoring receipt exists", () => {
  const confirm = read(
    "src/app/api/assessment/mock-interview/voice/confirm-transcript/route.ts",
  );
  const drafts = read(
    "src/lib/mockInterview/VoiceTranscriptConfirmation.ts",
  );
  assert.ok(confirm.includes("takeVoiceTranscriptDraft"));
  assert.ok(confirm.includes("createVoiceTranscriptReceipt"));
  assert.ok(confirm.includes("confirmedByCandidate: true"));
  assert.ok(confirm.includes('transcriptSource: "CANDIDATE_CONFIRMED"'));
  assert.ok(confirm.includes("TRANSCRIPT_CONFIRMED"));
  assert.ok(drafts.includes("takeRedisValue"));
  assert.ok(drafts.includes("DRAFT_TTL_SECONDS"));
});

test("Voice turn accepts only one-time server receipt and hides turn scores", () => {
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

test("voice receipts are one-time, support candidate-confirmed transcripts, and never fake confidence", () => {
  const receipt = read(
    "src/lib/mockInterview/VoiceTranscriptReceipt.ts",
  );
  const redis = read("src/lib/redis.ts");
  assert.ok(receipt.includes("takeVoiceTranscriptReceipt"));
  assert.ok(receipt.includes("takeRedisValue"));
  assert.ok(receipt.includes("RECEIPT_TTL_SECONDS"));
  assert.ok(receipt.includes("confidence: z.number().finite().min(0).max(1).nullable()"));
  assert.ok(receipt.includes("CANDIDATE_CONFIRMED"));
  assert.ok(redis.includes("export async function takeRedisValue"));
  assert.ok(redis.includes("redis.call('GET', KEYS[1])"));
  assert.ok(redis.includes("redis.call('DEL', KEYS[1])"));
});

test("Mock Interview active page exposes typed answers and no voice controls", () => {
  const active = read("src/app/ai/mock-interview/active/page.tsx");
  assert.ok(active.includes("handleSubmitAnswer"));
  assert.ok(active.includes("setAnswerText"));
  assert.ok(active.includes("answerText"));
  assert.ok(!active.includes("MediaRecorder"));
  assert.ok(!active.includes("navigator.mediaDevices.getUserMedia"));
  assert.ok(!active.includes("voice/transcribe"));
  assert.ok(!active.includes("voice/confirm-transcript"));
  assert.ok(!active.includes("<Mic2"));
  assert.ok(!active.includes("<Volume2"));
});

test("Mock Interview setup defaults to text mode without voice readiness UI", () => {
  const setup = read("src/app/ai/mock-interview/setup/page.tsx");
  assert.ok(setup.includes('const mode = "TEXT" as const'));
  assert.ok(setup.includes("mode,"));
  assert.ok(!setup.includes("Real Voice Mode"));
  assert.ok(!setup.includes("/voice/readiness"));
  assert.ok(!setup.includes("voiceReadiness?.ready !== true"));
  assert.ok(!setup.includes("Checking voice practice availability"));
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

test("Railway worker remains optional and fail-closed as a future fallback", () => {
  const env = read("src/lib/env.ts");
  const worker = read("video-analysis-worker/main.py");
  assert.ok(env.includes("MOCK_INTERVIEW_VOICE_WORKER_FALLBACK_ENABLED"));
  assert.ok(worker.includes('@app.post("/transcribe-turn")'));
  assert.ok(worker.includes('"voiceTurnSupported": True'));
  assert.ok(worker.includes("hmac.compare_digest"));
});

test("voice feature configuration stays disabled unless explicitly enabled", () => {
  const env = read("src/lib/env.ts");
  assert.ok(env.includes('MOCK_INTERVIEW_VOICE_ENABLED === "true"'));
  assert.ok(env.includes("MOCK_INTERVIEW_VOICE_MAX_AUDIO_BYTES"));
  assert.ok(env.includes("MOCK_INTERVIEW_VOICE_MIN_TRANSCRIPT_CONFIDENCE"));
});


test("voice AI routing migration configures quality-first STT and routed TTS without app fallbacks", () => {
  const migration = read(
    "prisma/migrations/20261005100000_voice_ai_routing_defaults/migration.sql",
  );
  assert.ok(migration.includes("'openai:gpt-4o-transcribe'"));
  assert.ok(migration.includes("'openai:gpt-4o-mini-transcribe'"));
  assert.ok(migration.includes("'openai:gpt-4o-mini-tts'"));
  assert.ok(migration.includes("'mock-interview-stt'"));
  assert.ok(migration.includes("'mock-interview-tts'"));
  assert.ok(migration.includes("'QUALITY_FIRST'"));
  assert.ok(migration.includes("'semantic-embedding'"));
});

test("voice provider models are configuration data, not hard-coded runtime fallbacks", () => {
  const stt = read("src/lib/mockInterview/SpeechToTextService.ts");
  const tts = read("src/lib/mockInterview/TextToSpeechService.ts");
  assert.ok(!stt.includes("gpt-4o-transcribe"));
  assert.ok(!stt.includes("gpt-4o-mini-transcribe"));
  assert.ok(!tts.includes("gpt-4o-mini-tts"));
});
