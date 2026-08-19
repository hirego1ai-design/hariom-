"use client";

import React from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function WelcomeOnboardingPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        {/* Premium Ambient Background Grid & Dual Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-30 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(255,82,82,0.09) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(68,138,255,0.09) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(156,39,176,0.05) 0%, transparent 60%)",
          }}
        />

        {/* Top Sticky Header */}
        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-center text-center"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--primary-container-bg)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
              >
                Welcome
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                AI-Driven Career Vector Setup
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Intelligent Candidate Onboarding
            </h1>
          </div>

          <div className="hidden" aria-hidden="true">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Start here
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 flex items-center justify-center max-w-[1400px] w-full mx-auto my-auto overflow-y-auto">
          {/* Centered Colorful 3D Bento Card */}
          <div
            className="w-full max-w-[960px] rounded-3xl p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            {/* Multi-Color Top Border Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, var(--primary), #AB47BC, var(--secondary), var(--color-green-light, #2E7D32))" }}
            />

            {/* Left 3D Icon Graphic */}
            <div className="flex flex-col items-center justify-center relative min-h-[260px] p-6 rounded-2xl" style={{ backgroundColor: "var(--surface-container-low)" }}>
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center relative animate-pulse"
                style={{
                  background: "linear-gradient(135deg, rgba(255,82,82,0.15), rgba(68,138,255,0.15))",
                  border: "1px solid var(--outline)",
                }}
              >
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  <span className="material-symbols-outlined text-[64px] text-white">rocket_launch</span>
                </div>
              </div>
            </div>

            {/* Right Content Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider inline-block"
                  style={{
                    backgroundColor: "var(--primary-container-bg)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  Candidate AI Onboarding
                </span>
                <h2
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  Welcome to <span style={{ color: "var(--primary)" }}>HireGo AI</span>
                </h2>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Your journey to a high-impact career starts here. We evaluate your resume, skills, video presentation, and technical domain readiness before you apply.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/onboarding/role-select"
                  className="w-full h-12 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  <span>Let's Start Onboarding</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>

              </div>

              <p className="text-[11px] font-mono font-bold text-center md:text-left" style={{ color: "var(--text-muted)" }}>
                You can save optional sections and finish them later.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
