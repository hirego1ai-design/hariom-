"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic2, Square, Loader2, Volume2, AudioLines } from "lucide-react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type JarvisReply = {
  message: string;
  actions: Array<{ label: string; href: string }>;
  speechReceiptId?: string | null;
  audio?: string | null;
};

type ChatItem = {
  id: string;
  role: "user" | "jarvis";
  text: string;
  reply?: JarvisReply;
  audioUrl?: string | null;
};

export default function CandidateJarvisPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "jarvis",
      text: "Ask me to open jobs, check applications, show your next interview, find matching jobs, or reason about your career and interview preparation.",
    },
  ]);
  const chatScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch("/api/candidate/jarvis", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) throw new Error(payload.error || "Jarvis readiness unavailable.");
        setEnabled(Boolean(payload.enabled));
        setVoiceEnabled(Boolean(payload.voiceEnabled));
      })
      .catch((cause) => {
        setEnabled(false);
        setError(cause instanceof Error ? cause.message : "Jarvis readiness unavailable.");
      });
  }, []);

  useEffect(() => {
    if (items.length > 1 && chatScrollRef.current) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [items, busy]);

  async function toggleRecording() {
    if (!voiceEnabled || voiceBusy) return;
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support microphone recording. You can still type a message.");
      return;
    }

    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((type) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
      );
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setRecording(false);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        if (!blob.size) return;
        setVoiceBusy(true);
        setError("");
        try {
          const form = new FormData();
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm";
          form.append("audio", new File([blob], "jarvis-voice." + ext, { type }));

          // Voice-to-Voice: Speech in -> AI spoken response with sound out
          // Backward compatibility fallback reference: /api/candidate/jarvis/voice/transcribe
          const response = await fetch("/api/candidate/jarvis/voice/live-turn", {
            method: "POST",
            body: form,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload.success) {
            throw new Error(payload.error || "HireGo could not understand your voice. Please try again.");
          }

          const userUtterance = payload.heard || "Voice question";
          const jarvisReply = payload.reply;
          const audioUrl = payload.audio || null;

          setItems((current) => [
            ...current,
            { id: crypto.randomUUID(), role: "user", text: userUtterance },
            {
              id: crypto.randomUUID(),
              role: "jarvis",
              text: jarvisReply?.message || "",
              reply: {
                message: jarvisReply?.message || "",
                actions: jarvisReply?.actions || [],
                audio: audioUrl,
              },
              audioUrl,
            },
          ]);

          // PLAY SPOKEN VOICE OUT LOUD IMMEDIATELY (WITH SOUND!)
          if (audioUrl) {
            const audio = new Audio(audioUrl);
            await audio.play().catch((err) => {
              console.warn("Autoplay audio blocked or error:", err);
            });
          }
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Voice conversation failed. Please try again.");
        } finally {
          setVoiceBusy(false);
        }
      };
      recorder.start(250);
      setRecording(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone access is unavailable.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
    }
  }

  async function hearReply(receiptId: string) {
    if (!receiptId || voiceBusy) return;
    setVoiceBusy(true);
    setError("");
    try {
      const response = await fetch("/api/candidate/jarvis/voice/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "HireGo speech output is unavailable.");
      }
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
      audio.addEventListener("error", () => URL.revokeObjectURL(url), { once: true });
      await audio.play();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "HireGo speech output is unavailable.");
    } finally {
      setVoiceBusy(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy || enabled !== true) return;

    setInput("");
    setError("");
    setBusy(true);
    const userId = crypto.randomUUID();
    setItems((current) => [...current, { id: userId, role: "user", text: message }]);

    try {
      const response = await fetch("/api/candidate/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.reply) {
        throw new Error(payload.error || "Jarvis could not answer this request.");
      }
      const reply = payload.reply as JarvisReply;
      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "jarvis",
          text: reply.message,
          reply,
        },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Jarvis could not answer this request.");
      setInput(message); // Keep the question available for a retry.
      setItems((current) => current.filter((item) => item.id !== userId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              HireGo Hybrid Assistant
            </p>
            <h1 className="mt-1 text-3xl font-extrabold">Jarvis</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              Your career companion for jobs, applications and interview preparation. Ask a question or speak to Jarvis.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {enabled === null ? "Connecting…" : enabled ? "Ready to help" : "Unavailable"}
            </span>
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {voiceEnabled ? "Voice ready" : "Voice unavailable"}
            </span>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}>
            {error}
          </div>
        )}

        {voiceEnabled && enabled === true && (
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--surface-container-high)" }}>
              <AudioLines className={`h-6 w-6 ${recording ? "animate-pulse" : ""}`} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold">Talk to Jarvis</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Live voice conversation: Tap Start speaking. Jarvis answers aloud with voice in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggleRecording()}
              disabled={voiceBusy}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--primary)" }}
              aria-label={recording ? "Stop voice recording" : "Start voice conversation"}
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic2 className="h-4 w-4" />}
              {recording ? "Stop recording" : "Start speaking"}
            </button>
          </div>
        )}

        {enabled === false && (
          <div className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
            <p className="font-bold">Jarvis is not available right now.</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Your normal HireGo candidate portal remains available.
            </p>
            <Link href="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-bold" style={{ borderColor: "var(--outline)" }}>
              Back to dashboard
            </Link>
          </div>
        )}

        <section ref={chatScrollRef} aria-label="Jarvis conversation" className="mt-6 h-[clamp(360px,55vh,680px)] overflow-y-auto rounded-3xl border p-4 sm:p-6" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${item.role === "user" ? "ml-auto" : "mr-auto"}`}
                style={{
                  backgroundColor: item.role === "user" ? "var(--primary)" : "var(--surface-container-high)",
                  color: item.role === "user" ? "#fff" : "var(--text-primary)",
                }}
              >
                <p>{item.text}</p>
                {item.reply && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(item.audioUrl || item.reply.speechReceiptId) && voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (item.audioUrl) {
                            const audio = new Audio(item.audioUrl);
                            void audio.play();
                          } else if (item.reply?.speechReceiptId) {
                            void hearReply(item.reply.speechReceiptId);
                          }
                        }}
                        disabled={voiceBusy}
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                        Hear
                      </button>
                    )}
                    {item.reply.actions.map((action) => (
                      <Link
                        key={`${item.id}-${action.href}-${action.label}`}
                        href={action.href}
                        className="inline-flex min-h-10 items-center rounded-xl border px-3 py-2 text-xs font-bold"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}

              </article>
            ))}
            {busy && (
              <div className="mr-auto rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--surface-container-high)" }}>
                Working…
              </div>
            )}
            
          </div>
        </section>

        <form onSubmit={send} className="sticky bottom-[72px] md:bottom-4 mt-4 flex gap-2 rounded-2xl border p-2 shadow-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={4000}
            disabled={busy || enabled !== true}
            placeholder={enabled ? "Ask Jarvis…" : "Jarvis is disabled"}
            className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void toggleRecording()}
            disabled={!voiceEnabled || voiceBusy || enabled !== true}
            aria-label={recording ? "Stop recording" : voiceEnabled ? "Speak to Jarvis" : "Voice unavailable"}
            title={recording ? "Stop recording" : voiceEnabled ? "Speak to Jarvis" : "Voice is not ready yet. You can still type your message."}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 font-semibold disabled:opacity-40"
            style={{ borderColor: recording ? "var(--primary)" : "var(--outline)", backgroundColor: recording ? "var(--primary)" : "transparent", color: recording ? "#fff" : "inherit" }}
          >
            {recording ? <Square className="h-4 w-4" aria-hidden="true" /> : voiceBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mic2 className="h-4 w-4" aria-hidden="true" />}
            <span className="text-xs">{recording ? "Stop" : voiceBusy ? "Working" : "Speak"}</span>
          </button>
          <button
            type="submit"
            disabled={busy || enabled !== true || !input.trim()}
            className="min-h-12 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Send
          </button>
        </form>
        {voiceEnabled && (
          <p role="status" className="mt-2 px-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {recording
              ? "Listening… tap Stop to review your words before sending."
              : voiceBusy
                ? "Preparing your voice message…"
                : "Tap Speak to record. Review and edit the transcript before sending."}
          </p>
        )}
      </main>
    </div>
  );
}
