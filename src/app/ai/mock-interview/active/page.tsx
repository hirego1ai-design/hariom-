"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  PhoneOff,
  Radio,
  Hand,
  VolumeX,
  Play,
  RotateCcw,
} from "lucide-react";

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
  | "CONNECTING"
  | "SPEAKING"
  | "LISTENING"
  | "THINKING"
  | "MUTED";

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

  // Live Duplex Voice States
  const [liveStatus, setLiveStatus] = useState<LiveVoiceStatus>("IDLE");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [interimUserText, setInterimUserText] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Text Mode States (for text assessment fallback)
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [turnEvaluation, setTurnEvaluation] = useState<any>(null);
  const [showOpening, setShowOpening] = useState(false);

  // References for live full-duplex conversation
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  const isMountedRef = useRef(true);
  const accumulatedSpeechRef = useRef("");
  const liveStatusRef = useRef<LiveVoiceStatus>("IDLE");
  const isMicMutedRef = useRef(false);
  const conversationRef = useRef<ChatMessage[]>([]);
  const isProcessingTurnRef = useRef(false);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Stop Sara's Audio immediately (Barge-In)
  const stopSaraSpeaking = useCallback(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current);
      stopSaraSpeaking();
      try {
        recognitionRef.current?.abort?.();
      } catch {}
      recognitionRef.current = null;
    };
  }, [stopSaraSpeaking]);

  // Fetch Session
  useEffect(() => {
    if (!sessionId) {
      router.push("/ai/mock-interview/setup");
      return;
    }

    const controller = new AbortController();

    async function fetchSession() {
      try {
        const res = await fetch(
          `/api/assessment/mock-interview/session?id=${sessionId}`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success || !data.session) {
          throw new Error(data?.error || "Could not load interview session.");
        }

        if (data.session.status === "COMPLETED") {
          router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
          return;
        }

        const active =
          data.session.turns.find(
            (t: Turn) => t.questionIndex === data.session.currentQuestionIndex,
          ) || data.session.turns[0];

        setSession(data.session);
        setCurrentTurn(active);

        // Prepopulate conversation history from all completed turns
        const initialMessages: ChatMessage[] = [];
        if (data.session.openingMessage) {
          initialMessages.push({
            id: "opening",
            sender: "assistant",
            text: data.session.openingMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
        }
        if (Array.isArray(data.session.turns)) {
          for (const t of data.session.turns) {
            if (t.questionText && t.questionText !== data.session.openingMessage) {
              initialMessages.push({
                id: `q-${t.questionIndex}`,
                sender: "assistant",
                text: t.questionText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              });
            }
            if (t.candidateAnswerTranscript) {
              initialMessages.push({
                id: `a-${t.questionIndex}`,
                sender: "user",
                text: t.candidateAnswerTranscript,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              });
            }
          }
        }
        setConversation(initialMessages);
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

  // Overall Session Timer
  useEffect(() => {
    if (!session || liveStatus === "IDLE") return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, liveStatus]);

  // Recover only when the candidate should be listening; delay prevents tight browser restart loops.
  const scheduleRecognitionRestart = useCallback(() => {
    if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current);
    recognitionRestartTimerRef.current = setTimeout(() => {
      recognitionRestartTimerRef.current = null;
      if (!isMountedRef.current || isMicMutedRef.current || isProcessingTurnRef.current ||
          liveStatusRef.current !== "LISTENING" || isPlayingRef.current || !recognitionRef.current) return;
      try { recognitionRef.current.start(); } catch { /* Already starting/listening. */ }
    }, 700);
  }, []);

  // Play Sara's speech (ElevenLabs Sarah voice, with fallback)
  const playSaraSpeech = useCallback(
    async (text: string) => {
      if (!text || !sessionId) return;
      stopSaraSpeaking();
      isPlayingRef.current = true;
      setLiveStatus("SPEAKING");

      try {
        const response = await fetch("/api/assessment/mock-interview/voice/live-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            text,
            voiceKey: "sarah",
          }),
        });

        if (!response.ok) {
          throw new Error("Speech synthesis failed");
        }

        const blob = await response.blob();
        if (!isMountedRef.current || !isPlayingRef.current) return;

        const objectUrl = URL.createObjectURL(blob);
        audioObjectUrlRef.current = objectUrl;
        const audio = new Audio(objectUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          const releaseUrl = () => {
            if (audioObjectUrlRef.current === objectUrl) {
              URL.revokeObjectURL(objectUrl);
              audioObjectUrlRef.current = null;
            }
          };
          audio.onended = () => { releaseUrl(); if (audioRef.current === audio) audioRef.current = null; resolve(); };
          audio.onerror = () => { releaseUrl(); if (audioRef.current === audio) audioRef.current = null; reject(new Error("Audio playback failed")); };
          void audio.play().catch((error) => { releaseUrl(); if (audioRef.current === audio) audioRef.current = null; reject(error); });
        });
      } catch (err) {
        if (audioObjectUrlRef.current) {
          URL.revokeObjectURL(audioObjectUrlRef.current);
          audioObjectUrlRef.current = null;
        }
        // Fallback: If network/ElevenLabs fails, speak via Web Speech API
        if (typeof window !== "undefined" && "speechSynthesis" in window && isPlayingRef.current) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          utterance.rate = 1.05;
          const voices = window.speechSynthesis.getVoices();
          const natural = voices.find(
            (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Google")),
          );
          if (natural) utterance.voice = natural;
          await new Promise<void>((resolve) => {
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          });
        }
      } finally {
        if (isMountedRef.current && isPlayingRef.current) {
          isPlayingRef.current = false;
          setLiveStatus(isMicMutedRef.current ? "MUTED" : "LISTENING");
          if (!isMicMutedRef.current) scheduleRecognitionRestart();
        }
      }
    },
    [sessionId, stopSaraSpeaking, scheduleRecognitionRestart],
  );

  // Send candidate speech to LLM and trigger Sara's live response
  const handleCandidateFinishedSpeaking = useCallback(
    async (candidateSpeech: string) => {
      const cleanSpeech = candidateSpeech.trim();
      if (!cleanSpeech || !sessionId || isProcessingTurnRef.current) return;
      isProcessingTurnRef.current = true;
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      setLiveStatus("THINKING");
      setInterimUserText("");
      accumulatedSpeechRef.current = "";

      // Append candidate speech to chat
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: cleanSpeech,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setConversation((prev) => [...prev, userMsg]);

      try {
        const historyPayload = conversationRef.current.slice(-6).map((m) => ({
          role: m.sender,
          content: m.text,
        }));

        const res = await fetch("/api/assessment/mock-interview/live-turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            candidateSpeech: cleanSpeech,
            history: historyPayload,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success || !data.replyText || (data.turnScore !== undefined && typeof data.turnScore !== "number")) {
          throw new Error(data?.error || "Could not process live conversation turn.");
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: data.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setConversation((prev) => [...prev, assistantMsg]);

        // Sara speaks the response out loud with ElevenLabs
        await playSaraSpeech(data.replyText);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Error in live discussion.");
        setLiveStatus("LISTENING");
      } finally {
        isProcessingTurnRef.current = false;
        if (liveStatusRef.current === "LISTENING" && !isMicMutedRef.current) scheduleRecognitionRestart();
      }
    },
    [sessionId, playSaraSpeech, scheduleRecognitionRestart],
  );

  // Setup Continuous Speech Recognition with Instant Barge-In
  const startLiveRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecClass) {
      setErrorMessage("Live speech recognition requires Google Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch {}

    const recognition = new SpeechRecClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (isMicMutedRef.current || isProcessingTurnRef.current ||
          liveStatusRef.current === "SPEAKING" || liveStatusRef.current === "THINKING" ||
          liveStatusRef.current === "CONNECTING") return;

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      if (final.trim()) {
        accumulatedSpeechRef.current = (accumulatedSpeechRef.current + " " + final).trim();
      }
      setInterimUserText(interim || accumulatedSpeechRef.current);

      // Debounce: detect when candidate pauses speaking (~550ms for snappy natural response)
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      speechTimerRef.current = setTimeout(() => {
        const fullCandidateSpeech = accumulatedSpeechRef.current.trim();
        if (fullCandidateSpeech.length >= 4 && !isProcessingTurnRef.current) {
          void handleCandidateFinishedSpeaking(fullCandidateSpeech);
        }
      }, 900);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.warn("[LiveInterview] Speech recognition notice:", e.error);
      }
    };

    recognition.onend = () => {
      // Do not restart in a tight onend loop; recover only during the listening phase.
      if (liveStatusRef.current === "LISTENING" && !isMicMutedRef.current) scheduleRecognitionRestart();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.warn("Could not start continuous speech recognition:", err);
    }
  }, [handleCandidateFinishedSpeaking, scheduleRecognitionRestart]);

  // Connect to Live Interview Room
  const handleStartLiveCall = async () => {
    setLiveStatus("CONNECTING");
    setErrorMessage(null);

    try {
      // SpeechRecognition manages microphone permission itself. Avoid opening a second
      // microphone stream that can compete with recognition on mobile browsers.
      startLiveRecognition();

      // Start with Sara's opening / first question
      const opening =
        session?.openingMessage ||
        currentTurn?.questionText ||
        "Hello! I'm Sara, your interviewer today. Thank you for joining. To begin, could you briefly introduce yourself and share a key challenge you worked on recently?";

      await playSaraSpeech(opening);
    } catch (err) {
      setErrorMessage(
        "Microphone access is required for the live interview. Please allow microphone permissions in your browser.",
      );
      setLiveStatus("IDLE");
    }
  };

  // Toggle Microphone
  const toggleMute = () => {
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    isMicMutedRef.current = nextState;
    if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current);
    if (nextState) {
      setLiveStatus("MUTED");
      try {
        recognitionRef.current?.stop();
      } catch {}
    } else {
      setLiveStatus("LISTENING");
      scheduleRecognitionRestart();
    }
  };

  // Manual Interrupt Button
  const handleManualInterrupt = () => {
    stopSaraSpeaking();
    setLiveStatus("LISTENING");
    if (!isMicMutedRef.current) scheduleRecognitionRestart();
  };

  // End Interview & Complete
  const finishInterview = async () => {
    if (!sessionId) return;
    setIsFinishing(true);
    stopSaraSpeaking();
    if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current);
    isProcessingTurnRef.current = false;
    try { recognitionRef.current?.abort?.(); } catch {}

    try {
      await fetch("/api/assessment/mock-interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
    } catch (err) {
      setErrorMessage("Could not finalize report. Redirecting to summary...");
      router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
    }
  };

  const isVoice = session?.mode === "VOICE";

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#4285F4] border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-white/50">
            Connecting to Live Interview Room...
          </p>
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
          <p className="text-xs text-white/60 mt-1 mb-6">
            {errorMessage || "We could not locate this interview session."}
          </p>
          <Link
            href="/ai/mock-interview/setup"
            className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-[#4285F4] text-xs font-bold uppercase tracking-wider hover:bg-[#3367D6]"
          >
            Start New Interview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col font-sans select-none">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/10 px-4 md:px-8 flex items-center justify-between bg-[#111114]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-xl tracking-tight">
            <span>Hire<span className="text-[#C5221F]">Go</span></span>
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white/80">
              Live Mock Interview: <span className="text-white font-bold">{session.roleTarget}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
            <Clock className="w-3.5 h-3.5 text-[#4285F4]" />
            <span>
              {Math.floor(elapsedSeconds / 60)}:
              {(elapsedSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <button
            type="button"
            onClick={finishInterview}
            disabled={isFinishing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5221F]/20 hover:bg-[#C5221F]/30 text-[#FF6B6B] border border-[#C5221F]/30 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            {isFinishing ? "Finishing..." : "End Call"}
          </button>
        </div>
      </header>

      {/* Main Live Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-[#C5221F]/15 border border-[#C5221F]/30 text-white flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {isVoice ? (
          /* =========================================================
             LIVE FULL-DUPLEX GEMINI-STYLE CONVERSATIONAL ROOM
             ========================================================= */
          <div className="flex-1 flex flex-col items-center justify-between gap-6 py-4">
            {/* Top Persona Tag */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#4285F4] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                Interviewer: {session.persona?.name || "Sara"} (Executive HR & Technical)
              </div>
              <h1 className="text-xl md:text-2xl font-semibold mt-2 text-white">
                Live Full-Duplex Voice Discussion
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Take turns speaking with Sara. Use the interrupt button to stop her audio.
              </p>
            </div>

            {/* Central Animated Neural Voice Orb */}
            <div className="relative flex flex-col items-center justify-center my-4">
              <div
                className={`relative flex h-52 w-52 md:h-64 md:w-64 items-center justify-center rounded-full transition-all duration-700 ${
                  liveStatus === "SPEAKING"
                    ? "scale-105 shadow-[0_0_100px_rgba(66,133,244,0.45)] ring-4 ring-[#4285F4]/50"
                    : liveStatus === "LISTENING"
                      ? "scale-100 shadow-[0_0_90px_rgba(16,185,129,0.35)] ring-4 ring-emerald-500/50"
                      : liveStatus === "THINKING"
                        ? "scale-95 shadow-[0_0_80px_rgba(168,85,247,0.35)] ring-4 ring-purple-500/50 animate-pulse"
                        : liveStatus === "MUTED"
                          ? "shadow-[0_0_40px_rgba(197,34,31,0.25)] ring-2 ring-[#C5221F]/40"
                          : "shadow-[0_0_50px_rgba(255,255,255,0.06)] border border-white/10"
                }`}
              >
                {/* Background Fluid Gradient */}
                <div
                  className={`absolute inset-2 rounded-full transition-all duration-700 blur-xl opacity-75 ${
                    liveStatus === "SPEAKING"
                      ? "bg-gradient-to-tr from-[#4285F4] via-cyan-400 to-indigo-600 animate-spin"
                      : liveStatus === "LISTENING"
                        ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500"
                        : liveStatus === "THINKING"
                          ? "bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 animate-pulse"
                          : liveStatus === "MUTED"
                            ? "bg-gradient-to-tr from-[#C5221F] to-orange-700"
                            : "bg-gradient-to-tr from-white/10 to-white/5"
                  }`}
                  style={{ animationDuration: "8s" }}
                />

                {/* Center Core */}
                <div className="relative z-10 flex flex-col items-center justify-center bg-[#0D0D11] h-40 w-40 md:h-48 md:w-48 rounded-full border border-white/15 backdrop-blur-2xl">
                  {liveStatus === "SPEAKING" ? (
                    <div className="flex items-center gap-1.5 h-10">
                      {[12, 28, 44, 20, 36, 16, 32].map((height, i) => (
                        <span
                          key={i}
                          className="w-1.5 bg-[#4285F4] rounded-full animate-bounce"
                          style={{
                            height: `${height}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: "0.6s",
                          }}
                        />
                      ))}
                    </div>
                  ) : liveStatus === "LISTENING" ? (
                    <div className="flex flex-col items-center">
                      <Mic className="w-12 h-12 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mt-1">
                        Listening
                      </span>
                    </div>
                  ) : liveStatus === "THINKING" ? (
                    <div className="flex flex-col items-center">
                      <Sparkles className="w-10 h-10 text-purple-400 animate-spin" style={{ animationDuration: "3s" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/80 mt-1">
                        Thinking
                      </span>
                    </div>
                  ) : liveStatus === "MUTED" ? (
                    <div className="flex flex-col items-center">
                      <MicOff className="w-10 h-10 text-[#C5221F]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mt-1">
                        Mic Muted
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Radio className="w-10 h-10 text-white/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-1">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <div className="mt-5 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80">
                {liveStatus === "SPEAKING" && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[#4285F4] animate-ping" />
                    <span>Sara is speaking</span>
                  </>
                )}
                {liveStatus === "LISTENING" && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Listening to you... Speak freely</span>
                  </>
                )}
                {liveStatus === "THINKING" && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <span>Sara is formulating response...</span>
                  </>
                )}
                {liveStatus === "MUTED" && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[#C5221F]" />
                    <span>Microphone is muted</span>
                  </>
                )}
                {liveStatus === "IDLE" && (
                  <>
                    <span className="h-2 w-2 rounded-full bg-white/40" />
                    <span>Click &quot;Start Live Call&quot; to begin conversation</span>
                  </>
                )}
              </div>
            </div>

            {/* Live Real-Time Transcript Bubbles */}
            <div className="w-full max-w-2xl bg-[#141418] border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-3 min-h-[140px] max-h-[220px] overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center justify-between pb-1 border-b border-white/5">
                <span>Live Spoken Transcript</span>
                <span className="text-emerald-400 font-mono">ElevenLabs + Groq Voice Engine</span>
              </div>

              {conversation.length === 0 && !interimUserText && (
                <div className="text-center text-xs text-white/40 py-6">
                  {liveStatus === "IDLE"
                    ? "Click 'Start Live Call' below to connect with Sara."
                    : "Conversation is starting..."}
                </div>
              )}

              {conversation.slice(-3).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col text-xs leading-relaxed ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[10px] font-semibold text-white/40 mb-0.5">
                    {msg.sender === "user" ? "You" : session.persona?.name || "Sara"}
                  </span>
                  <div
                    className={`p-3 rounded-xl max-w-[85%] ${
                      msg.sender === "user"
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-100"
                        : "bg-white/5 border border-white/10 text-white/90"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {interimUserText && (
                <div className="flex flex-col items-end text-xs leading-relaxed">
                  <span className="text-[10px] font-semibold text-emerald-400 mb-0.5">You (speaking...)</span>
                  <div className="p-3 rounded-xl max-w-[85%] bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 animate-pulse">
                    {interimUserText}
                  </div>
                </div>
              )}
            </div>

            {/* Live Action Controls (Hands-free duplex) */}
            <div className="flex items-center gap-3">
              {liveStatus === "IDLE" ? (
                <button
                  type="button"
                  onClick={handleStartLiveCall}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#4285F4] to-indigo-600 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-xl hover:opacity-95 transition-all"
                >
                  <Play className="h-5 w-5 fill-current" />
                  Start Live Call
                </button>
              ) : (
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
                      onClick={handleManualInterrupt}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-purple-600/20 border border-purple-500/40 px-5 text-xs font-bold uppercase tracking-wider text-purple-300 hover:bg-purple-600/30 transition-all"
                    >
                      <Hand className="h-4 w-4" />
                      Interrupt Sara
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={finishInterview}
                    disabled={isFinishing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#C5221F]/20 hover:border-[#C5221F]/40 hover:text-[#FF6B6B] transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete & View Scorecard
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* =========================================================
             FALLBACK TEXT ASSESSMENT MODE
             ========================================================= */
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
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here..."
              rows={8}
              className="w-full rounded-2xl border border-white/10 bg-[#121216] p-4 text-sm text-white focus:outline-none focus:border-[#4285F4]"
            />

            <button
              type="button"
              onClick={finishInterview}
              className="self-end px-6 py-3 rounded-xl bg-[#4285F4] text-xs font-bold uppercase tracking-wider hover:bg-[#3367D6]"
            >
              Submit & Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
