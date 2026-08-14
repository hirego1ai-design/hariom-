"use client";
import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function ActiveMockInterviewPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [candidateResponse, setCandidateResponse] = useState(
    "In React 19, Server Components execute strictly on the build or server environment, returning pre-rendered HTML without shipping hydration code to the client bundle..."
  );

  const questions = [
    {
      id: 1,
      category: "Architecture & Frontend",
      text: "Explain how React 19 Server Components improve client-side bundle size and eliminate unnecessary hydration overhead.",
    },
    {
      id: 2,
      category: "Backend & Systems",
      text: "How do you approach optimizing high-throughput WebSocket streams and preventing memory leaks in node connection pools?",
    },
    {
      id: 3,
      category: "Leadership & Incident Ops",
      text: "Describe a critical production incident you diagnosed under pressure and how you implemented a post-mortem fix.",
    },
  ];

  const currentQ = questions[questionIndex];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Header Bar */}
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  CF07 Module
                </span>
                <span className="text-xs text-text-muted">Interactive Audio/Video Round</span>
              </div>
              <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
                Active AI Mock Interview Room
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Recording Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-[11px] font-mono">REC 00:14:22</span>
            </div>

            {/* Exit Session Button */}
            <Link
              href="/ai/practice-hub"
              className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-red-500/30"
            >
              <span className="material-symbols-outlined text-[16px]">call_end</span>
              End Session & Return
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Status Telemetry Ribbon */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                Question {questionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-bold text-white truncate">{currentQ.category}</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-green">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span className="font-bold">AI Proctor: 99.8% Integrity</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span className="font-mono font-bold text-white">15:38 Remaining</span>
              </div>
            </div>
          </div>

          {/* Main Video Call Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter min-h-[460px]">
            
            {/* Left Box: AI Recruiter Avatar Feed */}
            <div className="lg:col-span-6 glass-card rounded-2xl border border-white/10 bg-black flex flex-col justify-between p-6 relative overflow-hidden group">
              <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Sophia (AI Lead Recruiter)
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 font-mono text-text-muted">
                  Audio Stream: Active
                </span>
              </div>

              {/* AI Avatar Center Animation */}
              <div className="my-auto text-center space-y-4 py-8 relative z-10">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-primary-light p-1 mx-auto shadow-[0_0_40px_rgba(255,180,170,0.3)] group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full bg-[#141418] flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[56px]">smart_toy</span>
                  </div>
                </div>

                {/* Animated Speech Soundwave */}
                <div className="flex items-center justify-center gap-1 h-6">
                  {[30, 70, 45, 90, 60, 80, 50, 95, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-primary rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>

                {/* Question Prompt Text */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-w-lg mx-auto">
                  <p className="text-sm text-white font-medium italic leading-relaxed">
                    "{currentQ.text}"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Box: Candidate HD Webcam Feed & AI Telemetry */}
            <div className="lg:col-span-6 glass-card rounded-2xl border border-white/10 bg-[#121216] flex flex-col justify-between p-6 relative overflow-hidden">
              <div className="flex justify-between items-center z-10">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
                  Rahul Verma (You - Candidate)
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green/20 text-green font-bold text-[10px]">
                  Eye Contact: 96%
                </span>
              </div>

              {/* Simulated Candidate Video Canvas */}
              <div className="my-auto text-center py-6 relative z-10">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-primary to-secondary p-1 mx-auto shadow-xl relative">
                  <div className="w-full h-full rounded-[20px] bg-[#1A1A22] flex items-center justify-center font-bold text-primary text-2xl">
                    RV
                  </div>
                  {/* Face Mesh Indicator */}
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded bg-green text-black font-bold text-[9px] shadow-md">
                    FACEMESH 3D OK
                  </span>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-text-muted">
                  <span>Detected Emotion:</span>
                  <span className="text-white font-bold">Confident & Focused</span>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10 z-10">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    micActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
                  }`}
                  title={micActive ? "Mute Mic" : "Unmute Mic"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {micActive ? "mic" : "mic_off"}
                  </span>
                </button>

                <button
                  onClick={() => setCamActive(!camActive)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                    camActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
                  }`}
                  title={camActive ? "Turn Off Camera" : "Turn On Camera"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {camActive ? "videocam" : "videocam_off"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Box: Live Speech-to-Text Response & Submit Action */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">graphic_eq</span>
                Live Answer Speech Transcript
              </h3>
              <span className="text-[11px] text-green font-bold">Auto-transcribing candidate speech...</span>
            </div>

            <textarea
              value={candidateResponse}
              onChange={(e) => setCandidateResponse(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-[#1E1E1E] border border-white/10 p-4 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors leading-relaxed font-sans"
              placeholder="Your live spoken answer will transcribe here in real-time..."
            />

            <div className="flex justify-between items-center pt-2">
              <p className="text-[11px] text-text-muted">
                Pressing submit will store response vector for AI grading report.
              </p>

              <button
                onClick={() => setQuestionIndex((prev) => (prev + 1) % questions.length)}
                className="px-6 py-3 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                Submit Answer & Next Question
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
