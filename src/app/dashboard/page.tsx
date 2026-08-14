"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

export default function CandidateDashboardPage() {
  const [proctorStatus, setProctorStatus] = useState(true);
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const selectTheme = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
    } else {
      setTheme(mode);
    }
    setThemeOpen(false);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Candidate Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Candidate Header */}
        <header
          className="fixed top-0 left-[116px] right-0 z-40 backdrop-blur-xl flex justify-between items-center px-gutter h-20 shadow-sm"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <h1
                className="text-headline-md font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Welcome back, <span style={{ color: "var(--primary)" }}>Rahul Verma</span>
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                You have 3 active interview invitations waiting for confirmation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Proctor Status Badge */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-green)" }} />
              <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--color-green)" }}>
                AI Proctor Active
              </span>
            </div>

            {/* Quick Links */}
            <Link
              href="/messages/chat"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors relative"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
              title="Messages"
            >
              <span className="material-symbols-outlined text-[20px]">forum</span>
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                2
              </span>
            </Link>

            <Link
              href="/notifications"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </Link>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeOpen(!themeOpen);
                  setProfileOpen(false);
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none"
                style={{
                  backgroundColor: "var(--surface-container-high)",
                  border: "1px solid var(--outline)",
                  color: "var(--text-primary)",
                }}
                title="Appearance"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === "dark" ? "dark_mode" : "light_mode"}
                </span>
              </button>
              {themeOpen && (
                <div
                  className="absolute right-0 mt-3 w-40 border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    borderColor: "var(--outline)",
                  }}
                >
                  <button
                    onClick={() => selectTheme("light")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">light_mode</span>
                    Light
                  </button>
                  <button
                    onClick={() => selectTheme("dark")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                    Dark
                  </button>
                  <button
                    onClick={() => selectTheme("system")}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                    System
                  </button>
                </div>
              )}
            </div>

            {/* Settings Icon */}
            <Link
              href="/settings"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
              title="Account Settings"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Link>

            <div className="h-6 w-[1px] mx-1" style={{ backgroundColor: "var(--outline)" }} />

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setThemeOpen(false);
                }}
                className="flex items-center gap-3 pl-1 cursor-pointer focus:outline-none select-none"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold leading-none" style={{ color: "var(--text-primary)" }}>Rahul Verma</p>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: "var(--primary)" }}>
                    Senior UX Engineer
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: "var(--bg-card)", color: "var(--primary)" }}
                  >
                    RV
                  </div>
                </div>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-3 w-56 border rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    borderColor: "var(--outline)",
                  }}
                >
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-bold leading-none" style={{ color: "var(--text-primary)" }}>Rahul Verma</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>rahul.verma@hirego.ai</p>
                  </div>
                  <div className="h-[1px] my-2" style={{ backgroundColor: "var(--outline)" }} />
                  
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    My Profile
                  </Link>
                  
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    Account Settings
                  </Link>
                  
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setThemeOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">palette</span>
                    Appearance
                  </button>
                  
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">notifications</span>
                    Notifications Preferences
                  </button>

                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">keyboard</span>
                    Keyboard Shortcuts
                  </button>

                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">help</span>
                    Help & Support
                  </button>
                  
                  <div className="h-[1px] my-2" style={{ backgroundColor: "var(--outline)" }} />
                  
                  <Link
                    href="/login"
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-red-500/10 flex items-center gap-2"
                    style={{ color: "var(--color-red)" }}
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Canvas */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div
              className="p-5 rounded-2xl relative overflow-hidden group transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  AI Readiness Score
                </span>
                <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--primary)" }}>
                  auto_awesome
                </span>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="font-display-lg text-display-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  94
                </span>
                <span className="text-xs font-bold mb-1" style={{ color: "var(--color-green)" }}>↑ +4.2%</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Top 2.8% for Senior Fullstack Engineers</p>
            </div>

            <div
              className="p-5 rounded-2xl relative overflow-hidden group transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Active Applications
                </span>
                <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--secondary)" }}>send</span>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="font-display-lg text-display-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  12
                </span>
                <span className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>4 Shortlisted</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Average response time: 2.4 days</p>
            </div>

            <div
              className="p-5 rounded-2xl relative overflow-hidden group transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Scheduled Interviews
                </span>
                <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--tertiary)" }}>video_call</span>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="font-display-lg text-display-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  3
                </span>
                <span className="text-xs font-bold mb-1" style={{ color: "var(--tertiary)" }}>Next: Today 4 PM</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>AI Proctoring Enabled</p>
            </div>

            <div
              className="p-5 rounded-2xl relative overflow-hidden group transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Employer Views
                </span>
                <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-green)" }}>visibility</span>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="font-display-lg text-display-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
                  248
                </span>
                <span className="text-xs font-bold mb-1" style={{ color: "var(--color-green)" }}>↑ +38 this week</span>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Google, Microsoft, Netflix viewed profile</p>
            </div>
          </div>

          {/* Main Content Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Left Column: AI Copilot & Practice Suite */}
            <div className="lg:col-span-4 space-y-gutter">
              {/* AI Practice Card */}
              <div
                className="rounded-2xl p-6 relative overflow-hidden text-center"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--outline)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-primary-dim flex items-center justify-center shadow-lg mb-4">
                  <span className="material-symbols-outlined text-white text-[32px]">psychology</span>
                </div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>AI Mock Interview Practice</h3>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Practice live technical questions with real-time feedback on confidence, speech clarity, and code quality.
                </p>
                <div className="mt-5 space-y-2">
                  <Link
                    href="/ai/mock-interview/active"
                    className="block w-full py-3 rounded-full text-white font-bold text-xs shadow-lg transition-all"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                      boxShadow: "var(--shadow-btn-red)",
                    }}
                  >
                    Start AI Mock Session
                  </Link>
                  <Link
                    href="/ai/practice-hub"
                    className="block w-full py-2.5 rounded-full font-bold text-xs border transition-all"
                    style={{
                      backgroundColor: "var(--surface-container-high)",
                      border: "1px solid var(--outline)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Explore Practice Hub
                  </Link>
                </div>
              </div>

              {/* Trajectory & Skills */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--outline)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <h3 className="font-bold text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--primary)" }}>trending_up</span>
                  Career Trajectory
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>React & Next.js Architecture</span>
                      <span className="font-bold" style={{ color: "var(--color-green)" }}>98%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                      <div className="h-full w-[98%]" style={{ backgroundColor: "var(--color-green)" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>System Design & Scalability</span>
                      <span className="font-bold" style={{ color: "var(--primary)" }}>88%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                      <div className="h-full w-[88%]" style={{ backgroundColor: "var(--primary)" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>Speech & Communication Clarity</span>
                      <span className="font-bold" style={{ color: "var(--secondary)" }}>92%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
                      <div className="h-full w-[92%]" style={{ backgroundColor: "var(--secondary)" }} />
                    </div>
                  </div>
                </div>

                <Link
                  href="/ai/skill-gap"
                  className="block text-center pt-2 text-xs font-bold hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  View Full Skill Gap Matrix →
                </Link>
              </div>
            </div>

            {/* Right Column: AI Job Recommendations & Applications */}
            <div className="lg:col-span-8 space-y-gutter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>Recommended Opportunities</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Matched using your AI Resume Vector Profile</p>
                </div>
                <Link href="/jobs" className="text-xs font-bold hover:underline" style={{ color: "var(--primary)" }}>
                  Browse All 248 Jobs →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Job Card 1 */}
                <div
                  className="p-5 rounded-2xl border transition-all flex flex-col justify-between group"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--outline)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: "var(--primary-container-bg)",
                          color: "var(--primary)",
                          border: "1px solid var(--primary)",
                        }}
                      >
                        TS
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full font-bold text-[10px]"
                        style={{
                          backgroundColor: "rgba(52,168,83,0.12)",
                          color: "var(--color-green)",
                          border: "1px solid rgba(52,168,83,0.2)",
                        }}
                      >
                        98% AI Match
                      </span>
                    </div>
                    <h4 className="font-bold text-base group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                      Staff Frontend Engineer
                    </h4>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>TechCorp Global • Bengaluru (Hybrid)</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Next.js 16", "TypeScript", "WebRTC"].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{ backgroundColor: "var(--surface-container-high)", color: "var(--text-secondary)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--outline)" }}>
                    <span className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>₹38L – ₹48L / yr</span>
                    <Link
                      href="/jobs"
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-sm"
                      style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}
                    >
                      Quick Apply
                    </Link>
                  </div>
                </div>

                {/* Job Card 2 */}
                <div
                  className="p-5 rounded-2xl border transition-all flex flex-col justify-between group"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--outline)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: "var(--secondary-container-bg)",
                          color: "var(--secondary)",
                          border: "1px solid var(--secondary)",
                        }}
                      >
                        AI
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full font-bold text-[10px]"
                        style={{
                          backgroundColor: "rgba(52,168,83,0.12)",
                          color: "var(--color-green)",
                          border: "1px solid rgba(52,168,83,0.2)",
                        }}
                      >
                        95% AI Match
                      </span>
                    </div>
                    <h4 className="font-bold text-base group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                      Lead AI UI Architect
                    </h4>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Apex AI Labs • Remote</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Design Systems", "LLM Ops"].map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{ backgroundColor: "var(--surface-container-high)", color: "var(--text-secondary)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--outline)" }}>
                    <span className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>₹42L – ₹55L / yr</span>
                    <Link
                      href="/jobs"
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-sm"
                      style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}
                    >
                      Quick Apply
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
