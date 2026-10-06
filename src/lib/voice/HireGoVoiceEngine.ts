import { z } from "zod";
import { assertSafeOutboundNetworkTarget } from "@/lib/security/outboundUrl";

const capabilitiesSchema = z.object({
  status: z.literal("ready"),
  workerVersion: z.string().trim().min(1).max(80),
  stt: z.object({
    ready: z.boolean(),
    provider: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(120),
  }).strict(),
  tts: z.object({
    ready: z.boolean(),
    provider: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(120),
  }).strict(),
  languages: z.array(z.string().trim().min(1).max(16)).max(20),
  voices: z.array(z.string().trim().min(1).max(80)).max(50),
}).strict();

const transcriptionSchema = z.object({
  transcript: z.string().trim().min(1).max(10_000),
  detectedLanguage: z.string().trim().min(1).max(32),
  confidence: z.number().finite().min(0).max(1).nullable(),
  durationSeconds: z.number().finite().min(0).max(300).nullable(),
  provider: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  workerVersion: z.string().trim().min(1).max(80),
}).strict();

export type HireGoVoiceCapabilities = z.infer<typeof capabilitiesSchema>;

function runtime() {
  const baseUrl = process.env.HIREGO_VOICE_ENGINE_URL?.trim();
  const token = process.env.HIREGO_VOICE_ENGINE_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new Error("HireGo Voice Engine runtime is not configured.");
  }
  if (process.env.NODE_ENV === "production" && token.length < 32) {
    throw new Error("HireGo Voice Engine token is not production eligible.");
  }
  return { baseUrl, token };
}

async function safeEndpoint(pathname: string): Promise<{ url: string; token: string }> {
  const { baseUrl, token } = runtime();
  const url = new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  if (process.env.NODE_ENV === "production") {
    await assertSafeOutboundNetworkTarget(url, {
      label: "HireGo Voice Engine URL",
      requireHttps: true,
    });
  }
  return { url, token };
}

export async function getHireGoVoiceCapabilities(timeoutMs = 5_000): Promise<HireGoVoiceCapabilities> {
  const { url, token } = await safeEndpoint("capabilities");
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`HireGo Voice Engine readiness returned HTTP ${response.status}`);
  }
  return capabilitiesSchema.parse(await response.json());
}

export async function transcribeHireGoVoice(params: {
  audio: File;
  expectedLanguage?: string | null;
  timeoutMs?: number;
}) {
  const { url, token } = await safeEndpoint("v1/stt");
  const form = new FormData();
  form.append("audio", params.audio, params.audio.name || "jarvis-voice.webm");
  if (params.expectedLanguage?.trim()) {
    form.append("expectedLanguage", params.expectedLanguage.trim().slice(0, 16));
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(params.timeoutMs ?? 60_000),
  });
  if (!response.ok) {
    throw new Error(`HireGo Voice Engine STT returned HTTP ${response.status}`);
  }
  return transcriptionSchema.parse(await response.json());
}

export async function synthesizeHireGoVoice(params: {
  text: string;
  voiceKey: string;
  language: string;
  timeoutMs?: number;
}): Promise<{ audio: Uint8Array; contentType: string }> {
  const text = params.text.trim().slice(0, 2_000);
  if (!text) throw new Error("Voice response text is empty.");
  const { url, token } = await safeEndpoint("v1/tts");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voiceKey: params.voiceKey.trim().slice(0, 80),
      language: params.language.trim().slice(0, 16),
    }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(params.timeoutMs ?? 45_000),
  });
  if (!response.ok) {
    throw new Error(`HireGo Voice Engine TTS returned HTTP ${response.status}`);
  }

  const declared = Number(response.headers.get("content-length") || "0");
  const maxBytes = 8 * 1024 * 1024;
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error("HireGo Voice Engine TTS response exceeded size limit.");
  }
  const audio = new Uint8Array(await response.arrayBuffer());
  if (!audio.length || audio.length > maxBytes) {
    throw new Error("HireGo Voice Engine returned invalid speech audio.");
  }
  return {
    audio,
    contentType: response.headers.get("content-type")?.split(";")[0] || "audio/wav",
  };
}
