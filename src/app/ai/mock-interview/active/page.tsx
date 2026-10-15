"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  turnScore?: number;
  feedback?: string;
  evidenceConfidence?: number;
  evaluation?: AdaptiveEvaluation;
  nextQuestion?: NextQuestion;
  isComplete?: boolean;
};

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

        if (data.session.mode === "VOICE") {
          router.replace("/ai/mock-interview/setup");
          return;
        }

        setSession(data.session);
        setCurrentTurn(active);
        setShowOpening(
          Boolean(
            data.session.openingMessage &&
              active.questionIndex === 0,
          ),
        );
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
    if (!currentTurn || showOpening || turnEvaluation) return;

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
            <span>
              Hire<span className="text-[#C5221F]">Go</span>
            </span>
            <span className="text-[#4285F4]">AI</span>
          </Link>
          <span className="text-white/30">|</span>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white/80">
              {session.persona?.name || "HireGo Interviewer"} ·{" "}
              {session.roleTarget}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/35">
              {session.declaredSeniority || "Adaptive"} start ·{" "}
              Text practice · {session.language}
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

        <div className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-white/35">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Private practice only. Practice scores and level guidance are not
          written into employer-facing verified skill evidence or used to
          select/reject you.
        </div>

        {showOpening && session.openingMessage && (
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

        {turnEvaluation && (
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
