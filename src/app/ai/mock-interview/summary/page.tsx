"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, CheckCircle2, RotateCcw, LayoutDashboard, ChevronDown, ChevronUp, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";

export default function MockInterviewSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(0);

  useEffect(() => {
    if (!sessionId) {
      router.push("/ai/mock-interview/setup");
      return;
    }

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/assessment/mock-interview/session?id=${sessionId}`);
        if (!res.ok) throw new Error("Could not load interview summary.");
        const data = await res.json();
        if (!data.success || !data.session) throw new Error(data.error || "Session not found.");
        setSession(data.session);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load summary.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5221F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/50">Compiling Practice Report...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center p-6">
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-[#C5221F] mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Summary Unavailable</h2>
          <p className="text-xs text-white/60 mb-6">{errorMessage || "Session could not be located."}</p>
          <Link
            href="/ai/mock-interview/setup"
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-[#C5221F] text-xs font-bold uppercase tracking-wider text-white"
          >
            Go to Practice Studio
          </Link>
        </div>
      </div>
    );
  }

  const turns = session.turns || [];
  const overallScore = session.overallScore ?? (turns.length > 0
    ? Math.round(turns.reduce((acc: number, t: any) => acc + (t.score || 0), 0) / turns.length)
    : 0);

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
          <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Session Complete
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Hero Scorecard */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C5221F] via-[#4285F4] to-[#C5221F]" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#4285F4] font-bold mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Fluency & Technical Practice Summary
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                {session.roleTarget}
              </h1>
              <p className="text-xs text-white/50">
                Completed on {new Date(session.createdAt).toLocaleDateString()} • {turns.length} Questions Answered
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 md:px-6">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold">Overall Practice Score</div>
                <div className="text-3xl font-mono font-bold text-emerald-400">
                  {overallScore}<span className="text-sm text-white/40">/100</span>
                </div>
              </div>
            </div>
          </div>

          {session.aiFeedback && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold mb-2">General Assessment</h3>
              <p className="text-xs text-white/80 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                {session.aiFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Turn-by-Turn Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider text-white/70 font-bold">
              Detailed Question-by-Question Review
            </h2>
            <span className="text-xs text-white/40">{turns.length} answers evaluated</span>
          </div>

          {turns.map((turn: any, idx: number) => {
            const isExpanded = expandedTurn === idx;
            return (
              <div
                key={turn.id || idx}
                className="bg-[#161616] border border-white/10 rounded-xl overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedTurn(isExpanded ? null : idx)}
                  className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-white truncate max-w-md md:max-w-xl">
                      {turn.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {turn.score !== null && (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {turn.score}/100
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-white/5 space-y-4 bg-black/20">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">
                        Full Question Prompt
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed">{turn.questionText}</p>
                    </div>

                    {turn.candidateAnswerTranscript && (
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">
                          Your Recorded Response
                        </h4>
                        <div className="text-xs text-white/80 italic leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                          &ldquo;{turn.candidateAnswerTranscript}&rdquo;
                        </div>
                      </div>
                    )}

                    {turn.feedback && (
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          AI Evaluator Feedback
                        </h4>
                        <div className="text-xs text-white/90 leading-relaxed bg-emerald-500/5 border border-emerald-500/15 p-3.5 rounded-xl">
                          {turn.feedback}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Practice Integrity Notice */}
        <div className="bg-[#161616] border border-white/5 rounded-xl p-4 flex items-start gap-3 text-xs text-white/50 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            This mock interview is an AI-powered practice simulation designed to enhance candidate communication clarity and technical delivery. These results remain private to your candidate profile and do not affect live employer applications.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
          </Link>

          <Link
            href="/ai/mock-interview/setup"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#C5221F] hover:bg-[#A31816] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" /> Practice Another Role
          </Link>
        </div>
      </main>
    </div>
  );
}
