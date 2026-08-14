"use client";
import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function CommunicationCoachPage() {
  const [isRecording, setIsRecording] = useState(true);
  const [fillerCount, setFillerCount] = useState(1);
  const [wpm, setWpm] = useState(138);
  const [clarityScore, setClarityScore] = useState(96);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const waveformHeights = [28, 58, 24, 82, 74, 36, 68, 92, 48, 76, 42, 84, 64, 30, 56, 78, 88, 26, 70, 44];

  const prompts = [
    "Tell me about a complex technical decision you made and how you aligned cross-functional teams.",
    "How do you handle disagreement with a Principal Architect during a critical system design review?",
    "Describe your approach to mitigating production incidents and leading post-mortem retrospectives."
  ];

  // Simulate dynamic live speech telemetry
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setWpm(Math.floor(130 + Math.random() * 18));
      setClarityScore(Math.floor(94 + Math.random() * 4));
    }, 2000);
    return () => clearInterval(interval);
  }, [isRecording]);

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
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  CF08 Module
                </span>
                <span className="text-xs text-text-muted">Live Speech & Tone Laboratory</span>
              </div>
              <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
                AI Communication & Speech Coach
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ai/practice-hub"
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Exit to Practice Hub
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Question Prompt Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-[#141418] via-[#1A1A22] to-blue-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Question {currentPromptIndex + 1} of {prompts.length}
              </span>
              <h2 className="font-bold text-lg text-white">
                "{prompts[currentPromptIndex]}"
              </h2>
            </div>

            <button
              onClick={() => setCurrentPromptIndex((prev) => (prev + 1) % prompts.length)}
              className="px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 shrink-0"
            >
              Next Practice Question →
            </button>
          </div>

          {/* Grid Layout: Live Audio Waveform & Speech Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Left: Waveform & Speech Control */}
            <div className="lg:col-span-7 space-y-gutter">
              {/* Waveform Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-black flex flex-col items-center justify-between min-h-[320px] relative overflow-hidden">
                <div className="w-full flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-text-muted"}`} />
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      {isRecording ? "LIVE AUDIO ANALYZER ACTIVE" : "MICROPHONE PAUSED"}
                    </span>
                  </div>
                  <span className="text-text-muted font-mono text-[11px]">Input: Default Mic (Built-in)</span>
                </div>

                {/* Animated Audio Frequency Bars */}
                <div className="w-full py-8 flex items-center justify-center gap-1.5 h-32">
                  {waveformHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`w-2.5 rounded-full transition-all duration-300 ${
                        isRecording ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-white/10"
                      }`}
                      style={{
                        height: isRecording ? `${h}%` : "12%",
                      }}
                    />
                  ))}
                </div>

                {/* Control Bar */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/10 w-full justify-center">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                      isRecording
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : "bg-green text-black shadow-lg shadow-green/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isRecording ? "mic_off" : "mic"}
                    </span>
                    {isRecording ? "Pause Speech Recording" : "Resume Recording"}
                  </button>
                </div>
              </div>

              {/* Live Transcript Stream */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-[18px]">graphic_eq</span>
                    Real-Time Speech Transcript & Rephrasing AI
                  </span>
                  <span className="text-[10px] text-text-muted">Auto-Transcribing...</span>
                </h3>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs leading-relaxed text-text-secondary">
                  <p>
                    "In my previous project, we had to migrate a high-volume PostgreSQL database to BigQuery. <span className="text-yellow font-bold bg-yellow/10 px-1 rounded">Um</span>, we noticed latency spikes so I introduced a Redis caching tier..."
                  </p>
                </div>

                {/* AI Rephrasing Tip */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-blue-400 text-[18px] shrink-0 mt-0.5">lightbulb</span>
                  <div>
                    <p className="font-bold text-white">AI Executive Tip:</p>
                    <p className="text-[11px] mt-0.5 text-blue-200">
                      Replace "<span className="italic">Um, we noticed</span>" with "<span className="font-semibold text-white">Upon detecting latency spikes, I immediately deployed a Redis caching layer...</span>"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Telemetry Dashboard */}
            <div className="lg:col-span-5 space-y-gutter">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
                <h3 className="font-bold text-base text-white border-b border-white/5 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-[20px]">speed</span>
                  Speech Metrics & Telemetry
                </h3>

                {/* Metric 1: WPM */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-bold">Speaking Speed (WPM)</span>
                    <span className="text-white font-mono font-bold">{wpm} WPM</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${(wpm / 200) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-green font-bold block">Optimal Executive Pace (130-160 WPM)</span>
                </div>

                {/* Metric 2: Clarity Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-bold">Clarity & Articulation Index</span>
                    <span className="text-green font-mono font-bold">{clarityScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="bg-green h-full transition-all duration-500" style={{ width: `${clarityScore}%` }} />
                  </div>
                </div>

                {/* Metric 3: Filler Word Counter */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Filler Word Detector</p>
                    <p className="text-[10px] text-text-muted">Detects "um", "uh", "like", "you know"</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-yellow/20 text-yellow font-mono text-xs font-bold border border-yellow/30">
                    {fillerCount} Detected
                  </span>
                </div>

                {/* Metric 4: Confidence & Pitch Variance */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted font-bold">Voice Confidence & Modulation</span>
                    <span className="text-purple-400 font-mono font-bold">High (92%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="bg-purple-400 h-full w-[92%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
