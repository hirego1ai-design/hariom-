"use client";

import React, { useEffect, useRef, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

export default function VideoResumePage() {
  const router = useRouter();
  const { updateState, markStepComplete } = useOnboarding();
  const [mode, setMode] = useState<"idle" | "recording" | "recorded" | "uploading" | "analyzing" | "complete" | "failed">("idle");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    setUploadError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setUploadError("Camera recording is not supported in this browser. Please upload a video instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.muted = true;
        await videoPreviewRef.current.play().catch(() => {});
      }
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        const file = new File([blob], `hirego-video-resume-${Date.now()}.webm`, { type: blob.type });
        setVideoFile(file);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        setMode("recorded");
      };
      recorder.start();
      setMode("recording");
      setTimeElapsed(0);
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev >= 120) { // Strict 120s limit
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setUploadError("Camera and microphone access was not granted. You can upload a video instead.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  const reRecord = () => {
    setUploadError(null);
    setStatusMessage(null);
    setMode("idle");
    setTimeElapsed(0);
    setAnalysisResult(null);
    setVideoFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleVideoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith("video/") || file.size > 10 * 1024 * 1024) {
      setUploadError("Please upload an MP4 or WebM video up to 10MB.");
      return;
    }
    setVideoFile(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setMode("recorded");
  };

  const pollStatus = async (videoId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/candidate/video-resume/status?videoId=${videoId}`);
        const data = await res.json();
        if (data.success) {
          const status = data.analysisStatus;
          if (status === "COMPLETED") {
            clearInterval(interval);
            // Render actual scores from server only if non-null
            setAnalysisResult({
              communicationScore: data.scores.communicationScore,
              clarityScore: data.scores.clarityScore,
              confidenceScore: data.scores.confidenceScore,
              professionalismScore: data.scores.professionalism,
              speechDeliveryScore: data.scores.speechDeliveryScore,
              contentStructureScore: data.scores.contentStructureScore,
              transcript: data.transcript,
              strengths: data.insights?.strengths || [],
              improvements: data.insights?.improvementSuggestions || [],
              lowConfidence: data.metrics?.lowConfidence,
            });
            setMode("complete");
          } else if (status === "FAILED" || status === "BLOCKED_INFRA") {
            clearInterval(interval);
            setMode("failed");
            if (status === "BLOCKED_INFRA") {
              setUploadError("Video saved. Local worker processing is BLOCKED_INFRA (Worker service unavailable).");
            } else {
              setUploadError(data.error || "Analysis processing failed.");
            }
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
      if (attempts >= 40) {
        clearInterval(interval);
        setStatusMessage("Analysis is taking longer than expected. Status: PROCESSING.");
      }
    }, 3000);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setUploadError("Record or choose a video before saving.");
      return;
    }
    setMode("uploading");
    setUploadError(null);
    setStatusMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("category", "video-resumes");
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadJson.file?.url) throw new Error(uploadJson.error || "Video upload failed");

      setMode("analyzing");
      const durationToSubmit = Math.min(120, Math.max(1, timeElapsed || 60));
      const saveResponse = await fetch("/api/candidate/video-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: uploadJson.file.url,
          durationSeconds: durationToSubmit,
        }),
      });
      const saveJson = await saveResponse.json();
      if (!saveResponse.ok || !saveJson.success) throw new Error(saveJson.error || "Video could not be saved");

      updateState({ videoRecorded: true, videoAnalysis: null });
      markStepComplete(8);

      if (saveJson.videoId && saveJson.analysisStatus === "PENDING") {
        pollStatus(saveJson.videoId);
      } else if (saveJson.analysisStatus === "BLOCKED_INFRA") {
        setMode("failed");
        setUploadError("Video saved. Local worker analysis is BLOCKED_INFRA.");
      } else {
        setMode("complete");
      }
    } catch (error) {
      setMode("recorded");
      setUploadError(error instanceof Error ? error.message : "Video could not be saved. Please try again.");
    }
  };

  const handleNext = () => {
    markStepComplete(8);
    router.push("/onboarding/preferences");
  };

  const handleSkip = () => {
    updateState({ videoRecorded: false, videoAnalysis: null });
    markStepComplete(8);
    router.push("/onboarding/preferences");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% 15%, rgba(66,133,244,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(234,67,53,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 10%, rgba(251,188,5,0.06) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(52,168,83,0.08) 0%, transparent 50%)",
          }}
        />

        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-center text-center"
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
                Video resume
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Local Speech & Presentation Processing (Max 120s)
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Video Pitch Studio
            </h1>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          <div
            className="rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }}
            />

            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline)" }}>
              <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>videocam</span>
                2-Minute Elevator Pitch Studio
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Privacy-First Local Processing
              </span>
            </div>

            <div
              className="w-full h-64 sm:h-72 rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: "var(--surface-container-low)",
                borderColor: "var(--outline)",
              }}
            >
              {mode === "recording" && (
                <video ref={videoPreviewRef} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
              )}
              {(mode === "recorded" || mode === "uploading" || mode === "analyzing" || mode === "complete" || mode === "failed") && previewUrl && (
                <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" controls playsInline />
              )}
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
                    Ready to record your 2-minute pitch?
                  </h3>
                  <p className="text-xs font-semibold max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                    Introduce your domain focus, key projects, and career goals (Strict 120-second maximum limit).
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="block mx-auto text-xs font-bold underline underline-offset-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Upload a video instead
                  </button>
                  <input ref={fileInputRef} type="file" accept="video/mp4,video/webm" onChange={handleVideoFile} className="hidden" />
                </div>
              )}

              {mode === "recording" && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: "var(--primary)" }} />
                    <span className="text-sm font-extrabold font-mono" style={{ color: "var(--primary)" }}>
                      RECORDING — {Math.floor(timeElapsed / 60)}:{timeElapsed % 60 < 10 ? `0${timeElapsed % 60}` : timeElapsed % 60} / 2:00
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

              {(mode === "recorded" || mode === "uploading" || mode === "analyzing" || mode === "complete" || mode === "failed") && (
                <div className="text-center space-y-3 p-6">
                  {mode === "analyzing" && (
                    <div className="space-y-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        Processing video with local Whisper & MediaPipe...
                      </p>
                    </div>
                  )}
                  {mode === "complete" && (
                    <>
                      <span className="material-symbols-outlined text-[48px]" style={{ color: "var(--color-green-light, #2E7D32)" }}>
                        check_circle
                      </span>
                      <h3 className="font-extrabold text-base" style={{ color: "var(--text-primary)" }}>
                        Video resume saved and analyzed
                      </h3>
                    </>
                  )}
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
                        Record again
                      </button>
                      <button
                        onClick={handleUpload}
                        className="px-6 py-2 rounded-full text-white text-xs font-extrabold shadow-md transition-all"
                        style={{
                          background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                          boxShadow: "var(--shadow-btn-red)",
                        }}
                      >
                        Upload & Save Video
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 rounded-2xl border text-xs font-semibold" style={{ backgroundColor: "rgba(229,57,53,0.08)", borderColor: "var(--primary)", color: "var(--primary)" }}>
                {uploadError}
              </div>
            )}

            {statusMessage && (
              <div className="p-3 rounded-2xl border text-xs font-semibold" style={{ backgroundColor: "rgba(251,188,5,0.1)", borderColor: "var(--color-yellow-dark, #F57F17)", color: "var(--text-primary)" }}>
                {statusMessage}
              </div>
            )}

            {/* Verified Server-Side Analysis Results */}
            {mode === "complete" && analysisResult && (
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
                    Local Speech & Presentation Metrics
                  </span>
                  {analysisResult.lowConfidence && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-600">
                      Low Audio Confidence
                    </span>
                  )}
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
                        {m.score !== null && m.score !== undefined ? `${m.score}%` : "N/A"}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {analysisResult.transcript && (
                  <div className="p-3 rounded-xl border bg-white/5 space-y-1 text-xs">
                    <span className="font-bold block text-text-primary">Transcript (Whisper small):</span>
                    <p className="text-text-muted italic">"{analysisResult.transcript}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

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
            <button
              type="button"
              onClick={handleSkip}
              className="px-5 h-11 rounded-full font-bold text-xs border transition-all"
              style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)", color: "var(--text-secondary)" }}
            >
              Skip for now
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
