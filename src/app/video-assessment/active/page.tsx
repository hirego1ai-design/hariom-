"use client";

import React, { useState, useEffect, useRef } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VideoAssessmentActivePage() {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const questions = [
    {
      id: 1,
      title: "Architecture & System Scalability",
      text: "Describe a scenario where you had to design or refactor a high-throughput microservices architecture to handle sudden 10x traffic spikes.",
      timeLimit: 120,
    },
    {
      id: 2,
      title: "Conflict Resolution & Technical Leadership",
      text: "How do you align cross-functional engineering stakeholders when there is a deadlock regarding technical stack choices or schema design?",
      timeLimit: 120,
    },
    {
      id: 3,
      title: "AI Integration & Performance Optimization",
      text: "Explain your methodology for streaming LLM responses to a client with low latency while managing edge authentication and rate limits.",
      timeLimit: 120,
    },
  ];

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn("Camera/mic access unavailable:", err);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0 && isRecording) {
      handleNextQuestion();
    }
    return () => clearInterval(interval);
  }, [isRecording, timerSeconds]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimerSeconds(questions[currentQuestionIndex].timeLimit);
  };

  async function handleNextQuestion() {
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/agents/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "VIDEO_INTERVIEW_EVALUATION",
          prompt: `Evaluate candidate video response for question: ${questions[currentQuestionIndex].title}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.summary !== "string") {
        throw new Error(data.error || "Evaluation service returned an invalid response.");
      }
      setAiFeedback(data.summary);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Evaluation is temporarily unavailable.";
      setAiFeedback(`Evaluation unavailable: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setAiFeedback(null);
        setTimerSeconds(questions[currentQuestionIndex + 1].timeLimit);
      }, 2500);
    } else {
      setIsCompleted(true);
    }
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[100px] lg:ml-[116px] min-h-screen flex flex-col">
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-[#0A0A0C]/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              AI Video Assessment Session
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold">
              Proctored
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-gray-300">
                {formatTimer(timerSeconds)}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Video Feed (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Status overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRecording ? "bg-red-500 animate-pulse" : "bg-yellow-400"
                  }`}
                />
                <span className="text-[11px] font-bold">
                  {isRecording ? "RECORDING" : "STANDBY"}
                </span>
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-xs font-bold text-primary">
                    AI Neural Engine analyzing acoustic & semantic coherence...
                  </p>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-white/10 bg-white/5">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="btn-3d-red px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">radio_button_checked</span>
                  <span>Start Recording Answer</span>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">stop</span>
                  <span>Submit & Next Question</span>
                </button>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="material-symbols-outlined text-green-400 text-sm">mic</span>
                <span>Audio Stream HD</span>
              </div>
            </div>
          </div>

          {/* Question & Feedback (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 bg-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  {questions[currentQuestionIndex].title}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {questions[currentQuestionIndex].timeLimit}s Max
                </span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">
                {questions[currentQuestionIndex].text}
              </h2>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  AI Evaluation Tips
                </span>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Structure using the STAR framework (Situation, Task, Action, Result).</li>
                  <li>Focus on architectural trade-offs and performance metrics.</li>
                  <li>Maintain steady eye contact with the lens.</li>
                </ul>
              </div>
            </div>

            {aiFeedback && (
              <div className="p-5 rounded-3xl border border-primary/30 bg-primary/10 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>AI Real-time Sentiment Score</span>
                </div>
                <p className="text-xs text-gray-200">{aiFeedback}</p>
              </div>
            )}

            {isCompleted && (
              <div className="glass-card p-6 rounded-3xl border border-green-500/30 bg-green-500/10 space-y-4 text-center">
                <span className="material-symbols-outlined text-4xl text-green-400">
                  check_circle
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Video Assessment Completed!
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Your assessment has been submitted for AI scoring and recruiter review.
                  </p>
                </div>
                <Link
                  href="/applications/timeline"
                  className="inline-block btn-3d-red px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-lg"
                >
                  View Application Timeline
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
