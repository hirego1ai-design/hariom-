"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ResponseRecord = { id: string } | null;
type AttemptQuestion = {
  id: string; questionText: string; roleTitle: string; skillTags: string[];
  orderIndex: number; readingTimeSeconds: number; answerDurationSeconds: number; response: ResponseRecord;
};
type Attempt = {
  id: string; mediaType: "AUDIO" | "VIDEO"; status: string; questions: AttemptQuestion[];
};
type Phase = "READY" | "PREPARE" | "COUNTDOWN" | "RECORDING" | "SAVING" | "COMPLETE" | "ERROR";

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || "Request failed.");
  return body;
}

export default function VideoAssessmentActivePage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("READY");
  const [seconds, setSeconds] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const [message, setMessage] = useState("");
  const [booting, setBooting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const busyRef = useRef(false);

  const question = attempt?.questions[index];

  useEffect(() => {
    let cancelled = false;
    if (!jobId) { setMessage("This assessment link is missing its job ID."); setPhase("ERROR"); setBooting(false); return; }
    jsonRequest("/api/candidate/recorded-assessment/attempts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }),
    }).then(({ attempt: value }) => {
      if (cancelled) return;
      setAttempt(value);
      const firstUnanswered = value.questions.findIndex((q: AttemptQuestion) => !q.response);
      if (firstUnanswered === -1) setPhase("COMPLETE"); else setIndex(firstUnanswered);
    }).catch((error) => { if (!cancelled) { setMessage(error.message); setPhase("ERROR"); } })
      .finally(() => { if (!cancelled) setBooting(false); });
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => {
    if (!attempt || phase === "COMPLETE" || phase === "ERROR") return;
    let local: MediaStream | null = null;
    const constraints: MediaStreamConstraints = attempt.mediaType === "VIDEO"
      ? { video: { width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 15 } }, audio: true }
      : { video: true, audio: true }; // Camera stays active for proctoring in AUDIO mode.
    navigator.mediaDevices?.getUserMedia(constraints).then((stream) => {
      local = stream; streamRef.current = stream; setMediaReady(true); setMessage("");
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => { setMediaReady(false); setMessage("Camera and microphone permission is required for this proctored assessment."); });
    return () => { local?.getTracks().forEach((track) => track.stop()); streamRef.current = null; };
  }, [attempt?.id, attempt?.mediaType, phase === "COMPLETE"]);

  const completeAttempt = useCallback(async () => {
    if (!attempt) return;
    await jsonRequest(`/api/candidate/recorded-assessment/attempts/${attempt.id}/complete`, { method: "POST" });
    setPhase("COMPLETE"); setMessage("Assessment completed. All answers were saved.");
  }, [attempt]);

  const saveRecording = useCallback(async () => {
    if (!attempt || !question || busyRef.current) return;
    busyRef.current = true; setPhase("SAVING"); setMessage("Answer saved locally. Uploading securely…");
    try {
      const recorder = recorderRef.current;
      if (!recorder) throw new Error("Recorder is unavailable.");
      if (recorder.state !== "inactive") {
        await new Promise<void>((resolve) => { recorder.addEventListener("stop", () => resolve(), { once: true }); recorder.stop(); });
      }
      const mime = recorder.mimeType.split(";")[0] || (attempt.mediaType === "VIDEO" ? "video/webm" : "audio/webm");
      const blob = new Blob(chunksRef.current, { type: mime });
      if (!blob.size) throw new Error("No media was captured. Check your camera and microphone.");
      const durationSeconds = Math.max(1, Math.min(question.answerDurationSeconds, Math.ceil((Date.now() - startedAtRef.current) / 1000)));
      const form = new FormData();
      form.append("file", new File([blob], `assessment-${question.id}.webm`, { type: mime }));
      form.append("category", "assessment-media");
      const uploaded = await jsonRequest("/api/upload", { method: "POST", body: form });
      await jsonRequest(`/api/candidate/recorded-assessment/attempts/${attempt.id}/responses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptQuestionId: question.id, storedFileId: uploaded.file.id, durationSeconds }),
      });
      const updated = { ...attempt, questions: attempt.questions.map((q) => q.id === question.id ? { ...q, response: { id: uploaded.file.id } } : q) };
      setAttempt(updated); chunksRef.current = []; recorderRef.current = null;
      if (index + 1 >= updated.questions.length) await completeAttempt();
      else { setMessage("Answer saved — preparing next question."); setTimeout(() => { setIndex((v) => v + 1); setSeconds(updated.questions[index + 1].readingTimeSeconds); setPhase("PREPARE"); busyRef.current = false; }, 2500); return; }
    } catch (error) {
      setMessage(error instanceof Error ? `Upload failed: ${error.message} Your answer was not discarded; retry is required.` : "Upload failed.");
      setPhase("ERROR");
    } finally { busyRef.current = false; }
  }, [attempt, question, index, completeAttempt]);

  const beginRecording = useCallback(() => {
    if (!attempt || !question || !streamRef.current || typeof MediaRecorder === "undefined") { setMessage("Recording is unavailable in this browser."); setPhase("ERROR"); return; }
    const source = attempt.mediaType === "AUDIO"
      ? new MediaStream(streamRef.current.getAudioTracks())
      : streamRef.current;
    const types = attempt.mediaType === "VIDEO" ? ["video/webm;codecs=vp8,opus", "video/webm"] : ["audio/webm;codecs=opus", "audio/webm"];
    const mimeType = types.find((value) => MediaRecorder.isTypeSupported(value));
    const options: MediaRecorderOptions = attempt.mediaType === "VIDEO"
      ? { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 500_000, audioBitsPerSecond: 64_000 }
      : { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 };
    const recorder = new MediaRecorder(source, options);
    chunksRef.current = []; recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorderRef.current = recorder; startedAtRef.current = Date.now(); recorder.start(1000);
    setSeconds(question.answerDurationSeconds); setPhase("RECORDING"); setMessage("");
  }, [attempt, question]);

  useEffect(() => {
    if (!["PREPARE", "COUNTDOWN", "RECORDING"].includes(phase)) return;
    if (seconds <= 0) {
      if (phase === "PREPARE") { setPhase("COUNTDOWN"); setSeconds(3); }
      else if (phase === "COUNTDOWN") beginRecording();
      else void saveRecording();
      return;
    }
    const timer = window.setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, seconds, beginRecording, saveRecording]);

  const startAssessment = () => {
    if (!mediaReady || !question) { setMessage("Camera and microphone must be ready before starting."); return; }
    setSeconds(question.readingTimeSeconds); setPhase("PREPARE"); setMessage("");
  };

  if (booting) return <div className="min-h-screen bg-bg-page text-text-primary grid place-items-center"><p>Preparing your assessment…</p></div>;

  return <div className="min-h-screen bg-bg-page text-text-primary flex">
    <CandidateSidebar />
    <div className="flex-1 md:ml-[116px] min-h-screen">
      <header className="min-h-16 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-outline bg-bg-page">
        <div><h1 className="font-bold">Recorded Assessment</h1><p className="text-xs text-text-secondary">{attempt?.mediaType === "AUDIO" ? "Audio answers · camera proctoring active" : "Video answers · proctored"}</p></div>
        {attempt && phase !== "COMPLETE" && <span className="text-xs font-mono">Question {Math.min(index + 1, attempt.questions.length)} / {attempt.questions.length}</span>}
      </header>
      <main className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-outline">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold">
              {phase === "RECORDING" ? "● RECORDING" : mediaReady ? "● PROCTORING READY" : "MEDIA REQUIRED"}
            </div>
          </div>
          {message && <div role="status" className="rounded-2xl border border-outline bg-bg-card p-4 text-sm">{message}</div>}
          {phase === "READY" && <button onClick={startAssessment} disabled={!mediaReady || !question} className="min-h-11 px-6 rounded-full btn-3d-red font-bold disabled:opacity-50">Start Assessment</button>}
          {phase === "ERROR" && question && <button onClick={() => { setMessage(""); setSeconds(question.readingTimeSeconds); setPhase("PREPARE"); }} className="min-h-11 px-6 rounded-full border border-outline bg-bg-card font-bold">Retry current question</button>}
        </section>
        <section className="lg:col-span-5">
          {phase === "COMPLETE" ? <div className="rounded-3xl border border-outline bg-bg-card p-6 text-center space-y-4"><h2 className="text-xl font-bold">Assessment complete</h2><p className="text-sm text-text-secondary">Your recorded responses have been securely saved.</p><Link href="/applications/timeline" className="inline-flex min-h-11 items-center px-6 rounded-full btn-3d-red font-bold">Application timeline</Link></div>
          : question ? <div className="rounded-3xl border border-outline bg-bg-card p-6 space-y-5">
            <div className="flex justify-between gap-3 text-xs text-text-secondary"><span>{question.roleTitle}</span><span>{question.answerDurationSeconds}s answer</span></div>
            <h2 className="text-lg font-bold leading-relaxed">{question.questionText}</h2>
            {question.skillTags.length > 0 && <p className="text-xs text-text-secondary">Focus: {question.skillTags.join(" · ")}</p>}
            {phase === "PREPARE" && <div className="rounded-2xl bg-bg-elevated p-5"><p className="text-xs uppercase font-bold">Read & Prepare</p><p className="text-4xl font-mono font-bold mt-2">00:{String(seconds).padStart(2,"0")}</p></div>}
            {phase === "COUNTDOWN" && <div className="rounded-2xl bg-bg-elevated p-5 text-center"><p className="text-sm font-bold">Recording starts in</p><p className="text-6xl font-bold mt-2">{seconds}</p></div>}
            {phase === "RECORDING" && <div className="rounded-2xl bg-bg-elevated p-5"><p className="text-xs uppercase font-bold">Recording</p><p className="text-4xl font-mono font-bold mt-2">00:{String(seconds).padStart(2,"0")}</p>{seconds <= 10 && <p className="text-sm mt-2">10 seconds or less remaining.</p>}</div>}
            {phase === "SAVING" && <div className="rounded-2xl bg-bg-elevated p-5"><p className="font-bold">Saving answer…</p><p className="text-sm text-text-secondary mt-1">Do not close this page.</p></div>}
            <p className="text-xs text-text-secondary">After you start, each question runs automatically: 10 seconds to read, a 3-2-1 countdown, then the configured 30 or 60 second recording. There is no Next or Submit button.</p>
          </div> : null}
        </section>
      </main>
    </div>
  </div>;
}
