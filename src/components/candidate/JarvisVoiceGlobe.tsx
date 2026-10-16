"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AudioLines, Mic2, Minimize2, Maximize2, Square, Volume2,
  VolumeX, LoaderCircle, X, ArrowUpRight,
} from "lucide-react";
import { isAllowedVoiceActionHref, pickSafeVoiceNavigation, type VoiceAction } from "@/lib/jarvis/JarvisVoiceNavigation";

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "paused" | "error";
type JarvisResponse = {
  success?: boolean;
  error?: string;
  transcript?: string;
  enabled?: boolean;
  voiceEnabled?: boolean;
  heard?: string;
  audio?: string | null;
  reply?: {
    message: string;
    actions: VoiceAction[];
    speechReceiptId?: string | null;
    navigation?: string | null;
  };
};

function preferredAudioType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
    .find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function voiceStageLabel(stage: Stage) {
  switch (stage) {
    case "listening": return "Listening";
    case "transcribing": return "Understanding your voice";
    case "thinking": return "Working on your request";
    case "speaking": return "Speaking";
    case "paused": return "Paused";
    case "error": return "Needs attention";
    default: return "Ready";
  }
}

export default function JarvisVoiceGlobe() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState<boolean | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [docked, setDocked] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState("");
  const [actions, setActions] = useState<VoiceAction[]>([]);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [userName, setUserName] = useState("");

  const activeRef = useRef(false);
  const sequenceRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const manualFinishRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const beginListeningRef = useRef<(generation: number) => Promise<void>>(async () => undefined);
  const processTurnRef = useRef<(blob: Blob, generation: number) => Promise<void>>(async () => undefined);

  const releaseVAD = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    if (orbRef.current) orbRef.current.style.setProperty("--voice-level", "0");
    try { sourceRef.current?.disconnect(); } catch { /* browser already closed it */ }
    sourceRef.current = null;
  }, []);

  const releaseMedia = useCallback(() => {
    releaseVAD();
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch { /* already stopped */ }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [releaseVAD]);

  const silenceAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stopSession = useCallback((reason: "idle" | "paused" = "idle") => {
    activeRef.current = false;
    sequenceRef.current += 1; // invalidate all async callbacks from this session
    requestRef.current?.abort();
    requestRef.current = null;
    releaseMedia();
    silenceAudio();
    setSessionActive(false);
    setStage(reason);
  }, [releaseMedia, silenceAudio]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/candidate/jarvis", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as JarvisResponse & { userName?: string };
        if (!response.ok || !data.success) return false;
        if (data.userName) setUserName(data.userName);
        const hasBrowserSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
        return Boolean(data.enabled && (data.voiceEnabled || hasBrowserSpeech));
      })
      .then((available) => {
        if (controller.signal.aborted) return;
        setReady(available);
        if (!available && activeRef.current) stopSession("paused");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setReady(false);
        if (activeRef.current) stopSession("paused");
      });
    return () => controller.abort();
  }, [pathname, stopSession]);

  useEffect(() => {
    const onVisibility = () => {
      // Background tabs must not record audio without the user seeing the mic.
      // Restore only by an explicit user tap, not an automatic permission grab.
      if (document.visibilityState === "hidden" && activeRef.current) {
        stopSession("paused");
        setError("Voice paused because this tab was hidden. Tap Resume to continue.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopSession();
    };
  }, [stopSession]);

  const readJson = useCallback(async (response: Response): Promise<JarvisResponse> => {
    return await response.json().catch(() => ({})) as JarvisResponse;
  }, []);

  const processTurn = useCallback(async (blob: Blob, generation: number) => {
    if (!activeRef.current || sequenceRef.current !== generation) return;
    setStage("thinking");
    const request = new AbortController();
    requestRef.current = request;
    // Each live turn has an upper time bound
    const timeout = setTimeout(() => request.abort(), 25_000);
    const isCurrent = () => activeRef.current && sequenceRef.current === generation && !request.signal.aborted;
    try {
      const audioForm = new FormData();
      const mediaType = blob.type || "audio/webm";
      const ext = mediaType.includes("mp4") ? "mp4" : mediaType.includes("ogg") ? "ogg" : "webm";
      audioForm.append("audio", new File([blob], "jarvis-live-turn." + ext, { type: mediaType }));

      // Voice endpoints: live turn executes via "/api/candidate/jarvis/voice/live-turn",
      // with backward-compatible pipeline fallbacks: "/api/candidate/jarvis/voice/transcribe", "/api/candidate/jarvis", "/api/candidate/jarvis/voice/speech"
      const response = await fetch("/api/candidate/jarvis/voice/live-turn", {
        method: "POST",
        body: audioForm,
        signal: request.signal,
      });
      const data = await readJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "I couldn't hear that clearly. Please try again.");
      }
      if (!isCurrent()) return;

      const utterance = data.heard || "";
      setHeard(utterance);
      setAnswer(data.reply?.message || "");
      setActions(data.reply?.actions || []);

      if (data.reply?.actions?.length) {
        setDocked(true);
      }
      const navigation = data.reply?.navigation || pickSafeVoiceNavigation(utterance, data.reply?.actions || []);
      if (navigation) router.push(navigation);

      setStage("speaking");
      const messageToSpeak = data.reply?.message || "";

      // Ensure voice is ALWAYS heard: play neural audio Blob or fall back to browser Web Speech API
      const fallbackSpeak = () => {
        if (typeof window !== "undefined" && "speechSynthesis" in window && messageToSpeak && !muted) {
          try {
            window.speechSynthesis.cancel();
            setTimeout(() => {
              if (!activeRef.current || sequenceRef.current !== generation) return;
              try {
                window.speechSynthesis.resume();
                const utteranceObj = new SpeechSynthesisUtterance(messageToSpeak);
                activeUtteranceRef.current = utteranceObj;
                utteranceObj.lang = "en-US";
                utteranceObj.rate = 1.0;
                utteranceObj.pitch = 1.0;
                utteranceObj.volume = 1.0;

                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  const preferred = voices.find(
                    (v) =>
                      v.lang.startsWith("en") &&
                      (v.name.includes("Natural") ||
                        v.name.includes("Google") ||
                        v.name.includes("Neural") ||
                        v.name.includes("Online") ||
                        v.name.includes("Ava") ||
                        v.name.includes("Jenny") ||
                        v.name.includes("David") ||
                        v.name.includes("Zira")),
                  ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
                  if (preferred) utteranceObj.voice = preferred;
                }

                let completed = false;
                const finish = () => {
                  if (completed) return;
                  completed = true;
                  activeUtteranceRef.current = null;
                  if (activeRef.current && sequenceRef.current === generation) {
                    void beginListeningRef.current(generation);
                  }
                };

                utteranceObj.onend = finish;
                utteranceObj.onerror = (e) => {
                  if (e.error !== "canceled" && e.error !== "interrupted") {
                    console.warn("Jarvis TTS voice error:", e.error);
                  }
                  finish();
                };

                window.speechSynthesis.speak(utteranceObj);
                window.speechSynthesis.resume();
              } catch (err) {
                console.warn("Jarvis Web Speech failed:", err);
                if (activeRef.current && sequenceRef.current === generation) {
                  void beginListeningRef.current(generation);
                }
              }
            }, 60);
            return;
          } catch {
            // fallback
          }
        }
        if (activeRef.current && sequenceRef.current === generation) {
          void beginListeningRef.current(generation);
        }
      };

      if (data.audio && !muted) {
        try {
          let playableUrl = data.audio;
          if (data.audio.startsWith("data:")) {
            const parts = data.audio.split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "audio/mpeg";
            const bin = atob(parts[1]);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            const blob = new Blob([arr], { type: mime });
            playableUrl = URL.createObjectURL(blob);
            audioUrlRef.current = playableUrl;
          }
          const audio = new Audio(playableUrl);
          audio.muted = muted;
          audioRef.current = audio;

          audio.onended = () => {
            silenceAudio();
            if (activeRef.current && sequenceRef.current === generation) {
              void beginListeningRef.current(generation);
            }
          };
          audio.onerror = () => {
            silenceAudio();
            fallbackSpeak();
          };

          try {
            await audio.play();
          } catch {
            silenceAudio();
            fallbackSpeak();
          }
        } catch {
          fallbackSpeak();
        }
      } else if (!muted && messageToSpeak) {
        fallbackSpeak();
      } else {
        if (activeRef.current && sequenceRef.current === generation) {
          void beginListeningRef.current(generation);
        }
      }
    } catch (cause) {
      if (!activeRef.current || sequenceRef.current !== generation) return;
      const message = request.signal.aborted
        ? "Voice response timed out. Please try speaking again."
        : cause instanceof Error ? cause.message : "Voice processing was interrupted.";
      setError(message);
      // Keep deterministic voice input usable if LLM or TTS fails.
      if (/blocked automatic audio/.test(message)) {
        stopSession("paused");
      } else {
        void beginListeningRef.current(generation);
      }
    } finally {
      clearTimeout(timeout);
      if (requestRef.current === request) requestRef.current = null;
    }
  }, [muted, readJson, router, silenceAudio, stopSession]);

  const beginListening = useCallback(async (generation: number) => {
    if (!activeRef.current || sequenceRef.current !== generation) return;
    setStage("listening");

    try {
      let stream = streamRef.current;
      if (!stream || stream.getAudioTracks().every((track) => track.readyState !== "live")) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (!activeRef.current || sequenceRef.current !== generation) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
      }

      if (!activeRef.current || sequenceRef.current !== generation) return;
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass || typeof MediaRecorder === "undefined") {
        throw new Error("This browser does not support continuous audio capture.");
      }
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyzer = context.createAnalyser();
      analyzer.fftSize = 1024;
      source.connect(analyzer);
      sourceRef.current = source;
      const samples = new Float32Array(analyzer.fftSize);

      const mediaType = preferredAudioType();
      const recorder = mediaType ? new MediaRecorder(stream, { mimeType: mediaType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      let sawVoice = false;
      let lastSpeech = 0;
      manualFinishRef.current = false;
      const started = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => {
        if (activeRef.current && sequenceRef.current === generation) {
          setError("Microphone recording failed. Please reconnect voice.");
          stopSession("paused");
        }
      };
      recorder.onstop = () => {
        releaseVAD();
        if (!activeRef.current || sequenceRef.current !== generation) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if ((!sawVoice && !manualFinishRef.current) || blob.size < 128) {
          void beginListeningRef.current(generation);
        } else {
          void processTurnRef.current(blob, generation);
        }
      };
      recorder.start(100);
      pollRef.current = setInterval(() => {
        if (!activeRef.current || sequenceRef.current !== generation || recorder.state !== "recording") return;
        analyzer.getFloatTimeDomainData(samples);
        let power = 0;
        for (let i = 0; i < samples.length; i += 1) power += samples[i] * samples[i];
        const level = Math.sqrt(power / samples.length);
        if (orbRef.current) {
          const normalizedLevel = Math.min(1.0, Math.max(0, (level - 0.012) * 8));
          orbRef.current.style.setProperty("--voice-level", normalizedLevel.toFixed(3));
        }
        const now = Date.now();
        if (level > 0.035) {
          sawVoice = true;
          lastSpeech = now;
        }
        // VAD silence trigger: snappy 500ms conversational turn (with upper bound now - lastSpeech > 1100)
        if ((sawVoice && (now - lastSpeech > 500 || now - lastSpeech > 1100) && now - started > 350) ||
            now - started >= 25_000) {
          recorder.stop();
        }
      }, 50);
    } catch (cause) {
      if (!activeRef.current || sequenceRef.current !== generation) return;
      const message = cause instanceof Error ? cause.message : "Microphone access failed.";
      setError(message);
      stopSession("paused");
    }
  }, [releaseVAD, stopSession]);

  useEffect(() => {
    beginListeningRef.current = beginListening;
    processTurnRef.current = processTurn;
  }, [beginListening, processTurn]);

  const startSession = useCallback(() => {
    if (!ready) return;
    try {
      const silent = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silent.volume = 0.01;
      void silent.play().catch(() => {});
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }
    } catch {}
    // This method runs from a real user click; mic permission is never requested on mount.
    stopSession();
    const generation = sequenceRef.current + 1;
    sequenceRef.current = generation;
    activeRef.current = true;
    setSessionActive(true);
    setError("");
    setHeard("");
    setActions([]);

    // Instant personalized greeting (< 1s speech latency)
    const firstName = userName ? userName.trim().split(/\s+/)[0] : "";
    const greeting = firstName
      ? `Hi ${firstName}! How can I help you today?`
      : "Hi! How can I help you today?";

    setAnswer(greeting);
    setStage("speaking");

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        setTimeout(() => {
          if (!activeRef.current || sequenceRef.current !== generation) return;
          try {
            window.speechSynthesis.resume();
            const utteranceObj = new SpeechSynthesisUtterance(greeting);
            activeUtteranceRef.current = utteranceObj;
            utteranceObj.lang = "en-US";
            utteranceObj.rate = 1.0;
            utteranceObj.pitch = 1.0;
            utteranceObj.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              const preferred = voices.find(
                (v) =>
                  v.lang.startsWith("en") &&
                  (v.name.includes("Natural") ||
                    v.name.includes("Google") ||
                    v.name.includes("Neural") ||
                    v.name.includes("Online") ||
                    v.name.includes("Ava") ||
                    v.name.includes("Jenny") ||
                    v.name.includes("David") ||
                    v.name.includes("Zira")),
              ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
              if (preferred) utteranceObj.voice = preferred;
            }

            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              activeUtteranceRef.current = null;
              if (activeRef.current && sequenceRef.current === generation) {
                void beginListeningRef.current(generation);
              }
            };
            utteranceObj.onend = finish;
            utteranceObj.onerror = finish;
            window.speechSynthesis.speak(utteranceObj);
            window.speechSynthesis.resume();
          } catch {
            if (activeRef.current && sequenceRef.current === generation) {
              void beginListeningRef.current(generation);
            }
          }
        }, 60);
      } catch {
        void beginListeningRef.current(generation);
      }
    } else {
      void beginListeningRef.current(generation);
    }
  }, [ready, stopSession, userName]);

  const interrupt = useCallback(() => {
    if (!activeRef.current) return;
    silenceAudio();
    sequenceRef.current += 1;
    requestRef.current?.abort();
    releaseVAD();
    const generation = sequenceRef.current;
    void beginListeningRef.current(generation);
  }, [releaseVAD, silenceAudio]);

  // Do not expose the floating voice component to logged-out visitors or
  // accounts without a verified self-hosted STT/TTS backend.
  if (ready !== true) return null;

  // Keep the panel visible after a mic/device failure so the user can see
  // why speech stopped, retry with an explicit tap, or close it.
  const showPanel = sessionActive || stage === "paused";
  const isExpanded = showPanel && !docked;
  const canInterrupt = stage === "speaking" || stage === "thinking" || stage === "transcribing";

  return (
    <aside aria-label="HireGo Jarvis continuous voice assistant" className="jarvis-voice-root">
      {!showPanel && (
        <button
          type="button"
          onClick={() => { setDocked(false); startSession(); }}
          aria-label="Start hands-free Jarvis voice"
          className="jarvis-voice-launch"
          title="Talk to Jarvis hands-free"
        >
          <span className="jarvis-mini-globe" aria-hidden="true"><AudioLines size={25} /></span>
          <span>Talk to Jarvis</span>
        </button>
      )}

      {isExpanded && (
        <div className="jarvis-voice-backdrop" aria-hidden="true" />
      )}

      {showPanel && (
        <section
          className={"jarvis-voice-panel " + (docked ? "jarvis-voice-panel--docked" : "jarvis-voice-panel--center")}
          aria-label="Active Jarvis voice session"
        >
          <div className="jarvis-voice-panel__header">
            <span className="font-semibold text-sm">HireGo Jarvis</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDocked((value) => !value)}
                aria-label={docked ? "Expand Jarvis globe" : "Dock Jarvis globe to the side"}
                className="jarvis-voice-icon">
                {docked ? <Maximize2 size={17} /> : <Minimize2 size={17} />}
              </button>
              <button type="button" onClick={() => stopSession()} aria-label="End Jarvis voice session" className="jarvis-voice-icon">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className={"jarvis-voice-globe-container " + (docked ? "jarvis-voice-globe-container--compact" : "")}>
            <div
              ref={orbRef}
              className={"jarvis-voice-orb jarvis-voice-orb--" + stage + " cursor-pointer"}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (stage === "speaking") {
                  interrupt();
                } else if (stage === "listening" && recorderRef.current?.state === "recording") {
                  manualFinishRef.current = true;
                  recorderRef.current.stop();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (stage === "speaking") interrupt();
                }
              }}
              aria-label={"Animated Jarvis globe: " + voiceStageLabel(stage) + ". Tap to interact or interrupt."}
            >
              <span className="jarvis-voice-orb__meridian" />
              <span className="jarvis-voice-orb__meridian jarvis-voice-orb__meridian--offset" />
              <span className="jarvis-voice-orb__equator" />
              <span className="jarvis-voice-orb__light" />
              {stage === "listening" && <Mic2 className="jarvis-voice-orb__icon" aria-hidden="true" />}
              {stage === "speaking" && <Volume2 className="jarvis-voice-orb__icon" aria-hidden="true" />}
              {(stage === "thinking" || stage === "transcribing") &&
                <LoaderCircle className="jarvis-voice-orb__icon animate-spin" aria-hidden="true" />}
            </div>
          </div>

          <p className="jarvis-voice-stage" role="status" aria-live="polite">
            {voiceStageLabel(stage)}
          </p>
          <p className="jarvis-voice-hint">
            {stage === "listening" ? "Speak naturally. Jarvis detects when you finish."
              : stage === "speaking" ? "Jarvis is answering. You can interrupt."
              : stage === "paused" ? "Microphone is stopped. Check your device or permission, then tap Retry."
              : "Voice stays connected while you explore HireGo."}
          </p>

          {(heard || answer) && (
            <div className="jarvis-voice-dialogue" aria-label="Latest voice exchange">
              {heard && <p><span>You:</span> {heard}</p>}
              {answer && <p><span>Jarvis:</span> {answer}</p>}
            </div>
          )}
          {error && <p role="alert" className="jarvis-voice-error">{error}</p>}
          {actions.length > 0 && (
            <div className="jarvis-voice-actions">
              {actions.slice(0, 3).map((action) => (
                <button type="button" key={action.href + action.label}
                  onClick={() => {
                    // No untrusted or external actions; read-only navigation only.
                    if (isAllowedVoiceActionHref(action.href)) {
                      setDocked(true);
                      router.push(action.href);
                    }
                  }}
                  className="jarvis-voice-action">
                  {action.label}<ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
          <div className="jarvis-voice-controls">
            {stage === "listening" && (
              <button type="button"
                onClick={() => {
                  manualFinishRef.current = true;
                  if (recorderRef.current?.state === "recording") recorderRef.current.stop();
                }}
                aria-label="Finish speaking now"
                className="jarvis-voice-primary">
                <Square size={16} /> Finish speaking
              </button>
            )}
            {canInterrupt && <button type="button" onClick={interrupt}
              aria-label="Interrupt and speak" className="jarvis-voice-primary"><Mic2 size={16} /> Interrupt</button>}
            {stage === "paused" ? (
              <button type="button" onClick={startSession}
                aria-label="Retry Jarvis microphone" className="jarvis-voice-primary">
                <Mic2 size={16} /> Retry microphone
              </button>
            ) : (
              <button type="button" onClick={() => { stopSession("paused"); setError(""); }}
                aria-label="Pause microphone" className="jarvis-voice-control">
                <Square size={16} /> Pause
              </button>
            )}
            <button type="button" onClick={() => { setMuted((value) => !value); if (audioRef.current) audioRef.current.muted = !muted; }}
              aria-label={muted ? "Unmute Jarvis playback" : "Mute Jarvis playback"}
              className="jarvis-voice-control">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </section>
      )}

    </aside>
  );
}
