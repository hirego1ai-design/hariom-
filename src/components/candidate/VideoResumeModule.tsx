"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Analysis Report Types ───────────────────────────────────────
interface AnalysisReport {
  videoId: string;
  analysisStatus: string;
  durationSeconds: number;
  transcript: string | null;
  metrics: {
    detectedLanguage: string | null;
    wordsPerMinute: number | null;
    pauseRatio: number | null;
    fillerWordCount: number | null;
    transcriptConfidence: number | null;
    lowConfidence: boolean | null;
    audioQuality: string | null;
  };
  error: string | null;
  completedAt: string | null;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const MetricRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-text-secondary">{label}</span>
    <span className="text-xs font-bold text-white">{value ?? "—"}</span>
  </div>
);

export default function VideoResumeModule() {
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [analysisPolling, setAnalysisPolling] = useState(false);
  const [savedVideoId, setSavedVideoId] = useState<string | null>(null);
  const [understandsProcessing, setUnderstandsProcessing] = useState(false);
  const [savedVideo, setSavedVideo] = useState<{
    url: string;
    duration: string;
    date: string;
    size: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_DURATION = 120; // 2 minutes max

  // Request Camera & Microphone permissions
  const requestPermissions = async () => {
    try {
      if (typeof window !== "undefined" && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermissions(true);
      }
    } catch (err) {
      console.error("Camera/Mic Permission Error:", err);
      setHasPermissions(false);
    }
  };

  // Stop camera stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);



  // Start Recording
  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
    }
  };

  // Pause / Resume Recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Retake / Reset
  const retakeVideo = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    setUploadError(null);
    requestPermissions();
  };

  // ─── Get video duration from blob ────────────────────────────────
  const getVideoDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (isFinite(video.duration)) {
          resolve(Math.round(video.duration));
        } else {
          resolve(0); // WebM blobs sometimes report Infinity
        }
      };
      video.onerror = () => reject(new Error("Cannot read video metadata"));
      video.src = URL.createObjectURL(blob);
    });
  };

  // ─── Real Upload + Analysis Pipeline ─────────────────────────────
  const uploadAndAnalyze = async (blob: Blob, durationFallback: number) => {
    if (!understandsProcessing) {
      setUploadError("Please read and acknowledge the video processing notice before saving.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Step 1: Get duration
      let duration = durationFallback;
      try {
        const d = await getVideoDuration(blob);
        if (d > 0) duration = d;
      } catch { /* use fallback */ }

      if (duration > MAX_DURATION) {
        setUploadError(`Video is ${duration}s — exceeds the 2-minute (120s) limit.`);
        setIsUploading(false);
        return;
      }
      if (blob.size > 10 * 1024 * 1024) {
        setUploadError("Video exceeds the 10 MB limit. Please record a shorter clip or upload a smaller file.");
        return;
      }

      setUploadProgress(10);

      // Step 2: Upload file to R2 via /api/upload
      const formData = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("file", blob, `video-resume.${ext}`);
      formData.append("category", "video-resumes");

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || `Upload failed (${uploadRes.status})`);
      }
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.file?.url;
      if (!fileUrl) throw new Error("Upload response missing file URL");

      setUploadProgress(50);

      // Step 3: Submit video resume + queue analysis job
      const submitRes = await fetch("/api/candidate/video-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: fileUrl, durationSeconds: duration }),
      });
      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(err.error || `Submission failed (${submitRes.status})`);
      }
      const submitData = await submitRes.json();
      const videoId = submitData.videoId || submitData.videoResumeId || submitData.id;
      if (!videoId) throw new Error("Submission response missing video ID");

      setUploadProgress(80);

      setSavedVideo({
        url: URL.createObjectURL(blob),
        duration: formatTime(duration),
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        size: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      setSavedVideoId(videoId);
      setUploadProgress(100);

      // Step 4: Start polling for analysis status
      startPolling(videoId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Status Polling ──────────────────────────────────────────────
  const startPolling = useCallback((videoId: string) => {
    setAnalysisPolling(true);
    setAnalysisReport(null);

    const poll = async () => {
      try {
        const res = await fetch(`/api/candidate/video-resume/status?videoId=${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.analysisStatus === "COMPLETED" || data.analysisStatus === "FAILED" || data.analysisStatus === "BLOCKED_INFRA") {
          setAnalysisReport(data as AnalysisReport);
          setAnalysisPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* continue polling on network errors */ }
    };

    poll(); // immediate first check
    pollRef.current = setInterval(poll, 5000);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/candidate/video-resume", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data?.videos?.length) return;
        const latest = data.videos[0];
        if (!latest.id || !latest.videoUrl) return;
        setSavedVideo({
          url: latest.videoUrl,
          duration: formatTime(latest.durationSeconds || 0),
          date: new Date(latest.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          size: "Saved recording",
        });
        setSavedVideoId(latest.id);
        startPolling(latest.id);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [startPolling]);

  // ─── Save Recorded Video Handler ─────────────────────────────────
  const handleSaveVideo = () => {
    if (!videoBlob) return;
    uploadAndAnalyze(videoBlob, recordingTime || 60);
  };

  // ─── Upload File Handler ─────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the 10 MB limit. Please upload a smaller video.");
      return;
    }

    // Validate duration client-side
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_DURATION) {
        setUploadError(`Video is ${duration}s — exceeds the 2-minute (120s) limit.`);
        return;
      }
    } catch { /* proceed — server will enforce */ }

    uploadAndAnalyze(file, 0);
  };



  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 w-full shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl">videocam</span>
            <h2 className="font-headline-md text-headline-sm text-text-primary font-bold">Video Resume Module</h2>
            <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Optional
            </span>
          </div>
          <p className="text-text-secondary text-xs">
            Add a two-minute introduction about your experience, skills and a project you are proud of.
          </p>
        </div>

        {/* Tab Switcher if not saved */}
        {!savedVideo && (
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("record")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "record" ? "bg-primary text-white shadow-md" : "text-text-secondary hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              <span>Record Live</span>
            </button>
            <button
              onClick={() => { stopStream(); setHasPermissions(null); setActiveTab("upload"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "upload" ? "bg-primary text-white shadow-md" : "text-text-secondary hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              <span>Upload Video</span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm leading-6 text-text-secondary">
        <p>Your video may be transcribed and analyzed for observable presentation details. The report can be wrong and does not make a hiring decision. See our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> and <Link href="/terms" className="text-primary underline">Terms</Link>. If video is not suitable for you, ask for another way to present your experience.</p>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-white"><input type="checkbox" checked={understandsProcessing} onChange={event => setUnderstandsProcessing(event.target.checked)} className="mt-1 h-4 w-4 accent-blue-500" /><span>I understand how my video and report may be used.</span></label>
      </div>

      {/* Recording Instructions Callout Box */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">info</span>
        <div>
          <h4 className="font-bold text-xs text-primary mb-1 uppercase tracking-wider">Recording Instructions</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            In up to 2 minutes, introduce yourself, describe the role you want, and explain one relevant project or result. You do not need a perfect script or studio setup.
          </p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {uploadError && (
        <div className="bg-red/10 border border-red/30 rounded-xl p-4 mb-4 flex items-start gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-red text-xl flex-shrink-0">error</span>
          <div className="flex-1">
            <p className="text-xs text-red font-bold">{uploadError}</p>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red/60 hover:text-red text-xs">✕</button>
        </div>
      )}

      {/* SAVED VIDEO VIEW */}
      {savedVideo ? (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 group shadow-xl">
            <video src={savedVideo.url} controls className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
              <span>ACTIVE VIDEO RESUME</span>
            </div>
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-text-secondary border border-white/10">
              Duration: {savedVideo.duration} • Size: {savedVideo.size}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="text-xs text-text-secondary">
              <span className="font-bold text-white">Upload Date:</span> {savedVideo.date}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setSavedVideo(null);
                  setSavedVideoId(null);
                  setAnalysisReport(null);
                  setAnalysisPolling(false);
                  if (pollRef.current) clearInterval(pollRef.current);
                  retakeVideo();
                }}
                className="btn-ghost px-4 py-2 rounded-xl text-xs font-bold text-white hover:border-primary/40 flex items-center justify-center gap-1.5 border border-white/10 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Record another</span>
              </button>
              <button
                onClick={() => {
                  setSavedVideo(null);
                  setSavedVideoId(null);
                  setAnalysisReport(null);
                  if (pollRef.current) clearInterval(pollRef.current);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red hover:bg-red/10 transition-colors flex items-center justify-center gap-1 border border-red/20 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Close preview</span>
              </button>
            </div>
          </div>
          <p className="text-xs leading-5 text-text-secondary">Closing this preview or recording another video does not delete a saved upload. To request deletion, contact <a href="mailto:legal@hiregoai.com" className="text-primary underline">legal@hiregoai.com</a>.</p>

          {/* ─── ANALYSIS POLLING STATUS ─────────────────────────── */}
          {analysisPolling && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-bold text-white">Analyzing your video resume...</p>
              <p className="text-xs text-text-secondary">The service is preparing a transcript and presentation report. Timing depends on availability.</p>
            </div>
          )}

          {/* ─── ANALYSIS REPORT (COMPLETED) ─────────────────────── */}
          {analysisReport && analysisReport.analysisStatus === "COMPLETED" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pt-2">
                <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Video presentation report</h3>
                <span className="bg-green/20 text-green border border-green/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Completed</span>
              </div>

              <p className="text-xs leading-5 text-text-secondary">This report organizes your recording and transcript. It does not score your character or job suitability. A person should review your actual words and experience.</p>

              {/* Observable speech details and report context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">mic</span>
                    Speech Metrics
                  </h4>
                  <MetricRow label="Detected Language" value={analysisReport.metrics.detectedLanguage} />
                  <MetricRow label="Words Per Minute" value={analysisReport.metrics.wordsPerMinute ? Math.round(analysisReport.metrics.wordsPerMinute) : null} />
                  <MetricRow label="Pause Ratio" value={analysisReport.metrics.pauseRatio !== null && analysisReport.metrics.pauseRatio !== undefined ? `${(analysisReport.metrics.pauseRatio * 100).toFixed(0)}%` : null} />
                  <MetricRow label="Filler Words" value={analysisReport.metrics.fillerWordCount} />
                  <MetricRow label="Audio Quality" value={analysisReport.metrics.audioQuality} />
                  <MetricRow label="Transcript Confidence" value={analysisReport.metrics.transcriptConfidence !== null && analysisReport.metrics.transcriptConfidence !== undefined ? `${(analysisReport.metrics.transcriptConfidence * 100).toFixed(0)}%` : null} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">About this report</h4>
                  <p className="text-xs leading-6 text-text-secondary">The report is generated from your recording and may be incomplete or wrong. Recording quality, language and accessibility needs can affect the output. Ask a person to review the video in context.</p>
                  <MetricRow label="Duration" value={`${analysisReport.durationSeconds}s`} />
                </div>
              </div>

              {analysisReport.metrics.lowConfidence && <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-6 text-yellow-200">The transcript may be less accurate than usual. Check the recording before drawing conclusions.</p>}

              {/* Transcript */}
              {analysisReport.transcript && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">subtitles</span>
                    Transcript
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {analysisReport.transcript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analysis Error State */}
          {analysisReport && (analysisReport.analysisStatus === "FAILED" || analysisReport.analysisStatus === "BLOCKED_INFRA") && (
            <div className="bg-red/5 border border-red/20 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-red text-xl flex-shrink-0">warning</span>
              <div>
                <h4 className="text-xs font-bold text-red uppercase tracking-wider mb-1">Analysis Failed</h4>
                <p className="text-xs text-text-secondary">{analysisReport.error || "The video analysis could not be completed. Please try uploading again."}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* RECORD TAB */}
          {activeTab === "record" && (
            <div className="space-y-4">
              {/* Camera Preview Area */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center shadow-xl">
                {videoUrl ? (
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                )}

                {/* Request camera access only after the candidate chooses to record. */}
                {hasPermissions !== true && !videoUrl && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
                    <span className="material-symbols-outlined text-primary text-4xl mb-2">videocam</span>
                    <h3 className="font-bold text-white text-sm mb-1">Record a video introduction</h3>
                    <p className="text-xs text-text-secondary max-w-sm mb-4">
                      {hasPermissions === false ? "Camera access was unavailable. You can try again or upload a video instead." : "Choose Enable camera when you are ready. Uploading a file does not require camera access."}
                    </p>
                    <button onClick={requestPermissions} className="btn-3d-red px-5 py-2.5 rounded-xl text-xs font-bold text-white">
                      Enable camera
                    </button>
                  </div>
                )}

                {/* Live Recording Overlay Timer */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg animate-pulse z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                    <span>REC</span>
                    <span className="font-mono text-sm ml-1">{formatTime(recordingTime)}</span>
                    <span className="text-[10px] text-white/80 border-l border-white/30 pl-2">
                      Remaining: {formatTime(MAX_DURATION - recordingTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                {!videoUrl ? (
                  <>
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        disabled={!hasPermissions}
                        className="btn-3d-red px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">fiber_manual_record</span>
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={togglePause}
                          className="btn-ghost px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 border border-white/10"
                        >
                          <span className="material-symbols-outlined text-lg">{isPaused ? "play_arrow" : "pause"}</span>
                          <span>{isPaused ? "Resume" : "Pause"}</span>
                        </button>

                        <button
                          onClick={stopRecording}
                          className="bg-red hover:bg-red/90 px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-lg"
                        >
                          <span className="material-symbols-outlined text-lg">stop</span>
                          <span>Finish & Preview</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={retakeVideo}
                      className="btn-ghost px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 border border-white/10"
                    >
                      <span className="material-symbols-outlined text-lg">replay</span>
                      <span>Retake Video</span>
                    </button>
                    <button
                      onClick={handleSaveVideo}
                      className="btn-3d-red px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-lg"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>Confirm & Save Resume</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white/5 relative">
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                </div>
                <h3 className="font-bold text-sm text-text-primary mb-1">Drag & Drop or Click to Upload Video</h3>
                <p className="text-xs text-text-secondary mb-3">Formats: MP4 or WebM • Maximum 2 minutes and 10 MB</p>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-tertiary bg-tertiary/10 border border-tertiary/20 px-3 py-1 rounded-full font-bold">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  <span>Video resume is optional</span>
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD PROGRESS BAR */}
          {isUploading && (
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Processing & Uploading Video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
