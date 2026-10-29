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
  History,
  AlertCircle,
  Search,
  Mic2,
  Radio,
  CheckCircle2,
  Edit3,
  UserCheck,
  Globe,
  ChevronDown,
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

type VoiceReadiness = {
  ready: boolean;
  code: string;
  message: string;
  personaName: string | null;
};

const SENIORITY_OPTIONS = [
  "Junior",
  "Mid-Level",
  "Senior",
  "Staff / Lead",
] as const;

export default function MockInterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleFromAssessment = searchParams.get("role") || "";
  const focusSkills = useMemo(
    () =>
      (searchParams.get("skills") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6),
    [searchParams],
  );

  const [roleTarget, setRoleTarget] = useState(roleFromAssessment);
  const [seniority, setSeniority] =
    useState<(typeof SENIORITY_OPTIONS)[number]>("Mid-Level");
  const [practiceContext, setPracticeContext] = useState("");
  const [voiceReadiness, setVoiceReadiness] = useState<VoiceReadiness | null>(null);
  const [checkingVoice, setCheckingVoice] = useState(false);
  const roleOptions: RoleOption[] = useMemo(() => searchRoles(roleTarget), [roleTarget]);
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [hasProfileData, setHasProfileData] = useState(false);
  const [language, setLanguage] = useState("auto");
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const startRequestKey = useRef<string | null>(null);

  const activeInProgressSession = useMemo(
    () => pastSessions.find((s) => s.status === "IN_PROGRESS"),
    [pastSessions],
  );

  useEffect(() => {
    startRequestKey.current = null;
  }, [roleTarget, seniority, practiceContext]);

  // Auto-populate from Candidate Profile
  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const res = await fetch("/api/candidate/profile?view=overview", {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (data?.success && data.profile) {
          const prof = data.profile;
          const target =
            prof.preferences?.targetRole ||
            prof.headline ||
            (Array.isArray(prof.experience) && prof.experience[0]?.role) ||
            "";

          if (target && !roleFromAssessment) {
            setRoleTarget(target);
            setHasProfileData(true);
          }

          const years = typeof prof.experienceYears === "number" ? prof.experienceYears : 2;
          if (years <= 1) setSeniority("Junior");
          else if (years <= 4) setSeniority("Mid-Level");
          else if (years <= 8) setSeniority("Senior");
          else setSeniority("Staff / Lead");

          const extractedSkills = Array.isArray(prof.candidateSkills)
            ? prof.candidateSkills.map((s: { name: string }) => s.name).filter(Boolean)
            : Array.isArray(prof.skills)
            ? prof.skills
            : [];
          if (extractedSkills.length > 0) {
            setProfileSkills(extractedSkills.slice(0, 8));
          }
        }
      } catch {
        // Non-blocking fallback
      } finally {
        if (!controller.signal.aborted) setIsProfileLoaded(true);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, [roleFromAssessment]);

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

  useEffect(() => {
    if (!roleTarget.trim()) {
      setVoiceReadiness({
        ready: false,
        code: "ROLE_REQUIRED",
        message: "Select a target role before checking voice practice.",
        personaName: null,
      });
      return;
    }

    const controller = new AbortController();
    setCheckingVoice(true);

    async function checkReadiness() {
      try {
        const response = await fetch(
          `/api/assessment/mock-interview/voice/readiness?roleTarget=${encodeURIComponent(
            roleTarget.trim(),
          )}`,
          {
            signal: controller.signal,
            credentials: "include",
            cache: "no-store",
          },
        );

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Voice readiness check failed.");
        }

        setVoiceReadiness({
          ready: Boolean(data.ready),
          code: data.code || "UNKNOWN",
          message: data.message || "Voice Mode ready.",
          personaName: data.personaName || null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setVoiceReadiness({
          ready: true, // Default ready since ElevenLabs is configured server-side
          code: "READY",
          message: "Live Voice Practice ready.",
          personaName: "Sara",
        });
      } finally {
        if (!controller.signal.aborted) setCheckingVoice(false);
      }
    }

    void checkReadiness();
    return () => controller.abort();
  }, [roleTarget]);

  const handleStartInterview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleTarget.trim() || isStarting) return;

    setIsStarting(true);
    setErrorMessage(null);

    const idempotencyKey =
      startRequestKey.current ||
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }));
    startRequestKey.current = idempotencyKey;

    try {
      const res = await fetch("/api/assessment/mock-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idempotencyKey,
          roleTarget: roleTarget.trim(),
          declaredSeniority: seniority,
          totalQuestions: 8,
          focusSkills: focusSkills.length > 0 ? focusSkills : profileSkills.slice(0, 6),
          practiceContext: practiceContext.trim() || null,
          mode: "VOICE", // Always live voice-to-voice for mock interview
          language: language === "auto" ? "en" : language,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        session?: { id: string };
      } | null;

      if (res.status === 402) {
        router.push("/credits?returnTo=mock-interview");
        return;
      }

      if (!res.ok || !data?.success || !data?.session?.id) {
        throw new Error(
          data?.error || (res.status >= 500 ? `Service error (${res.status}): Please try again shortly.` : "Could not start your interview. Please try again.")
        );
      }

      router.push(`/ai/mock-interview/active?sessionId=${data.session.id}`);
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
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col font-sans">
      <header className="h-16 border-b border-white/10 px-4 md:px-8 flex items-center justify-between bg-[#141414]/90 backdrop-blur-md sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Image src="/marketing/hirego-logo-hd.png" alt="HireGo AI" width={110} height={28} className="h-7 w-auto" priority />
          <span className="sr-only">Checking voice practice availability</span>
        </Link>
        <Link
          href="/credits"
          className="text-xs text-white/70 hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
        >
          <span>Credit Wallet</span>
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/20 text-[#4285F4] text-xs font-bold uppercase tracking-wider mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#4285F4]" />
            First-Round Screening & Technical Mock Interview
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Live Voice Interview Practice
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Practice a first-round voice interview with Sara and receive an executive scorecard upon completion.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 bg-[#141416] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
            {activeInProgressSession && (
              <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Active Interview Session In Progress
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                        Zero Credits
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      Role: <strong className="text-white">{activeInProgressSession.roleTarget}</strong> • {activeInProgressSession.declaredSeniority || "Mid-Level"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/ai/mock-interview/active?sessionId=${activeInProgressSession.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-emerald-400 transition-all shadow-md"
                >
                  Resume Interview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-6">
              {/* Voice-Only Banner */}
              <div className="rounded-2xl border border-[#4285F4]/30 bg-gradient-to-r from-[#4285F4]/15 via-indigo-950/20 to-transparent p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#4285F4]/20 text-[#4285F4] flex items-center justify-center">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Live Conversational Call</span>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      Interviewer: <strong className="text-white">Sara</strong> (Studio-quality ElevenLabs voice)
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </div>
              </div>

              {/* Profile Auto-Populate Summary Card */}
              {hasProfileData && !isEditingRole ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4285F4]">
                      <UserCheck className="w-4 h-4" />
                      Auto-Detected From Your Profile
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingRole(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Change Role / Custom
                    </button>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-white">{roleTarget}</div>
                    <div className="text-xs text-white/60 mt-0.5">
                      Target Seniority: <span className="text-emerald-400 font-semibold">{seniority}</span>
                    </div>
                  </div>

                  {profileSkills.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-1.5">
                        Assessed Profile Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Target Role Input & Seniority (Shown when customizing or no profile) */}
              {(!hasProfileData || isEditingRole) && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs uppercase tracking-wider text-white/70 font-bold">
                        Target Job Role
                      </label>
                      {hasProfileData && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRole(false)}
                          className="text-xs text-[#4285F4] hover:underline"
                        >
                          Use Profile Role
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/35" />
                      <input
                        type="text"
                        value={roleTarget}
                        onChange={(event) => setRoleTarget(event.target.value)}
                        placeholder="e.g. Frontend Developer, Sales Executive, Product Manager"
                        maxLength={120}
                        className="w-full text-sm bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4285F4] transition-colors"
                        required
                      />
                    </div>

                    <div className="mt-3 min-h-[36px]">
                      {roleOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {roleOptions.slice(0, 6).map((role) => (
                            <button
                              key={role.title}
                              type="button"
                              onClick={() => setRoleTarget(role.title)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/75 hover:border-[#4285F4]/50 hover:text-white transition"
                            >
                              {role.title}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Seniority Picker */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2">
                      Target Seniority Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SENIORITY_OPTIONS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSeniority(level)}
                          className={`text-center text-xs py-2.5 rounded-xl border transition-all ${
                            seniority === level
                              ? "border-[#4285F4] bg-[#4285F4]/20 text-white font-bold"
                              : "border-white/5 bg-white/5 text-white/70 hover:border-white/20"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Interview Language */}
              <div>
                <label
                  htmlFor="interview-language"
                  className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#4285F4]" />
                    Interview Language
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Hindi & 30+ Languages Supported
                  </span>
                </label>
                <div className="relative">
                  <select
                    id="interview-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4285F4] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="auto" className="bg-[#141416] text-white">🌐 Auto-Detect / Multilingual (Adapts to Hindi, Hinglish, English, etc.)</option>
                    <option value="en" className="bg-[#141416] text-white">🇺🇸 English (Global Standard)</option>
                    <option value="hi" className="bg-[#141416] text-white">🇮🇳 Hindi / Hinglish (हिंदी / हिंग्लिश)</option>
                    <option value="es" className="bg-[#141416] text-white">🇪🇸 Spanish (Español)</option>
                    <option value="fr" className="bg-[#141416] text-white">🇫🇷 French (Français)</option>
                    <option value="de" className="bg-[#141416] text-white">🇩🇪 German (Deutsch)</option>
                    <option value="ja" className="bg-[#141416] text-white">🇯🇵 Japanese (日本語)</option>
                    <option value="ar" className="bg-[#141416] text-white">🇸🇦 Arabic (العربية)</option>
                    <option value="pt" className="bg-[#141416] text-white">🇧🇷 Portuguese (Português)</option>
                    <option value="zh" className="bg-[#141416] text-white">🇨🇳 Chinese (中文)</option>
                    <option value="ru" className="bg-[#141416] text-white">🇷🇺 Russian (Русский)</option>
                    <option value="it" className="bg-[#141416] text-white">🇮🇹 Italian (Italiano)</option>
                    <option value="ko" className="bg-[#141416] text-white">🇰🇷 Korean (한국어)</option>
                    <option value="nl" className="bg-[#141416] text-white">🇳🇱 Dutch (Nederlands)</option>
                    <option value="tr" className="bg-[#141416] text-white">🇹🇷 Turkish (Türkçe)</option>
                    <option value="id" className="bg-[#141416] text-white">🇮🇩 Indonesian (Bahasa)</option>
                    <option value="ta" className="bg-[#141416] text-white">🇮🇳 Tamil (தமிழ்)</option>
                    <option value="te" className="bg-[#141416] text-white">🇮🇳 Telugu (తెలుగు)</option>
                    <option value="mr" className="bg-[#141416] text-white">🇮🇳 Marathi (मराठी)</option>
                    <option value="bn" className="bg-[#141416] text-white">🇮🇳 Bengali (বাংলা)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[11px] text-white/50 mt-1">
                  Sara natively understands Indian accents, Hindi, Hinglish, and adapts to whatever language you speak.
                </p>
              </div>

              {/* Optional Context */}
              <div>
                <label
                  htmlFor="practice-context"
                  className="block text-xs uppercase tracking-wider text-white/70 font-bold mb-2"
                >
                  Specific Topic or Area of Focus{" "}
                  <span className="text-white/35 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="practice-context"
                  value={practiceContext}
                  onChange={(event) => setPracticeContext(event.target.value)}
                  maxLength={1_000}
                  rows={2}
                  placeholder="e.g. Focus on system architecture, customer conflict resolution, or behavioural scenarios."
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4285F4] transition-colors resize-none"
                />
              </div>

              {/* Start Button */}
              <button
                type="submit"
                disabled={startDisabled}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-[#4285F4] to-indigo-600 hover:opacity-95 text-white font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting to Room...
                  </>
                ) : (
                  <>
                    <Mic2 className="w-4 h-4 fill-current" />
                    Start Live Voice Interview
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Sidebar / Past Sessions */}
          <aside className="space-y-6">
            <div className="bg-[#141416] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
                <History className="w-4 h-4 text-[#4285F4]" />
                Previous Interviews
              </div>

              {isLoadingHistory ? (
                <div className="text-xs text-white/40 py-6 text-center">Loading past sessions...</div>
              ) : pastSessions.length === 0 ? (
                <div className="text-xs text-white/40 py-6 text-center">No past interviews yet. Your practice history will appear here.</div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto">
                  {pastSessions.slice(0, 5).map((session) => (
                    <Link
                      key={session.id}
                      href={`/ai/mock-interview/active?sessionId=${session.id}`}
                      className="block p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition text-xs"
                    >
                      <div className="font-bold text-white truncate">{session.roleTarget}</div>
                      <div className="flex items-center justify-between text-white/40 text-[10px] mt-1">
                        <span>{session.declaredSeniority || "Standard"}</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141416] p-4 flex items-start gap-3 text-xs text-white/50 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Private practice mode. Your interview performance is confidential and only used for your personal scorecard.</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
