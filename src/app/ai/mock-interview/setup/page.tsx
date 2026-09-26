"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, ArrowRight, Clock, History, AlertCircle } from "lucide-react";

export default function MockInterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromAssessment = searchParams.get("role")?.trim() || "";
  const focusSkills = (searchParams.get("focus") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 6);
  const [roleTarget, setRoleTarget] = useState(roleFromAssessment || "Full Stack Engineer");
  const [seniority, setSeniority] = useState("Senior");
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load candidate's past sessions for history overview
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/assessment/mock-interview/session");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.sessions)) {
            setPastSessions(data.sessions);
          }
        }
      } catch {
        // Non-fatal if history cannot be loaded initially
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget.trim()) {
      setErrorMessage("Please enter a target role.");
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const fullRoleTarget = `${seniority} ${roleTarget.trim()}`;
      const res = await fetch("/api/assessment/mock-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTarget: fullRoleTarget,
          totalQuestions: Number(totalQuestions),
          focusSkills,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start mock interview session.");
      }

      router.push(`/ai/mock-interview/active?sessionId=${data.session.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-[64px] border-b border-white/10 px-6 flex items-center justify-between bg-[#121212]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-xl tracking-tight">
            <span>Hire<span className="text-[#C5221F]">Go</span></span>
            <span className="text-[#4285F4]">AI</span>
          </Link>
          <span className="text-white/30">|</span>
          <span className="text-xs uppercase tracking-widest text-white/70 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C5221F]" />
            AI Practice Studio
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2.5">
            Technical Mock Interview Setup
          </h1>
          <p className="text-sm text-white/60 max-w-2xl">
            Practice role-relevant interview questions in a text-only session. Type your answers, receive structured turn-by-turn feedback, and track your practice progression.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Setup Form */}
          <div className="lg:col-span-7 bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5221F]" /> Interview Parameters
            </h2>

            {focusSkills.length > 0 && (
              <div className="mb-6 rounded-xl border border-[#4285F4]/30 bg-[#4285F4]/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8AB4F8]">Practice focus from Skill Validation</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {focusSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-[#4285F4]/30 bg-black/20 px-3 py-1.5 text-xs text-white">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-white/50">
                  These focus areas guide practice questions only. Mock Interview performance does not rewrite your historical Skill Validation score.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              {/* Role Target */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Target Role
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    "Full Stack Engineer",
                    "Frontend Architect",
                    "Backend Systems",
                    "AI / ML Engineer",
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleTarget(role)}
                      className={`text-left text-xs px-3.5 py-2.5 rounded-lg border transition-all ${
                        roleTarget === role
                          ? "border-[#C5221F] bg-[#C5221F]/10 text-white font-semibold"
                          : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={roleTarget}
                  onChange={(e) => setRoleTarget(e.target.value)}
                  placeholder="Or enter custom role (e.g. AI Systems Architect)"
                  maxLength={100}
                  className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C5221F] transition-colors"
                  required
                />
              </div>

              {/* Seniority Level */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Seniority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Junior", "Mid-Level", "Senior", "Staff/Lead"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeniority(lvl)}
                      className={`text-center text-xs py-2.5 rounded-lg border transition-all ${
                        seniority === lvl
                          ? "border-[#C5221F] bg-[#C5221F]/10 text-white font-semibold"
                          : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                  Interview Length
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { count: 3, label: "Short (3 Qs)", time: "~10 mins" },
                    { count: 5, label: "Standard (5 Qs)", time: "~20 mins" },
                    { count: 8, label: "Comprehensive (8 Qs)", time: "~35 mins" },
                  ].map((len) => (
                    <button
                      key={len.count}
                      type="button"
                      onClick={() => setTotalQuestions(len.count)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        totalQuestions === len.count
                          ? "border-[#C5221F] bg-[#C5221F]/10 text-white"
                          : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">{len.label}</div>
                      <div className="text-[11px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {len.time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text-Based Evaluation Notice */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Text-Based Practice Evaluation</div>
                  <div className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                    Questions are generated based on your selected role, claimed skills, and optional Skill Validation focus areas. Type your answers to receive structured practice feedback.
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                type="submit"
                disabled={isStarting}
                className="w-full h-12 rounded-xl bg-[#C5221F] hover:bg-[#A31816] text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing Tailored Questions...
                  </>
                ) : (
                  <>
                    Start Practice Interview <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar / History & Guidelines (Col 3) */}
          <div className="space-y-6">
            {/* Guidelines Card */}
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider text-white/70 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Practice Evaluation Ethics
              </div>
              <ul className="text-xs text-white/60 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#C5221F] font-bold">•</span>
                  <span><strong>Defensible Metrics:</strong> Feedback focuses on technical clarity, answer structure, and conciseness.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C5221F] font-bold">•</span>
                  <span><strong>No Deceptive AI:</strong> We do not infer emotional or psychological states from video/audio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C5221F] font-bold">•</span>
                  <span><strong>Private Practice:</strong> Scores are confidential to you and do not alter company hiring decisions without your submission.</span>
                </li>
              </ul>
            </div>

            {/* Past Practice Sessions */}
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 font-bold">
                  <History className="w-4 h-4 text-[#4285F4]" />
                  Recent Practice Sessions
                </div>
                <span className="text-[11px] text-white/40">({pastSessions.length})</span>
              </div>

              {isLoadingHistory ? (
                <div className="text-xs text-white/40 py-4 text-center">Loading past sessions...</div>
              ) : pastSessions.length === 0 ? (
                <div className="text-xs text-white/40 py-4 text-center leading-relaxed">
                  No previous sessions found. Start your first session to track fluency growth!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {pastSessions.slice(0, 5).map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/ai/mock-interview/summary?sessionId=${s.id}`}
                      className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white group-hover:text-[#4285F4] transition-colors truncate max-w-[140px]">
                          {s.roleTarget}
                        </span>
                        {s.overallScore !== null && (
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {s.overallScore}/100
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/40">
                        <span>{s.status === "COMPLETED" ? "Completed" : "In Progress"}</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
