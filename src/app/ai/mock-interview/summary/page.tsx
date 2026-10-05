"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Target,
  Gauge,
  BookOpenCheck,
  Volume2,
} from "lucide-react";

type EvidenceRow = {
  skill: string;
  reason: string;
};

type PracticePlanRow = {
  priority: number;
  focus: string;
  action: string;
};

type FinalReport = {
  mode: "PRACTICE";
  practiceScore: number | null;
  answeredTurns: number;
  estimatedLevel: string | null;
  levelConfidence: number | null;
  evidenceStatus: "ESTIMATED" | "INSUFFICIENT_EVIDENCE";
  strengths: EvidenceRow[];
  missingEvidence: EvidenceRow[];
  nextPracticePlan: PracticePlanRow[];
  summary: string;
};

type TurnEvaluation = {
  demonstratedLevel?: string;
  evidenceConfidence?: number;
  evidence?: Array<{
    skill: string;
    dimension: string;
    status: string;
    reason: string;
  }>;
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
  evaluation: TurnEvaluation | null;
};

type Session = {
  id: string;
  roleTarget: string;
  declaredSeniority: string | null;
  roleFamily: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  mode: "TEXT" | "VOICE";
  language: string;
  overallScore: number | null;
  estimatedLevel: string | null;
  levelConfidence: number | null;
  finalReport: FinalReport | null;
  aiFeedback: string | null;
  persona: {
    name: string;
    roleFamily: string;
    rubricVersion: string;
  } | null;
  createdAt: string;
  turns: Turn[];
};

function formatLevel(level: string | null) {
  if (!level) return "Not enough evidence";
  return level.replace("_", "/");
}

