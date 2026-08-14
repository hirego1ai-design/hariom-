"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";

export default function EmployerRegistrationCompletePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      

      {/* Main Content Workspace with Sidebar Offset */}
      <div className="flex-1 ml-[116px] min-h-screen flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[820px] glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-6 sm:p-8 flex flex-col items-center gap-5 my-auto text-center">
          
          {/* Animated Success Badge */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 relative">
              <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 52 52">
                <circle className="opacity-10" cx="26" cy="26" fill="none" r="25" />
                <path
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full -z-10" />
            </div>
            <h1 className="font-display-xl text-2xl sm:text-3xl text-primary font-bold tracking-tight">
              Registration Complete
            </h1>
            <p className="font-body-lg text-xs sm:text-sm text-text-secondary max-w-md">
              Welcome to the future of hiring. Your Enterprise Workspace is fully configured and ready.
            </p>
          </div>

          {/* 🌟 ENHANCED HIGH-VISIBILITY MANUAL DOCUMENT REVIEW NOTICE BANNER */}
          <div className="w-full p-5 rounded-2xl border border-amber-400/50 bg-[#1A140B] backdrop-blur-md text-left flex items-start gap-3.5 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-400/40 mt-0.5 shadow-md">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">
                hourglass_top
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                  <span>Document Review Under Way</span>
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-black shadow-md uppercase tracking-wider">
                  Manual Audit Pending
                </span>
              </div>

              {/* High Contrast Readability Text */}
              <p className="text-sm text-slate-100 leading-relaxed font-medium">
                Thank you for submitting your verification documents. The{" "}
                <strong className="text-amber-300 font-bold">HireGo AI team</strong> is manually reviewing your{" "}
                <strong className="text-white font-bold underline decoration-amber-400/60 underline-offset-4">
                  GST, PAN, MSME, and corporate credentials
                </strong>. Your{" "}
                <strong className="text-emerald-300 font-bold">14-day trial is fully active</strong> and unlocked while review is under way (typically completed within 2–4 hours).
              </p>
            </div>
          </div>

          {/* Summary Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
            {/* Trial Status Card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  Free Trial
                </span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="flex flex-col mb-3">
                <span className="text-xl sm:text-2xl font-bold text-white">14 Days Left</span>
                <span className="text-xs text-text-secondary">Access to all premium AI features</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-full rounded-full" />
              </div>
            </div>

            {/* Job Usage Card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">work</span>
                  Job Slots
                </span>
                <span className="text-xs text-text-secondary">Trial Limit</span>
              </div>
              <div className="flex flex-col mb-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-white">0/5</span>
                  <span className="text-xs text-text-secondary">Jobs Used</span>
                </div>
                <span className="text-xs text-text-secondary">Ready for your first job posting</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-0 rounded-full" />
              </div>
            </div>

            {/* AI Capability Micro-Card */}
            <div className="md:col-span-2 glass-card rounded-2xl p-4 flex items-center gap-3 border border-primary/30 bg-primary/10">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  auto_awesome
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-primary">AI Proctoring Enabled</h3>
                <p className="text-xs text-text-secondary">
                  Your trial includes full access to AI-driven candidate verification and scorecards.
                </p>
              </div>
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">
                check_circle
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center pt-1">
            <button
              onClick={() => router.push("/employer/employer-onboarding-first-job-prompt")}
              className="btn-3d-red h-11 px-6 rounded-xl flex items-center justify-center gap-2 font-bold text-xs text-white w-full sm:w-auto min-w-[220px] group shadow-md"
            >
              <span>Post Your First Job</span>
              <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
            <button
              onClick={() => router.push("/employer/dashboard")}
              className="h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 font-bold text-xs text-white w-full sm:w-auto transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">dashboard</span>
              <span>Go to Dashboard</span>
            </button>
          </div>

          {/* Footer Guide Link */}
          <p className="text-xs text-text-secondary">
            Need help getting started?{" "}
            <a className="text-primary hover:underline font-bold" href="#">
              Read the Employer Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}