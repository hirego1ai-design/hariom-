import crypto from "node:crypto";
import { z } from "zod";
import {
  getRedisValue,
  setRedisValue,
  takeRedisValue,
} from "@/lib/redis";

const RECEIPT_TTL_SECONDS = 5 * 60;

const receiptSchema = z.object({
  version: z.literal(1),
  receiptId: z.string().uuid(),
  userId: z.string().min(1).max(200),
  candidateProfileId: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0).max(50),
  transcript: z.string().trim().min(1).max(10_000),
  detectedLanguage: z.string().trim().min(1).max(32),
  confidence: z.number().finite().min(0).max(1).nullable(),
  durationSeconds: z.number().finite().min(0).max(300).nullable(),
  provider: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
  versionLabel: z.string().trim().min(1).max(160),
  workerVersion: z.string().trim().min(1).max(160).nullable(),
  confirmedByCandidate: z.boolean().default(false),
  transcriptSource: z.enum(["WORKER_CONFIDENT", "CANDIDATE_CONFIRMED"]),
  createdAt: z.string().datetime(),
}).strict();

export type VoiceTranscriptReceipt = z.infer<typeof receiptSchema>;

function receiptKey(receiptId: string) {
  return `mock-interview:voice-receipt:v1:${receiptId}`;
}

export async function createVoiceTranscriptReceipt(params: Omit<
  VoiceTranscriptReceipt,
  "version" | "receiptId" | "createdAt"
>): Promise<VoiceTranscriptReceipt> {
  const receipt: VoiceTranscriptReceipt = {
    ...params,
    version: 1,
    receiptId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const parsed = receiptSchema.parse(receipt);
  await setRedisValue(
    receiptKey(parsed.receiptId),
    JSON.stringify(parsed),
    RECEIPT_TTL_SECONDS,
  );
  return parsed;
}

export async function peekVoiceTranscriptReceipt(
  receiptId: string,
): Promise<VoiceTranscriptReceipt | null> {
  const raw = await getRedisValue(receiptKey(receiptId));
  if (!raw) return null;
  const parsed = receiptSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export async function takeVoiceTranscriptReceipt(params: {
  receiptId: string;
  userId: string;
  candidateProfileId: string;
  sessionId: string;
  questionIndex: number;
}): Promise<VoiceTranscriptReceipt | null> {
  const raw = await takeRedisValue(receiptKey(params.receiptId));
  if (!raw) return null;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = receiptSchema.safeParse(parsedJson);
  if (!parsed.success) return null;

  const receipt = parsed.data;
  if (
    receipt.userId !== params.userId ||
    receipt.candidateProfileId !== params.candidateProfileId ||
    receipt.sessionId !== params.sessionId ||
    receipt.questionIndex !== params.questionIndex
  ) {
    return null;
  }

  return receipt;
}
