"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Send,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Gauge,
  ShieldCheck,
  Mic2,
  Square,
  Volume2,
  AudioLines,
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

type AdaptiveEvaluation = {
  score: number;
  feedback: string;
  evidenceConfidence: number;
  demonstratedLevel:
    | "JUNIOR"
    | "MID"
    | "SENIOR"
    | "STAFF_LEAD"
    | "INSUFFICIENT_EVIDENCE";
  difficultyAdjustment: "DOWN" | "SAME" | "UP";
  nextDifficulty: number;
  supportMode: "NONE" | "GUIDED" | "HINT";
};

type NextQuestion = {
  text: string;
  questionIndex: number;
  difficulty: number | null;
  competency: string | null;
  skillTags: string[];
};

type TurnResponse = {
  success?: boolean;
  error?: string;
  voiceMode?: boolean;
  turnScore?: number;
  feedback?: string;
  evidenceConfidence?: number;
  evaluation?: AdaptiveEvaluation;
  nextQuestion?: NextQuestion;
  isComplete?: boolean;
};

type VoiceTranscriptionResponse = {
  success?: boolean;
  error?: string;
  requiresRepeat?: boolean;
  requiresConfirmation?: boolean;
  draftId?: string;
  receiptId?: string;
  transcript?: string;
  heardText?: string;
  confidence?: number | null;
  detectedLanguage?: string;
  durationSeconds?: number;
  message?: string;
};

type VoiceConfirmationResponse = {
  success?: boolean;
  error?: string;
  receiptId?: string;
  transcript?: string;
  confidence?: number | null;
  detectedLanguage?: string;
};

type VoiceUiState =
  | "READY"
  | "SPEAKING"
  | "LISTENING_READY"
  | "LISTENING"
  | "UNDERSTANDING"
  | "CONFIRM_TRANSCRIPT"
  | "REPEAT"
  | "FOLLOW_UP_READY"
  | "COMPLETE";

const difficultyLabel = (
  difficulty: number | null | undefined,
) => {
  if (!difficulty) return "Calibrating";
  return (
    [
      "",
      "Foundation",
      "Core",
      "Advanced",
      "Senior depth",
      "Stretch",
    ][difficulty] ?? "Adaptive"
  );
};

function preferredRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return (
    candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ""
  );
}

