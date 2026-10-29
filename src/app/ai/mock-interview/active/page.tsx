"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Hand,
  Play,
  Wifi,
  Volume2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Persona = {
  key: string;
  name: string;
  roleFamily: string;
  tone: string;
  rubricVersion: string;
};

type Turn = {
  id: string;
  questionIndex: number;
  questionText: string;
  difficulty: number | null;
  competency: string | null;
  skillTags: string[];
  candidateAnswerTranscript: string | null;
  score: number | null;
  feedback: string | null;
  evidenceConfidence: number | null;
};

type InterviewSession = {
  id: string;
  roleTarget: string;
  declaredSeniority: string | null;
  roleFamily: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  mode: "TEXT" | "VOICE";
  language: string;
  openingMessage: string | null;
  totalQuestions: number;
  currentQuestionIndex: number;
  persona: Persona | null;
  turns: Turn[];
};

type ChatMessage = {
  id: string;
  sender: "assistant" | "user";
  text: string;
  timestamp: string;
};

type LiveVoiceStatus =
  | "IDLE"
  | "ENV_CHECK"
  | "CONNECTING"
  | "SPEAKING"
  | "LISTENING"
  | "THINKING"
  | "MUTED";

// Environment check results
type EnvCheckState = "pending" | "pass" | "fail";
type EnvChecks = {
  mic: EnvCheckState;
  network: EnvCheckState;
  noise: EnvCheckState;
};

// ─── Streaming SSE event shapes ───────────────────────────────────────────────
type SSEEvent =
  | { type: "status"; state: "transcribing" | "thinking" | "speaking" }
  | { type: "transcript"; text: string }
  | { type: "reply_text"; text: string; turnIndex: number }
  | { type: "audio_chunk"; b64: string }
  | { type: "audio_end" }
  | { type: "error"; message: string };

