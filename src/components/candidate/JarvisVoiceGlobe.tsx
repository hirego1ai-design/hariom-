"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AudioLines, Mic2, MicOff, Minimize2, Maximize2, Square, Volume2,
  VolumeX, LoaderCircle, X, ArrowUpRight,
} from "lucide-react";
import { pickSafeVoiceNavigation, type VoiceAction } from "@/lib/jarvis/JarvisVoiceNavigation";

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "paused" | "error";
type JarvisResponse = {
  success?: boolean;
  error?: string;
  transcript?: string;
  enabled?: boolean;
  voiceEnabled?: boolean;
  reply?: { message: string; actions: VoiceAction[]; speechReceiptId?: string | null };
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
  const [ready, setReady] = useState<boolean | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [docked, setDocked] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState("");
  const [actions, setActions] = useState<VoiceAction[]>([]);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);

  const activeRef = useRef(false);
  const sequenceRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const beginListeningRef = useRef<(generation: number) => Promise<void>>(async () => undefined);
  const processTurnRef = useRef<(blob: Blob, generation: number) => Promise<void>>(async () => undefined);

  const releaseVAD = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    try { sourceRef.current?.disconnect(); } catch { /* browser already closed it */ }
    sourceRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context) void context.close().catch(() => undefined);
  }, []);

  const releaseMedia = useCallback(() => {
    releaseVAD();
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
        const data = await response.json().catch(() => ({})) as JarvisResponse;
        if (!response.ok || !data.success) return false;
        return Boolean(data.enabled && data.voiceEnabled);
      })
      .then((available) => { if (!controller.signal.aborted) setReady(available); })
      .catch(() => { if (!controller.signal.aborted) setReady(false); });
    return () => controller.abort();
  }, []);

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
    setStage("transcribing");
    const request = new AbortController();
    requestRef.current = request;
    // Each inference call has an upper time bound; cancellation terminates the loop.
    const timeout = setTimeout(() => request.abort(), 75_000);
    const isCurrent = () => activeRef.current && sequenceRef.current === generation && !request.signal.aborted;
    try {
      const audioForm = new FormData();
      const mediaType = blob.type || "audio/webm";
      const ext = mediaType.includes("mp4") ? "mp4" : mediaType.includes("ogg") ? "ogg" : "webm";
      audioForm.append("audio", new File([blob], "jarvis-turn." + ext, { type: mediaType }));
      const transcriptResponse = await fetch("/api/candidate/jarvis/voice/transcribe", {
        method: "POST", body: audioForm, signal: request.signal,
      });
      const transcriptData = await readJson(transcriptResponse);
      if (!transcriptResponse.ok || !transcriptData.success || !transcriptData.transcript?.trim()) {
        throw new Error(transcriptData.error || "I couldn't hear that clearly. Please try again.");
      }
      if (!isCurrent()) return;
      const utterance = transcriptData.transcript.trim();
      setHeard(utterance);
      setStage("thinking");

      const replyResponse = await fetch("/api/candidate/jarvis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: utterance }),
        signal: request.signal,
      });
      const replyData = await readJson(replyResponse);
      if (!replyResponse.ok || !replyData.success || !replyData.reply) {
        throw new Error(replyData.error || "Jarvis could not complete that request.");
      }
      if (!isCurrent()) return;
      const reply = replyData.reply;
      setAnswer(reply.message);
      setActions(reply.actions || []);

      if (reply.actions?.length) {
        // Keep the microphone session alive while the actual portal does the work.
        setDocked(true);
      }
      const navigation = pickSafeVoiceNavigation(utterance, reply.actions || []);
      if (navigation) router.push(navigation);

      if (!reply.speechReceiptId) {
        setError("Spoken playback isn't ready. The response is shown below.");
        if (isCurrent()) void beginListeningRef.current(generation);
        return;
      }

      setStage("speaking");
      const speechResponse = await fetch("/api/candidate/jarvis/voice/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId: reply.speechReceiptId }),
        signal: request.signal,
      });
      if (!speechResponse.ok) {
        const problem = await readJson(speechResponse);
        throw new Error(problem.error || "Spoken response is temporarily unavailable.");
      }
      const voiceBlob = await speechResponse.blob();
      if (!isCurrent()) return;
      const url = URL.createObjectURL(voiceBlob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        silenceAudio();
        if (activeRef.current && sequenceRef.current === generation) {
          void beginListeningRef.current(generation);
        }
      };
      audio.onerror = () => {
        silenceAudio();
        setError("Couldn't play audio. You can read the response and continue.");
        if (activeRef.current && sequenceRef.current === generation) {
          void beginListeningRef.current(generation);
        }
      };
      try {
        await audio.play();
      } catch {
        silenceAudio();
        throw new Error("Your browser blocked automatic audio. Use Resume to continue.");
      }
    } catch (cause) {
      if (!isCurrent()) return;
      const message = cause instanceof Error ? cause.message : "Voice processing was interrupted.";
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
  }, [readJson, router, silenceAudio, stopSession]);

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
      const context = new AudioContextClass();
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
        if (!sawVoice || blob.size < 128) {
          void beginListeningRef.current(generation);
        } else {
          void processTurnRef.current(blob, generation);
        }
      };
      recorder.start(300);
      pollRef.current = setInterval(() => {
        if (!activeRef.current || sequenceRef.current !== generation || recorder.state !== "recording") return;
        analyzer.getFloatTimeDomainData(samples);
        let power = 0;
        for (let i = 0; i < samples.length; i += 1) power += samples[i] * samples[i];
        const level = Math.sqrt(power / samples.length);
        const now = Date.now();
        if (level > 0.038) {
          sawVoice = true;
          lastSpeech = now;
        }
        if ((sawVoice && now - lastSpeech > 1100 && now - started > 650) ||
            now - started >= 25_000) {
          recorder.stop();
        }
      }, 130);
    } catch (cause) {
      if (!activeRef.current || sequenceRef.current !== generation) return;
      const message = cause instanceof Error ? cause.message : "Microphone access failed.";
      setError(message);
      stopSession("paused");
    }
  }, [releaseVAD, stopSession]);

  beginListeningRef.current = beginListening;
  processTurnRef.current = processTurn;

  const startSession = useCallback(() => {
    if (!ready) return;
    // This method runs from a real user click; mic permission is never requested on mount.
    stopSession();
    const generation = sequenceRef.current;
    activeRef.current = true;
    setSessionActive(true);
    setError("");
    setStage("listening");
    void beginListeningRef.current(generation);
  }, [ready, stopSession]);

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

  const isExpanded = sessionActive && !docked;
  const canInterrupt = stage === "speaking" || stage === "thinking" || stage === "transcribing";

  return (
    <aside aria-label="HireGo Jarvis continuous voice assistant" className="jarvis-voice-root">
      {!sessionActive && (
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

      {sessionActive && isExpanded && (
        <div className="jarvis-voice-backdrop" aria-hidden="true" />
      )}

      {sessionActive && (
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
            <div className={"jarvis-voice-orb jarvis-voice-orb--" + stage} role="img"
              aria-label={"Animated Jarvis globe: " + voiceStageLabel(stage)}>
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
                    if (action.href.startsWith("/") && !action.href.startsWith("//")) {
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
            {canInterrupt && <button type="button" onClick={interrupt}
              aria-label="Interrupt and speak" className="jarvis-voice-primary"><Mic2 size={16} /> Interrupt</button>}
            <button type="button" onClick={() => { stopSession("paused"); setError(""); }}
              aria-label="Pause microphone" className="jarvis-voice-control">
              {muted ? <MicOff size={16} /> : <Square size={16} />} Pause
            </button>
            <button type="button" onClick={() => { setMuted((value) => !value); if (audioRef.current) audioRef.current.muted = !muted; }}
              aria-label={muted ? "Unmute Jarvis playback" : "Mute Jarvis playback"}
              className="jarvis-voice-control">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </section>
      )}

      {!sessionActive && stage === "paused" && (
        <button type="button" className="jarvis-voice-resume"
          onClick={() => { setDocked(true); startSession(); }}>
          Resume hands-free voice
        </button>
      )}
    </aside>
  );
}
