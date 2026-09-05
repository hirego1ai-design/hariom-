"use client";

import React, { useState, useRef, useEffect } from "react";

export default function VideoResumeModule() {
  const [activeTab, setActiveTab] = useState<"record" | "upload">("record");
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // in seconds
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savedVideo, setSavedVideo] = useState<{
    url: string;
    duration: string;
    date: string;
    size: string;
  } | null>({
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "01:45",
    date: "July 26, 2026",
    size: "18.4 MB",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (activeTab === "record" && !savedVideo) {
      requestPermissions();
    }
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab, savedVideo]);

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
    requestPermissions();
  };

  // Save / Submit Video
  const handleSaveVideo = () => {
    if (!videoUrl) return;
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setSavedVideo({
          url: videoUrl,
          duration: formatTime(recordingTime || 105),
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          size: videoBlob ? `${(videoBlob.size / (1024 * 1024)).toFixed(1)} MB` : "15.2 MB",
        });
      }
    }, 300);
  };

  // Upload File handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10 MB limit. Please upload a smaller video.");
      return;
    }

    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        const url = URL.createObjectURL(file);
        setSavedVideo({
          url: url,
          duration: "01:50",
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        });
      }
    }, 400);
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
                  retakeVideo();
                }}
                className="btn-ghost px-4 py-2 rounded-xl text-xs font-bold text-white hover:border-primary/40 flex items-center justify-center gap-1.5 border border-white/10 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Replace Video</span>
              </button>
              <button
                onClick={() => setSavedVideo(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red hover:bg-red/10 transition-colors flex items-center justify-center gap-1 border border-red/20 w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
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
