"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type JarvisReply = {
  path: "FAST" | "SMART" | "DEEP";
  message: string;
  actions: Array<{ label: string; href: string }>;
  model: null | { provider: string; model: string; taskType: string };
  speechReceiptId?: string | null;
};

type ChatItem = {
  id: string;
  role: "user" | "jarvis";
  text: string;
  reply?: JarvisReply;
};

export default function CandidateJarvisPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [transcriptReady, setTranscriptReady] = useState(false);
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
  const endRef = useRef<HTMLDivElement | null>(null);

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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, busy]);

  async function toggleRecording() {
    if (!voiceEnabled || voiceBusy || busy || enabled !== true) return;
    if (recording) {
      recorderRef.current?.stop();
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
        try {
          const form = new FormData();
          form.append("audio", new File([blob], "jarvis-voice.webm", { type }));
          const response = await fetch("/api/candidate/jarvis/voice/transcribe", {
            method: "POST",
            body: form,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload.success || typeof payload.transcript !== "string") {
            throw new Error(payload.error || "HireGo could not transcribe this recording.");
          }
          setInput(payload.transcript);
          setTranscriptReady(true);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "HireGo could not transcribe this recording.");
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
    setTranscriptReady(false);
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
      // Only play a server-receipt-backed response to a user who chose voice.
      // The Hear control remains available if browser autoplay is blocked.
      if (voiceMode && voiceEnabled && reply.speechReceiptId) {
        void hearReply(reply.speechReceiptId);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Jarvis could not answer this request.");
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
              Explore jobs, check applications and practise interviews. Type a message or talk to Jarvis.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {enabled === null ? "Connecting…" : enabled ? "Jarvis ready" : "Unavailable"}
            </span>
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {voiceEnabled ? "Voice ready" : "Voice not connected"}
            </span>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border p-4 sm:p-5" aria-label="Jarvis voice conversation" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ color: "var(--primary)" }}>graphic_eq</span>
                Voice conversation
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Record your question, review what was heard, then send. Play Jarvis&apos;s answer when available.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceMode((current) => !current)}
              aria-pressed={voiceMode}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"
              style={{ borderColor: voiceMode ? "var(--primary)" : "var(--outline)", backgroundColor: voiceMode ? "var(--surface-container-high)" : "transparent" }}
            >
              <span className="material-symbols-outlined text-[19px]" aria-hidden="true">{voiceMode ? "keyboard" : "mic"}</span>
              {voiceMode ? "Text view" : "Use voice"}
            </button>
          </div>
          {voiceMode && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border p-5 text-center" style={{ borderColor: "var(--outline)", backgroundColor: "var(--surface-container-high)" }}>
              <button
                type="button"
                onClick={() => void toggleRecording()}
                disabled={!voiceEnabled || voiceBusy || busy || enabled !== true}
                aria-label={recording ? "Stop voice recording" : "Start voice recording"}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 text-white shadow-lg transition-transform enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--primary)", backgroundColor: recording ? "#b91c1c" : "var(--primary)" }}
              >
                <span className="material-symbols-outlined text-[30px]" aria-hidden="true">{recording ? "stop" : "mic"}</span>
              </button>
              <p className="text-sm font-semibold" aria-live="polite">
                {!voiceEnabled ? "Voice connection is not ready. You can still use text chat." :
                  voiceBusy ? "Preparing your words…" :
                  recording ? "Listening… tap again to finish" :
                  transcriptReady ? "Review your words in the message box, then press Send." :
                  "Tap the microphone to speak"}
              </p>
              {voiceEnabled && <p className="text-xs" style={{ color: "var(--text-muted)" }}>We show your transcript before sending; nothing is sent until you confirm.</p>}
            </div>
          )}
        </section>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}>
            {error}
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

        <section className="mt-6 min-h-[55vh] rounded-3xl border p-4 sm:p-6" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
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
                    {item.reply.speechReceiptId && voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => void hearReply(item.reply!.speechReceiptId!)}
                        disabled={voiceBusy}
                        className="inline-flex min-h-10 items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
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
                {item.reply && (
                  <details className="mt-2 text-[10px] opacity-60"><summary className="cursor-pointer">Response details</summary><p>
                    Path: {item.reply.path}
                    {item.reply.model ? ` · hybrid model route ${item.reply.model.taskType}` : " · no LLM"}
                  </p></details>
                )}
              </article>
            ))}
            {busy && (
              <div className="mr-auto rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--surface-container-high)" }}>
                Working…
              </div>
            )}
            <div ref={endRef} />
          </div>
        </section>

        <form onSubmit={send} className="sticky bottom-[72px] md:bottom-4 mt-4 flex gap-2 rounded-2xl border p-2 shadow-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <input
            value={input}
            onChange={(event) => { setInput(event.target.value); setTranscriptReady(false); }}
            maxLength={4000}
            disabled={busy || enabled !== true}
            placeholder={enabled ? "Ask Jarvis…" : "Jarvis is disabled"}
            className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void toggleRecording()}
            disabled={!voiceEnabled || voiceBusy}
            aria-label={recording ? "Stop recording" : "Record a voice message"}
            title={voiceEnabled ? (recording ? "Stop recording" : "Record a voice message") : "Voice connection is not ready"}
            className="min-h-12 min-w-12 rounded-xl border disabled:opacity-40"
            style={{ borderColor: recording ? "var(--primary)" : "var(--outline)", backgroundColor: recording ? "var(--primary)" : "transparent", color: recording ? "#fff" : "inherit" }}
          >
            <span className="material-symbols-outlined">{recording ? "stop" : voiceBusy ? "hourglass_top" : "mic"}</span>
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
      </main>
    </div>
  );
}
