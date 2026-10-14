"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mic2, Square, Loader2, Volume2, AudioLines, VolumeX,
  X, Radio, Sparkles, MessageSquare, Hand
} from "lucide-react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type JarvisReply = {
  message: string;
  actions: Array<{ label: string; href: string }>;
  speechReceiptId?: string | null;
  audio?: string | null;
};

type ChatItem = {
  id: string;
  role: "user" | "jarvis";
  text: string;
  reply?: JarvisReply;
  audioUrl?: string | null;
};

type LiveStage = "listening" | "thinking" | "speaking" | "paused";

export default function CandidateJarvisPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState("");

  // Live Voice Mode States (GPT-4o / Gemini Live Voice-to-Voice)
  const [liveMode, setLiveMode] = useState(false);
  const [liveStage, setLiveStage] = useState<LiveStage>("listening");
  const [liveMuted, setLiveMuted] = useState(false);
  const [liveHeard, setLiveHeard] = useState("");
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveActions, setLiveActions] = useState<Array<{ label: string; href: string }>>([]);

  const liveActiveRef = useRef(false);
  const liveSequenceRef = useRef(0);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveRecorderRef = useRef<MediaRecorder | null>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const livePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);
  const liveBlobUrlRef = useRef<string | null>(null);
  const liveOrbRef = useRef<HTMLDivElement | null>(null);

  // Standard Turn-based recording refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "jarvis",
      text: "Ask me to open jobs, check applications, show your next interview, find matching jobs, or reason about your career and interview preparation.",
    },
  ]);
  const chatScrollRef = useRef<HTMLElement | null>(null);

  // Unlock browser audio upon initial user interaction to bypass autoplay restrictions
  const unlockAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const silent = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silent.volume = 0.01;
      void silent.play().catch(() => {});
      if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/candidate/jarvis", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) throw new Error(payload.error || "Jarvis readiness unavailable.");
        setEnabled(Boolean(payload.enabled));
        setVoiceEnabled(Boolean(payload.voiceEnabled));
      })
      .catch((cause) => {
        setEnabled(false);
        setError(cause instanceof Error ? cause.message : "Jarvis readiness unavailable.");
      });
  }, []);

  useEffect(() => {
    if (items.length > 1 && chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [items, busy]);

  // Bulletproof spoken voice playback (Server neural audio Blob with instant Web Speech fallback)
  const playSpokenVoice = useCallback((audioData: string | null | undefined, text: string, onEnded?: () => void) => {
    let played = false;

    const speakWithWebSpeech = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neural") || v.name.includes("Ava") || v.name.includes("Jenny"))) || voices.find((v) => v.lang.startsWith("en"));
          if (preferred) utterance.voice = preferred;
          utterance.onend = () => { onEnded?.(); };
          utterance.onerror = () => { onEnded?.(); };
          window.speechSynthesis.speak(utterance);
          return;
        } catch {}
      }
      onEnded?.();
    };

    if (audioData) {
      try {
        let playableUrl = audioData;
        if (audioData.startsWith("data:")) {
          const parts = audioData.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1] || "audio/mpeg";
          const bin = atob(parts[1]);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          const blob = new Blob([arr], { type: mime });
          playableUrl = URL.createObjectURL(blob);
          liveBlobUrlRef.current = playableUrl;
        }
        const audio = new Audio(playableUrl);
        liveAudioRef.current = audio;
        audio.onended = () => {
          liveAudioRef.current = null;
          if (liveBlobUrlRef.current) {
            URL.revokeObjectURL(liveBlobUrlRef.current);
            liveBlobUrlRef.current = null;
          }
          onEnded?.();
        };
        audio.onerror = () => {
          liveAudioRef.current = null;
          if (!played) speakWithWebSpeech();
        };
        audio.play().then(() => {
          played = true;
        }).catch(() => {
          liveAudioRef.current = null;
          speakWithWebSpeech();
        });
      } catch {
        speakWithWebSpeech();
      }
    } else {
      speakWithWebSpeech();
    }
  }, []);

  const silenceLiveAudio = useCallback(() => {
    if (liveAudioRef.current) {
      liveAudioRef.current.pause();
      liveAudioRef.current.onended = null;
      liveAudioRef.current.onerror = null;
      liveAudioRef.current = null;
    }
    if (liveBlobUrlRef.current) {
      URL.revokeObjectURL(liveBlobUrlRef.current);
      liveBlobUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Cleanup live media & VAD analyzer
  const releaseLiveMedia = useCallback(() => {
    if (livePollRef.current) clearInterval(livePollRef.current);
    livePollRef.current = null;
    if (liveOrbRef.current) liveOrbRef.current.style.setProperty("--voice-level", "0");
    if (liveRecorderRef.current && liveRecorderRef.current.state === "recording") {
      try { liveRecorderRef.current.stop(); } catch {}
    }
    liveRecorderRef.current = null;
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    if (liveAudioContextRef.current) {
      void liveAudioContextRef.current.close().catch(() => {});
      liveAudioContextRef.current = null;
    }
    liveAnalyserRef.current = null;
  }, []);

  // Stop live conversation session
  const stopLiveSession = useCallback(() => {
    liveActiveRef.current = false;
    liveSequenceRef.current += 1;
    silenceLiveAudio();
    releaseLiveMedia();
    setLiveMode(false);
  }, [releaseLiveMedia, silenceLiveAudio]);

  // Execute one turn in Live Voice Mode
  const executeLiveTurn = useCallback(async (audioBlob: Blob, generation: number) => {
    if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;
    setLiveStage("thinking");

    try {
      const type = audioBlob.type || "audio/webm";
      const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("audio", new File([audioBlob], "live-turn." + ext, { type }));

      const res = await fetch("/api/candidate/jarvis/voice/live-turn", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not understand your voice. Please try again.");
      }

      if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;

      const userText = data.heard || "";
      const replyMessage = data.reply?.message || "";
      const actions = data.reply?.actions || [];
      const audioUrl = data.audio || null;

      setLiveHeard(userText);
      setLiveAnswer(replyMessage);
      setLiveActions(actions);

      // Save to chat history
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: userText },
        {
          id: crypto.randomUUID(),
          role: "jarvis",
          text: replyMessage,
          reply: { message: replyMessage, actions, audio: audioUrl },
          audioUrl,
        },
      ]);

      setLiveStage("speaking");

      // Speak answer out loud with real sound!
      playSpokenVoice(audioUrl, replyMessage, () => {
        // Automatically resume listening for the next question (hands-free loop!)
        if (liveActiveRef.current && liveSequenceRef.current === generation) {
          void startLiveListening(generation);
        }
      });
    } catch (err) {
      if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;
      setError(err instanceof Error ? err.message : "Voice turn failed.");
      setLiveStage("listening");
      void startLiveListening(generation);
    }
  }, [playSpokenVoice]); // startLiveListening is hoisted via ref or inline

  const executeLiveTurnRef = useRef(executeLiveTurn);
  useEffect(() => { executeLiveTurnRef.current = executeLiveTurn; }, [executeLiveTurn]);

  // Start listening with real-time Voice Activity Detection (VAD)
  const startLiveListening = useCallback(async (generation: number) => {
    if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;
    setLiveStage("listening");

    try {
      let stream = liveStreamRef.current;
      if (!stream || stream.getAudioTracks().every((t) => t.readyState !== "live")) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        liveStreamRef.current = stream;
      }

      // Initialize Web Audio analyzer for real-time RMS visualizer and VAD
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = liveAudioContextRef.current || new AudioCtx();
      liveAudioContextRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      liveAnalyserRef.current = analyser;

      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((t) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
      );
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      liveRecorderRef.current = recorder;

      const turnChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) turnChunks.push(e.data);
      };

      recorder.onstop = () => {
        if (livePollRef.current) clearInterval(livePollRef.current);
        livePollRef.current = null;
        if (liveOrbRef.current) liveOrbRef.current.style.setProperty("--voice-level", "0");
        const blob = new Blob(turnChunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 256 && liveActiveRef.current && liveSequenceRef.current === generation) {
          void executeLiveTurnRef.current(blob, generation);
        }
      };

      // VAD tracking
      const pcmData = new Float32Array(analyser.fftSize);
      let speechStartedAt = 0;
      let lastSpeechAt = 0;
      const SILENCE_THRESHOLD_MS = 650;
      const POWER_THRESHOLD = 0.035;

      livePollRef.current = setInterval(() => {
        if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;
        analyser.getFloatTimeDomainData(pcmData);
        let sumSquares = 0;
        for (let i = 0; i < pcmData.length; i++) sumSquares += pcmData[i] * pcmData[i];
        const rms = Math.sqrt(sumSquares / pcmData.length);

        // Update CSS voice amplitude
        if (liveOrbRef.current) {
          const scaled = Math.min(1, rms * 14);
          liveOrbRef.current.style.setProperty("--voice-level", scaled.toFixed(3));
        }

        const now = Date.now();
        if (rms > POWER_THRESHOLD) {
          if (!speechStartedAt) speechStartedAt = now;
          lastSpeechAt = now;
        } else if (speechStartedAt && lastSpeechAt && (now - lastSpeechAt > SILENCE_THRESHOLD_MS)) {
          // Candidate finished speaking! Trigger automatic turn.
          if (now - speechStartedAt >= 400 && recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, 50);

      recorder.start(100);
    } catch (err) {
      if (!liveActiveRef.current || liveSequenceRef.current !== generation) return;
      setError("Microphone access unavailable. Please allow microphone permissions.");
      stopLiveSession();
    }
  }, [stopLiveSession]);

  // Launch Live Voice Mode (Gemini Live / GPT-4o style)
  const startLiveVoiceSession = useCallback(() => {
    unlockAudio();
    silenceLiveAudio();
    releaseLiveMedia();
    const generation = liveSequenceRef.current + 1;
    liveSequenceRef.current = generation;
    liveActiveRef.current = true;
    setLiveMode(true);
    setLiveStage("listening");
    setLiveHeard("");
    setLiveAnswer("");
    setLiveActions([]);
    setError("");
    void startLiveListening(generation);
  }, [releaseLiveMedia, silenceLiveAudio, startLiveListening, unlockAudio]);

  // Barge-in Interrupt (if Jarvis is speaking or thinking)
  const interruptLiveVoice = useCallback(() => {
    silenceLiveAudio();
    const generation = liveSequenceRef.current + 1;
    liveSequenceRef.current = generation;
    void startLiveListening(generation);
  }, [silenceLiveAudio, startLiveListening]);

  // Standard Turn-based Voice Recording (Legacy/Direct option)
  async function toggleRecording() {
    if (!voiceEnabled || voiceBusy) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support microphone recording. You can still type a message.");
      return;
    }

    unlockAudio();
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((type) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
      );
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (!blob.size) return;
        setVoiceBusy(true);
        setError("");
        try {
          const form = new FormData();
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
          form.append("audio", new File([blob], "jarvis-voice." + ext, { type }));

          const response = await fetch("/api/candidate/jarvis/voice/live-turn", {
            method: "POST",
            body: form,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload.success) {
            throw new Error(payload.error || "HireGo could not understand your voice. Please try again.");
          }

          const userUtterance = payload.heard || "Voice question";
          const jarvisReply = payload.reply;
          const audioUrl = payload.audio || null;

          setItems((current) => [
            ...current,
            { id: crypto.randomUUID(), role: "user", text: userUtterance },
            {
              id: crypto.randomUUID(),
              role: "jarvis",
              text: jarvisReply?.message || "",
              reply: {
                message: jarvisReply?.message || "",
                actions: jarvisReply?.actions || [],
                audio: audioUrl,
              },
              audioUrl,
            },
          ]);

          // PLAY SPOKEN VOICE OUT LOUD IMMEDIATELY (WITH SOUND!)
          playSpokenVoice(audioUrl, jarvisReply?.message || "");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Voice conversation failed. Please try again.");
        } finally {
          setVoiceBusy(false);
        }
      };
      recorder.start(250);
      setRecording(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone access is unavailable.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
    }
  }

  // Hear previous reply
  async function hearReply(receiptId: string, directAudioUrl?: string | null, textMessage?: string) {
    if (voiceBusy) return;
    unlockAudio();
    if (directAudioUrl || textMessage) {
      playSpokenVoice(directAudioUrl, textMessage || "");
      return;
    }
    if (!receiptId) return;
    setVoiceBusy(true);
    setError("");
    try {
      const response = await fetch("/api/candidate/jarvis/voice/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "HireGo speech output is unavailable.");
      }
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
      audio.addEventListener("error", () => URL.revokeObjectURL(url), { once: true });
      await audio.play();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "HireGo speech output is unavailable.");
    } finally {
      setVoiceBusy(false);
    }
  }

  // Send typed message
  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy || enabled !== true) return;

    setInput("");
    setError("");
    setBusy(true);
    const userId = crypto.randomUUID();
    setItems((current) => [...current, { id: userId, role: "user", text: message }]);

    try {
      const response = await fetch("/api/candidate/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.reply) {
        throw new Error(payload.error || "Jarvis could not answer this request.");
      }
      const reply = payload.reply as JarvisReply;
      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "jarvis",
          text: reply.message,
          reply,
        },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Jarvis could not answer this request.");
      setInput(message);
      setItems((current) => current.filter((item) => item.id !== userId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              HireGo Hybrid Assistant
            </p>
            <h1 className="mt-1 text-3xl font-extrabold flex items-center gap-2">
              Jarvis
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                <Sparkles className="h-3 w-3" /> Live Voice
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              Your career companion for jobs, applications and interview preparation. Speak or type to Jarvis.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {enabled === null ? "Connecting…" : enabled ? "Ready to help" : "Unavailable"}
            </span>
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {voiceEnabled ? "Voice ready" : "Voice unavailable"}
            </span>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}>
            {error}
          </div>
        )}

        {/* ============================================================== */}
        {/* LIVE VOICE-TO-VOICE MODE (Gemini Live / GPT-4o Experience)      */}
        {/* ============================================================== */}
        {liveMode ? (
          <div className="mt-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0a0f1d] via-[#050811] to-[#020408] p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-cyan-500/15 via-purple-500/10 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar with Live Badge & Close */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Live Voice Mode</span>
              </div>
              <button
                type="button"
                onClick={stopLiveSession}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Exit Live Voice Mode"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Centered Glowing 3D Glassmorphic Voice Orb */}
            <div className="my-8 flex flex-col items-center justify-center relative z-10">
              <div className="relative flex items-center justify-center">
                {/* Outer dynamic audio wave rings */}
                <div
                  className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-cyan-400/20 transition-transform duration-75"
                  style={{ transform: `scale(calc(1 + var(--voice-level, 0) * 0.45))` }}
                />
                <div
                  className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-purple-400/15 transition-transform duration-75"
                  style={{ transform: `scale(calc(1 + var(--voice-level, 0) * 0.7))` }}
                />

                {/* Main Orb */}
                <div
                  ref={liveOrbRef}
                  onClick={() => {
                    if (liveStage === "speaking") {
                      interruptLiveVoice();
                    } else if (liveStage === "listening" && liveRecorderRef.current?.state === "recording") {
                      liveRecorderRef.current.stop();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`jarvis-voice-orb jarvis-voice-orb--${liveStage} cursor-pointer transition-all duration-150`}
                  title={liveStage === "speaking" ? "Tap to interrupt Jarvis" : "Tap to complete sentence"}
                >
                  <div className="jarvis-voice-orb__highlight" />
                  <div className="jarvis-voice-orb__icon">
                    {liveStage === "speaking" ? (
                      <Volume2 className="h-7 w-7 text-white animate-pulse" />
                    ) : liveStage === "thinking" ? (
                      <Loader2 className="h-7 w-7 text-white animate-spin" />
                    ) : (
                      <Mic2 className="h-7 w-7 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-6 text-center">
                <p className="text-lg font-extrabold text-white">
                  {liveStage === "listening"
                    ? "Listening to you…"
                    : liveStage === "thinking"
                    ? "Jarvis is thinking…"
                    : "Jarvis is speaking aloud…"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {liveStage === "listening"
                    ? "Speak freely. Jarvis will detect your silence and answer automatically."
                    : liveStage === "speaking"
                    ? "Tap the orb or button below to interrupt at any time."
                    : "Analyzing your request and preparing a spoken response…"}
                </p>
              </div>

              {/* Real-time Subtitle Heads-Up Display */}
              {(liveHeard || liveAnswer) && (
                <div className="mt-6 w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 p-4 text-sm backdrop-blur-md space-y-2">
                  {liveHeard && (
                    <p className="text-slate-300">
                      <span className="text-cyan-400 font-bold mr-1.5">You:</span>
                      {liveHeard}
                    </p>
                  )}
                  {liveAnswer && (
                    <p className="text-slate-100">
                      <span className="text-purple-400 font-bold mr-1.5">Jarvis:</span>
                      {liveAnswer}
                    </p>
                  )}
                  {liveActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {liveActions.map((action) => (
                        <Link
                          key={action.href + action.label}
                          href={action.href}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 transition-all"
                        >
                          {action.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Live Voice Controls */}
              <div className="mt-8 flex items-center justify-center gap-3">
                {liveStage === "speaking" && (
                  <button
                    type="button"
                    onClick={interruptLiveVoice}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all"
                  >
                    <Hand className="h-4 w-4" /> Interrupt & Speak
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLiveMuted((m) => !m)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                    liveMuted ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {liveMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {liveMuted ? "Unmute" : "Mute audio"}
                </button>
                <button
                  type="button"
                  onClick={stopLiveSession}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-300 transition-all"
                >
                  <Square className="h-4 w-4" /> End Live Voice
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* HERO BANNER: ONE-TAP LIVE VOICE CONVERSATION                   */
          /* ============================================================== */
          voiceEnabled && enabled === true && (
            <div className="mt-5 relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 border-cyan-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-cyan-400 opacity-20"></span>
                    <AudioLines className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">Live Voice Conversation</h2>
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">
                        GPT-4o Style
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300 max-w-lg">
                      Continuous, real-time voice-to-voice conversation. Just tap start and talk naturally — Jarvis answers out loud with voice in real time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startLiveVoiceSession}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)" }}
                    aria-label="Start voice conversation"
                  >
                    <Radio className="h-4 w-4 animate-pulse" />
                    Start Live Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleRecording()}
                    disabled={voiceBusy}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-50"
                    aria-label={recording ? "Stop voice recording" : "Quick audio turn"}
                  >
                    {recording ? <Square className="h-4 w-4 text-red-400" /> : <Mic2 className="h-4 w-4" />}
                    {recording ? "Stop" : "Quick Turn"}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {enabled === false && (
          <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
            <p className="font-bold">Jarvis is not available right now.</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Your normal HireGo candidate portal remains available.
            </p>
            <Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-bold" style={{ borderColor: "var(--outline)" }}>
              Back to dashboard
            </Link>
          </div>
        )}

        {/* Conversation History */}
        <section ref={chatScrollRef} aria-label="Jarvis conversation" className="mt-6 h-[clamp(360px,50vh,620px)] overflow-y-auto rounded-3xl border p-4 sm:p-6" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${item.role === "user" ? "ml-auto" : "mr-auto"}`}
                style={{
                  backgroundColor: item.role === "user" ? "var(--primary)" : "var(--surface-container-high)",
                  color: item.role === "user" ? "#fff" : "var(--text-primary)",
                }}
              >
                <p>{item.text}</p>
                {item.reply && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => void hearReply(item.reply?.speechReceiptId || "", item.audioUrl, item.reply?.message)}
                        disabled={voiceBusy}
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                        Hear
                      </button>
                    )}
                    {item.reply.actions.map((action) => (
                      <Link
                        key={`${item.id}-${action.href}-${action.label}`}
                        href={action.href}
                        className="inline-flex min-h-10 items-center rounded-xl border px-3 py-2 text-xs font-bold"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {busy && (
              <div className="mr-auto rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--surface-container-high)" }}>
                Working…
              </div>
            )}
          </div>
        </section>

        {/* Bottom Text & Quick-Voice Input Form */}
        <form onSubmit={send} className="sticky bottom-[72px] md:bottom-4 mt-4 flex gap-2 rounded-2xl border p-2 shadow-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={4000}
            disabled={busy || enabled !== true}
            placeholder={enabled ? "Ask Jarvis…" : "Jarvis is disabled"}
            className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void toggleRecording()}
            disabled={!voiceEnabled || voiceBusy || enabled !== true}
            aria-label={recording ? "Stop recording" : voiceEnabled ? "Speak to Jarvis" : "Voice unavailable"}
            title={recording ? "Stop recording" : voiceEnabled ? "Speak to Jarvis" : "Voice is not ready yet. You can still type your message."}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 font-semibold disabled:opacity-40"
            style={{
              borderColor: recording ? "var(--primary)" : "var(--outline)",
              backgroundColor: recording ? "var(--primary)" : "transparent",
              color: recording ? "#fff" : "inherit"
            }}
          >
            {recording ? <Square className="h-4 w-4" aria-hidden="true" /> : voiceBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mic2 className="h-4 w-4" aria-hidden="true" />}
            <span className="text-xs">{recording ? "Stop" : voiceBusy ? "Working" : "Speak"}</span>
          </button>
          <button
            type="submit"
            disabled={busy || enabled !== true || !input.trim()}
            className="min-h-12 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Send
          </button>
        </form>

        {voiceEnabled && (
          <p role="status" className="mt-2 px-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {recording
              ? "Listening… tap Stop to review your words before sending."
              : voiceBusy
                ? "Preparing your voice message…"
                : "Tap Speak to record. Review and edit the transcript before sending."}
          </p>
        )}
      </main>
    </div>
  );
}
