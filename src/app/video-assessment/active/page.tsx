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
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);

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
        mediaStreamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setMediaReady(true);
        setMediaError("");
      })
      .catch((err) => {
        console.warn("Camera/mic access unavailable:", err);
        setMediaReady(false);
        setMediaError("Camera and microphone access is required before starting this assessment.");
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
    const media = mediaStreamRef.current;
    if (!mediaReady || !media || typeof MediaRecorder === "undefined") {
      setMediaError("Video recording is not supported by this browser.");
      return;
    }
    const preferredType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = preferredType ? new MediaRecorder(media, { mimeType: preferredType }) : new MediaRecorder(media);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
    recorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    recorder.start(1000);
    setMediaError("");
    setIsRecording(true);
    setTimerSeconds(questions[currentQuestionIndex].timeLimit);
  };

  async function handleNextQuestion() {
    if (isAnalyzing) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") throw new Error("No recorded answer is available.");
      const stopped = new Promise<void>((resolve) => recorder.addEventListener("stop", () => resolve(), { once: true }));
      recorder.stop();
      await stopped;

      const durationSeconds = Math.max(1, Math.min(120, Math.ceil((Date.now() - (recordingStartedAtRef.current || Date.now())) / 1000)));
      const mimeType = recorder.mimeType.includes("webm") ? "video/webm" : "video/mp4";
      const extension = mimeType === "video/webm" ? "webm" : "mp4";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (!blob.size) throw new Error("The recorded answer is empty.");

      const form = new FormData();
      form.append("file", new File([blob], `assessment-answer-${currentQuestionIndex + 1}.${extension}`, { type: mimeType }));
      form.append("category", "video-resumes");
      const upload = await fetch("/api/upload", { method: "POST", body: form });
      const uploaded = await upload.json();
      if (!upload.ok || !uploaded.file?.url) throw new Error(uploaded.error || "Unable to upload the recorded answer.");

      const save = await fetch("/api/candidate/video-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploaded.file.url, durationSeconds }),
      });
      const saved = await save.json();
      if (!save.ok) throw new Error(saved.error || "Unable to submit the recorded answer.");

      setAiFeedback(saved.analysisStatus === "BLOCKED_INFRA"
        ? "Your recorded answer was saved. Automated analysis is temporarily unavailable."
        : "Your recorded answer was saved and queued for transcription and analysis.");
      chunksRef.current = [];
      recorderRef.current = null;
      recordingStartedAtRef.current = null;

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimerSeconds(questions[currentQuestionIndex + 1].timeLimit);
      } else {
        setIsCompleted(true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to submit the recorded answer.";
      setAiFeedback(`Submission failed: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-0 md:ml-[116px] min-h-screen flex flex-col">
        <header className="h-16 px-8 flex items-center justify-between border-b border-outline bg-bg-page backdrop-blur-xl">
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
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/60 border border-outline shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Status overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-outline text-xs">
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
                    Evaluating your submitted response...
                  </p>
                </div>
              )}
            </div>

            {mediaError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{mediaError}</div>}

            {/* Video Controls */}
            <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-outline bg-white/5">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={!mediaReady || isAnalyzing || isCompleted}
                  className="btn-3d-red px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">radio_button_checked</span>
                  <span>{mediaReady ? "Start Answer" : "Camera & microphone required"}</span>
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
                <span>{mediaReady ? "Camera & microphone ready" : "Media not ready"}</span>
              </div>
            </div>
          </div>

          {/* Question & Feedback (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-outline space-y-4 bg-white/5">
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
                  <span>Response evaluation</span>
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
                    This session is complete. Review availability depends on the configured assessment workflow.
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
