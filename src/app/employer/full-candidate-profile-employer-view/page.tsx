"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  candidateProfile,
  candidateScores,
  candidateVideoAnalysis,
  candidateSkills,
  candidateExperience,
  candidateEducation,
  candidateCertifications,
  candidateAssessments,
  candidateAICareerSummary,
  candidateRecommendations,
  candidateActivity,
  candidateAnalytics,
} from "@/mocks/candidateProfileData";

import { getUniversalCandidateProfile } from "@/services/candidateProfileService";
import { useApp } from "@/context/AppContext";

/* ─── Premium High-Contrast Design Tokens ─── */
const T = {
  pageBg: "#0E0E10",
  card: "#16161B",
  cardAlt: "#242430",
  border: "#333333",
  borderLight: "#262626",
  blue: "#82B1FF",
  blueDark: "#448AFF",
  green: "#4CAF50",
  greenDark: "#2E7D32",
  yellow: "#F57F17",
  red: "#FF5252",
  purple: "#40C4FF",
  purpleDark: "#0068B0",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  radius: "20px",
  shadow: "0 8px 30px rgba(0,0,0,0.5)",
};

/* ─── Card Wrapper ─── */
const Card = ({ children, className = "", id, hover = false }: { children: React.ReactNode; className?: string; id?: string; hover?: boolean }) => (
  <div
    id={id}
    className={`bg-surface-container shadow-card rounded-[20px] p-6 md:p-8 border border-white/10 scroll-mt-20 ${hover ? "hover:-translate-y-0.5 transition-all duration-200" : ""} ${className}`}
  >
    {children}
  </div>
);

