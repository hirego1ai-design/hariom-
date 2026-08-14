"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function UniversalHireGoProfilePage() {
  const [activeTab, setActiveTab] = useState<"resume" | "video" | "skills" | "experience" | "certs">("resume");
  const [toast, setToast] = useState<string | null>(null);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("http://localhost:3000/profile/public");
    }
    setToast("🎉 HireGo Universal Profile Link copied to clipboard! Share anywhere instead of a traditional resume or LinkedIn!");
    setTimeout(() => setToast(null), 4000);
  };

  const handleScheduleInterview = () => {
    setToast("⚡ Redirecting to Interview Scheduler for Alex Chen...");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      {/* Floating Navigation Rail */}
      <CandidateSidebar />

      {/* Main Workspace Canvas */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C22] border border-yellow/50 text-white px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow animate-ping" />
            <span>{toast}</span>
          </div>
        )}

        {/* Universal Public Top Action Header Bar */}
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider">
              HireGo Universal Profile
            </span>
            <span className="text-text-muted text-xs hidden sm:inline">• Official Verified Candidate Link</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-yellow">share</span>
              <span>Share HireGo Profile</span>
            </button>

            {/* Schedule Interview Yellow Accent Button */}
            <button
              onClick={handleScheduleInterview}
              className="px-6 py-2.5 rounded-full bg-yellow text-bg-page hover:bg-yellow/90 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,200,0,0.35)] transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>Schedule Interview</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-gutter pt-24 pb-16 space-y-8 max-w-[1400px] w-full mx-auto overflow-y-auto">
          {/* Hero Profile Banner */}
          <div className="glass-card p-8 rounded-2xl border border-white/10 bg-[#141418] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
              {/* Avatar + Basic Details */}
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary via-secondary to-yellow shadow-[0_0_30px_rgba(255,180,170,0.3)]">
                    <div className="w-full h-full rounded-full bg-[#141418] flex items-center justify-center font-bold text-2xl text-primary font-mono border-4 border-[#141418]">
                      AC
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-green text-bg-page flex items-center justify-center border-2 border-[#141418] shadow-md">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Alex Chen</h1>
                    <span className="px-3 py-0.5 rounded-full bg-green/20 text-green border border-green/30 text-[11px] font-mono font-bold">
                      Open for Opportunities
                    </span>
                  </div>

                  <p className="text-sm font-bold text-primary font-mono">Senior AI & Systems Architect</p>
                  <p className="text-xs text-text-muted flex items-center justify-center sm:justify-start gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    San Francisco, CA • Remote Preferred • 8.5 Years Exp
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-text-muted">Cloud Architecture</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-text-muted">PyTorch / CUDA</span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-text-muted">Distributed Systems</span>
                  </div>
                </div>
              </div>

              {/* HireGo Score™ Ring Widget */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center min-w-[220px] space-y-2 shadow-xl">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary via-secondary to-yellow p-1 shadow-[0_0_25px_rgba(255,180,170,0.4)]">
                  <div className="w-full h-full rounded-full bg-[#141418] flex flex-col items-center justify-center font-mono">
                    <span className="text-3xl font-bold text-primary">88</span>
                    <span className="text-[9px] text-text-muted uppercase tracking-widest">HireGo Score</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-green font-bold uppercase tracking-wider">
                  Top 5% Candidate
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#141418] rounded-2xl p-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "resume" ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
              }`}
            >
              Visual Resume & Overview
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "video" ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
              }`}
            >
              Video Resume & AI Presentation Report
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "skills" ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
              }`}
            >
              Skill Matrix & Assessment Baseline
            </button>
            <button
              onClick={() => setActiveTab("experience")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "experience" ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
              }`}
            >
              Work Experience & Projects
            </button>
            <button
              onClick={() => setActiveTab("certs")}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "certs" ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-white"
              }`}
            >
              Verified Certifications
            </button>
          </div>

          {/* Tab Content 1: Visual Resume Overview */}
          {activeTab === "resume" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
              {/* Left 2 Columns: Executive Summary & Highlights */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                    Executive Profile Summary
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Pioneering AI architect with a proven track record of constructing high-throughput neural infrastructure for enterprise environments. Specialized in distributed PyTorch model training, sub-millisecond inference servers, and custom CUDA kernel acceleration.
                  </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                    Featured Engineering Projects
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-xs font-bold text-white">Project Astra: Edge LLM Gateway</span>
                      <p className="text-[11px] text-text-muted">Sub-second local quantization for 7B parameter models on mobile devices.</p>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-mono font-bold inline-block">
                        Python / Rust / C++
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <span className="text-xs font-bold text-white">OmniVision Neural Pipeline</span>
                      <p className="text-[11px] text-text-muted">Real-time multi-stream computer vision processing with 99.8% precision accuracy.</p>
                      <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-mono font-bold inline-block">
                        PyTorch / CUDA / gRPC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Score Component Breakdown */}
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                    AI Evaluation Components
                  </h3>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Resume Quality Score</span>
                      <strong className="text-green">84/100</strong>
                    </div>
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Technical Baseline Quiz</span>
                      <strong className="text-green">85/100</strong>
                    </div>
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Video Presentation Score</span>
                      <strong className="text-yellow">82/100</strong>
                    </div>
                    <div className="flex justify-between items-center text-text-muted">
                      <span>Communication Score</span>
                      <strong className="text-purple-300">86/100</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Video Resume & AI Presentation */}
          {activeTab === "video" && (
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                  Candidate Video Resume & AI Presentation Report
                </h3>
                <span className="px-3 py-1 rounded-full bg-green/20 text-green text-xs font-mono font-bold">
                  82/100 Presentation Score
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-video bg-black/60 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center space-y-3 p-6">
                  <span className="material-symbols-outlined text-5xl text-primary">play_circle</span>
                  <p className="text-xs font-bold text-white">Alex Chen — 2 Minute Introduction</p>
                  <span className="text-[10px] font-mono text-text-muted">HD Stream • Verified Stream Audio</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block font-sans">
                    Neural Presentation Metrics
                  </span>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <div className="flex justify-between text-white">
                      <span>Speaking Clarity & Fluency:</span>
                      <strong className="text-green">88%</strong>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Confidence & Professionalism:</span>
                      <strong className="text-green">90%</strong>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Eye Contact & Body Language:</span>
                      <strong className="text-yellow">74%</strong>
                    </div>
                  </div>

                  <p className="text-xs text-text-muted font-sans leading-relaxed pt-2">
                    Candidate speaks clearly with sub-millisecond pauses. Highly articulate when describing complex system architecture.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Skill Matrix */}
          {activeTab === "skills" && (
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                Verified Skill Matrix & Technical Baseline
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold">
                  Node.js (Expert)
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-green/20 text-green border border-green/30 text-xs font-mono font-bold">
                  React.js (Advanced)
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-green/20 text-green border border-green/30 text-xs font-mono font-bold">
                  Python 3 (Advanced)
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-yellow/20 text-yellow border border-yellow/30 text-xs font-mono font-bold">
                  System Architecture (Intermediate)
                </span>
              </div>
            </div>
          )}

          {/* Tab Content 4: Work Experience */}
          {activeTab === "experience" && (
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                Professional Timeline
              </h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-white text-sm">Lead Software Engineer</strong>
                    <span className="text-primary font-mono">2021 — Present</span>
                  </div>
                  <p className="text-text-muted font-bold">TechNova Solutions</p>
                  <p className="text-text-muted pt-1">
                    Engineered high-availability cloud microservices processing millions of daily transactions with sub-30ms latency.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 5: Certifications */}
          {activeTab === "certs" && (
            <div className="glass-card p-6 rounded-2xl border border-white/10 bg-[#141418] space-y-4">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono border-b border-white/10 pb-3">
                Verified Credentials & Certifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-white block font-sans text-sm">AWS Certified Solutions Architect</strong>
                    <span className="text-text-muted text-[11px]">Credential ID: AWS-8829-XP</span>
                  </div>
                  <span className="text-green font-bold">✓ Verified</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-white block font-sans text-sm">Google UX Design Certificate</strong>
                    <span className="text-text-muted text-[11px]">Credential ID: G-UI-0021</span>
                  </div>
                  <span className="text-green font-bold">✓ Verified</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}