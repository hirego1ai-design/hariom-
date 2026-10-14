"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { searchRoles } from "@/lib/skill-master";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  History,
  AlertCircle,
  Search,
} from "lucide-react";

type RoleOption = {
  title: string;
  department: string;
  industry?: string;
};

type SessionSummary = {
  id: string;
  roleTarget: string;
  declaredSeniority: string | null;
  roleFamily: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  mode: "TEXT" | "VOICE";
  overallScore: number | null;
  estimatedLevel: string | null;
  levelConfidence: number | null;
  createdAt: string;
};



const SENIORITY_OPTIONS = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Staff/Lead",
] as const;

const INTERVIEW_LENGTHS = [
  { count: 3, label: "Short", detail: "3 questions" },
  { count: 5, label: "Standard", detail: "5 questions" },
  { count: 8, label: "Comprehensive", detail: "8 questions" },
] as const;

export default function MockInterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromAssessment = searchParams.get("role")?.trim() || "";
  const focusSkills = useMemo(
    () =>
      (searchParams.get("focus") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 6),
    [searchParams],
  );

  const [roleTarget, setRoleTarget] = useState(roleFromAssessment);
  const [seniority, setSeniority] =
    useState<(typeof SENIORITY_OPTIONS)[number]>("Senior");
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [practiceContext, setPracticeContext] = useState("");
  const mode = "TEXT" as const;
  const roleOptions: RoleOption[] = useMemo(() => searchRoles(roleTarget), [roleTarget]);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const startRequestKey = useRef<string | null>(null);

  useEffect(() => {
    startRequestKey.current = null;
  }, [roleTarget, seniority, totalQuestions, practiceContext, mode]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHistory() {
      try {
        const res = await fetch("/api/assessment/mock-interview/session", {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Practice history could not be loaded.");
        const data = (await res.json()) as {
          success?: boolean;
          sessions?: SessionSummary[];
        };
        if (data.success && Array.isArray(data.sessions)) {
          setPastSessions(data.sessions);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Practice history could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingHistory(false);
      }
    }
    void loadHistory();
    return () => controller.abort();
  }, []);

  const handleStartInterview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleTarget.trim()) {
      setErrorMessage("Please enter or select a target role.");
      return;
    }
    setIsStarting(true);
    setErrorMessage(null);

    try {
      const idempotencyKey =
        startRequestKey.current || crypto.randomUUID();
      startRequestKey.current = idempotencyKey;

      const res = await fetch("/api/assessment/mock-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idempotencyKey,
          roleTarget: roleTarget.trim(),
          declaredSeniority: seniority,
          totalQuestions,
          focusSkills,
          practiceContext: practiceContext.trim() || null,
          mode,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            success?: boolean;
            error?: string;
            session?: { id: string };
          }
        | null;

      if (res.status === 402) {
        router.push("/credits?returnTo=mock-interview");
        return;
      }

      if (!res.ok || !data?.success || !data.session?.id) {
        throw new Error(
          res.status >= 500 ? "Interview service is temporarily unavailable. Please try again shortly." : data?.error || "Could not start your interview. Please try again.",
        );
      }

      router.push(
        `/ai/mock-interview/active?sessionId=${data.session.id}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
      );
      setIsStarting(false);
    }
  };

  const startDisabled = isStarting || !roleTarget.trim();

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col">
      <header className="h-[64px] border-b border-white/10 px-6 flex items-center justify-between bg-[#121212]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 font-bold text-xl tracking-tight"
          >
            <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI" width={126} height={42} priority className="h-10 w-auto max-w-[126px] object-contain" />
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5221F]" />
            AI Practice Studio
          </span>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-white/60 hover:text-white transition-colors"
        >
          Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Adaptive Mock Interview
          </h1>
          <p className="text-sm text-white/60 max-w-3xl">
            Practise for your next opportunity with realistic role-based text questions and get practical feedback as you progress.
          </p>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5221F]" />
              Interview Parameters
            </h2>

            {focusSkills.length > 0 && (
              <div className="mb-6 rounded-xl border border-[#4285F4]/30 bg-[#4285F4]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8AB4F8]">
                  Practice focus from Skill Validation
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {focusSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#4285F4]/30 bg-black/20 px-3 py-1.5 text-xs text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                  Practice feedback is separate from your verified assessments and job applications.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Target Role
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/35" />
                  <input
                    type="text"
                    value={roleTarget}
                    onChange={(event) => setRoleTarget(event.target.value)}
                    placeholder="Search or enter your target role"
                    maxLength={120}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C5221F] transition-colors"
                    required
                  />
                </div>

                <div className="mt-3 min-h-[42px]">
                  {roleOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.slice(0, 8).map((role) => (
                        <button
                          key={role.title}
                          type="button"
                          onClick={() => setRoleTarget(role.title)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/75 hover:border-[#4285F4]/50 hover:text-white"
                          title={[role.department, role.industry]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          {role.title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      No catalogue match. You can still use a custom role.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Starting Seniority
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SENIORITY_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeniority(level)}
                      className={`text-center text-xs py-2.5 rounded-lg border transition-all ${
                        seniority === level
                          ? "border-[#C5221F] bg-[#C5221F]/10 text-white font-semibold"
                          : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/40">
                  Your interview questions adjust to your answers as you practise.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Interview Length
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INTERVIEW_LENGTHS.map((option) => (
                    <button
                      key={option.count}
                      type="button"
                      onClick={() => setTotalQuestions(option.count)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        totalQuestions === option.count
                          ? "border-[#C5221F] bg-[#C5221F]/10 text-white"
                          : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-1">
                        {option.label}
                      </div>
                      <div className="text-[11px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {option.detail}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="practice-context"
                  className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2"
                >
                  What do you want help with?{" "}
                  <span className="text-white/35">Optional</span>
                </label>
                <textarea
                  id="practice-context"
                  value={practiceContext}
                  onChange={(event) =>
                    setPracticeContext(event.target.value)
                  }
                  maxLength={2_000}
                  rows={3}
                  placeholder="Example: I struggle to explain system-design trade-offs clearly."
                  className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4285F4] transition-colors resize-y"
                />
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Private adaptive practice
                  </div>
                  <div className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                    HireGo uses role context and your typed answers to adapt questions without inferring emotion, personality, or protected traits.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={startDisabled}
                className="w-full h-12 rounded-xl bg-[#C5221F] hover:bg-[#A31816] text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    Start Adaptive Interview{" "}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-white/70 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                How calibration works
              </div>
              <div className="space-y-3 text-xs text-white/60 leading-relaxed">
                <p>
                  The interviewer starts around your selected level, then moves
                  difficulty up or down from demonstrated evidence.
                </p>
                <p>
                  Weak or incomplete evidence triggers a simpler or guided
                  follow-up rather than an automatic negative judgment.
                </p>
                <p>
                  Final level guidance appears only after enough consistent
                  evidence across multiple turns.
                </p>
              </div>
            </div>

            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 font-bold">
                  <History className="w-4 h-4 text-[#4285F4]" />
                  Recent Practice
                </div>
                <span className="text-[11px] text-white/40">
                  {pastSessions.length}
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="text-xs text-white/40 py-4 text-center">
                  Loading past sessions...
                </div>
              ) : historyError ? (
                <div
                  role="alert"
                  className="text-xs text-red-300 py-4 text-center"
                >
                  {historyError}
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="text-xs text-white/40 py-4 text-center leading-relaxed">
                  No previous practice sessions found.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {pastSessions.slice(0, 6).map((practice) => {
                    const href =
                      practice.status === "COMPLETED"
                        ? `/ai/mock-interview/summary?sessionId=${practice.id}`
                        : `/ai/mock-interview/active?sessionId=${practice.id}`;
                    return (
                      <Link
                        key={practice.id}
                        href={href}
                        className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className="text-xs font-semibold text-white group-hover:text-[#4285F4] transition-colors truncate">
                            {practice.roleTarget}
                          </span>
                          <span className="shrink-0 text-[10px] uppercase text-white/35">
                            Text practice
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/40">
                          <span>
                            {practice.status === "COMPLETED"
                              ? practice.estimatedLevel
                                ? practice.estimatedLevel.replace("_", "/")
                                : "Completed"
                              : practice.status === "IN_PROGRESS"
                                ? "Continue"
                                : "Abandoned"}
                          </span>
                          <span>
                            {new Date(
                              practice.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
