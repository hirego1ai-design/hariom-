"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function OnboardingCompletePage() {
  const [assessmentState, setAssessmentState] = useState<{ loading: boolean; assessmentId?: string; noticeUrl?: string; alreadyCurrent?: boolean; error?: string }>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/candidate/readiness/assign", { method: "POST" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Skill Validation is temporarily unavailable.");
        if (!cancelled) setAssessmentState({ loading: false, assessmentId: body.assessmentId, noticeUrl: body.noticeUrl, alreadyCurrent: body.alreadyCurrent });
      })
      .catch((error) => {
        if (!cancelled) setAssessmentState({ loading: false, error: error instanceof Error ? error.message : "Skill Validation is temporarily unavailable." });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-0 md:left-[116px] right-0 z-40 bg-bg-page/90 backdrop-blur-xl border-b border-outline flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-text-primary font-bold tracking-tight">
              Onboarding saved
            </h1>
            <p className="text-text-muted text-xs">Your profile information has been saved. Verification, assessment, and job eligibility are separate steps.</p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-green/20 text-green font-bold border border-green/30">
              Profile saved
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 flex items-center justify-center max-w-[1200px] w-full mx-auto overflow-y-auto">
          <div className="glass-card w-full max-w-[800px] rounded-2xl border border-outline p-8 md:p-12 bg-bg-card space-y-6 shadow-2xl text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green to-yellow p-1 shadow-[0_0_50px_rgba(0,255,150,0.3)] mx-auto flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-bg-page flex items-center justify-center text-green">
                <span className="material-symbols-outlined text-[48px]">check_circle</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">Your onboarding details are saved</h1>
              <p className="text-xs text-text-muted max-w-[400px] mx-auto leading-relaxed">
                HireGo now prepares an optional role-based Skill Validation for your target role. You can take it now or continue browsing jobs. If a job requires validation, the same durable requirement is reused during application.
              </p>
            </div>

            {assessmentState.error && <p role="status" className="text-xs text-text-muted">{assessmentState.error} This does not block onboarding or job browsing.</p>}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {assessmentState.loading ? (
                <span className="w-full sm:w-auto px-8 py-3 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 font-bold text-xs">
                  Preparing Skill Validation…
                </span>
              ) : assessmentState.assessmentId ? (
                <Link
                  href={assessmentState.noticeUrl || `/assessment/mcq/active?id=${encodeURIComponent(assessmentState.assessmentId)}`}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 font-bold text-xs hover:bg-sky-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  {assessmentState.alreadyCurrent ? "View current Skill Validation" : "Start optional Skill Validation"}
                </Link>
              ) : (
                <Link
                  href="/assessment/readiness"
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-surface-container border border-outline text-text-primary font-bold text-xs hover:bg-white/10 transition-all"
                >
                  Skill Validation unavailable — review later
                </Link>
              )}
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-yellow text-bg-page font-bold text-xs shadow-[0_0_20px_rgba(255,200,0,0.35)] hover:scale-105 transition-all"
              >
                Go to Candidate Dashboard
              </Link>
              <Link
                href="/jobs"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-surface-container border border-outline text-text-primary font-bold text-xs hover:bg-white/10 transition-all"
              >
                Browse opportunities
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