export default function MockInterviewActivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnEvaluation, setTurnEvaluation] =
    useState<AdaptiveEvaluation | null>(null);
  const [pendingNextQuestion, setPendingNextQuestion] =
    useState<NextQuestion | null>(null);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceUiState>("READY");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceConfidence, setVoiceConfidence] = useState<number | null>(
    null,
  );
  const [voiceMessage, setVoiceMessage] = useState("");
  const [voiceDraftId, setVoiceDraftId] = useState<string | null>(null);
  const [openingSpoken, setOpeningSpoken] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        recorderRef.current &&
        recorderRef.current.state !== "inactive"
      ) {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.pause();
    };
  }, []);

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
        const data = (await res.json().catch(() => null)) as
          | {
              success?: boolean;
              error?: string;
              session?: InterviewSession;
            }
          | null;

        if (!res.ok || !data?.success || !data.session) {
          throw new Error(
            data?.error || "Could not load interview session.",
          );
        }

        if (data.session.status === "COMPLETED") {
          router.push(
            `/ai/mock-interview/summary?sessionId=${sessionId}`,
          );
          return;
        }
        if (data.session.status === "ABANDONED") {
          throw new Error("This practice session has been abandoned.");
        }

        const active =
          data.session.turns.find(
            (turn) =>
              turn.questionIndex ===
              data.session?.currentQuestionIndex,
          ) ?? null;

        if (!active) {
          throw new Error(
            "The current interview question is unavailable.",
          );
        }

        setSession(data.session);
        setCurrentTurn(active);
        if (data.session.mode === "VOICE") {
          setVoiceState("READY");
          setShowOpening(false);
        } else {
          setShowOpening(
            Boolean(
              data.session.openingMessage &&
                active.questionIndex === 0,
            ),
          );
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load session.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingSession(false);
      }
    }

    void fetchSession();
    return () => controller.abort();
  }, [sessionId, router]);

  useEffect(() => {
    setElapsedSeconds(0);
    const isVoice = session?.mode === "VOICE";
    const timerBlocked = isVoice
      ? voiceState !== "LISTENING" &&
        voiceState !== "LISTENING_READY"
      : showOpening || Boolean(turnEvaluation);

    if (!currentTurn || timerBlocked) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [
    currentTurn?.questionIndex,
    showOpening,
    turnEvaluation,
    session?.mode,
    voiceState,
  ]);

  async function finishInterview() {
    if (!sessionId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/assessment/mock-interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || "Could not complete this practice session.",
        );
      }
      router.push(
        `/ai/mock-interview/summary?sessionId=${sessionId}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not complete this practice session.",
      );
      setVoiceState("COMPLETE");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentTurn) return;
    if (answerText.trim().length < 5) {
      setErrorMessage(
        "Please provide a little more detail before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/assessment/mock-interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          questionIndex: currentTurn.questionIndex,
          answer: answerText.trim(),
          durationMs: elapsedSeconds * 1_000,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | TurnResponse
        | null;
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || "Evaluation failed. Please try again.",
        );
      }

      if (
        typeof data.turnScore !== "number" ||
        typeof data.feedback !== "string" ||
        !data.evaluation
      ) {
        throw new Error(
          "The evaluation service returned an incomplete adaptive result.",
        );
      }

      setTurnEvaluation(data.evaluation);
      setPendingNextQuestion(data.nextQuestion ?? null);
      setIsFinalQuestion(
        Boolean(data.isComplete || !data.nextQuestion),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not submit response. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToNext = async () => {
    if (!sessionId || !session) return;

    if (isFinalQuestion) {
      await finishInterview();
      return;
    }

    if (!pendingNextQuestion) {
      setErrorMessage(
        "The next adaptive question is unavailable. Please reload.",
      );
      setTurnEvaluation(null);
      return;
    }

    const nextTurn: Turn = {
      id: `pending-${pendingNextQuestion.questionIndex}`,
      questionIndex: pendingNextQuestion.questionIndex,
      questionText: pendingNextQuestion.text,
      difficulty: pendingNextQuestion.difficulty,
      competency: pendingNextQuestion.competency,
      skillTags: pendingNextQuestion.skillTags,
      candidateAnswerTranscript: null,
      score: null,
      feedback: null,
      evidenceConfidence: null,
    };

    setSession({
      ...session,
      currentQuestionIndex: nextTurn.questionIndex,
      turns: [
        ...session.turns.filter(
          (turn) => turn.questionIndex !== nextTurn.questionIndex,
        ),
        nextTurn,
      ],
    });
    setCurrentTurn(nextTurn);
    setTurnEvaluation(null);
    setPendingNextQuestion(null);
    setAnswerText("");
    setElapsedSeconds(0);
  };

  async function playSpeech(
    kind: "OPENING" | "QUESTION",
    questionIndex?: number,
  ) {
    if (!sessionId) return;
    setVoiceState("SPEAKING");
    setErrorMessage(null);

    const response = await fetch(
      "/api/assessment/mock-interview/voice/speech",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          kind,
          ...(kind === "QUESTION"
            ? { questionIndex: questionIndex ?? 0 }
            : {}),
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        data?.error || "Interviewer voice is temporarily unavailable.",
      );
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () =>
          reject(new Error("Could not play interviewer audio."));
        void audio.play().catch(reject);
      });
    } finally {
      audioRef.current = null;
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function hearCurrentQuestion() {
    if (!session || !currentTurn) return;
    try {
      if (
        currentTurn.questionIndex === 0 &&
        session.openingMessage &&
        !openingSpoken
      ) {
        await playSpeech("OPENING");
        setOpeningSpoken(true);
      }
      await playSpeech("QUESTION", currentTurn.questionIndex);
      setVoiceState("LISTENING_READY");
      setVoiceMessage("Your turn. Record your answer when ready.");
    } catch (error) {
      setVoiceState("READY");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Interviewer voice is unavailable.",
      );
    }
  }

  async function submitVoiceReceipt(
    receiptId: string,
    transcript: string,
    confidence: number | null,
  ) {
    if (!sessionId || !session || !currentTurn) return;
    setVoiceState("UNDERSTANDING");
    setVoiceTranscript(transcript);
    setVoiceConfidence(confidence);
    setVoiceMessage("Understanding your answer and preparing the next step...");
    setErrorMessage(null);

    try {
      const response = await fetch(
        "/api/assessment/mock-interview/turn",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            questionIndex: currentTurn.questionIndex,
            transcriptionReceiptId: receiptId,
          }),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | TurnResponse
        | null;
      if (!response.ok || !data?.success || data.voiceMode !== true) {
        throw new Error(
          data?.error ||
            "The voice answer could not be processed safely.",
        );
      }

      if (data.isComplete) {
        setVoiceState("COMPLETE");
        setVoiceMessage(
          "Interview complete. Preparing your evidence-based practice report...",
        );
        await finishInterview();
        return;
      }

      if (!data.nextQuestion) {
        throw new Error("The next adaptive question is unavailable.");
      }

      const nextTurn: Turn = {
        id: `pending-${data.nextQuestion.questionIndex}`,
        questionIndex: data.nextQuestion.questionIndex,
        questionText: data.nextQuestion.text,
        difficulty: data.nextQuestion.difficulty,
        competency: data.nextQuestion.competency,
        skillTags: data.nextQuestion.skillTags,
        candidateAnswerTranscript: null,
        score: null,
        feedback: null,
        evidenceConfidence: null,
      };

      setSession({
        ...session,
        currentQuestionIndex: nextTurn.questionIndex,
        turns: [
          ...session.turns.filter(
            (turn) =>
              turn.questionIndex !== nextTurn.questionIndex,
          ),
          nextTurn,
        ],
      });
      setCurrentTurn(nextTurn);
      setElapsedSeconds(0);
      setVoiceState("FOLLOW_UP_READY");
      setVoiceMessage(
        "I have understood your answer. The next question is ready.",
      );
    } catch (error) {
      setVoiceState("REPEAT");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The voice answer could not be processed.",
      );
    }
  }

  async function transcribeVoiceBlob(blob: Blob) {
    if (!sessionId || !currentTurn) return;
    setVoiceState("UNDERSTANDING");
    setVoiceMessage("Transcribing your answer...");
    setErrorMessage(null);

    const form = new FormData();
    form.append(
      "audio",
      blob,
      blob.type.includes("mp4")
        ? "voice-answer.mp4"
        : blob.type.includes("ogg")
          ? "voice-answer.ogg"
          : "voice-answer.webm",
    );
    form.append("sessionId", sessionId);
    form.append("questionIndex", String(currentTurn.questionIndex));

    try {
      const response = await fetch(
        "/api/assessment/mock-interview/voice/transcribe",
        {
          method: "POST",
          credentials: "include",
          body: form,
        },
      );

      const data = (await response.json().catch(() => null)) as
        | VoiceTranscriptionResponse
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Voice transcription failed.",
        );
      }

      if (data.requiresRepeat) {
        setVoiceTranscript(data.heardText || "");
        setVoiceConfidence(
          typeof data.confidence === "number"
            ? data.confidence
            : null,
        );
        setVoiceDraftId(null);
        setVoiceState("REPEAT");
        setVoiceMessage(
          data.message ||
            "I could not hear that confidently enough. Please answer again.",
        );
        return;
      }

      if (
        data.requiresConfirmation &&
        data.draftId &&
        data.transcript
      ) {
        setVoiceDraftId(data.draftId);
        setVoiceTranscript(data.transcript);
        setVoiceConfidence(null);
        setVoiceState("CONFIRM_TRANSCRIPT");
        setVoiceMessage(
          data.message ||
            "Please confirm the transcript before HireGo evaluates it.",
        );
        return;
      }

      if (!data.receiptId || !data.transcript) {
        throw new Error(
          "Voice transcription returned an incomplete verified result.",
        );
      }

      await submitVoiceReceipt(
        data.receiptId,
        data.transcript,
        typeof data.confidence === "number"
          ? data.confidence
          : null,
      );
    } catch (error) {
      setVoiceState("REPEAT");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Voice transcription failed.",
      );
    }
  }

  async function confirmVoiceTranscript() {
    if (
      !sessionId ||
      !currentTurn ||
      !voiceDraftId ||
      voiceTranscript.trim().length < 1
    ) {
      setErrorMessage("A transcript is required before confirmation.");
      return;
    }

    setVoiceState("UNDERSTANDING");
    setVoiceMessage("Confirming transcript...");
    setErrorMessage(null);

    try {
      const response = await fetch(
        "/api/assessment/mock-interview/voice/confirm-transcript",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            questionIndex: currentTurn.questionIndex,
            draftId: voiceDraftId,
            transcript: voiceTranscript.trim(),
          }),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | VoiceConfirmationResponse
        | null;

      if (
        !response.ok ||
        !data?.success ||
        !data.receiptId ||
        !data.transcript
      ) {
        throw new Error(
          data?.error || "Transcript confirmation failed.",
        );
      }

      setVoiceDraftId(null);
      await submitVoiceReceipt(
        data.receiptId,
        data.transcript,
        typeof data.confidence === "number"
          ? data.confidence
          : null,
      );
    } catch (error) {
      setVoiceState("CONFIRM_TRANSCRIPT");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Transcript confirmation failed.",
      );
    }
  }

  async function startRecording() {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setErrorMessage(
        "This browser does not support secure microphone recording for Voice Mode.",
      );
      return;
    }

    setErrorMessage(null);
    setVoiceMessage("");
    setVoiceTranscript("");
    setVoiceConfidence(null);
    setVoiceDraftId(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;

      const mimeType = preferredRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setErrorMessage("Microphone recording failed.");
        setVoiceState("REPEAT");
      };

      recorder.onstop = () => {
        const recordedType =
          recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, {
          type: recordedType,
        });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        void transcribeVoiceBlob(blob);
      };

      recorder.start(250);
      setVoiceState("LISTENING");
      setElapsedSeconds(0);
      recordingStartedAtRef.current = Date.now();
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setVoiceState("REPEAT");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Microphone permission is required for Voice Mode.",
      );
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    const duration = Date.now() - recordingStartedAtRef.current;
    if (duration < 500) {
      setErrorMessage(
        "Keep recording a little longer before submitting your answer.",
      );
      return;
    }
    recorder.stop();
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const wordCount = answerText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5221F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/50">
            Loading Interview Session...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !currentTurn) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#161616] p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-9 w-9 text-[#C5221F]" />
          <h1 className="mb-2 text-lg font-bold">
            Interview unavailable
          </h1>
          <p className="mb-5 text-sm text-white/60">
            {errorMessage || "The session could not be loaded."}
          </p>
          <Link
            href="/ai/mock-interview/setup"
            className="inline-flex h-10 items-center rounded-xl bg-[#C5221F] px-5 text-xs font-bold uppercase tracking-wider"
          >
            Return to Practice Studio
          </Link>
        </div>
      </div>
    );
  }

  const isVoice = session.mode === "VOICE";
  const progress = Math.round(
    ((currentTurn.questionIndex + 1) / session.totalQuestions) * 100,
  );

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col">
      <header className="min-h-[64px] border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1 font-bold text-xl tracking-tight"
          >
            <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI" width={126} height={42} priority className="h-10 w-auto max-w-[126px] object-contain" />
          </Link>
          <span className="text-white/30">|</span>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white/80">
              {session.persona?.name || "HireGo Interviewer"} ·{" "}
              {session.roleTarget}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/35">
              {session.declaredSeniority || "Adaptive"} start ·{" "}
              {isVoice ? "Real Voice" : "Text"} · {session.language}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 font-mono text-xs text-white/80">
            <Clock className="w-3.5 h-3.5 text-[#C5221F]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
          <Link
            href="/ai/mock-interview/setup"
            className="text-xs text-white/50 hover:text-white"
          >
            Leave Session
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col">
        <div className="mb-5">
          <div className="flex flex-wrap justify-between gap-2 text-xs uppercase tracking-wider text-white/60 mb-2 font-semibold">
            <span>
              Question {currentTurn.questionIndex + 1} of{" "}
              {session.totalQuestions}
            </span>
            <span>{progress}% completed</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C5221F] to-[#4285F4] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4285F4]/20 bg-[#4285F4]/10 px-3 py-1 text-[11px] text-[#AECBFA]">
            <Gauge className="h-3 w-3" />
            {difficultyLabel(currentTurn.difficulty)}
          </span>
          {currentTurn.competency && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/65">
              {currentTurn.competency}
            </span>
          )}
          {currentTurn.skillTags.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55"
            >
              {skill}
            </span>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-[#C5221F]/10 border border-[#C5221F]/30 text-white flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 md:p-8 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C5221F] via-[#4285F4] to-[#C5221F]" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#C5221F] font-bold mb-3">
            <Sparkles className="w-4 h-4" />
            {session.persona?.name || "AI Interviewer"}
          </div>
          <h2 className="text-lg md:text-xl font-medium text-white leading-relaxed">
            {currentTurn.questionText}
          </h2>
        </div>

        {isVoice ? (
          <section className="flex-1 rounded-3xl border border-white/10 bg-[#121216] p-5 md:p-8 shadow-2xl">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div
                className={`relative flex h-44 w-44 items-center justify-center rounded-full border transition-all duration-500 ${
                  voiceState === "SPEAKING"
                    ? "border-[#4285F4]/70 shadow-[0_0_70px_rgba(66,133,244,0.25)]"
                    : voiceState === "LISTENING"
                      ? "border-[#C5221F]/70 shadow-[0_0_70px_rgba(197,34,31,0.28)]"
                      : voiceState === "UNDERSTANDING"
                        ? "border-[#4285F4]/50 shadow-[0_0_45px_rgba(66,133,244,0.18)]"
                        : "border-white/10 shadow-[0_0_35px_rgba(255,255,255,0.05)]"
                }`}
              >
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#4285F4]/25 via-black/50 to-[#C5221F]/25 backdrop-blur-xl" />
                <div
                  className={`absolute inset-8 rounded-full border border-white/10 ${
                    ["SPEAKING", "LISTENING", "UNDERSTANDING"].includes(
                      voiceState,
                    )
                      ? "animate-pulse"
                      : ""
                  }`}
                />
                {voiceState === "LISTENING" ? (
                  <Mic2 className="relative z-10 h-12 w-12 text-[#C5221F]" />
                ) : voiceState === "SPEAKING" ? (
                  <Volume2 className="relative z-10 h-12 w-12 text-[#4285F4]" />
                ) : (
                  <AudioLines className="relative z-10 h-12 w-12 text-white/80" />
                )}
              </div>

              <div className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-white/55">
                {voiceState === "SPEAKING"
                  ? "Interviewer speaking"
                  : voiceState === "LISTENING"
                    ? "Listening"
                    : voiceState === "UNDERSTANDING"
                      ? "Understanding"
                      : voiceState === "FOLLOW_UP_READY"
                        ? "Follow-up ready"
                        : voiceState === "REPEAT"
                          ? "Please repeat"
                          : voiceState === "COMPLETE"
                            ? "Interview complete"
                            : "Ready"}
              </div>

              {(voiceMessage || voiceTranscript) && (
                <div className="mt-5 w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left">
                  {voiceMessage && (
                    <p className="text-sm leading-relaxed text-white/70">
                      {voiceMessage}
                    </p>
                  )}
                  {voiceTranscript && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                        Transcript
                        {voiceConfidence !== null
                          ? ` · ${Math.round(
                              voiceConfidence * 100,
                            )}% confidence`
                          : voiceState === "CONFIRM_TRANSCRIPT"
                            ? " · confirm before scoring"
                            : ""}
                      </div>
                      {voiceState === "CONFIRM_TRANSCRIPT" ? (
                        <textarea
                          value={voiceTranscript}
                          onChange={(event) =>
                            setVoiceTranscript(event.target.value)
                          }
                          maxLength={10_000}
                          rows={5}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white focus:border-[#4285F4] focus:outline-none"
                        />
                      ) : (
                        <p className="mt-1 text-xs leading-relaxed text-white/60">
                          {voiceTranscript}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                {["READY", "FOLLOW_UP_READY"].includes(voiceState) && (
                  <button
                    type="button"
                    onClick={() => void hearCurrentQuestion()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3367D6]"
                  >
                    <Volume2 className="h-4 w-4" />
                    {currentTurn.questionIndex === 0 && !openingSpoken
                      ? "Start Interview"
                      : "Hear Question"}
                  </button>
                )}

                {voiceState === "CONFIRM_TRANSCRIPT" && (
                  <>
                    <button
                      type="button"
                      onClick={() => void confirmVoiceTranscript()}
                      disabled={!voiceDraftId || voiceTranscript.trim().length < 1}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3367D6] disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Transcript
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceDraftId(null);
                        setVoiceTranscript("");
                        setVoiceConfidence(null);
                        setVoiceState("REPEAT");
                        setVoiceMessage(
                          "Record the answer again if this transcript is not accurate.",
                        );
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 text-xs font-bold uppercase tracking-wider text-white"
                    >
                      <Mic2 className="h-4 w-4" />
                      Record Again
                    </button>
                  </>
                )}

                {["LISTENING_READY", "REPEAT"].includes(voiceState) && (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C5221F] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#A31816]"
                  >
                    <Mic2 className="h-4 w-4" />
                    {voiceState === "REPEAT"
                      ? "Record Again"
                      : "Record Answer"}
                  </button>
                )}

                {voiceState === "LISTENING" && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-black uppercase tracking-wider text-black"
                  >
                    <Square className="h-4 w-4" />
                    Finish Answer
                  </button>
                )}

                {voiceState === "COMPLETE" && errorMessage && (
                  <button
                    type="button"
                    onClick={() => void finishInterview()}
                    disabled={isSubmitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#4285F4] px-6 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    Prepare Report
                  </button>
                )}
              </div>

              <p className="mt-6 max-w-xl text-[11px] leading-relaxed text-white/35">
                Voice practice gives feedback after the interview, not after every question. You can review and confirm the text of your answers before they are assessed. Individual answer recordings are not saved by this practice.
              </p>
            </div>
          </section>
        ) : (
          <section className="flex-1 flex flex-col bg-[#161616] border border-white/10 rounded-2xl p-5 md:p-6 relative">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-[#4285F4]" />
                Your response
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                <span>
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
                <span>•</span>
                <span>{answerText.length} characters</span>
              </div>
            </div>

            <textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              disabled={isSubmitting || Boolean(turnEvaluation)}
              placeholder="Answer naturally. Explain what you know, how you would apply it, and any trade-offs you would consider."
              maxLength={10_000}
              className="flex-1 min-h-[220px] w-full text-sm leading-relaxed bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/25 focus:outline-none focus:border-[#C5221F] transition-colors resize-y mb-4"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-white/5">
              <p className="text-xs text-white/40 max-w-xl">
                It is okay not to know everything. HireGo can lower
                difficulty or use a guided follow-up instead of treating
                one weak answer as your level.
              </p>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={
                  isSubmitting ||
                  Boolean(turnEvaluation) ||
                  answerText.trim().length < 5
                }
                className="h-11 px-6 rounded-xl bg-[#C5221F] hover:bg-[#A31816] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Understanding...
                  </>
                ) : (
                  <>
                    Submit Answer <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        <div className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Private practice only. Practice scores and level guidance are not
          written into employer-facing verified skill evidence or used to
          select/reject you.
        </div>

        {!isVoice && showOpening && session.openingMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-[#181818] p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#4285F4]">
                <Sparkles className="h-4 w-4" />
                {session.persona?.name || "HireGo Interviewer"}
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                {session.openingMessage}
              </p>
              <button
                type="button"
                onClick={() => setShowOpening(false)}
                className="mt-6 w-full h-11 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs uppercase tracking-wider"
              >
                I&apos;m ready
              </button>
            </div>
          </div>
        )}

        {!isVoice && turnEvaluation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#181818] border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Practice response reviewed
                </div>
                <div className="text-sm font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {turnEvaluation.score}/100
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2">
                  Constructive feedback
                </h4>
                <p className="text-sm text-white/90 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                  {turnEvaluation.feedback}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Evidence confidence
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {turnEvaluation.evidenceConfidence}%
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    Next adaptation
                  </div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {turnEvaluation.difficultyAdjustment === "UP"
                      ? "Slightly harder"
                      : turnEvaluation.difficultyAdjustment === "DOWN"
                        ? "More foundational"
                        : turnEvaluation.supportMode === "NONE"
                          ? "Similar depth"
                          : "Guided follow-up"}
                  </div>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-white/40">
                One answer does not determine your final level. HireGo
                aggregates evidence across the practice session.
              </p>

              <button
                type="button"
                onClick={handleProceedToNext}
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isFinalQuestion
                  ? "Complete Interview & View Report"
                  : "Continue to Adaptive Question"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
