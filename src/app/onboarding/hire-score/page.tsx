"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useOnboarding } from "@/context/OnboardingContext";

export default function HireScorePage() {
  const { state, calculateHireGoScore } = useOnboarding();
  const [score, setScore] = useState(state.hireGoScore);

  useEffect(() => {
    const calc = calculateHireGoScore();
    setScore(calc);
  }, []);

  const overall = score?.overall ?? 0;

  const breakdown = [
    { label: "Resume Quality", value: score?.resumeQuality ?? 0, color: "text-primary" },
    { label: "Technical Baseline", value: score?.assessmentScore ?? 0, color: "text-green" },
    { label: "Video Presentation", value: score?.videoAnalysis ?? 0, color: "text-yellow" },
    { label: "Communication Score", value: score?.communicationScore ?? 0, color: "text-purple-300" },
    { label: "Behavioural Score", value: score?.behaviourScore ?? 0, color: "text-blue-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
              HireGo Score™ Calculation Engine
            </h1>
            <p className="text-text-muted text-xs">Proprietary AI score combining resume, video, skills, and assessment metrics.</p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-text-muted">
              Completion
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1100px] w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
            {/* Left: Score Crystal / Ring Visual */}
            <div className="glass-card p-8 rounded-2xl border border-white/10 bg-[#141418] flex flex-col items-center justify-center space-y-4 shadow-2xl text-center min-h-[360px]">
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary via-secondary to-yellow p-1 shadow-[0_0_60px_rgba(255,180,170,0.3)] animate-pulse">
                <div className="w-full h-full rounded-full bg-[#0E0E0E] flex flex-col items-center justify-center font-mono">
                  <span className="text-5xl font-bold text-primary">{overall}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest mt-1">HireGo Score™</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="px-3 py-1 rounded-full bg-green/20 text-green text-xs font-mono font-bold">
                  {overall >= 85 ? "Strong profile readiness" : "Complete more sections to improve readiness"}
                </span>
                <p className="text-xs text-text-muted max-w-[280px]">
                  This score uses only the resume, skills, experience, video, and assessment data you completed.
                </p>
              </div>
            </div>

            {/* Right: Score Breakdown Matrix */}
            <div className="space-y-4">
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4 shadow-xl">
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                  Score Component Breakdown
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  {breakdown.map((b) => (
                    <div key={b.label} className="space-y-1">
                      <div className="flex justify-between items-center text-text-muted">
                        <span>{b.label}</span>
                        <span className={`font-bold ${b.color}`}>{b.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${b.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 space-y-2">
                <h4 className="font-bold text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  AI Placement Forecast
                </h4>
                <p className="text-xs text-white leading-relaxed">
                  Candidates with a HireGo Score™ above 85 experience a <strong>2.8x higher response rate</strong> from global enterprise engineering managers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <Link
              href="/onboarding/baseline-assessment"
              className="px-8 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Link>

            <Link
              href="/onboarding/readiness-report"
              className="px-8 py-2.5 rounded-full bg-yellow text-bg-page font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,200,0,0.35)] hover:scale-105 transition-all"
            >
              Generate Readiness Report
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
