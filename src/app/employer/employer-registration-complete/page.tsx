"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LayoutDashboard, CheckCircle2, Sparkles, Clock, Briefcase, ShieldCheck } from "lucide-react";

export default function EmployerRegistrationCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManagedHiring = searchParams.get("model") === "managed";

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center p-3 sm:p-5 text-text-primary">
      <div className="w-full max-w-[680px] glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-5 sm:p-7 flex flex-col items-center gap-4 my-auto text-center">
        {/* Animated Success Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 relative">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full -z-10" />
          </div>
          <h1 className="font-display-xl text-2xl sm:text-3xl text-primary font-bold tracking-tight">
            Registration Complete
          </h1>
          <p className="font-body-lg text-xs sm:text-sm text-text-secondary max-w-md">
            Welcome to HireGo AI. Your Enterprise Workspace is fully configured and ready.
          </p>
        </div>

        {/* Clean, Non-Intrusive Verification Status */}
        <div className="w-full p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-left flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-text-secondary">
            Your workspace access is <strong className="text-emerald-400 font-semibold">Active</strong>. Submitted documents are verified seamlessly in the background (typically within 2–4 hours).
          </p>
        </div>

        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
          {/* Trial Status Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Onboarding Access
              </span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Active
              </span>
            </div>
            <div className="flex flex-col mb-3">
              <span className="text-xl sm:text-2xl font-bold text-white">Active</span>
              <span className="text-xs text-text-secondary">Your workspace is ready for the next step</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-full rounded-full" />
            </div>
          </div>

          {/* Job Usage Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-primary flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Next Action
              </span>
              <span className="text-xs text-text-secondary">Workspace setup</span>
            </div>
            <div className="flex flex-col mb-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-white">Ready</span>
                <span className="text-xs text-text-secondary">First job posting</span>
              </div>
              <span className="text-xs text-text-secondary">Create your first hiring requirement</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-0 rounded-full" />
            </div>
          </div>

          {/* AI Capability Micro-Card */}
          <div className="md:col-span-2 glass-card rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 border border-primary/30 bg-primary/10">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-primary">AI Proctoring Enabled</h3>
              <p className="text-xs text-text-secondary">
                Your trial includes full access to AI-driven candidate verification and scorecards.
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-center pt-1">
          <button
            onClick={() => router.push(isManagedHiring ? "/employer/managed-hiring/request" : "/employer/employer-onboarding-first-job-prompt")}
            className="btn-3d-red h-11 px-6 rounded-xl flex items-center justify-center gap-2 font-bold text-xs text-white w-full sm:w-auto min-w-[220px] group shadow-md"
          >
            <span>{isManagedHiring ? "Submit Hiring Requirement" : "Post Your First Job"}</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => router.push("/employer/dashboard")}
            className="h-11 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 font-bold text-xs text-white w-full sm:w-auto transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
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
    );
  }
