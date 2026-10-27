import crypto from "node:crypto";
import { z } from "zod";
import { setRedisValue, takeRedisValue } from "@/lib/redis";

const TTL_SECONDS = 5 * 60;

const speechReceiptSchema = z.object({
  version: z.literal(1),
  receiptId: z.string().uuid(),
  userId: z.string().min(1).max(200),
  text: z.string().trim().min(1).max(2_000),
  language: z.string().trim().min(2).max(16),
  voiceKey: z.string().trim().min(1).max(80),
  createdAt: z.string().datetime(),
}).strict();

export type CandidateJarvisSpeechReceipt = z.infer<typeof speechReceiptSchema>;

function key(receiptId: string) {
  return `candidate:jarvis:speech:v1:${receiptId}`;
}

export async function createCandidateJarvisSpeechReceipt(params: {
  userId: string;
  text: string;
  language: string;
  voiceKey: string;
}): Promise<CandidateJarvisSpeechReceipt> {
  const receipt = speechReceiptSchema.parse({
    version: 1,
    receiptId: crypto.randomUUID(),
    userId: params.userId,
    text: params.text.trim().slice(0, 2_000),
    language: params.language,
    voiceKey: params.voiceKey,
    createdAt: new Date().toISOString(),
  });
  await setRedisValue(key(receipt.receiptId), JSON.stringify(receipt), TTL_SECONDS);
  return receipt;
}

/**
 * Upstash can deserialize a Redis EVAL JSON response into an object before it
 * reaches the caller. Development Redis returns its raw serialized string.
 * Never double-JSON.parse a value that is already an object.
 *
 * Every receipt is additionally bound to its user and creation time. The
 * atomic takeRedisValue call, not this parser, enforces single consumption.
 */
export function parseCandidateJarvisSpeechReceipt(
  raw: unknown,
  userId: string,
  nowMs: number = Date.now(),
): CandidateJarvisSpeechReceipt | null {
  if (raw === null || raw === undefined) return null;
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const parsed = speechReceiptSchema.safeParse(value);
  if (!parsed.success || parsed.data.userId !== userId) return null;
  const createdMs = Date.parse(parsed.data.createdAt);
  if (!Number.isFinite(createdMs) ||
      createdMs > nowMs + 60_000 ||
      nowMs - createdMs > TTL_SECONDS * 1_000) {
    return null;
  }
  return parsed.data;
}

export async function takeCandidateJarvisSpeechReceipt(params: {
  receiptId: string;
  userId: string;
}): Promise<CandidateJarvisSpeechReceipt | null> {
  const raw: unknown = await takeRedisValue(key(params.receiptId));
  return parseCandidateJarvisSpeechReceipt(raw, params.userId);
}
