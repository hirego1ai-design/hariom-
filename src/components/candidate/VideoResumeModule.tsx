"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Analysis Report Types ───────────────────────────────────────
interface AnalysisReport {
  videoId: string;
  analysisStatus: string;
  durationSeconds: number;
  transcript: string | null;
  scores: {
    communicationScore: number | null;
    clarityScore: number | null;
    confidenceScore: number | null;
    professionalism: number | null;
    speechDeliveryScore: number | null;
    contentStructureScore: number | null;
  };
  metrics: {
    detectedLanguage: string | null;
    wordsPerMinute: number | null;
    pauseRatio: number | null;
    fillerWordCount: number | null;
    transcriptConfidence: number | null;
    lowConfidence: boolean | null;
    audioQuality: string | null;
    facePresenceRatio: number | null;
    cameraFacingRatioEstimate: number | null;
    headPoseIndicators: Record<string, unknown> | null;
    postureIndicators: Record<string, unknown> | null;
  };
  insights: {
    strengths: string[] | null;
    improvementSuggestions: string[] | null;
  };
  modelInfo: {
    analysisVersion: string | null;
    workerVersion: string | null;
    modelName: string | null;
    modelVersion: string | null;
  };
  error: string | null;
  completedAt: string | null;
}

// ─── Score display helpers ───────────────────────────────────────
const ScoreCard = ({ label, value, icon }: { label: string; value: number | null; icon: string }) => {
  const color = value === null ? "text-text-secondary" : value >= 75 ? "text-green" : value >= 50 ? "text-yellow-400" : "text-red";
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 min-w-[120px]">
      <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
      <span className={`text-2xl font-bold ${color}`}>{value ?? "—"}</span>
      <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold text-center">{label}</span>
    </div>
  );
};

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
    requestPermissions();
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
      const videoId = submitData.videoResumeId || submitData.id;

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
      if (videoId) startPolling(videoId);
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

  // ─── Save Recorded Video Handler ─────────────────────────────────
  const handleSaveVideo = () => {
    if (!videoBlob) return;
    uploadAndAnalyze(videoBlob, recordingTime || 60);
  };

  // ─── Upload File Handler ─────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File size exceeds 100 MB limit. Please upload a smaller video.");
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



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
              AI Powered
            </span>
          </div>
          <p className="text-text-secondary text-xs">
            Stand out to top tech employers with a 2-minute video pitch highlighting your skills & achievements.
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
              onClick={() => setActiveTab("upload")}
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

      {/* Recording Instructions Callout Box */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">info</span>
        <div>
          <h4 className="font-bold text-xs text-primary mb-1 uppercase tracking-wider">Recording Instructions</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            "Introduce yourself in a maximum of 2 minutes. Tell employers about your experience, skills, achievements, career goals, communication skills, and why you are the right candidate."
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
                <span>Replace Video</span>
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
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* ─── ANALYSIS POLLING STATUS ─────────────────────────── */}
          {analysisPolling && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-bold text-white">Analyzing your video resume...</p>
              <p className="text-xs text-text-secondary">Local AI is processing speech, facial expressions, and posture. This typically takes 30–90 seconds.</p>
            </div>
          )}

          {/* ─── ANALYSIS REPORT (COMPLETED) ─────────────────────── */}
          {analysisReport && analysisReport.analysisStatus === "COMPLETED" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pt-2">
                <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">AI Analysis Report</h3>
                <span className="bg-green/20 text-green border border-green/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Completed</span>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <ScoreCard label="Communication" value={analysisReport.scores.communicationScore} icon="forum" />
                <ScoreCard label="Clarity" value={analysisReport.scores.clarityScore} icon="visibility" />
                <ScoreCard label="Confidence" value={analysisReport.scores.confidenceScore} icon="psychology" />
                <ScoreCard label="Professionalism" value={analysisReport.scores.professionalism} icon="business_center" />
                <ScoreCard label="Speech Delivery" value={analysisReport.scores.speechDeliveryScore} icon="record_voice_over" />
                <ScoreCard label="Content Structure" value={analysisReport.scores.contentStructureScore} icon="format_list_numbered" />
              </div>

              {/* Speech & Visual Metrics */}
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
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">face</span>
                    Visual Metrics (MediaPipe)
                  </h4>
                  <MetricRow label="Face Presence" value={analysisReport.metrics.facePresenceRatio !== null && analysisReport.metrics.facePresenceRatio !== undefined ? `${(analysisReport.metrics.facePresenceRatio * 100).toFixed(0)}%` : null} />
                  <MetricRow label="Camera Facing" value={analysisReport.metrics.cameraFacingRatioEstimate !== null && analysisReport.metrics.cameraFacingRatioEstimate !== undefined ? `${(analysisReport.metrics.cameraFacingRatioEstimate * 100).toFixed(0)}%` : null} />
                  <MetricRow label="Posture (Upright)" value={
                    analysisReport.metrics.postureIndicators && typeof analysisReport.metrics.postureIndicators === "object" && "uprightRatio" in analysisReport.metrics.postureIndicators
                      ? `${((analysisReport.metrics.postureIndicators as { uprightRatio: number }).uprightRatio * 100).toFixed(0)}%`
                      : null
                  } />
                  <MetricRow label="Duration" value={`${analysisReport.durationSeconds}s`} />
                  <MetricRow label="Model" value={analysisReport.modelInfo.modelName} />
                  <MetricRow label="Version" value={analysisReport.modelInfo.modelVersion} />
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisReport.insights.strengths && analysisReport.insights.strengths.length > 0 && (
                  <div className="bg-green/5 border border-green/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-green uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysisReport.insights.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                          <span className="text-green mt-0.5">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysisReport.insights.improvementSuggestions && analysisReport.insights.improvementSuggestions.length > 0 && (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      Suggestions for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {analysisReport.insights.improvementSuggestions.map((s, i) => (
                        <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

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

                {/* Permission Banner if denied */}
                {hasPermissions === false && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
                    <span className="material-symbols-outlined text-red text-4xl mb-2">videocam_off</span>
                    <h3 className="font-bold text-white text-sm mb-1">Camera & Microphone Access Required</h3>
                    <p className="text-xs text-text-secondary max-w-sm mb-4">
                      Please enable browser permissions to record your live video resume.
                    </p>
                    <button onClick={requestPermissions} className="btn-3d-red px-5 py-2.5 rounded-xl text-xs font-bold text-white">
                      Grant Permission
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
                  accept="video/mp4,video/mov,video/webm"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                </div>
                <h3 className="font-bold text-sm text-text-primary mb-1">Drag & Drop or Click to Upload Video</h3>
                <p className="text-xs text-text-secondary mb-3">Formats: MP4, MOV, WebM • Maximum file size: 100 MB</p>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-tertiary bg-tertiary/10 border border-tertiary/20 px-3 py-1 rounded-full font-bold">
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  <span>Auto-compresses large files for fast loading</span>
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