// ─── Environment check icon (module scope) ───
function EnvCheckIcon({ state }: { state: EnvCheckState }) {
  if (state === "pending") return <Loader2 className="w-5 h-5 text-white/40 animate-spin" />;
  if (state === "pass") return <CheckCircle className="w-5 h-5 text-emerald-400" />;
  return <XCircle className="w-5 h-5 text-amber-400" />;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MockInterviewActivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [liveStatus, setLiveStatus] = useState<LiveVoiceStatus>("IDLE");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [interimUserText, setInterimUserText] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [envChecks, setEnvChecks] = useState<EnvChecks>({ mic: "pending", network: "pending", noise: "pending" });
  const [envChecksDone, setEnvChecksDone] = useState(false);

  // Refs
  const isMountedRef = useRef(true);
  const isInterviewEndingRef = useRef(false);
  const liveStatusRef = useRef<LiveVoiceStatus>("IDLE");
  const isMicMutedRef = useRef(false);
  const conversationRef = useRef<ChatMessage[]>([]);
  const isProcessingTurnRef = useRef(false);
  const sessionIdRef = useRef<string | null>(sessionId);
  const questionIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio playback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const pendingChunksRef = useRef<Uint8Array[]>([]);

  // MediaRecorder for mic capture
  const recorderRef = useRef<MediaRecorder | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const preSpeechChunksRef = useRef<Blob[]>([]);
  const recordingHasSpeechRef = useRef(false);
  const lastSpeechAtRef = useRef(0);
  const segmentStartedAtRef = useRef(0);
  const discardRecordingRef = useRef(false);
  const candidateTurnHandlerRef = useRef<(blob: Blob, mime: string) => Promise<void>>(async () => {});
  const startListeningCaptureRef = useRef<() => Promise<void>>(async () => {});
  const noiseBaselineRef = useRef(0);

  // Sync refs
  useEffect(() => { liveStatusRef.current = liveStatus; }, [liveStatus]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { isMicMutedRef.current = isMicMuted; }, [isMicMuted]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => {
    questionIndexRef.current = currentTurn?.questionIndex ?? session?.currentQuestionIndex ?? 0;
  }, [currentTurn?.questionIndex, session?.currentQuestionIndex]);

  // ─── Audio playback via Web Audio API ───
  // Declared before any useEffect that references it to satisfy React Compiler / ESLint ordering rules.
  const stopAllAudio = useCallback(() => {
    try { audioSourceRef.current?.stop(); } catch {}
    audioSourceRef.current = null;
    audioQueueRef.current = [];
    pendingChunksRef.current = [];
    isPlayingAudioRef.current = false;
  }, []);

  const getAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNextChunkRef = useRef<() => Promise<void>>(async () => {});

  const playNextChunk = useCallback(async () => {
    if (!isPlayingAudioRef.current) return;
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      return;
    }
    const ctx = await getAudioContext();
    const buffer = audioQueueRef.current.shift()!;
    try {
      const decoded = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      audioSourceRef.current = source;
      source.onended = () => {
        audioSourceRef.current = null;
        void playNextChunkRef.current();
      };
      source.start();
    } catch {
      void playNextChunkRef.current();
    }
  }, [getAudioContext]);

  useEffect(() => {
    playNextChunkRef.current = playNextChunk;
  }, [playNextChunk]);

  // Cleanup on unmount — inline ref operations to avoid forward-reference lint error
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      // Inline stopAllAudio to avoid referencing it before declaration
      try { audioSourceRef.current?.stop(); } catch {}
      audioSourceRef.current = null;
      audioQueueRef.current = [];
      pendingChunksRef.current = [];
      isPlayingAudioRef.current = false;
      microphoneStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Session timer
  useEffect(() => {
    if (!session || liveStatus === "IDLE" || liveStatus === "ENV_CHECK") return;
    timerRef.current = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session, liveStatus]);  const enqueueAudioChunk = useCallback((b64: string) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    pendingChunksRef.current.push(bytes);
    const totalBytes = pendingChunksRef.current.reduce((s, c) => s + c.length, 0);
    if (totalBytes >= 16 * 1024) {
      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const c of pendingChunksRef.current) { merged.set(c, offset); offset += c.length; }
      pendingChunksRef.current = [];
      audioQueueRef.current.push(merged.buffer);
      if (!isPlayingAudioRef.current) {
        isPlayingAudioRef.current = true;
        void playNextChunkRef.current();
      }
    }
  }, []);

  const flushAudioChunks = useCallback(() => {
    if (pendingChunksRef.current.length === 0) return;
    const totalBytes = pendingChunksRef.current.reduce((s, c) => s + c.length, 0);
    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const c of pendingChunksRef.current) { merged.set(c, offset); offset += c.length; }
    pendingChunksRef.current = [];
    if (totalBytes >= 128) {
      audioQueueRef.current.push(merged.buffer);
      if (!isPlayingAudioRef.current) {
        isPlayingAudioRef.current = true;
        void playNextChunkRef.current();
      }
    }
  }, []);

  // ─── Microphone setup ─────────────────────────────────────────────────────────
  const ensureMicrophone = useCallback(async () => {
    if (microphoneStreamRef.current?.getTracks().some((t) => t.readyState === "live")) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("This browser does not support microphone recording. Please use Chrome, Edge, or Safari.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    microphoneStreamRef.current = stream;
    const ctx = await getAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyserRef.current = analyser;
  }, [getAudioContext]);

  // ─── Environment check ────────────────────────────────────────────────────────
  const runEnvironmentChecks = useCallback(async () => {
    setLiveStatus("ENV_CHECK");
    setEnvChecks({ mic: "pending", network: "pending", noise: "pending" });
    setEnvChecksDone(false);

    // Check 1: Microphone
    try {
      await ensureMicrophone();
      setEnvChecks((p) => ({ ...p, mic: "pass" }));
    } catch {
      setEnvChecks((p) => ({ ...p, mic: "fail", network: "fail", noise: "fail" }));
      setEnvChecksDone(true);
      return;
    }

    // Check 2: Network speed (download a small probe)
    try {
      const start = Date.now();
      await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(3_000) });
      const ms = Date.now() - start;
      setEnvChecks((p) => ({ ...p, network: ms < 2000 ? "pass" : "fail" }));
    } catch {
      // Non-fatal — proceed anyway
      setEnvChecks((p) => ({ ...p, network: "pass" }));
    }

    // Check 3: Ambient noise level (1.5s sample)
    try {
      const analyser = analyserRef.current;
      if (analyser) {
        const samples = new Uint8Array(analyser.fftSize);
        await new Promise<void>((resolve) => setTimeout(resolve, 1500));
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          const v = (samples[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / samples.length);
        noiseBaselineRef.current = rms;
        // Pass if noise is below moderate threshold
        setEnvChecks((p) => ({ ...p, noise: rms < 0.04 ? "pass" : "fail" }));
      } else {
        setEnvChecks((p) => ({ ...p, noise: "pass" }));
      }
    } catch {
      setEnvChecks((p) => ({ ...p, noise: "pass" }));
    }

    setEnvChecksDone(true);
  }, [ensureMicrophone]);

  // ─── MediaRecorder capture ────────────────────────────────────────────────────
  const stopListeningCapture = useCallback((discard = true) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      discardRecordingRef.current = discard;
      try { recorderRef.current.stop(); } catch {}
    }
  }, []);

  const startListeningCapture = useCallback(async () => {
    if (
      !isMountedRef.current ||
      isInterviewEndingRef.current ||
      isMicMutedRef.current ||
      isProcessingTurnRef.current ||
      isPlayingAudioRef.current ||
      liveStatusRef.current === "SPEAKING" ||
      liveStatusRef.current === "THINKING" ||
      liveStatusRef.current === "CONNECTING"
    ) return;
    if (recorderRef.current && recorderRef.current.state !== "inactive") return;

    try {
      await ensureMicrophone();
      if (!isMountedRef.current || isMicMutedRef.current || isPlayingAudioRef.current) return;

      const stream = microphoneStreamRef.current;
      const analyser = analyserRef.current;
      if (!stream || !analyser) return;

      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      preSpeechChunksRef.current = [];
      recordingHasSpeechRef.current = false;
      lastSpeechAtRef.current = 0;
      segmentStartedAtRef.current = Date.now();
      discardRecordingRef.current = false;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (!event.data?.size) return;
        if (recordingHasSpeechRef.current) {
          recordingChunksRef.current.push(event.data);
        } else {
          preSpeechChunksRef.current = [...preSpeechChunksRef.current.slice(-2), event.data];
        }
      };

      recorder.onstop = async () => {
        if (recorderRef.current === recorder) recorderRef.current = null;
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        const discard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        const hadSpeech = recordingHasSpeechRef.current;
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recordingChunksRef.current = [];
        preSpeechChunksRef.current = [];
        recordingHasSpeechRef.current = false;

        if (discard || !hadSpeech || blob.size < 128) {
          if (
            isMountedRef.current &&
            !isInterviewEndingRef.current &&
            !isMicMutedRef.current &&
            !isPlayingAudioRef.current &&
            !isProcessingTurnRef.current &&
            liveStatusRef.current === "LISTENING"
          ) {
            void startListeningCaptureRef.current();
          }
          return;
        }

        await candidateTurnHandlerRef.current(blob, recorder.mimeType || "audio/webm");
      };

      recorder.start(250);
      setLiveStatus("LISTENING");

      const noiseThreshold = Math.max(0.015, noiseBaselineRef.current * 2.5);
      const samples = new Uint8Array(analyser.fftSize);

      const detectSpeech = () => {
        if (recorderRef.current !== recorder || recorder.state !== "recording") return;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          const v = (samples[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / samples.length);
        const now = Date.now();

        if (rms > noiseThreshold) {
          if (!recordingHasSpeechRef.current) {
            recordingHasSpeechRef.current = true;
            recordingChunksRef.current = [...preSpeechChunksRef.current];
            preSpeechChunksRef.current = [];
          }
          lastSpeechAtRef.current = now;
        }

        if (
          recordingHasSpeechRef.current &&
          (now - lastSpeechAtRef.current > 1200 || now - segmentStartedAtRef.current > 45_000)
        ) {
          animationFrameRef.current = null;
          try { recorder.stop(); } catch {}
          return;
        }

        animationFrameRef.current = requestAnimationFrame(detectSpeech);
      };

      animationFrameRef.current = requestAnimationFrame(detectSpeech);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Microphone access is required.");
      setLiveStatus("IDLE");
    }
  }, [ensureMicrophone]);

  useEffect(() => { startListeningCaptureRef.current = startListeningCapture; }, [startListeningCapture]);

  // ─── Streaming turn handler (SSE pipeline) ────────────────────────────────────
  const handleCandidateTurn = useCallback(async (blob: Blob, mime: string) => {
    const sid = sessionIdRef.current;
    if (!sid || isProcessingTurnRef.current || isInterviewEndingRef.current) return;

    isProcessingTurnRef.current = true;
    setLiveStatus("THINKING");
    setInterimUserText("Processing your response...");
    stopAllAudio();

    try {
      const form = new FormData();
      form.append("audio", blob, mime.startsWith("audio/mp4") ? "answer.mp4" : "answer.webm");
      form.append("sessionId", sid);
      form.append("questionIndex", String(questionIndexRef.current));
      form.append("history", JSON.stringify(
        conversationRef.current.slice(-8).map((m) => ({ role: m.sender, content: m.text })),
      ));

      const response = await fetch("/api/assessment/mock-interview/voice/stream-turn", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream failed to start.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let transcript = "";
      let saraText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!isMountedRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: SSEEvent;
          try { event = JSON.parse(line.slice(6)) as SSEEvent; } catch { continue; }

          switch (event.type) {
            case "status":
              if (event.state === "transcribing") setInterimUserText("Transcribing...");
              else if (event.state === "thinking") setInterimUserText("Sara is thinking...");
              else if (event.state === "speaking") {
                setInterimUserText("");
                setLiveStatus("SPEAKING");
                isPlayingAudioRef.current = true;
              }
              break;

            case "transcript":
              transcript = event.text;
              setInterimUserText(transcript);
              setConversation((prev) => [
                ...prev,
                {
                  id: `user-${Date.now()}`,
                  sender: "user",
                  text: transcript,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
              break;

            case "reply_text":
              saraText = event.text;
              questionIndexRef.current = event.turnIndex;
              setConversation((prev) => [
                ...prev,
                {
                  id: `assistant-${Date.now()}`,
                  sender: "assistant",
                  text: saraText,
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
              setSession((prev) =>
                prev ? { ...prev, currentQuestionIndex: event.turnIndex } : null,
              );
              break;

            case "audio_chunk":
              enqueueAudioChunk(event.b64);
              break;

            case "audio_end":
              flushAudioChunks();
              break;

            case "error":
              console.warn("[StreamTurn] Server error:", event.message);
              setInterimUserText("");
              // Only show persistent red alert for auth/config errors
              if (event.message.includes("not enabled") || event.message.includes("Unauthorized")) {
                setErrorMessage(event.message);
              }
              break;
          }
        }
      }
    } catch (err) {
      console.warn("[StreamTurn] Client error:", err instanceof Error ? err.message : err);
      setInterimUserText("");
    } finally {
      isProcessingTurnRef.current = false;
      // Wait for audio playback to finish before listening again
      const waitForAudio = () => {
        if (!isMountedRef.current || isInterviewEndingRef.current) return;
        if (isPlayingAudioRef.current || audioQueueRef.current.length > 0) {
          setTimeout(waitForAudio, 200);
          return;
        }
        const nextStatus = isMicMutedRef.current ? "MUTED" : "LISTENING";
        liveStatusRef.current = nextStatus;
        setLiveStatus(nextStatus);
        if (!isMicMutedRef.current) void startListeningCaptureRef.current();
      };
      setTimeout(waitForAudio, 200);
    }
  }, [stopAllAudio, enqueueAudioChunk, flushAudioChunks]);

  useEffect(() => { candidateTurnHandlerRef.current = handleCandidateTurn; }, [handleCandidateTurn]);

  // ─── Play Sara's opening greeting via stream ──────────────────────────────────
  const playSaraOpening = useCallback(async (text: string) => {
    const sid = sessionIdRef.current;
    if (!sid || !text) return;

    setLiveStatus("SPEAKING");
    isPlayingAudioRef.current = true;
    stopAllAudio();

    try {
      // Use a silent stub blob to kick off the stream-turn endpoint with just the opening text
      // We call the live-speech endpoint directly for the opening since it has no user audio
      const response = await fetch("/api/assessment/mock-interview/voice/live-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: sid, text, voiceKey: "sarah" }),
      });

      if (!response.ok) throw new Error("Opening speech failed");

      const blob = await response.blob();
      if (!isMountedRef.current) return;

      const arrayBuffer = await blob.arrayBuffer();
      const ctx = await getAudioContext();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      audioSourceRef.current = source;

      await new Promise<void>((resolve) => {
        source.onended = () => {
          audioSourceRef.current = null;
          resolve();
        };
        source.start();
      });
    } catch {
      // Fallback to browser TTS
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.05;
        await new Promise<void>((resolve) => {
          utt.onend = () => resolve();
          utt.onerror = () => resolve();
          window.speechSynthesis.speak(utt);
        });
      }
    } finally {
      isPlayingAudioRef.current = false;
      if (isMountedRef.current && !isInterviewEndingRef.current) {
        const nextStatus = isMicMutedRef.current ? "MUTED" : "LISTENING";
        liveStatusRef.current = nextStatus;
        setLiveStatus(nextStatus);
        if (!isMicMutedRef.current) void startListeningCapture();
      }
    }
  }, [getAudioContext, startListeningCapture, stopAllAudio]);

  // ─── Fetch session ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) { router.push("/ai/mock-interview/setup"); return; }
    const controller = new AbortController();

    async function fetchSession() {
      try {
        const res = await fetch(`/api/assessment/mock-interview/session?id=${sessionId}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data.session) {
          throw new Error(data?.error || "Could not load interview session.");
        }
        if (data.session.status === "COMPLETED") {
          router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
          return;
        }
        const active =
          data.session.turns.find((t: Turn) => t.questionIndex === data.session.currentQuestionIndex)
          || data.session.turns[0];

        setSession(data.session);
        setCurrentTurn(active);

        const msgs: ChatMessage[] = [];
        if (data.session.openingMessage) {
          msgs.push({ id: "opening", sender: "assistant", text: data.session.openingMessage, timestamp: "" });
        }
        for (const t of data.session.turns ?? []) {
          if (t.questionText && t.questionText !== data.session.openingMessage) {
            msgs.push({ id: `q-${t.questionIndex}`, sender: "assistant", text: t.questionText, timestamp: "" });
          }
          if (t.candidateAnswerTranscript) {
            msgs.push({ id: `a-${t.questionIndex}`, sender: "user", text: t.candidateAnswerTranscript, timestamp: "" });
          }
        }
        setConversation(msgs);
      } catch (err) {
        if (controller.signal.aborted) return;
        setErrorMessage(err instanceof Error ? err.message : "Failed to load session.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingSession(false);
      }
    }

    void fetchSession();
    return () => controller.abort();
  }, [sessionId, router]);

  // ─── Start live call ──────────────────────────────────────────────────────────
  const handleStartLiveCall = async () => {
    setErrorMessage(null);
    void runEnvironmentChecks();
  };

  const handleProceedAfterCheck = async () => {
    setLiveStatus("CONNECTING");
    try {
      await ensureMicrophone();
      const opening =
        (session?.openingMessage?.trim() || "") +
        " " +
        (currentTurn?.questionText?.trim() || "");
      const finalOpening = opening.trim() ||
        "Hello! I'm your interviewer today. Thank you for joining. Could you briefly introduce yourself and walk me through a recent project you're proud of?";

      setConversation((prev) => {
        if (prev.some((m) => m.id === "opening")) return prev;
        return [...prev, { id: "opening", sender: "assistant", text: finalOpening, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
      });

      await playSaraOpening(finalOpening);
    } catch {
      setErrorMessage("Microphone access is required. Please allow permissions and try again.");
      setLiveStatus("IDLE");
    }
  };

  // ─── Controls ─────────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    isMicMutedRef.current = next;
    if (next) { stopListeningCapture(true); setLiveStatus("MUTED"); }
    else { setLiveStatus("LISTENING"); void startListeningCapture(); }
  };

  const handleInterrupt = () => {
    stopAllAudio();
    isPlayingAudioRef.current = false;
    // Sync the ref immediately — startListeningCapture reads liveStatusRef synchronously
    liveStatusRef.current = "LISTENING";
    setLiveStatus("LISTENING");
    if (!isMicMutedRef.current) void startListeningCapture();
  };

  const finishInterview = async () => {
    if (!sessionId) return;
    setIsFinishing(true);
    isInterviewEndingRef.current = true;
    stopAllAudio();
    isProcessingTurnRef.current = false;
    stopListeningCapture(true);
    microphoneStreamRef.current?.getTracks().forEach((t) => t.stop());
    microphoneStreamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;

    try {
      await fetch("/api/assessment/mock-interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
    } catch { /* ignore, redirect anyway */ }
    router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
  };

  const isVoice = session?.mode === "VOICE";

  // ─── Loading / error states ───────────────────────────────────────────────────
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#4285F4] border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-white/50">Loading Interview Room...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#141416] p-6 text-center">
          <AlertCircle className="w-10 h-10 text-[#C5221F] mx-auto mb-3" />
          <h2 className="text-lg font-bold">Interview Unavailable</h2>
          <p className="text-xs text-white/60 mt-1 mb-6">{errorMessage || "Session not found."}</p>
          <Link href="/ai/mock-interview/setup" className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-[#4285F4] text-xs font-bold uppercase tracking-wider hover:bg-[#3367D6]">
            Start New Interview
          </Link>
        </div>
      </div>
    );
  }
  // ─── Environment check state helpers ───
const allChecksPass = envChecks.mic === "pass" && envChecks.network === "pass";
  const micFailed = envChecks.mic === "fail";

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col font-sans select-none">

      {/* ── Header ── */}
      <header className="h-16 border-b border-white/10 px-4 md:px-8 flex items-center justify-between bg-[#111114]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight">
            Hire<span className="text-[#C5221F]">Go</span>
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            {liveStatus !== "IDLE" && liveStatus !== "ENV_CHECK" && (
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className="text-xs font-semibold text-white/80">
              Mock Interview: <span className="text-white font-bold">{session.roleTarget}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {liveStatus !== "IDLE" && liveStatus !== "ENV_CHECK" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
              <Clock className="w-3.5 h-3.5 text-[#4285F4]" />
              <span>{Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}</span>
            </div>
          )}
          <button
            type="button"
            onClick={finishInterview}
            disabled={isFinishing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5221F]/20 hover:bg-[#C5221F]/30 text-[#FF6B6B] border border-[#C5221F]/30 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            {isFinishing ? "Finishing..." : "End"}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col">

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#C5221F]/15 border border-[#C5221F]/30 text-white flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
            <span className="text-xs md:text-sm leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {isVoice ? (
          <div className="flex-1 flex flex-col items-center justify-between gap-6 py-4">

            {/* ── Persona tag ── */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#4285F4] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                Interviewer: {session.persona?.name || "Sara"} · Live Voice
              </div>
              <h1 className="text-xl md:text-2xl font-semibold mt-2 text-white">Live Voice Interview</h1>
              <p className="text-xs text-white/50 mt-1">Speak naturally — Sara listens and responds in real time.</p>
            </div>

            {/* ── Environment check panel (shown when ENV_CHECK) ── */}
            {liveStatus === "ENV_CHECK" && (
              <div className="w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-base font-bold text-white mb-1">Checking your setup</h2>
                <p className="text-xs text-white/50 mb-5">
                  For the best experience, use a quiet space with a stable connection.
                </p>

                <div className="space-y-4">
                  {/* Mic */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        <Mic className="w-4.5 h-4.5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Microphone</p>
                        <p className="text-xs text-white/40">
                          {envChecks.mic === "pending" ? "Requesting access..." :
                           envChecks.mic === "pass" ? "Mic is ready" :
                           "Mic access denied — required"}
                        </p>
                      </div>
                    </div>
                    <EnvCheckIcon state={envChecks.mic} />
                  </div>

                  {/* Network */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        <Wifi className="w-4.5 h-4.5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Network speed</p>
                        <p className="text-xs text-white/40">
                          {envChecks.network === "pending" ? "Testing..." :
                           envChecks.network === "pass" ? "Connection looks good" :
                           "Slow connection detected — may affect quality"}
                        </p>
                      </div>
                    </div>
                    <EnvCheckIcon state={envChecks.network} />
                  </div>

                  {/* Noise */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        <Volume2 className="w-4.5 h-4.5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Background noise</p>
                        <p className="text-xs text-white/40">
                          {envChecks.noise === "pending" ? "Listening for a moment..." :
                           envChecks.noise === "pass" ? "Environment is quiet" :
                           "Some noise detected — find a quieter spot if possible"}
                        </p>
                      </div>
                    </div>
                    <EnvCheckIcon state={envChecks.noise} />
                  </div>
                </div>

                {envChecksDone && (
                  <div className="mt-6">
                    {micFailed ? (
                      <p className="text-xs text-[#C5221F] text-center">
                        Microphone access is required. Please allow it in your browser and reload.
                      </p>
                    ) : (
                      <>
                        {envChecks.noise === "fail" && (
                          <p className="text-xs text-amber-400/80 text-center mb-3">
                            Tip: Move to a quieter spot or use headphones for best results.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handleProceedAfterCheck}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4285F4] to-indigo-600 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:opacity-95 transition-all"
                        >
                          {allChecksPass ? "Everything looks good — Start Interview" : "Continue Anyway"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Voice orb (shown during active interview) ── */}
            {liveStatus !== "ENV_CHECK" && liveStatus !== "IDLE" && (
              <div className="relative flex flex-col items-center justify-center my-2">
                <div className={`relative flex h-52 w-52 md:h-64 md:w-64 items-center justify-center rounded-full transition-all duration-700 ${
                  liveStatus === "SPEAKING" ? "scale-105 shadow-[0_0_100px_rgba(66,133,244,0.45)] ring-4 ring-[#4285F4]/50"
                  : liveStatus === "LISTENING" ? "scale-100 shadow-[0_0_90px_rgba(16,185,129,0.35)] ring-4 ring-emerald-500/50"
                  : liveStatus === "THINKING" ? "scale-95 shadow-[0_0_80px_rgba(168,85,247,0.35)] ring-4 ring-purple-500/50 animate-pulse"
                  : liveStatus === "MUTED" ? "shadow-[0_0_40px_rgba(197,34,31,0.25)] ring-2 ring-[#C5221F]/40"
                  : "shadow-[0_0_50px_rgba(255,255,255,0.06)] border border-white/10"
                }`}>
                  <div className={`absolute inset-2 rounded-full transition-all duration-700 blur-xl opacity-75 ${
                    liveStatus === "SPEAKING" ? "bg-gradient-to-tr from-[#4285F4] via-cyan-400 to-indigo-600 animate-spin"
                    : liveStatus === "LISTENING" ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500"
                    : liveStatus === "THINKING" ? "bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 animate-pulse"
                    : liveStatus === "MUTED" ? "bg-gradient-to-tr from-[#C5221F] to-orange-700"
                    : "bg-gradient-to-tr from-white/10 to-white/5"
                  }`} style={{ animationDuration: "8s" }} />

                  <div className="relative z-10 flex flex-col items-center justify-center bg-[#0D0D11] h-40 w-40 md:h-48 md:w-48 rounded-full border border-white/15 backdrop-blur-2xl">
                    {liveStatus === "SPEAKING" ? (
                      <div className="flex items-center gap-1.5 h-10">
                        {[12, 28, 44, 20, 36, 16, 32].map((h, i) => (
                          <span key={i} className="w-1.5 bg-[#4285F4] rounded-full animate-bounce"
                            style={{ height: `${h}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.6s" }} />
                        ))}
                      </div>
                    ) : liveStatus === "LISTENING" ? (
                      <div className="flex flex-col items-center">
                        <Mic className="w-12 h-12 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mt-1">Listening</span>
                      </div>
                    ) : liveStatus === "THINKING" ? (
                      <div className="flex flex-col items-center">
                        <Sparkles className="w-10 h-10 text-purple-400 animate-spin" style={{ animationDuration: "3s" }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mt-1">Processing</span>
                      </div>
                    ) : liveStatus === "MUTED" ? (
                      <div className="flex flex-col items-center">
                        <MicOff className="w-10 h-10 text-[#C5221F]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mt-1">Muted</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Radio className="w-10 h-10 text-white/50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">Connecting</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status pill */}
                <div className="mt-5 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
                  {liveStatus === "SPEAKING" && <><span className="h-2 w-2 rounded-full bg-[#4285F4] animate-ping" /><span>Sara is speaking — interrupt anytime</span></>}
                  {liveStatus === "LISTENING" && <><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span>Listening — speak freely</span></>}
                  {liveStatus === "THINKING" && <><span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" /><span>Processing your response...</span></>}
                  {liveStatus === "MUTED" && <><span className="h-2 w-2 rounded-full bg-[#C5221F]" /><span>Microphone muted</span></>}
                  {liveStatus === "CONNECTING" && <><span className="h-2 w-2 rounded-full bg-white/40 animate-pulse" /><span>Starting interview...</span></>}
                </div>
              </div>
            )}

            {/* ── Transcript bubbles ── */}
            {liveStatus !== "ENV_CHECK" && (
              <div className="w-full max-w-2xl bg-[#141418] border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between pb-1 border-b border-white/5">
                  <span>Live Transcript</span>
                  <span className="text-white/20 font-mono">AI Voice Interview</span>
                </div>

                {conversation.length === 0 && !interimUserText && (
                  <div className="text-center text-xs text-white/40 py-4">
                    {liveStatus === "IDLE" ? "Click 'Start Interview' below." : "Starting..."}
                  </div>
                )}

                {conversation.slice(-3).map((msg) => (
                  <div key={msg.id} className={`flex flex-col text-xs leading-relaxed ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] font-semibold text-white/40 mb-0.5">
                      {msg.sender === "user" ? "You" : session.persona?.name || "Sara"}
                    </span>
                    <div className={`p-3 rounded-xl max-w-[85%] ${
                      msg.sender === "user"
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-100"
                        : "bg-white/5 border border-white/10 text-white/90"
                    }`}>{msg.text}</div>
                  </div>
                ))}

                {interimUserText && (
                  <div className="flex flex-col items-end text-xs leading-relaxed">
                    <span className="text-[10px] font-semibold text-emerald-400 mb-0.5">You</span>
                    <div className="p-3 rounded-xl max-w-[85%] bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 animate-pulse">
                      {interimUserText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Action controls ── */}
            <div className="flex items-center gap-3">
              {liveStatus === "IDLE" && (
                <button
                  type="button"
                  onClick={handleStartLiveCall}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#4285F4] to-indigo-600 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-xl hover:opacity-95 transition-all"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Start Interview
                </button>
              )}

              {liveStatus !== "IDLE" && liveStatus !== "ENV_CHECK" && liveStatus !== "CONNECTING" && (
                <>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition-all ${
                      isMicMuted
                        ? "bg-[#C5221F]/20 border-[#C5221F] text-[#C5221F]"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/15"
                    }`}
                    title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {liveStatus === "SPEAKING" && (
                    <button
                      type="button"
                      onClick={handleInterrupt}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-purple-600/20 border border-purple-500/40 px-5 text-xs font-bold uppercase tracking-wider text-purple-300 hover:bg-purple-600/30 transition-all"
                    >
                      <Hand className="h-4 w-4" />
                      Interrupt
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={finishInterview}
                    disabled={isFinishing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#C5221F]/20 hover:border-[#C5221F]/40 hover:text-[#FF6B6B] transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finish
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── Text mode fallback ── */
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
              <span className="text-xs font-bold uppercase text-[#4285F4]">
                Question {currentTurn ? currentTurn.questionIndex + 1 : 1}
              </span>
              <h2 className="text-lg font-medium text-white mt-2 leading-relaxed">
                {currentTurn?.questionText}
              </h2>
            </div>
            <textarea
              value={session?.openingMessage ?? ""}
              readOnly
              rows={8}
              className="w-full rounded-2xl border border-white/10 bg-[#121216] p-4 text-sm text-white focus:outline-none focus:border-[#4285F4]"
            />
            <button
              type="button"
              onClick={finishInterview}
              className="self-end px-6 py-3 rounded-xl bg-[#4285F4] text-xs font-bold uppercase tracking-wider hover:bg-[#3367D6]"
            >
              Finish Interview
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