export default function MockInterviewSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(0);
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);
  const [voiceFeedbackError, setVoiceFeedbackError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      router.push("/ai/mock-interview/setup");
      return;
    }

    const controller = new AbortController();

    async function fetchSummary() {
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
          | { success?: boolean; error?: string; session?: Session }
          | null;

        if (!res.ok || !data?.success || !data.session) {
          throw new Error(data?.error || "Could not load interview summary.");
        }
        if (data.session.status !== "COMPLETED") {
          throw new Error("This practice session has not been completed yet.");
        }
        setSession(data.session);
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load summary.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void fetchSummary();
    return () => controller.abort();
  }, [sessionId, router]);

  async function hearFinalFeedback() {
    if (!sessionId || session?.mode !== "VOICE") return;
    setIsPlayingFeedback(true);
    setVoiceFeedbackError("");
    try {
      const response = await fetch(
        "/api/assessment/mock-interview/voice/speech",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            kind: "FINAL_SUMMARY",
          }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error || "Spoken feedback is temporarily unavailable.",
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      try {
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(url);
          audio.onended = () => resolve();
          audio.onerror = () =>
            reject(new Error("Could not play spoken feedback."));
          void audio.play().catch(reject);
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setVoiceFeedbackError(
        error instanceof Error
          ? error.message
          : "Spoken feedback is unavailable.",
      );
    } finally {
      setIsPlayingFeedback(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C5221F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/50">
            Compiling Practice Report...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !session) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center p-6">
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-[#C5221F] mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Summary unavailable</h2>
          <p className="text-xs text-white/60 mb-6">
            {errorMessage || "Session could not be located."}
          </p>
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

  const turns = session.turns ?? [];
  const report = session.finalReport;
  const practiceScore =
    report?.practiceScore ??
    (typeof session.overallScore === "number"
      ? Math.round(session.overallScore)
      : null);
  const estimatedLevel = report?.estimatedLevel ?? session.estimatedLevel;
  const levelConfidence =
    report?.levelConfidence ?? session.levelConfidence ?? null;
  const strengths = report?.strengths ?? [];
  const missingEvidence = report?.missingEvidence ?? [];
  const nextPracticePlan = report?.nextPracticePlan ?? [];
  const reportSummary = report?.summary ?? session.aiFeedback;

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col">
      <header className="min-h-[64px] border-b border-white/10 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 font-bold text-xl tracking-tight"
          >
            <span>
              Hire<span className="text-[#C5221F]">Go</span>
            </span>
            <span className="text-[#4285F4]">AI</span>
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Practice complete
          </span>
        </div>

        <Link
          href="/dashboard"
          className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-10 space-y-8">
        <section className="bg-[#161616] border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C5221F] via-[#4285F4] to-[#C5221F]" />

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#4285F4] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive practice report
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                {session.roleTarget}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                <span>
                  Declared starting level: {session.declaredSeniority || "Not supplied"}
                </span>
                <span>Interviewer: {session.persona?.name || "HireGo AI"}</span>
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid w-full lg:w-auto grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 min-w-[150px]">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/45">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Practice score
                </div>
                <div className="mt-2 text-2xl font-mono font-bold text-emerald-400">
                  {practiceScore === null ? "—" : `${practiceScore}/100`}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 min-w-[150px]">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/45">
                  <Gauge className="h-4 w-4 text-[#4285F4]" />
                  Estimated level
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  {formatLevel(estimatedLevel)}
                </div>
                {levelConfidence !== null && (
                  <div className="mt-1 text-[11px] text-white/40">
                    {levelConfidence}% confidence
                  </div>
                )}
              </div>
            </div>
          </div>

          {reportSummary && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xs uppercase tracking-wider text-white/60 font-bold">
                  Evidence summary
                </h3>
                {session.mode === "VOICE" && (
                  <button
                    type="button"
                    onClick={() => void hearFinalFeedback()}
                    disabled={isPlayingFeedback}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#4285F4]/30 bg-[#4285F4]/10 px-3 py-2 text-[11px] font-bold text-[#AECBFA] disabled:opacity-50"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    {isPlayingFeedback ? "Playing feedback..." : "Hear feedback"}
                  </button>
                )}
              </div>
              <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                {reportSummary}
              </p>
              {voiceFeedbackError && (
                <p className="mt-2 text-xs text-amber-300">
                  {voiceFeedbackError}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-xs leading-relaxed text-white/55 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            This is private practice guidance. Declared seniority is not treated as
            verified truth, and this report does not automatically become
            employer-facing hiring evidence or a selection/rejection decision.
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/10 bg-[#161616] p-5">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-emerald-400">
              <BookOpenCheck className="h-4 w-4" />
              Demonstrated strengths
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-3">
                {strengths.map((item) => (
                  <div
                    key={item.skill}
                    className="rounded-xl border border-white/5 bg-white/5 p-3"
                  >
                    <div className="text-sm font-semibold text-white">
                      {item.skill}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-white/45">
                This session did not produce enough repeated evidence to label a
                specific skill as a demonstrated strength yet.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161616] p-5">
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-amber-300">
              <Target className="h-4 w-4" />
              Missing or partial evidence
            </div>
            {missingEvidence.length > 0 ? (
              <div className="space-y-3">
                {missingEvidence.map((item) => (
                  <div
                    key={item.skill}
                    className="rounded-xl border border-white/5 bg-white/5 p-3"
                  >
                    <div className="text-sm font-semibold text-white">
                      {item.skill}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-white/45">
                No specific evidence gap was persisted for this completed session.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#161616] p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#4285F4]">
            <Target className="h-4 w-4" />
            Next practice plan
          </div>
          {nextPracticePlan.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {nextPracticePlan.map((item) => (
                <div
                  key={`${item.priority}-${item.focus}`}
                  className="rounded-xl border border-white/5 bg-black/25 p-4"
                >
                  <div className="text-[10px] uppercase tracking-wider text-white/35">
                    Priority {item.priority}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {item.focus}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">
                    {item.action}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-white/45">
              Repeat the role practice with more questions to build broader
              evidence coverage.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm uppercase tracking-wider text-white/70 font-bold">
              Question-by-question review
            </h2>
            <span className="text-xs text-white/40">
              {turns.length} answers evaluated
            </span>
          </div>

          {turns.map((turn, index) => {
            const isExpanded = expandedTurn === index;
            return (
              <div
                key={turn.id}
                className="bg-[#161616] border border-white/10 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTurn(isExpanded ? null : index)}
                  className="w-full p-4 md:p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3 pr-4">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">
                        {turn.questionText}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-white/35">
                        {turn.competency && <span>{turn.competency}</span>}
                        {turn.difficulty && <span>Difficulty {turn.difficulty}/5</span>}
                        {turn.evidenceConfidence !== null && (
                          <span>Evidence {turn.evidenceConfidence}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {turn.score !== null && (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {turn.score}/100
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-white/50" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/50" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-white/5 space-y-4 bg-black/20">
                    <div>
                      <h4 className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">
                        Question
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed">
                        {turn.questionText}
                      </p>
                    </div>

                    {turn.candidateAnswerTranscript && (
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">
                          {session.mode === "VOICE"
                            ? "Your voice transcript"
                            : "Your typed response"}
                        </h4>
                        <div className="text-xs text-white/80 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                          {turn.candidateAnswerTranscript}
                        </div>
                      </div>
                    )}

                    {turn.feedback && (
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Practice feedback
                        </h4>
                        <div className="text-xs text-white/90 leading-relaxed bg-emerald-500/5 border border-emerald-500/15 p-3.5 rounded-xl">
                          {turn.feedback}
                        </div>
                      </div>
                    )}

                    {Array.isArray(turn.evaluation?.evidence) &&
                      turn.evaluation!.evidence!.length > 0 && (
                        <div>
                          <h4 className="text-[11px] uppercase tracking-wider text-[#4285F4] font-bold mb-2">
                            Evidence observed this turn
                          </h4>
                          <div className="space-y-2">
                            {turn.evaluation!.evidence!.map((evidence, evidenceIndex) => (
                              <div
                                key={`${evidence.skill}-${evidence.dimension}-${evidenceIndex}`}
                                className="rounded-lg border border-white/5 bg-white/5 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-white">
                                    {evidence.skill}
                                  </span>
                                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                                    {evidence.status.replaceAll("_", " ")}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] leading-relaxed text-white/50">
                                  {evidence.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

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
