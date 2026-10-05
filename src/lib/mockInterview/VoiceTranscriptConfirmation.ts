import crypto from "node:crypto";
import { z } from "zod";
import { setRedisValue, takeRedisValue } from "@/lib/redis";

const DRAFT_TTL_SECONDS = 5 * 60;

const draftSchema = z.object({
  version: z.literal(1),
  draftId: z.string().uuid(),
  userId: z.string().min(1).max(200),
  candidateProfileId: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0).max(50),
  transcript: z.string().trim().min(1).max(10_000),
  detectedLanguage: z.string().trim().min(1).max(32),
  durationSeconds: z.number().finite().min(0).max(300).nullable(),
  provider: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
  versionLabel: z.string().trim().min(1).max(160),
  createdAt: z.string().datetime(),
}).strict();

export type VoiceTranscriptDraft = z.infer<typeof draftSchema>;

function draftKey(draftId: string) {
  return `mock-interview:voice-draft:v1:${draftId}`;
}

export async function createVoiceTranscriptDraft(
  params: Omit<
    VoiceTranscriptDraft,
    "version" | "draftId" | "createdAt"
  >,
): Promise<VoiceTranscriptDraft> {
  const draft: VoiceTranscriptDraft = {
    ...params,
    version: 1,
    draftId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const parsed = draftSchema.parse(draft);
  await setRedisValue(
    draftKey(parsed.draftId),
    JSON.stringify(parsed),
    DRAFT_TTL_SECONDS,
  );
  return parsed;
}

export async function takeVoiceTranscriptDraft(params: {
  draftId: string;
  userId: string;
  candidateProfileId: string;
  sessionId: string;
  questionIndex: number;
}): Promise<VoiceTranscriptDraft | null> {
  const raw = await takeRedisValue(draftKey(params.draftId));
  if (!raw) return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = draftSchema.safeParse(json);
  if (!parsed.success) return null;

  const draft = parsed.data;
  if (
    draft.userId !== params.userId ||
    draft.candidateProfileId !== params.candidateProfileId ||
    draft.sessionId !== params.sessionId ||
    draft.questionIndex !== params.questionIndex
  ) {
    return null;
  }

  return draft;
}
