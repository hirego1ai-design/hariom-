"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type TypingPrompt = { id: string; title: string; text: string; durationSeconds: number };

export default function TypingTestActivePage() {
  const [prompt, setPrompt] = useState<TypingPrompt | null>(null);
  const [loadError, setLoadError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errorCount, setErrorCount] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [resultId, setResultId] = useState("");

  useEffect(() => {
    fetch("/api/assessment/typing/prompt")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success || !data.prompt) throw new Error(data.error || "Typing practice is unavailable.");
        setPrompt(data.prompt);
        setTimeLeft(data.prompt.durationSeconds);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Typing practice is unavailable."));
  }, []);

  useEffect(() => {
    if (!isTestActive || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((current) => current - 1), 1_000);
    return () => clearInterval(timer);
  }, [isTestActive, timeLeft]);

  useEffect(() => {
    if (isTestActive && timeLeft === 0) {
      setIsTestActive(false);
      setIsCompleted(true);
    }
  }, [isTestActive, timeLeft]);

  const submitResult = async () => {
    if (!prompt) return;
    setSubmissionAttempted(true);
    setSubmitting(true);
    try {
      const response = await fetch("/api/assessment/typing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          typedText: userInput,
          durationSeconds: Math.max(1, prompt.durationSeconds - timeLeft),
          keystrokeCount,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Practice result could not be saved.");
      setResultSaved(true);
      setResultId(data.assessment.id);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Practice result could not be saved.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (isCompleted && !resultSaved && !submitting && !submissionAttempted) void submitResult();
  // submitResult deliberately runs once when the client ends a practice attempt.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted, resultSaved, submitting, submissionAttempted]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!prompt || isCompleted) return;
    const value = event.target.value;
    if (!isTestActive) setIsTestActive(true);
    setKeystrokeCount((count) => count + 1);
    setUserInput(value);

    const elapsedMinutes = Math.max(1 / 60, (prompt.durationSeconds - timeLeft) / 60);
    setWpm(Math.round(value.trim().split(/\s+/).filter(Boolean).length / elapsedMinutes));

    let errors = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] !== prompt.text[index]) errors += 1;
    }
    setErrorCount(errors);
    setAccuracy(Math.max(0, Math.round(((value.length - errors) / (value.length || 1)) * 100)));

    if (value.length >= prompt.text.length) {
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
            <p className="text-text-muted text-xs">Self-reported practice only. It is not a verified hiring assessment.</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-yellow font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">timer</span> {prompt ? `${timeLeft}s Remaining` : "Not configured"}
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1200px] w-full mx-auto overflow-y-auto">
          {loadError && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{loadError}</div>}
          {!prompt ? (
            <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-3">
              <h2 className="font-bold">Typing practice is not configured</h2>
              <p className="text-sm text-text-secondary">An administrator must publish a real practice prompt before candidates can begin.</p>
              <Link href="/assessment/mcq" className="inline-flex px-5 py-2.5 rounded-xl btn-3d-red text-xs font-bold text-white">View assessments</Link>
            </div>
          ) : <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
              {[
                ["Speed (WPM)", wpm, "text-primary"],
                ["Accuracy", `${accuracy}%`, "text-green"],
                ["Errors", errorCount, "text-red-400"],
                ["Status", isCompleted ? "Completed" : isTestActive ? "Active" : "Ready", "text-white"],
              ].map(([label, value, tone]) => <div key={String(label)} className="glass-card p-5 rounded-2xl border border-white/10 text-center space-y-1">
                <span className="text-text-muted text-xs uppercase font-bold">{label}</span>
                <h2 className={`text-2xl font-bold font-mono ${tone}`}>{value}</h2>
              </div>)}
            </div>
            <div className="p-6 rounded-2xl bg-[#141418] border border-white/10 space-y-3 font-mono text-sm leading-relaxed text-text-muted select-none">
              <span className="text-xs uppercase font-bold text-primary tracking-wider block font-sans">{prompt.title}</span>
              <p className="text-white font-medium">{prompt.text}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Candidate live input</label>
              <textarea value={userInput} onChange={handleInputChange} disabled={isCompleted} placeholder="Start typing the prompt above to begin practice..." className="w-full h-40 bg-[#141418] border border-white/10 rounded-2xl p-5 text-white font-mono text-sm leading-relaxed focus:outline-none focus:border-primary/50 transition-all custom-scrollbar disabled:opacity-50" />
            </div>
            {isCompleted && <div className="p-6 rounded-2xl bg-green/10 border border-green/30 text-green space-y-3 font-mono">
              {submitting ? <div className="flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[16px]">sync</span><span className="font-bold">Saving practice result...</span></div> : <>
                <h3 className="font-bold text-base font-sans">Practice completed</h3>
                <p className="text-xs text-white">This saved result is self-reported practice and is not a hiring credential.</p>
                {resultSaved && resultId && <Link href={`/assessment/typing/results?id=${encodeURIComponent(resultId)}`} className="inline-flex px-5 py-2.5 rounded-xl bg-green text-bg-page font-bold font-sans text-xs">View saved result</Link>}
              </>}
            </div>}
          </>}
        </main>
      </div>
    </div>
  );
}
