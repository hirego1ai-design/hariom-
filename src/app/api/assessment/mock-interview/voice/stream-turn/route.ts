/**
 * POST /api/assessment/mock-interview/voice/stream-turn
 *
 * Single streaming endpoint that replaces the 4-step HTTP chain:
 *   1. Receives audio blob + session metadata
 *   2. Streams SSE: status → transcript → reply_text → audio_chunk(s) → audio_end
 *
 * SSE event format:  data: <JSON>\n\n
 * Event types:
 *   { type: "status",      state: "transcribing"|"thinking"|"speaking" }
 *   { type: "transcript",  text: string }
 *   { type: "reply_text",  text: string, turnIndex: number }
 *   { type: "audio_chunk", b64: string }      — base64 encoded mp3 chunk (~8 KB)
 *   { type: "audio_end" }
 *   { type: "error",       message: string }
 */

import { NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { ApiError, enforceRateLimit } from "@/lib/apiSecurity";
import { getMockInterviewVoiceConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { transcribeMockInterviewAudio } from "@/lib/mockInterview/SpeechToTextService";
import { resolveElevenLabsVoiceId } from "@/lib/mockInterview/TextToSpeechService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "video/webm",
]);

function sseEvent(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function cleanSpokenWords(raw: string): string {
  return raw
    .replace(/^(\*.*?\*|Sara:|Interviewer:)/gi, "")
    .replace(/[*_[\]#]/g, "")
    .replace(/["""]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateSaraReply(
  candidateSpeech: string,
  history: Array<{ role: string; content: string }>,
  roleTarget: string,
  seniority: string,
): Promise<string> {
  const systemPrompt = `You are Sara, a Senior Executive Technical Interviewer with 10+ years of hiring experience at top technology companies.

You are conducting a live spoken first-round interview for "${roleTarget}" at the ${seniority} level.

CRITICAL LIVE VOICE RULES:
1. You are speaking out loud on a real-time voice call. Not typing.
2. Maximum 2 spoken sentences (under 35 words total). Crisp, punchy, natural spoken English.
3. Sentence 1: Acknowledge or react to their previous point authentically (never say "Great point").
4. Sentence 2: Ask the next clear, role-specific interview question.
5. NEVER use markdown, bullet points, asterisks, emojis, or action tags. Output ONLY plain spoken words.
6. Ignore ambient background noise or side-conversations — evaluate only the candidate's technical response.`;

  // Groq — fastest (~400-800ms)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-4),
            { role: "user", content: candidateSpeech },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
        const text = json.choices?.[0]?.message?.content?.trim();
        if (text) return cleanSpokenWords(text);
      }
    } catch { /* fallthrough */ }
  }

  // Gemini fallback
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const prompt = [systemPrompt, "",
        ...history.slice(-4).map((h) => `${h.role === "assistant" ? "Sara" : "Candidate"}: ${h.content}`),
        `Candidate: ${candidateSpeech}`, "Sara:",
      ].join("\n");

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 120, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(6_000),
        },
      );
      if (res.ok) {
        const json = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return cleanSpokenWords(text);
      }
    } catch { /* fallthrough */ }
  }

  return `That is a strong point. Walk me through the most critical trade-off you made as a ${roleTarget}.`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      controllerRef = null;
    },
  });

  const send = (payload: Record<string, unknown>) => {
    try {
      controllerRef?.enqueue(encoder.encode(sseEvent(payload)));
    } catch { /* stream closed */ }
  };

  const close = () => {
    try {
      controllerRef?.close();
    } catch { /* already closed */ }
  };

  // Run the pipeline async while streaming events back
  void (async () => {
    try {
      // ── Auth ──────────────────────────────────────────────────
      const auth = await getCurrentSession(request.headers);
      if (!auth || auth.role !== "CANDIDATE") {
        send({ type: "error", message: "Unauthorized." });
        close();
        return;
      }

      await enforceRateLimit(request, `mock_interview_stream:${auth.id}`, 60, 60_000);

      let config: ReturnType<typeof getMockInterviewVoiceConfig>;
      try {
        config = getMockInterviewVoiceConfig();
      } catch {
        send({ type: "error", message: "Voice interview is not available." });
        close();
        return;
      }
      if (!config.enabled) {
        send({ type: "error", message: "Voice interview is not enabled." });
        close();
        return;
      }

      // ── Parse multipart form ──────────────────────────────────
      const form = await request.formData();
      const audio = form.get("audio");
      const sessionId = String(form.get("sessionId") || "").trim();
      const questionIndex = Number(String(form.get("questionIndex") || "0"));
      const historyRaw = String(form.get("history") || "[]");

      if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
        send({ type: "error", message: "Invalid session." });
        close();
        return;
      }
      if (!(audio instanceof File)) {
        send({ type: "error", message: "Audio recording is required." });
        close();
        return;
      }

      const mediaType = (audio.type || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_AUDIO_TYPES.has(mediaType) && !ALLOWED_AUDIO_TYPES.has(audio.type || "")) {
        send({ type: "error", message: "Unsupported audio format." });
        close();
        return;
      }
      if (audio.size < 128 || audio.size > config.maxAudioBytes) {
        send({ type: "error", message: "Audio size out of range." });
        close();
        return;
      }

      let history: Array<{ role: string; content: string }> = [];
      try {
        const parsed = JSON.parse(historyRaw);
        if (Array.isArray(parsed)) {
          history = parsed.slice(-8).filter(
            (h) => h && typeof h.role === "string" && typeof h.content === "string",
          );
        }
      } catch { /* ignore */ }

      // ── Session ownership check ───────────────────────────────
      const [candidateProfile, interviewSession] = await Promise.all([
        prisma.candidateProfile.findUnique({ where: { userId: auth.id }, select: { id: true } }),
        prisma.mockInterviewSession.findUnique({
          where: { id: sessionId },
          include: {
            persona: { select: { voiceKey: true, displayName: true } },
            turns: { where: { questionIndex }, take: 1 },
          },
        }),
      ]);

      if (!candidateProfile || !interviewSession || interviewSession.candidateProfileId !== candidateProfile.id) {
        send({ type: "error", message: "Session not found." });
        close();
        return;
      }
      if (interviewSession.status !== "IN_PROGRESS") {
        send({ type: "error", message: "Interview is not in progress." });
        close();
        return;
      }

      const turn = interviewSession.turns[0] ?? await prisma.mockInterviewTurn.findFirst({
        where: { sessionId: interviewSession.id },
        orderBy: { questionIndex: "desc" },
      });

      // ── Step 1: Transcribe ────────────────────────────────────
      send({ type: "status", state: "transcribing" });

      let transcript: string;
      try {
        const sttResult = await transcribeMockInterviewAudio({
          audio,
          expectedLanguage: interviewSession.language,
          roleTarget: interviewSession.roleTarget,
          skillTags: turn?.skillTags ?? [],
        });
        transcript = sttResult.transcript;
      } catch (sttError) {
        console.error("[StreamTurn] STT failed:", sttError instanceof Error ? sttError.message : sttError);
        send({ type: "error", message: "Could not hear that clearly. Please speak again." });
        close();
        return;
      }

      send({ type: "transcript", text: transcript });

      // ── Step 2: LLM reply ─────────────────────────────────────
      send({ type: "status", state: "thinking" });

      const saraReply = await generateSaraReply(
        transcript,
        history,
        interviewSession.roleTarget,
        interviewSession.declaredSeniority || "Mid-Level",
      );

      const nextQuestionIndex = Math.max(
        ...[...interviewSession.turns.map((t) => t.questionIndex), questionIndex],
      ) + 1;

      // Persist turn
      await prisma.mockInterviewTurn.create({
        data: {
          sessionId: interviewSession.id,
          questionIndex: nextQuestionIndex,
          questionText: saraReply,
          candidateAnswerTranscript: transcript,
          score: 75,
          feedback: "Live spoken turn recorded.",
        },
      });
      await prisma.mockInterviewSession.update({
        where: { id: interviewSession.id },
        data: {
          currentQuestionIndex: nextQuestionIndex,
          totalQuestions: Math.max(interviewSession.totalQuestions, nextQuestionIndex + 1),
        },
      });

      send({ type: "reply_text", text: saraReply, turnIndex: nextQuestionIndex });

      // ── Step 3: TTS — stream audio in chunks ──────────────────
      send({ type: "status", state: "speaking" });

      const voiceKey = interviewSession.persona?.voiceKey?.trim() || "sarah";
      const elevenKey = process.env.ELEVENLABS_API_KEY?.trim();

      if (elevenKey) {
        const voiceId = resolveElevenLabsVoiceId(voiceKey);
        // Use ElevenLabs streaming endpoint for lowest-latency audio delivery
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`,
          {
            method: "POST",
            headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: saraReply,
              model_id: "eleven_turbo_v2_5",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
            signal: AbortSignal.timeout(20_000),
          },
        );

        if (ttsRes.ok && ttsRes.body) {
          const CHUNK_SIZE = 8 * 1024; // 8 KB chunks
          const reader = ttsRes.body.getReader();
          let buffer = new Uint8Array(0);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Accumulate into buffer
            const merged = new Uint8Array(buffer.length + value.length);
            merged.set(buffer);
            merged.set(value, buffer.length);
            buffer = merged;

            // Emit full chunks as they arrive
            while (buffer.length >= CHUNK_SIZE) {
              const chunk = buffer.slice(0, CHUNK_SIZE);
              buffer = buffer.slice(CHUNK_SIZE);
              send({ type: "audio_chunk", b64: Buffer.from(chunk).toString("base64") });
            }
          }

          // Emit any remaining bytes
          if (buffer.length > 0) {
            send({ type: "audio_chunk", b64: Buffer.from(buffer).toString("base64") });
          }

          send({ type: "audio_end" });
          close();
          return;
        }

        console.warn("[StreamTurn] ElevenLabs stream failed, falling back to buffered TTS");
      }

      // Fallback: fetch full audio and send as chunks
      try {
        const { synthesizeMockInterviewSpeech } = await import("@/lib/mockInterview/TextToSpeechService");
        const speech = await synthesizeMockInterviewSpeech({
          text: saraReply,
          voiceKey,
          language: interviewSession.language || "en",
        });

        const CHUNK_SIZE = 8 * 1024;
        for (let i = 0; i < speech.audio.byteLength; i += CHUNK_SIZE) {
          const chunk = speech.audio.slice(i, i + CHUNK_SIZE);
          send({ type: "audio_chunk", b64: Buffer.from(chunk).toString("base64") });
        }
        send({ type: "audio_end" });
      } catch (ttsErr) {
        console.error("[StreamTurn] TTS failed:", ttsErr);
        send({ type: "error", message: "Voice synthesis is temporarily unavailable." });
      }

      close();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "An unexpected error occurred.";
      console.error("[StreamTurn] Pipeline error:", err);
      send({ type: "error", message: msg });
      close();
    }
  })();

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",       // disable nginx buffering
      "X-Content-Type-Options": "nosniff",
    },
  });
}
