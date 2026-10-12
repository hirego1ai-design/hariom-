import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseCandidateJarvisSpeechReceipt } from "../lib/jarvis/CandidateJarvisVoiceReceipt";

const now = Date.parse("2026-10-12T16:00:00.000Z");
const fixture = {
  version: 1 as const,
  receiptId: "b12cb8d5-f303-4ad8-8667-f5ec9ea26bb1",
  userId: "candidate-123",
  text: "Welcome to HireGo.",
  language: "en",
  voiceKey: "hfc_female",
  createdAt: new Date(now - 10_000).toISOString(),
};

test("accepts a serialized speech receipt from development Redis", () => {
  assert.deepEqual(parseCandidateJarvisSpeechReceipt(JSON.stringify(fixture), fixture.userId, now), fixture);
});

test("accepts a JSON-deserialized object from Upstash Redis EVAL", () => {
  assert.deepEqual(parseCandidateJarvisSpeechReceipt(fixture, fixture.userId, now), fixture);
});

test("one-time speech receipts reject another candidate and malformed payloads", () => {
  assert.equal(parseCandidateJarvisSpeechReceipt(fixture, "candidate-456", now), null);
  assert.equal(parseCandidateJarvisSpeechReceipt({ ...fixture, userId: "" }, fixture.userId, now), null);
  assert.equal(parseCandidateJarvisSpeechReceipt({ ...fixture, text: "" }, fixture.userId, now), null);
  assert.equal(parseCandidateJarvisSpeechReceipt("{", fixture.userId, now), null);
  assert.equal(parseCandidateJarvisSpeechReceipt(null, fixture.userId, now), null);
});

test("speech receipts cannot be used after five minutes or far ahead of time", () => {
  assert.equal(parseCandidateJarvisSpeechReceipt({
    ...fixture, createdAt: new Date(now - 301_000).toISOString(),
  }, fixture.userId, now), null);
  assert.equal(parseCandidateJarvisSpeechReceipt({
    ...fixture, createdAt: new Date(now + 120_000).toISOString(),
  }, fixture.userId, now), null);
});

test("speech receipt remains single-use with atomic Redis consumption", () => {
  const s = fs.readFileSync(path.resolve(process.cwd(), "src/lib/jarvis/CandidateJarvisVoiceReceipt.ts"), "utf8");
  assert.ok(s.includes("await takeRedisValue(key(params.receiptId))"));
  assert.ok(!s.includes("await getRedisValue(key(params.receiptId))"));
});
