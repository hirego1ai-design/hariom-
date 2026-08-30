"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function TypingTestActivePage() {
  const sampleText = "The rapid evolution of artificial intelligence requires software architects to design highly scalable, fault-tolerant distributed systems capable of processing millions of events per second with sub-millisecond latency.";
  
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errorCount, setErrorCount] = useState(0);
  
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isTestActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTestActive) {
      setIsTestActive(false);
      setIsCompleted(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTestActive, timeLeft]);

  useEffect(() => {
    if (isCompleted && !resultSaved && !submitting) {
      submitResult();
    }
  }, [isCompleted]);

  const submitResult = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessment/typing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: sampleText,
          typedText: userInput,
          durationSeconds: 60 - timeLeft,
          keystrokeCount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResultSaved(true);
      }
    } catch (err) {
      console.error('Failed to submit typing assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeystrokeCount(prev => prev + 1);
    const val = e.target.value;
    if (!isTestActive && !isCompleted) {
      setIsTestActive(true);
    }
    setUserInput(val);

    // Calculate WPM: (words typed) / (time elapsed in minutes)
    const wordsTyped = val.trim().split(/\s+/).filter(Boolean).length;
    const timeElapsedMin = (60 - timeLeft) / 60 || 1 / 60;
    const currentWpm = Math.round(wordsTyped / timeElapsedMin);
    setWpm(currentWpm);

    // Calculate Errors & Accuracy
    let errors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== sampleText[i]) errors++;
    }
    setErrorCount(errors);
    const acc = Math.max(0, Math.round(((val.length - errors) / (val.length || 1)) * 100));
    setAccuracy(acc);

    if (val.length >= sampleText.length) {
      setIsTestActive(false);
      setIsCompleted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-bold text-lg text-white">Typing Practice</h1>
            <p className="text-text-muted text-xs">Self-reported WPM and accuracy practice. It is not a verified hiring assessment.</p>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-yellow font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">timer</span> {timeLeft}s Remaining
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto overflow-y-auto">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <span className="text-text-muted text-xs uppercase font-bold">Speed (WPM)</span>
              <h2 className="text-3xl font-bold text-primary font-mono">{wpm}</h2>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <span className="text-text-muted text-xs uppercase font-bold">Accuracy</span>
              <h2 className="text-3xl font-bold text-green font-mono">{accuracy}%</h2>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <span className="text-text-muted text-xs uppercase font-bold">Errors</span>
              <h2 className="text-3xl font-bold text-red-400 font-mono">{errorCount}</h2>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-white/10 text-center space-y-1">
              <span className="text-text-muted text-xs uppercase font-bold">Status</span>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono pt-1">
                {isCompleted ? "Passed ✅" : isTestActive ? "Active ⚡" : "Ready ⏳"}
              </h2>
            </div>
          </div>

          {/* Prompt Box */}
          <div className="p-6 rounded-2xl bg-[#141418] border border-white/10 space-y-3 font-mono text-sm leading-relaxed text-text-muted select-none">
            <span className="text-xs uppercase font-bold text-primary tracking-wider block font-sans">Target Text Prompt</span>
            <p className="text-white font-medium">{sampleText}</p>
          </div>

          {/* Input Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Candidate Live Input</label>
            <textarea
              value={userInput}
              onChange={handleInputChange}
              disabled={isCompleted}
              placeholder="Start typing the text prompt above to initiate assessment..."
              className="w-full h-40 bg-[#141418] border border-white/10 rounded-2xl p-5 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-primary/50 transition-all custom-scrollbar disabled:opacity-50"
            />
          </div>

          {/* Completion Modal Trigger */}
          {isCompleted && (
            <div className="p-6 rounded-2xl bg-green/10 border border-green/30 text-green space-y-3 font-mono">
              {submitting ? (
                 <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                   <span className="font-bold">Submitting assessment...</span>
                 </div>
              ) : (
                <>
                  <h3 className="font-bold text-base font-sans">Practice Completed</h3>
                  <p className="text-xs text-white">Your self-reported practice result has been saved. It is not a verified certificate.</p>
                  {resultSaved && (
                    <div className="text-xs text-white bg-black/20 p-3 rounded-lg mt-2">
                      <p>Practice speed: <span className="font-bold text-green">{wpm} WPM</span> at {accuracy}% accuracy</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Link
                      href="/profile"
                      className="px-5 py-2.5 rounded-xl bg-green text-bg-page font-bold font-sans text-xs shadow-lg shadow-green/30"
                    >
                      View Profile
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
