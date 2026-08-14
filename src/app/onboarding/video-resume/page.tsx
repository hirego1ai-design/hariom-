"use client";

import React, { useState, useRef } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VideoResumePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "recording" | "recorded" | "uploading" | "analyzing" | "complete">("idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const timerRef = useRef<any>(null);

  const startRecording = () => {
    setMode("recording");
    setTimeElapsed(0);
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev >= 120) {
          clearInterval(timerRef.current);
          setMode("recorded");
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setMode("recorded");
  };

  const reRecord = () => {
    setMode("idle");
    setTimeElapsed(0);
    setAnalysisResult(null);
  };

  const handleUpload = () => {
    setMode("uploading");
    setTimeout(() => {
      setMode("analyzing");
      setTimeout(() => {
        setAnalysisResult({
          communicationScore: 82,
          clarityScore: 88,
          confidenceScore: 76,
          professionalismScore: 90,
          bodyLanguageScore: 74,
          fluencyScore: 85,
          toneScore: 80,
          energyLevel: 78,
          overallScore: 82,
        });
        setMode("complete");
      }, 2500);
    }, 1800);
  };

  const handleNext = () => {
    router.push("/onboarding/preferences");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        {/* Google-Style Ambient Lining Background & Quad Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% 15%, rgba(66,133,244,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(234,67,53,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 10%, rgba(251,188,5,0.06) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(52,168,83,0.08) 0%, transparent 50%)",
          }}
        />

        {/* Top Header */}
        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-between"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--primary-container-bg)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
              >
                Onboarding Step 8/10
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                AI Speech & Presentation Pitch Vector
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Video Pitch Recording Studio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Step 8 of 10
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          {/* Main 3D Bento Card */}
          <div
            className="rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            {/* Google Multi-Color Top Border Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }}
            />

            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline)" }}>
              <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>videocam</span>
                60-Second Elevator Pitch Video Studio
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                AI Speech Analysis Active
              </span>
            </div>

            {/* Video Viewport Box */}
            <div
              className="w-full h-64 sm:h-72 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: "var(--surface-container-low)",
                borderColor: "var(--outline)",
              }}
            >
              {mode === "idle" && (
                <div className="text-center space-y-3 p-6">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                      boxShadow: "var(--shadow-btn-red)",
                    }}
                  >
                    <span className="material-symbols-outlined text-white text-[32px]">videocam</span>
                  </div>
                  <h3 className="font-extrabold text-base" style={{ color: "var(--text-primary)" }}>
                    Ready to record your 60-second pitch?
                  </h3>
                  <p className="text-xs font-semibold max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                    Introduce your technical domain focus, top projects, and key career objectives for recruiter discovery.
                  </p>
                  <button
                    onClick={startRecording}
                    className="px-6 py-2.5 rounded-full text-white text-xs font-extrabold transition-all shadow-md hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                      boxShadow: "var(--shadow-btn-red)",
                    }}
                  >
                    Start Camera Recording
                  </button>
                </div>
              )}

              {mode === "recording" && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: "var(--primary)" }} />
                    <span className="text-sm font-extrabold font-mono" style={{ color: "var(--primary)" }}>
                      RECORDING IN PROGRESS — 0:{timeElapsed < 10 ? `0${timeElapsed}` : timeElapsed}
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2 rounded-full text-xs font-bold text-white transition-all shadow-md"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    Stop & Review Pitch
                  </button>
                </div>
              )}

              {(mode === "recorded" || mode === "uploading" || mode === "analyzing" || mode === "complete") && (
                <div className="text-center space-y-3 p-6">
                  <span className="material-symbols-outlined text-[48px]" style={{ color: "var(--color-green-light, #2E7D32)" }}>
                    check_circle
                  </span>
                  <h3 className="font-extrabold text-base" style={{ color: "var(--text-primary)" }}>
                    Pitch Recorded Successfully!
                  </h3>
                  {mode === "recorded" && (
                    <div className="flex items-center gap-3 justify-center pt-2">
                      <button
                        onClick={reRecord}
                        className="px-4 py-2 rounded-full text-xs font-bold border transition-all"
                        style={{
                          backgroundColor: "var(--surface-container-high)",
                          borderColor: "var(--outline)",
                          color: "var(--text-primary)",
                        }}
                      >
                        Re-record Pitch
                      </button>
                      <button
                        onClick={handleUpload}
                        className="px-6 py-2 rounded-full text-white text-xs font-extrabold shadow-md transition-all"
                        style={{
                          background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                          boxShadow: "var(--shadow-btn-red)",
                        }}
                      >
                        Analyze & Save Pitch
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Speech Analysis Results */}
            {analysisResult && (
              <div
                className="p-6 rounded-2xl border space-y-4"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderColor: "var(--outline)",
                }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--outline)" }}>
                  <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    AI Speech & Fluency Vectors
                  </span>
                  <span className="text-lg font-extrabold font-mono" style={{ color: "var(--color-green-light, #2E7D32)" }}>
                    {analysisResult.overallScore}% Pitch Score
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Communication", score: analysisResult.communicationScore },
                    { label: "Speech Clarity", score: analysisResult.clarityScore },
                    { label: "Confidence", score: analysisResult.confidenceScore },
                    { label: "Professionalism", score: analysisResult.professionalismScore },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-3 rounded-2xl border text-center"
                      style={{
                        backgroundColor: "var(--surface-container-high)",
                        borderColor: "var(--outline)",
                      }}
                    >
                      <span className="text-lg font-extrabold font-mono block" style={{ color: "var(--primary)" }}>
                        {m.score}%
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/resume-upload"
              className="px-6 h-11 rounded-full font-bold text-xs flex items-center gap-2 transition-all border"
              style={{
                backgroundColor: "var(--surface-container-high)",
                borderColor: "var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Link>

            <button
              onClick={handleNext}
              className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Next: Job Preferences</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
