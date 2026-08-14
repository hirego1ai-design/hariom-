"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [showBypassModal, setShowBypassModal] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative select-none"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Ambient background grid & glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-30" />
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(68,138,255,0.08) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(255,82,82,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Developer Bypass Floating Button (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setShowBypassModal(true)}
          className="px-4 py-2 rounded-full text-black font-extrabold text-xs transition-all flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #FFD54F, #F57F17)",
            boxShadow: "var(--shadow-btn-gold)",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">developer_mode</span>
          <span>Developer Bypass</span>
        </button>
      </div>

      <main className="relative z-10 w-full max-w-[960px] mx-auto flex flex-col items-center space-y-8 my-auto py-12">
        {/* Brand Header */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-1">
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#4285F4" }}>H</span>
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#EA4335" }}>i</span>
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#FBBC05" }}>r</span>
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#34A853" }}>e</span>
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#4285F4" }}>G</span>
            <span className="text-[36px] font-extrabold font-display" style={{ color: "#EA4335" }}>o</span>
            <div className="ml-2 px-2.5 py-0.5 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4285F4, #EA4335)" }}>
              <span className="font-mono font-bold text-white text-sm">[AI]</span>
            </div>
          </div>
          <h1
            className="text-[28px] sm:text-[36px] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Who are you joining as?
          </h1>
          <p className="text-sm font-semibold max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
            Choose your path to access the autonomous AI hiring platform
          </p>
        </header>

        {/* Compact Proportioned 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[840px]">
          
          {/* Candidate Card */}
          <div
            className="rounded-3xl p-8 flex flex-col items-center text-center justify-between group transition-all duration-300 hover:-translate-y-1.5"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Centered 3D Icon Box */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                <span className="material-symbols-outlined text-white text-[32px]">video_file</span>
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                I'm a Job Seeker
              </h2>
              <p className="text-xs font-medium leading-relaxed max-w-[280px]" style={{ color: "var(--text-secondary)" }}>
                Practice AI interviews, calculate your HireGo Score™, and apply to verified top-tier tech roles.
              </p>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-full font-bold text-xs text-white transition-all flex items-center justify-center gap-2 mt-6 shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Continue as Candidate</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Employer Card */}
          <div
            className="rounded-3xl p-8 flex flex-col items-center text-center justify-between group transition-all duration-300 hover:-translate-y-1.5"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex flex-col items-center space-y-4">
              {/* Centered 3D Icon Box */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))",
                  boxShadow: "var(--shadow-btn-blue)",
                }}
              >
                <span className="material-symbols-outlined text-white text-[32px]">domain</span>
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                I'm an Employer
              </h2>
              <p className="text-xs font-medium leading-relaxed max-w-[280px]" style={{ color: "var(--text-secondary)" }}>
                Post jobs, configure AI vetting pipelines, screen verified talent, and hire 84% faster.
              </p>
            </div>

            <button
              onClick={() => router.push("/employer/employer-sign-in")}
              className="w-full h-12 rounded-full font-bold text-xs text-white transition-all flex items-center justify-center gap-2 mt-6 shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))",
                boxShadow: "var(--shadow-btn-blue)",
              }}
            >
              <span>Continue as Employer</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-4 text-center flex flex-col items-center gap-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-bold underline underline-offset-4 transition-colors"
              style={{ color: "var(--primary)" }}
            >
              Sign In
            </button>
          </p>
          <button
            onClick={() => setShowBypassModal(true)}
            className="text-xs font-bold underline underline-offset-2 flex items-center gap-1"
            style={{ color: "#F57F17" }}
          >
            <span>⚡ Open Developer Bypass Hub</span>
          </button>
        </footer>
      </main>

      {/* Developer Bypass Modal Overlay */}
      {showBypassModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar space-y-6 shadow-2xl relative"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--outline)",
            }}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--outline)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Developer Bypass Hub</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Direct single-click shortcuts to test all portal screens</p>
                </div>
              </div>
              <button
                onClick={() => setShowBypassModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: "var(--surface-container-high)",
                  color: "var(--text-primary)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Links Grid */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                  Candidate Portal Shortcuts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Browse Jobs", href: "/jobs" },
                    { label: "Applications Tracker", href: "/applications" },
                    { label: "Pipeline View", href: "/applications/pipeline" },
                    { label: "AI Practice Hub", href: "/ai/practice-hub" },
                    { label: "Candidate Chat", href: "/messages/chat" },
                  ].map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        setShowBypassModal(false);
                        router.push(item.href);
                      }}
                      className="p-2.5 rounded-xl border text-left font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        borderColor: "var(--outline)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--secondary)" }}>
                  Employer Portal Shortcuts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Employer Sign In", href: "/employer/employer-sign-in" },
                    { label: "Employer Dashboard", href: "/employer/dashboard" },
                    { label: "AI Hiring Copilot", href: "/employer/ai-hiring-copilot-hub" },
                    { label: "Candidate Kanban", href: "/employer/candidate-pipeline-kanban" },
                    { label: "Job Listings", href: "/employer/job-listings-management" },
                    { label: "Employer Analytics", href: "/employer/employer-analytics-dashboard" },
                  ].map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        setShowBypassModal(false);
                        router.push(item.href);
                      }}
                      className="p-2.5 rounded-xl border text-left font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        borderColor: "var(--outline)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}