"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, Clock, Sparkles, CheckCircle2, AlertCircle, ArrowRight, BookOpen } from "lucide-react";

export default function MockInterviewActivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [answerText, setAnswerText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real turn feedback overlay/modal after submission
  const [turnEvaluation, setTurnEvaluation] = useState<{ score: number; feedback: string } | null>(null);
  const [isFinalQuestion, setIsFinalQuestion] = useState<boolean>(false);

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load session from backend
  useEffect(() => {
    if (!sessionId) {
      router.push("/ai/mock-interview/setup");
      return;
    }

    async function fetchSession() {
      try {
        const res = await fetch(`/api/assessment/mock-interview/session?id=${sessionId}`);
        if (!res.ok) {
          throw new Error("Could not load interview session.");
        }
        const data = await res.json();
        if (!data.success || !data.session) {
          throw new Error(data.error || "Session not found.");
        }

        const s = data.session;
        setSession(s);
        setTotalQuestions(s.totalQuestions || 5);
        setCurrentQuestionIndex(s.currentQuestionIndex || 0);

        // Find current question text
        const turns = s.turns || [];
        const activeTurn = turns.find((t: any) => t.questionIndex === s.currentQuestionIndex);
        if (activeTurn) {
          setCurrentQuestion(activeTurn.questionText);
        } else if (turns.length > 0) {
          setCurrentQuestion(turns[turns.length - 1].questionText);
        }

        if (s.status === "COMPLETED") {
          router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load session.");
      } finally {
        setIsLoadingSession(false);
      }
    }

    fetchSession();
  }, [sessionId, router]);

  // Response Timer
  useEffect(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setErrorMessage("Please write your technical answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const durationMs = elapsedSeconds * 1000;

    try {
      const res = await fetch("/api/assessment/mock-interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answer: answerText.trim(),
          durationMs,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Evaluation failed. Please try again.");
      }

      setTurnEvaluation({
        score: data.evaluation?.score ?? 75,
        feedback: data.evaluation?.feedback || "Answer recorded successfully.",
      });

      if (data.isComplete || !data.nextQuestion) {
        setIsFinalQuestion(true);
      } else {
        setIsFinalQuestion(false);
        // Prepare next question
        setCurrentQuestion(data.nextQuestion.text);
        setCurrentQuestionIndex(data.nextQuestion.questionIndex);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Could not submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToNext = async () => {
    setTurnEvaluation(null);
    setAnswerText("");

    if (isFinalQuestion) {
      // Complete interview
      try {
        setIsSubmitting(true);
        const res = await fetch("/api/assessment/mock-interview/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
        } else {
          router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
        }
      } catch {
        router.push(`/ai/mock-interview/summary?sessionId=${sessionId}`);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5221F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/50">Loading Interview Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-[64px] border-b border-white/10 px-6 flex items-center justify-between bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-xl tracking-tight">
            <span>Hire<span className="text-[#C5221F]">Go</span></span>
            <span className="text-[#4285F4]">AI</span>
          </Link>
          <span className="text-white/30">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-white/70 font-semibold truncate max-w-[200px]">
              {session?.roleTarget || "Mock Interview"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 font-mono text-xs text-white/80">
            <Clock className="w-3.5 h-3.5 text-[#C5221F]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <Link
            href="/ai/mock-interview/setup"
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Leave Session
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs uppercase tracking-wider text-white/60 mb-2 font-semibold">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}% Completed</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C5221F] to-[#4285F4] transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-[#C5221F]/10 border border-[#C5221F]/30 text-white flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Question Panel */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 md:p-8 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C5221F] via-[#4285F4] to-[#C5221F]" />
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#C5221F] font-bold mb-3">
            <Sparkles className="w-4 h-4" />
            AI Interviewer Prompt
          </div>
          <h2 className="text-lg md:text-xl font-medium text-white leading-relaxed">
            {currentQuestion || "Preparing question..."}
          </h2>
        </div>

        {/* Candidate Response Workspace */}
        <div className="flex-1 flex flex-col bg-[#161616] border border-white/10 rounded-2xl p-6 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 font-bold">
              <BookOpen className="w-3.5 h-3.5 text-[#4285F4]" />
              Structured Technical Response
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
              <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
              <span>•</span>
              <span>{answerText.length} characters</span>
            </div>
          </div>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your structured technical response here. Outline your rationale, approach, architecture, and edge-case handling..."
            className="flex-1 min-h-[220px] w-full text-sm leading-relaxed bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/25 focus:outline-none focus:border-[#C5221F] transition-colors resize-none mb-4 font-sans"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="text-xs text-white/40">
              Clear, structured responses with concrete technical rationale score highest.
            </p>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !answerText.trim()}
              className="h-11 px-6 rounded-xl bg-[#C5221F] hover:bg-[#A31816] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Evaluating Response...
                </>
              ) : (
                <>
                  Submit Answer <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Turn Evaluation Feedback Modal / Overlay */}
        {turnEvaluation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#181818] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Response Evaluated
                </div>
                <div className="text-sm font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Score: {turnEvaluation.score}/100
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2">
                  Constructive Practice Feedback
                </h4>
                <p className="text-sm text-white/90 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                  {turnEvaluation.feedback}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProceedToNext}
                  className="w-full h-11 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  {isFinalQuestion ? "Complete Interview & View Summary" : "Next Question"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
