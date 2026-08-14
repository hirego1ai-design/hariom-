"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function PracticeHubPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState("Senior");

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Header Bar */}
        <header
          className="fixed top-0 left-[116px] right-0 z-40 backdrop-blur-xl flex justify-between items-center px-gutter h-20 shadow-sm"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--primary-container-bg)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  CF06 Module
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>AI Candidate Copilot</span>
              </div>
              <h1
                className="text-headline-md font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                AI Practice Hub & Interview Simulator
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Top Banner & Quick Target Selector */}
          <div
            className="rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--outline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="space-y-1.5 max-w-2xl">
              <h2 className="font-bold text-xl flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--primary)" }}>psychology</span>
                Master Technical & Behavioral Interviews with AI
              </h2>
              <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                Choose a specialized practice mode below to simulate real-world hiring rounds. Get instant feedback on code quality, speech clarity, STAR method structure, and confidence metrics.
              </p>
            </div>

            <div
              className="flex items-center gap-3 p-2 rounded-2xl"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
              }}
            >
              <span className="text-xs font-bold pl-2" style={{ color: "var(--text-muted)" }}>Level:</span>
              {["Junior", "Mid", "Senior", "Principal"].map((lvl) => {
                const isSelected = selectedDifficulty === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedDifficulty(lvl)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      backgroundColor: isSelected ? "var(--primary)" : "transparent",
                      color: isSelected ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: isSelected ? "var(--shadow-btn-red)" : "none",
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practice Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            
            {/* Module 1: AI Mock Interview */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                {/* Centered 3D Icon Box */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">smart_toy</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--primary-container-bg)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    CF07
                  </span>
                  <span className="text-[11px] font-extrabold" style={{ color: "var(--color-green-light, #2E7D32)" }}>
                    Live AI Recruiter
                  </span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                  AI Mock Interview Simulator
                </h3>
                <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  Full 30-minute interactive audio/video interview round with live AI Recruiter avatar, real-time proctoring, and question bank tailored to {selectedDifficulty} role requirements.
                </p>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/ai/mock-interview/active"
                  className="block w-full py-2.5 rounded-full text-white font-bold text-xs text-center transition-all"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  Start Active Mock Interview →
                </Link>
              </div>
            </div>

            {/* Module 2: Communication & Speech Coach */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                {/* Centered 3D Icon Box */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, var(--secondary), var(--secondary-dim))",
                    boxShadow: "var(--shadow-btn-blue)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">record_voice_over</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--secondary-container-bg)",
                      color: "var(--secondary)",
                      border: "1px solid var(--secondary)",
                    }}
                  >
                    CF08
                  </span>
                  <span className="text-[11px] font-extrabold" style={{ color: "var(--secondary)" }}>
                    Audio Speech Lab
                  </span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                  Speech & Communication Coach
                </h3>
                <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  Analyze filler words ("um", "like"), speaking speed (WPM), voice tone, and clarity. Get instant AI rephrasing suggestions for high-impact executive responses.
                </p>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/ai/coach/active"
                  className="block w-full py-2.5 rounded-full font-bold text-xs text-center border transition-all"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  Launch Speech Coach →
                </Link>
              </div>
            </div>

            {/* Module 3: Coding & DSA Arena */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                {/* Centered 3D Icon Box */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
                    boxShadow: "0 6px 18px rgba(46,125,50,0.35)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">code</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: "rgba(46,125,50,0.14)",
                      color: "#2E7D32",
                      border: "1px solid rgba(46,125,50,0.25)",
                    }}
                  >
                    IDE Arena
                  </span>
                  <span className="text-[11px] font-extrabold" style={{ color: "#2E7D32" }}>
                    Proctored Code Test
                  </span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-emerald-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                  Coding & DSA IDE Arena
                </h3>
                <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  Solve Data Structure & Algorithm challenges in a browser-based Monaco editor with real-time test runners, time complexity analysis, and AI hint copilot.
                </p>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/assessment/coding/ide"
                  className="block w-full py-2.5 rounded-full text-white font-bold text-xs text-center transition-all"
                  style={{
                    background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
                    boxShadow: "0 6px 18px rgba(46,125,50,0.35)",
                  }}
                >
                  Enter Web IDE →
                </Link>
              </div>
            </div>

            {/* Module 4: STAR Behavioral Method Practice */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #8E24AA, #BA68C8)",
                    boxShadow: "0 6px 18px rgba(142,36,170,0.35)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">record_voice_over</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    STAR Method
                  </span>
                  <span className="text-[11px] font-extrabold text-purple-400">Behavioral</span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors" style={{ color: "var(--text-primary)" }}>
                  STAR Behavioral Story Studio
                </h3>
                <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  Practice Situation, Task, Action, Result responses for leadership, conflict resolution, and teamwork prompts with automated rubric evaluation.
                </p>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/ai/coach/active"
                  className="block w-full py-2.5 rounded-full font-bold text-xs text-center border transition-all"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  Practice STAR Stories →
                </Link>
              </div>
            </div>

            {/* Module 5: System Design Studio */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #F57F17, #FFB74D)",
                    boxShadow: "0 6px 18px rgba(245,127,23,0.35)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">architecture</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    Architecture
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-500">System Design</span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-amber-500 transition-colors" style={{ color: "var(--text-primary)" }}>
                  System Design Whiteboard Simulator
                </h3>
                <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                  Design distributed systems, microservices, and database schemas with interactive canvas drawing and AI architectural scalability checks.
                </p>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/assessment/coding/ide"
                  className="block w-full py-2.5 rounded-full font-bold text-xs text-center border transition-all"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  Open Whiteboard Canvas →
                </Link>
              </div>
            </div>

            {/* Module 6: Career Trajectory & Progress Analytics */}
            <div
              className="rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden transition-all"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[28px]">assessment</span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                  Practice Analytics & History
                </h3>
                <div className="mt-3 space-y-2.5 text-xs font-medium">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Total Practice Hours:</span>
                    <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>18.4 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Mock Rounds Completed:</span>
                    <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>14 Rounds</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Avg Speech Confidence:</span>
                    <span className="font-bold font-mono" style={{ color: "var(--color-green-light, #2E7D32)" }}>94.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Filler Words / Min:</span>
                    <span className="font-bold font-mono" style={{ color: "var(--primary)" }}>0.4 (Low)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 space-y-2" style={{ borderTop: "1px solid var(--outline)" }}>
                <Link
                  href="/ai/career-prediction"
                  className="block text-center text-xs font-bold hover:underline"
                  style={{ color: "var(--primary)" }}
                >
                  View Career Prediction & Trajectory →
                </Link>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
