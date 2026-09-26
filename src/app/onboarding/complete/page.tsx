"use client";

import React, { useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

type AssignmentState =
  | { status: "loading" }
  | { status: "ready"; roleTitle: string; noticeUrl: string }
  | { status: "unavailable"; message: string };

export default function OnboardingCompletePage() {
  const [assignment, setAssignment] = useState<AssignmentState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/candidate/readiness/auto-assign", { method: "POST" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.success) {
          throw new Error(body?.error || "Skill Validation could not be prepared right now.");
        }
        if (!cancelled) setAssignment({ status: "ready", roleTitle: body.roleTitle, noticeUrl: body.noticeUrl });
      })
      .catch((error) => {
        if (!cancelled) {
          setAssignment({
            status: "unavailable",
            message: error instanceof Error ? error.message : "Skill Validation could not be prepared right now.",
          });
        }
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-0 md:left-[116px] right-0 z-40 bg-bg-page/90 backdrop-blur-xl border-b border-outline flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-text-primary font-bold tracking-tight">Onboarding saved</h1>
            <p className="text-text-muted text-xs">Your profile is saved. Skill Validation is optional now and required only when a job application needs current validation.</p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-green/20 text-green font-bold border border-green/30 text-xs">Profile saved</span>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 flex items-center justify-center max-w-[1200px] w-full mx-auto overflow-y-auto">
          <div className="glass-card w-full max-w-[820px] rounded-2xl border border-outline p-8 md:p-12 bg-bg-card space-y-7 shadow-2xl text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-green to-yellow p-1 mx-auto flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-bg-page flex items-center justify-center text-green">
                <span className="material-symbols-outlined text-[48px]">check_circle</span>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Your onboarding details are saved</h1>
              <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                HireGo now prepares one reusable role-based Skill Validation for your target role. You can take it now or continue browsing jobs.
              </p>
            </div>

            <div className="rounded-2xl border border-outline bg-surface-container p-5 text-left">
              {assignment.status === "loading" && (
                <p className="text-sm text-text-secondary">Preparing your role-based Skill Validation…</p>
              )}
              {assignment.status === "ready" && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-primary">Skill Validation ready</p>
                  <p className="text-sm font-semibold">{assignment.roleTitle}</p>
                  <p className="text-xs text-text-muted">
                    This assessment is reusable while current. Skipping it here does not block platform exploration; applying to a job can require it before submission completes.
                  </p>
                </div>
              )}
              {assignment.status === "unavailable" && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-yellow">Assessment not prepared yet</p>
                  <p className="text-xs text-text-muted">{assignment.message}</p>
                  <p className="text-xs text-text-muted">You may continue browsing. HireGo will retry the required validation flow when you apply.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {assignment.status === "ready" && (
                <Link href={assignment.noticeUrl} className="w-full sm:w-auto px-8 py-3 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 font-bold text-xs">
                  Take Skill Validation
                </Link>
              )}
              <Link href="/jobs" className="w-full sm:w-auto px-8 py-3 rounded-full bg-yellow text-bg-page font-bold text-xs">
                Browse opportunities
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-3 rounded-full bg-surface-container border border-outline text-text-primary font-bold text-xs">
                Candidate dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
