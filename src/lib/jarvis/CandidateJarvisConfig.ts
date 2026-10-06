import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const candidateJarvisConfigSchema = z.object({
  enabled: z.boolean().default(false),
  voiceEnabled: z.boolean().default(false),
  hybridRoutingEnabled: z.boolean().default(true),
  smartTaskType: z.string().trim().min(1).max(120).default("candidate-jarvis"),
  qualityTaskType: z.string().trim().min(1).max(120).default("candidate-jarvis-quality"),
  maxInputChars: z.number().int().min(100).max(4000).default(1600),
  maxApplicationsContext: z.number().int().min(1).max(25).default(8),
  maxInterviewsContext: z.number().int().min(1).max(20).default(5),
  maxJobsContext: z.number().int().min(1).max(20).default(6),
  deepReasoningKeywords: z.array(z.string().trim().min(1).max(80)).max(40).default([
    "compare",
    "why",
    "weakness",
    "improve",
    "strategy",
    "prepare",
    "career",
    "best fit",
    "likely questions",
    "explain deeply",
  ]),
}).strict();

export type CandidateJarvisConfig = z.infer<typeof candidateJarvisConfigSchema>;

export const DEFAULT_CANDIDATE_JARVIS_CONFIG: CandidateJarvisConfig =
  candidateJarvisConfigSchema.parse({});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readCandidateJarvisConfig(platformConfig: unknown): CandidateJarvisConfig {
  if (!isRecord(platformConfig)) return DEFAULT_CANDIDATE_JARVIS_CONFIG;
  const raw = platformConfig.candidateJarvis;
  if (raw === undefined) return DEFAULT_CANDIDATE_JARVIS_CONFIG;
  const parsed = candidateJarvisConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Stored Candidate Jarvis configuration is invalid.");
  }
  return parsed.data;
}

export async function getCandidateJarvisConfig(): Promise<CandidateJarvisConfig> {
  const row = await prisma.adminConfiguration.findUnique({
    where: { id: "global-admin-config" },
    select: { platformConfig: true },
  });
  return readCandidateJarvisConfig(row?.platformConfig ?? null);
}

export function mergeCandidateJarvisConfig(
  platformConfig: unknown,
  config: CandidateJarvisConfig,
): Prisma.InputJsonValue {
  const current = isRecord(platformConfig) ? { ...platformConfig } : {};
  current.candidateJarvis = candidateJarvisConfigSchema.parse(config);
  return current as Prisma.InputJsonValue;
}


export function isCandidateJarvisVoiceRuntimeConfigured(): boolean {
  const url = process.env.HIREGO_VOICE_ENGINE_URL?.trim();
  const token = process.env.HIREGO_VOICE_ENGINE_TOKEN?.trim();
  if (!url || !token) return false;
  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}
