"use client";

import React from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function JobReadinessReportPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
              Job Readiness & Interview Eligibility Report
            </h1>
            <p className="text-text-muted text-xs">Comprehensive evaluation report generated prior to candidate job applications.</p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-green/20 text-green font-bold border border-green/30">
              Verified Candidate Status
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto overflow-y-auto">
          {/* Summary Banner */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1 text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider">
                Interview Readiness Status
              </span>
              <h2 className="text-xl font-bold text-white">Eligible for AI & Employer Interviews</h2>
              <p className="text-xs text-text-muted">
                Your HireGo Score™ and video evaluation meet enterprise hiring thresholds for top tier engineering roles.
              </p>
            </div>

            <Link
              href="/onboarding/complete"
              className="px-8 py-3 rounded-full bg-yellow text-bg-page font-bold text-xs shadow-[0_0_20px_rgba(255,200,0,0.35)] hover:scale-105 transition-all whitespace-nowrap"
            >
              Complete Onboarding & Enter Workspace
            </Link>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] space-y-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Recommended Roles</span>
              <ul className="space-y-1 text-xs text-white font-bold">
                <li>• Senior Software Architect</li>
                <li>• Fullstack Engineering Lead</li>
                <li>• Cloud Systems Engineer</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] space-y-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Skill Gap Recommendations</span>
              <ul className="space-y-1 text-xs text-yellow">
                <li>• Kubernetes Cluster Deployment</li>
                <li>• GraphQL Gateway Optimization</li>
              </ul>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] space-y-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Verified Credentials</span>
              <ul className="space-y-1 text-xs text-green font-bold">
                <li>✓ AI Video Presentation Verified</li>
                <li>✓ Technical Baseline Passed</li>
                <li>✓ Resume Quality Score 84/100</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
