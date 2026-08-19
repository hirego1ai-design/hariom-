"use client";

import React from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useOnboarding } from "@/context/OnboardingContext";

export default function OnboardingCompletePage() {
  const { state } = useOnboarding();
  const displayName = state.personalDetails.fullName.trim() || "Candidate";
  const score = state.hireGoScore?.overall;
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
              Onboarding Complete!
            </h1>
            <p className="text-text-muted text-xs">Your candidate profile is verified and active in the candidate directory.</p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-green/20 text-green font-bold border border-green/30">
              100% Onboarding Completed
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 flex items-center justify-center max-w-[1200px] w-full mx-auto overflow-y-auto">
          <div className="glass-card w-full max-w-[800px] rounded-2xl border border-white/10 p-8 md:p-12 bg-[#141418] space-y-6 shadow-2xl text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green to-yellow p-1 shadow-[0_0_50px_rgba(0,255,150,0.3)] mx-auto flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#0E0E0E] flex items-center justify-center text-green">
                <span className="material-symbols-outlined text-[48px]">check_circle</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Congratulations, {displayName}!</h1>
              <p className="text-xs text-text-muted max-w-[400px] mx-auto leading-relaxed">
                {score !== undefined
                  ? <>Your current HireGo Score™ is <strong>{score}</strong>. You can keep improving your profile at any time.</>
                  : "Your candidate profile is ready. Complete any optional assessments later to generate a HireGo Score™."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/candidate/universal-profile"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 font-bold text-xs hover:bg-sky-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">badge</span> View Universal Profile
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-yellow text-bg-page font-bold text-xs shadow-[0_0_20px_rgba(255,200,0,0.35)] hover:scale-105 transition-all"
              >
                Go to Candidate Dashboard
              </Link>
              <Link
                href="/jobs"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all"
              >
                Browse Matched Opportunities
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