/* ─── Section Header ─── */
const SectionHeader = ({ icon, colorClass, bgClass, borderClass, title, action }: { icon: string; colorClass: string; bgClass: string; borderClass: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shadow-inner border ${bgClass} ${borderClass}`}>
        <span className={`material-symbols-outlined text-[22px] ${colorClass}`}>{icon}</span>
      </div>
      <h2 className="text-[20px] font-bold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
    </div>
    {action}
  </div>
);

/* ─── Navigation Config ─── */
const SECTIONS = [
  { id: "overview", label: "Overview", icon: "person" },
  { id: "ai-summary", label: "AI Summary", icon: "psychology" },
  { id: "video-resume", label: "Video Resume", icon: "videocam" },
  { id: "skills", label: "Skills", icon: "code" },
  { id: "experience", label: "Experience", icon: "work" },

  { id: "education", label: "Education", icon: "school" },
  { id: "certifications", label: "Certifications", icon: "verified" },
  { id: "assessments", label: "Assessments", icon: "quiz" },
  { id: "ai-score", label: "AI Hiring Score", icon: "analytics" },
  { id: "recommendations", label: "Recommendations", icon: "lightbulb" },
  { id: "activity", label: "Activity", icon: "timeline" },
  { id: "analytics", label: "Analytics", icon: "bar_chart" },
];

export default function UniversalCandidateProfile() {
  const router = useRouter();
  const { user } = useApp();
  const [isEmployer, setIsEmployer] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [expandedCareer, setExpandedCareer] = useState(false);
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const [videoTab, setVideoTab] = useState<"analysis" | "transcript" | "insights">("analysis");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [profileData, setProfileData] = useState(() => getUniversalCandidateProfile());

  /* Synchronize profile data and role on client mount */
  useEffect(() => {
    setProfileData(getUniversalCandidateProfile());
    const savedRole = localStorage.getItem("userRole") || localStorage.getItem("role");
    if (
      user?.role === "EMPLOYER" || 
      user?.role === "Employer" || 
      savedRole === "EMPLOYER" || 
      savedRole === "employer" || 
      window.location.pathname.startsWith("/employer")
    ) {
      setIsEmployer(true);
    }
  }, [user]);

  /* Video controls */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [hasVideoError, setHasVideoError] = useState(false);

  const p = profileData.profile;
  const s = profileData.scores;

  /* ScrollSpy Observer */
  useEffect(() => {
    const sectionEls = SECTIONS.map((sec) => document.getElementById(sec.id)).filter(Boolean) as HTMLElement[];
    if (!sectionEls.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
    );
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const triggerToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(`https://${p.profileLink}`);
    triggerToast("Public profile link copied to clipboard!");
  }, [p.profileLink, triggerToast]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const togglePlay = async () => {
    if (!videoRef.current || hasVideoError) {
      setIsPlaying((prev) => !prev);
      return;
    }
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn("Video playback fallback triggered:", err);
      setIsPlaying((prev) => !prev);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  const scoreColor = (score: number) =>
    score >= 90 ? T.green : score >= 70 ? T.yellow : T.red;

  /* Recommendation icons */
  const recIcon: Record<string, string> = {
    "Recommended Job": "work",
    "Salary Prediction": "payments",
    "Skill Gap": "trending_up",
    "Learning Course": "school",
    "Career Roadmap": "route",
    "Interview Tips": "tips_and_updates",
  };

  return (
    <div className="min-h-screen pb-20 relative bg-bg-page text-text-primary">
      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-[16px] text-[14px] font-semibold flex items-center gap-3 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4" style={{ background: T.card, border: `1px solid ${T.blue}`, color: T.textPrimary }}>
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: T.blue }} />
          {toast}
        </div>
      )}

      {/* ─── Share Profile Modal ─── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] p-6 space-y-5 shadow-2xl border bg-surface-container border-outline" >
            <div className="flex items-center justify-between pb-3 border-b border-outline" >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-2xl" style={{ color: T.blue }}>share</span>
                <h3 className="text-lg font-bold text-white">Share Candidate Profile</h3>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Share this Universal Candidate Profile link with recruiters, hiring managers, or colleagues. Anyone with the link can view {p.name}&apos;s verified credentials &amp; video resume.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#11131A] border border-outline" >
                <span className="material-symbols-outlined text-sm text-slate-400">link</span>
                <span className="text-xs font-mono font-semibold text-sky-400 truncate flex-1">https://{p.profileLink}</span>
                <button onClick={copyShareLink} className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-xs">content_copy</span> Copy
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { copyShareLink(); setShareModalOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">share</span> Copy &amp; Close
              </button>
              <button onClick={() => setShareModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Grid Layout (3 Columns for Employer, 2 for Candidate) ─── */}
      <div 
        className="flex gap-4 items-start mx-auto pt-2 w-full"
        style={{ maxWidth: isEmployer ? "1600px" : "1120px" }}
      >

        {/* ════════════════════════════════════════ 1. LEFT SIDEBAR (260px) ════════════════════════════════════════ */}
        <aside className="w-[220px] flex-shrink-0 sticky top-4 hidden lg:flex flex-col gap-4 max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar pb-6">
          {/* Candidate Compact Identity Header */}
          <div className="rounded-[20px] p-5 space-y-4 shadow-lg" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate flex items-center gap-1">
                  {p.name}
                  {p.isVerified && <span className="material-symbols-outlined text-xs" style={{ color: T.blue }}>verified</span>}
                </h3>
                <p className="text-xs text-slate-400 truncate">{p.headline}</p>
              </div>
            </div>

            <button onClick={() => setShareModalOpen(true)} className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200" style={{ background: `${T.blue}1A`, color: T.blue, border: `1px solid ${T.blue}40` }}>
              <span className="material-symbols-outlined text-sm">share</span> Share Profile Link
            </button>
          </div>

          {/* Section Navigation Rail */}
          <div className="rounded-[20px] p-4 shadow-lg space-y-1" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2">Navigate Sections</p>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all duration-150"
                    style={{
                      background: isActive ? `${T.blue}20` : "transparent",
                      color: isActive ? T.blue : T.textMuted,
                      border: isActive ? `1px solid ${T.blue}40` : "1px solid transparent",
                    }}
                    aria-current={isActive ? "location" : undefined}
                  >
                    <span className="material-symbols-outlined text-[18px]">{sec.icon}</span>
                    <span className="truncate">{sec.label}</span>
                    {isActive && <span className="ml-auto w-2 h-2 rounded-full shadow-sm" style={{ background: T.blue }} />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ════════════════════════════════════════ 2. MAIN CENTER CONTENT ════════════════════════════════════════ */}
        <main className="flex-1 min-w-0 space-y-5 pt-0 pb-8 overflow-hidden">
          {/* ── HERO SECTION ── */}
          <section id="overview" className="rounded-[24px] p-6 md:p-8 space-y-6 shadow-xl scroll-mt-20" style={{ background: `linear-gradient(135deg, ${T.cardAlt} 0%, ${T.card} 100%)`, border: `1px solid ${T.borderLight}` }}>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <img src={p.avatar} alt={p.name} className="w-[110px] h-[110px] rounded-2xl object-cover border-2 border-white/10 shadow-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{p.name}</h1>
                  {p.isVerified && <span className="material-symbols-outlined text-xl" style={{ color: T.blue }}>verified</span>}
                </div>
                <p className="text-base font-semibold text-slate-200">{p.headline} at <span className="text-white font-bold">{p.currentCompany}</span></p>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-sky-400">work</span>{p.experience}</span>
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-sky-400">location_on</span>{p.location}</span>
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-sky-400">schedule</span>{p.noticePeriod} Notice</span>
                  <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-sky-400">badge</span>{p.preferredJobType}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {p.isOpenToWork && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${T.green}1A`, color: T.green, border: `1px solid ${T.green}40` }}>✓ Open To Work</span>}
                  {p.isEliteCandidate && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${T.yellow}1A`, color: T.yellow, border: `1px solid ${T.yellow}40` }}>⭐ Elite Candidate</span>}
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${T.blue}1A`, color: T.blue, border: `1px solid ${T.blue}40` }}>{p.availability}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5 border-t border-outline">
              <button onClick={() => scrollToSection("video-resume")} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform text-white shadow-lg" style={{ fontFamily: "var(--font-body)", background: T.blueDark }}>
                <span className="material-symbols-outlined text-base">play_circle</span> Watch Video Resume
              </button>
              {isEmployer && (
                <button onClick={() => triggerToast("Downloading AI Resume PDF...")} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 text-white transition-colors border" style={{ fontFamily: "var(--font-body)", background: T.cardAlt, borderColor: T.borderLight }}>
                  <span className="material-symbols-outlined text-base">download</span> Download AI Resume
                </button>
              )}
              <button onClick={() => setShareModalOpen(true)} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 text-white transition-colors border" style={{ fontFamily: "var(--font-body)", background: T.cardAlt, borderColor: T.borderLight }}>
                <span className="material-symbols-outlined text-base">share</span> Share Profile
              </button>
            </div>
          </section>

          {/* ── QUICK ANALYTICS ROW ── */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "AI Hiring Score", value: `${s.hiringScore.overall}%`, icon: "psychology", color: T.blue, trend: "Top 5% Candidate" },
              { label: "Profile Completion", value: `${s.profileCompletion}%`, icon: "check_circle", color: T.green, trend: "Fully Verified" },
              { label: "Recruiter Views", value: `${s.recruiterViews}`, icon: "visibility", color: T.yellow, trend: "+23% this month" },
              { label: "Interview Invites", value: `${s.interviewInvites}`, icon: "calendar_today", color: T.purple, trend: "3 Active Offers" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-transform duration-200 border shadow-md bg-surface-container border-outline" >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}1E`, border: `1px solid ${card.color}40` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: card.color }}>{card.icon}</span>
                </div>
                <p className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>{card.value}</p>
                <p className="text-xs font-semibold text-slate-300">{card.label}</p>
                <p className="text-[11px] font-bold" style={{ color: card.color }}>{card.trend}</p>
              </div>
            ))}
          </section>

          {/* ── AI CAREER SUMMARY ── */}
          <Card id="ai-summary">
            <SectionHeader icon="psychology" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="AI Career Intelligence Summary" action={
              <button onClick={() => setExpandedCareer(!expandedCareer)} className="text-xs font-bold hover:underline" style={{ color: T.blue }}>
                {expandedCareer ? "Show Less" : "Expand All Insights"}
              </button>
            } />
            <p className="text-sm leading-relaxed text-slate-200 mb-6 font-medium">{candidateAICareerSummary.careerSummary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-surface-container-high border-outline" >
                <p className="text-xs uppercase font-bold tracking-wider mb-2 text-slate-400">Leadership Potential</p>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">{candidateAICareerSummary.leadershipPotential}</p>
              </div>
              <div className="p-4 rounded-xl border bg-surface-container-high border-outline" >
                <p className="text-xs uppercase font-bold tracking-wider mb-2 text-slate-400">Communication Style</p>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">{candidateAICareerSummary.communicationStyle}</p>
              </div>
            </div>
            {expandedCareer && (
              <div className="space-y-4 mt-4 animate-in fade-in">
                <div className="p-4 rounded-xl border bg-surface-container-high border-outline" >
                  <p className="text-xs uppercase font-bold tracking-wider mb-2 text-slate-400">Learning Ability &amp; Adaptability</p>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{candidateAICareerSummary.learningAbility}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border" style={{ background: `${T.green}0A`, borderColor: `${T.green}30` }}>
                    <p className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: T.green }}>Core Strengths</p>
                    <ul className="space-y-2 text-xs text-slate-200 font-medium">
                      {candidateAICareerSummary.strengths.map((st, i) => <li key={i} className="flex items-start gap-2"><span style={{ color: T.green }}>✓</span>{st}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl border" style={{ background: `${T.yellow}0A`, borderColor: `${T.yellow}30` }}>
                    <p className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: T.yellow }}>Growth Areas</p>
                    <ul className="space-y-2 text-xs text-slate-200 font-medium">
                      {candidateAICareerSummary.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2"><span style={{ color: T.yellow }}>△</span>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ── VIDEO RESUME ── */}
          <Card id="video-resume" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline" >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/30">
                  <span className="material-symbols-outlined text-red-400 text-2xl">videocam</span>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight truncate" style={{ fontFamily: "var(--font-display)" }}>Video Resume &amp; AI Speech Analysis</h2>
              </div>
              <span className="self-start sm:self-auto px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">verified</span> HD Video Verified
              </span>
            </div>

            {/* Video Player (Centered, compact size) */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative aspect-video w-full rounded-[20px] overflow-hidden bg-slate-950 group border shadow-2xl flex items-center justify-center border-outline" >
                {!hasVideoError ? (
                  <video
                    ref={videoRef}
                    onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
                    onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
                    onError={() => setHasVideoError(true)}
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                  </video>
                ) : (
                  /* Fallback Player: Premium Tech Aesthetic with wave visualization */
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-black select-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)] animate-pulse" />
                    <span className="material-symbols-outlined text-4xl text-sky-400/30 mb-2 animate-bounce">graphic_eq</span>
                    <p className="text-[10px] text-sky-400 font-extrabold uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-body)" }}>AI Stream Verified</p>
                    <h4 className="text-xs font-semibold text-slate-400 max-w-xs mb-6" style={{ fontFamily: "var(--font-body)" }}>HD Video Resume &amp; Voice Waveform Stream Ready</h4>
                    <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-md px-4">
                      {[30, 60, 45, 80, 50, 95, 70, 40, 85, 60, 75, 50, 90, 65, 40, 80, 55, 30].map((h, i) => (
                        <div key={i} className="w-1.5 bg-gradient-to-t from-sky-400 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ height: isPlaying ? `${h}%` : "15%" }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Play Button Overlay when paused */}
                {!isPlaying && (
                  <button onClick={togglePlay} className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 z-10 hover:shadow-sky-500/20 hover:border-sky-400">
                    <span className="material-symbols-outlined text-4xl ml-1 text-sky-400">play_arrow</span>
                  </button>
                )}

                {/* Player Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <input type="range" min="0" max={duration || 120} value={currentTime} onChange={(e) => { const v = parseFloat(e.target.value); setCurrentTime(v); if (videoRef.current) videoRef.current.currentTime = v; }} className="w-full accent-sky-400 h-1.5 bg-white/20 rounded-lg cursor-pointer" />
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className="hover:text-sky-400 transition-colors">
                        <span className="material-symbols-outlined text-2xl">{isPlaying ? "pause" : "play_arrow"}</span>
                      </button>
                      <button onClick={() => { setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }} className="hover:text-sky-400 transition-colors">
                        <span className="material-symbols-outlined text-xl">{isMuted ? "volume_off" : "volume_up"}</span>
                      </button>
                      <span className="font-mono text-xs text-slate-300 font-semibold">{formatTime(currentTime)} / {candidateVideoAnalysis.duration}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { const sp = playbackSpeed === 1.0 ? 1.5 : playbackSpeed === 1.5 ? 2.0 : 1.0; setPlaybackSpeed(sp); if (videoRef.current) videoRef.current.playbackRate = sp; }} className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-xs font-bold font-mono">
                        {playbackSpeed}x
                      </button>
                      <button onClick={() => videoRef.current?.requestFullscreen?.()} className="hover:text-sky-400 transition-colors">
                        <span className="material-symbols-outlined text-xl">fullscreen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Video Information Bar (4 equal cards below video) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Duration", value: candidateVideoAnalysis.duration, icon: "schedule", color: T.blue },
                { label: "Language", value: candidateVideoAnalysis.language, icon: "translate", color: T.green },
                { label: "Uploaded Date", value: candidateVideoAnalysis.uploadDate, icon: "calendar_today", color: T.yellow },
                { label: "Quality", value: candidateVideoAnalysis.quality, icon: "hd", color: T.purple },
              ].map((info) => (
                <div key={info.label} className="p-4 rounded-[16px] border flex flex-col items-center text-center gap-2 shadow-md" style={{ background: T.cardAlt, borderColor: T.border }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}1E`, border: `1px solid ${info.color}40` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: info.color }}>{info.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase" style={{ fontFamily: "var(--font-body)" }}>{info.label}</p>
                  <p className="text-sm font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>{info.value}</p>
                </div>
              ))}
            </div>

            {/* 5. AI Navigation Tabs */}
            <div className="flex gap-2 p-1.5 rounded-[16px] border bg-surface-container-high border-outline" >
              {(["analysis", "transcript", "insights"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setVideoTab(tab)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: videoTab === tab ? T.card : "transparent",
                    color: videoTab === tab ? T.textPrimary : T.textMuted,
                    border: videoTab === tab ? `1px solid ${T.blue}40` : "1px solid transparent",
                    boxShadow: videoTab === tab ? T.shadow : "none",
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    {tab === "analysis" ? "analytics" : tab === "transcript" ? "description" : "psychology"}
                  </span>
                  {tab === "analysis" ? "AI Analysis" : tab === "transcript" ? "Transcript" : "AI Insights"}
                </button>
              ))}
            </div>

            {/* ── TAB 1: AI ANALYSIS GRID (3 columns × 3 rows = 9 cards) ── */}
            {videoTab === "analysis" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in">
                {candidateVideoAnalysis.metrics.map((m) => (
                  <div
                    key={m.name}
                    className="p-3.5 rounded-[12px] border flex flex-col gap-2 hover:-translate-y-0.5 transition-transform duration-200 shadow-md bg-surface-container-high border-outline"
                  >
                    {/* Top: Icon + Name + Badge (Stacked to prevent overlap) */}
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${T.blue}1E`, border: `1px solid ${T.blue}40` }}>
                        <span className="material-symbols-outlined text-sm" style={{ color: T.blue }}>{m.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white leading-tight" style={{ fontFamily: "var(--font-body)" }}>{m.name}</span>
                        <span className="self-start mt-0.5 px-1 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider leading-none" style={{ background: `${scoreColor(m.score)}1E`, color: scoreColor(m.score), border: `1px solid ${scoreColor(m.score)}40` }}>
                          {m.rating}
                        </span>
                      </div>
                    </div>
                    {/* Bottom: Score */}
                    <div className="flex items-baseline justify-between pt-1.5 border-t" style={{ borderColor: T.border }}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase" style={{ fontFamily: "var(--font-body)" }}>Score</span>
                      <span className="text-xl font-extrabold leading-none" style={{ color: scoreColor(m.score), fontFamily: "var(--font-display)" }}>
                        {m.name === "Overall Readiness" ? `${m.score}%` : `${m.score}/100`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB 2: TRANSCRIPT ── */}
            {videoTab === "transcript" && (
              <div className="p-6 rounded-[20px] border space-y-4 animate-in fade-in bg-surface-container-high border-outline" >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-outline" >
                  <div className="relative w-full sm:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="Search transcript..."
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-900 border text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 border-outline"
                      
                    />
                  </div>
                  <button
                    onClick={() => {
                      const fullText = candidateVideoAnalysis.transcriptData.map((t) => `[${t.timestamp}] ${t.text}`).join("\n");
                      navigator.clipboard.writeText(fullText);
                      triggerToast("Full transcript copied to clipboard!");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span> Copy Full Transcript
                  </button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                  {candidateVideoAnalysis.transcriptData
                    .filter((t) => t.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                    .map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border bg-slate-900/70 hover:border-sky-500/40 transition-colors space-y-1.5 border-outline" >
                        <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800">
                          {item.timestamp}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">{item.text}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: AI INSIGHTS ── */}
            {videoTab === "insights" && (
              <div className="space-y-4 animate-in fade-in">
                {/* Communication Summary */}
                <div className="p-6 rounded-[20px] border space-y-2 bg-surface-container-high border-outline" >
                  <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">psychology</span> Communication Summary
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{candidateVideoAnalysis.insights.communicationSummary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="p-6 rounded-[20px] border space-y-3" style={{ background: `${T.green}08`, borderColor: `${T.green}30` }}>
                    <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.green }}>
                      <span className="material-symbols-outlined text-base">check_circle</span> Core Presentation Strengths
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-200 font-medium">
                      {candidateVideoAnalysis.insights.strengths.map((st, i) => (
                        <li key={i} className="flex items-start gap-2"><span style={{ color: T.green }}>✓</span>{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="p-6 rounded-[20px] border space-y-3" style={{ background: `${T.yellow}08`, borderColor: `${T.yellow}30` }}>
                    <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: T.yellow }}>
                      <span className="material-symbols-outlined text-base">warning</span> Areas for Speech Polish
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-200 font-medium">
                      {candidateVideoAnalysis.insights.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2"><span style={{ color: T.yellow }}>△</span>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Metrics Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-[20px] border space-y-2 bg-surface-container-high border-outline" >
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Speaking Pattern &amp; Pace</p>
                    <p className="text-xs text-slate-200 font-medium">{candidateVideoAnalysis.insights.speakingPattern}</p>
                  </div>
                  <div className="p-5 rounded-[20px] border space-y-2 bg-surface-container-high border-outline" >
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Confidence &amp; Gaze Index</p>
                    <p className="text-xs text-slate-200 font-medium">{candidateVideoAnalysis.insights.confidenceAnalysis}</p>
                  </div>
                  <div className="p-5 rounded-[20px] border space-y-2 bg-surface-container-high border-outline" >
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Interview Readiness</p>
                    <p className="text-xs text-emerald-400 font-bold">{candidateVideoAnalysis.insights.interviewReadiness}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ── SKILLS ── */}
          <Card id="skills">
            <SectionHeader icon="code" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Verified Skills Matrix" />
            <div className="space-y-8">
              {Object.entries(candidateSkills).map(([category, skills]) => {
                const catColors: Record<string, string> = { technical: T.blue, softSkills: T.green, languages: T.purple, tools: T.yellow, cloud: T.red };
                const color = catColors[category] || T.blue;
                return (
                  <div key={category} className="pb-6 last:pb-0 border-b last:border-b-0" style={{ borderBottomColor: "rgba(255,255,255,0.05)", borderBottomWidth: "1px" }}>
                    <p className="text-xs uppercase font-extrabold tracking-widest mb-3.5 text-slate-400" style={{ fontFamily: "var(--font-display)" }}>{category.replace(/([A-Z])/g, " $1")}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {skills.map((sk) => (
                        <span key={sk.name} className="px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all" style={{ background: `${color}14`, color, borderColor: `${color}30` }}>
                          {sk.verified && <span style={{ color: T.green }}>✓</span>}
                          {sk.name}
                          <span className="text-[10px] opacity-75 font-mono">({sk.level})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── EXPERIENCE ── */}
          <Card id="experience">
            <SectionHeader icon="work" colorClass="text-yellow" bgClass="bg-yellow/10" borderClass="border-yellow/30" title="Work Experience &amp; Impact" />
            <div className="space-y-6">
              {candidateExperience.map((exp, i) => (
                <div key={i} className="relative pl-6 pb-6 last:pb-0 border-l-2 border-outline" >
                  <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full" style={{ background: T.blue }} />
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base font-bold text-white">{exp.role}</h4>
                      <p className="text-xs font-semibold text-slate-300">{exp.company} · {exp.type}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{exp.duration} ({exp.durationYears}) · {exp.location}</p>
                    </div>
                    <button onClick={() => setExpandedExp(expandedExp === i ? null : i)} className="text-xs font-bold text-sky-400 hover:underline">
                      {expandedExp === i ? "Less" : "View Achievements"}
                    </button>
                  </div>
                  {expandedExp === i && (
                    <div className="space-y-3 mt-3 pt-3 border-t border-outline" >
                      <p className="text-xs font-bold text-slate-300 uppercase">Key Deliverables:</p>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {exp.achievements.map((a, j) => <li key={j} className="flex items-start gap-2"><span style={{ color: T.green }}>•</span>{a}</li>)}
                      </ul>
                      <div className="p-3 rounded-xl border mt-2" style={{ background: `${T.blue}0E`, borderColor: `${T.blue}25` }}>
                        <p className="text-[10px] font-bold text-sky-400 uppercase mb-1">AI Performance Assessment</p>
                        <p className="text-xs text-slate-200 font-medium">{exp.aiImpact}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>



          {/* ── EDUCATION & CERTIFICATIONS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card id="education">
              <SectionHeader icon="school" colorClass="text-tertiary" bgClass="bg-tertiary/10" borderClass="border-tertiary/30" title="Education" />
              <div className="space-y-4">
                {candidateEducation.map((edu, i) => (
                  <div key={i} className="p-4 rounded-xl border space-y-1 bg-surface-container-high border-outline" >
                    <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                    <p className="text-xs font-semibold text-slate-300">{edu.institution}</p>
                    <p className="text-xs text-slate-400">{edu.year} · CGPA: {edu.cgpa}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="certifications">
              <SectionHeader icon="verified" colorClass="text-yellow" bgClass="bg-yellow/10" borderClass="border-yellow/30" title="Certifications" />
              <div className="space-y-4">
                {candidateCertifications.map((cert) => (
                  <div key={cert.name} className="p-4 rounded-xl border space-y-1 bg-surface-container-high border-outline" >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{cert.name}</h4>
                      {cert.verified && <span className="material-symbols-outlined text-sm" style={{ color: T.green }}>verified</span>}
                    </div>
                    <p className="text-xs font-semibold text-slate-300">{cert.issuer}</p>
                    <p className="text-xs text-slate-400">Issued: {cert.issuedDate}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── ASSESSMENTS ── */}
          <Card id="assessments">
            <SectionHeader icon="quiz" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Assessments &amp; Test Scores" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(candidateAssessments).map(([key, val]) => (
                <div key={key} className="p-4 rounded-xl border text-center space-y-2 bg-surface-container-high border-outline" >
                  <p className="text-[11px] uppercase font-bold text-slate-400">{key}</p>
                  <p className="text-2xl font-extrabold" style={{ color: scoreColor(val.score), fontFamily: "var(--font-display)" }}>{val.score}%</p>
                  <p className="text-xs font-bold text-slate-300">Top {100 - val.percentile}%</p>
                  <p className="text-[10px] text-slate-400">Rank #{val.rank}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── AI HIRING SCORE BREAKDOWN ── */}
          <Card id="ai-score">
            <SectionHeader icon="analytics" colorClass="text-green" bgClass="bg-green/10" borderClass="border-green/30" title="AI Hiring Score™ Breakdown" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              {Object.entries(s.hiringScore).filter(([k]) => k !== "overall").map(([key, val]) => {
                const scoreNum = Number(val) || 0;
                const displayVal = key === "risk" ? 100 - scoreNum : scoreNum;
                return (
                  <div key={key} className="p-3 rounded-xl border space-y-2 bg-surface-container-high border-outline" >
                    <p className="text-[10px] uppercase font-bold text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${displayVal}%`, background: scoreColor(displayVal) }} />
                    </div>
                    <p className="text-sm font-extrabold" style={{ color: scoreColor(displayVal) }}>{displayVal}%</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── AI RECOMMENDATIONS ── */}
          <Card id="recommendations">
            <SectionHeader icon="lightbulb" colorClass="text-yellow" bgClass="bg-yellow/10" borderClass="border-yellow/30" title="AI Actionable Recommendations" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidateRecommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-xl border space-y-2 bg-surface-container-high border-outline" >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-400">{recIcon[rec.type] || "auto_awesome"}</span>
                    <span className="text-[10px] font-bold uppercase text-amber-400">{rec.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                  <p className="text-xs text-slate-300 leading-normal">{rec.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── ACTIVITY & ANALYTICS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card id="activity">
              <SectionHeader icon="timeline" colorClass="text-tertiary" bgClass="bg-tertiary/10" borderClass="border-tertiary/30" title="Recent Activity Timeline" />
              <div className="space-y-3">
                {candidateActivity.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="material-symbols-outlined text-base mt-0.5 text-sky-400">{act.icon}</span>
                    <div>
                      <p className="text-slate-200 font-semibold">{act.event}</p>
                      <p className="text-[10px] text-slate-400">{act.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card id="analytics">
              <SectionHeader icon="bar_chart" colorClass="text-secondary" bgClass="bg-secondary/10" borderClass="border-secondary/30" title="Profile Analytics" />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(candidateAnalytics).slice(0, 4).map(([key, val]) => (
                  <div key={key} className="p-3.5 rounded-xl border bg-surface-container-high border-outline" >
                    <p className="text-[10px] font-bold text-slate-400 uppercase capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-xl font-extrabold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>{val.value}</p>
                    <p className="text-[10px] font-bold text-emerald-400 mt-0.5">{val.trend}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── SHARE PROFILE FOOTER CARD ── */}
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-xl" style={{ background: T.card, borderColor: T.borderLight }}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: T.blue }}>badge</span>
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Shareable Digital Resume Link</p>
                <p className="text-sm font-mono font-bold text-white">https://{p.profileLink}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyShareLink} className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">content_copy</span> Copy Link
              </button>
              <button onClick={() => setShareModalOpen(true)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700">
                Share
              </button>
            </div>
          </div>
        </main>

        {/* ════════════════════════════════════════ 3. RIGHT SIDEBAR (300px) ════════════════════════════════════════ */}
        {isEmployer && (
          <aside className="w-[260px] flex-shrink-0 sticky top-4 hidden xl:flex flex-col gap-4 max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar pb-6">
            {/* Employer Actions Card */}
            <div className="rounded-[20px] p-6 space-y-4 shadow-xl border bg-surface-container border-outline" >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-outline" style={{ fontFamily: "var(--font-display)" }}>
                Employer Actions
              </h3>
              <div className="space-y-2.5">
                <button onClick={() => triggerToast("Candidate shortlisted!")} className="w-full py-3 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg" style={{ fontFamily: "var(--font-body)", background: T.greenDark }}>
                  <span className="material-symbols-outlined text-base">bookmark_add</span> Shortlist Candidate
                </button>
                <button onClick={() => router.push("/employer/upcoming-interviews-list")} className="w-full py-3 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg" style={{ fontFamily: "var(--font-body)", background: T.blueDark }}>
                  <span className="material-symbols-outlined text-base">calendar_today</span> Schedule Interview
                </button>
                <button onClick={() => triggerToast("Opening direct chat with candidate...")} className="w-full py-3 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg" style={{ fontFamily: "var(--font-body)", background: T.purpleDark }}>
                  <span className="material-symbols-outlined text-base">chat</span> Chat Candidate
                </button>
                <button onClick={() => triggerToast("Downloading AI Resume PDF...")} className="w-full py-3 rounded-xl text-[13px] font-semibold text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors border bg-surface-container-high border-outline" style={{ fontFamily: "var(--font-body)" }}>
                  <span className="material-symbols-outlined text-base">download</span> Download AI Resume
                </button>
                <button onClick={() => triggerToast("Candidate rejected")} className="w-full py-3 rounded-xl text-[13px] font-semibold text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors border" style={{ fontFamily: "var(--font-body)", background: "rgba(248, 113, 113, 0.1)", borderColor: "rgba(248, 113, 113, 0.3)" }}>
                  <span className="material-symbols-outlined text-base">cancel</span> Reject Candidate
                </button>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="rounded-[20px] p-6 space-y-4 shadow-xl border bg-surface-container border-outline" >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-outline" style={{ fontFamily: "var(--font-display)" }}>
                Quick Candidate Summary
              </h3>
              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between"><span className="text-slate-400">Availability</span><span className="text-white font-bold">{p.availability}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Location</span><span className="text-white font-bold">{p.preferredLocation}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Expected CTC</span><span className="text-white font-bold">{p.expectedSalary}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Notice Period</span><span className="text-white font-bold">{p.noticePeriod}</span></div>
              </div>

              {/* Match Breakdown */}
              <div className="space-y-2.5 pt-4 border-t border-outline" >
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Match Breakdown</p>
                {s.matchBreakdown.slice(0, 5).map((m: { label: string; pct: number }) => (
                  <div key={m.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">{m.label}</span>
                      <span className="text-white">{m.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
                      <div className="h-full rounded-full bg-sky-400" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Candidate Metadata */}
              <div className="space-y-2 pt-4 border-t text-xs font-medium border-outline" >
                <div className="flex justify-between"><span className="text-slate-400">Candidate ID</span><span className="text-white font-mono">{p.id}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Applied For</span><span className="text-white font-bold">{p.appliedJob}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Applied Date</span><span className="text-white">{p.appliedDate}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Source</span><span className="text-white">{p.source}</span></div>
              </div>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}