"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type JarvisReply = {
  path: "FAST" | "SMART" | "DEEP";
  message: string;
  actions: Array<{ label: string; href: string }>;
  model: null | { provider: string; model: string; taskType: string };
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
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
              Direct HireGo actions run without an LLM. Reasoning uses the Super Admin model routes with provider fallback.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {enabled === null ? "Checking…" : enabled ? "Hybrid online" : "Disabled"}
            </span>
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              Voice {voiceEnabled ? "enabled" : "off"}
            </span>
          </div>
        </header>

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
                  <p className="mt-2 text-[10px] opacity-60">
                    Path: {item.reply.path}
                    {item.reply.model ? ` · hybrid model route ${item.reply.model.taskType}` : " · no LLM"}
                  </p>
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
            onChange={(event) => setInput(event.target.value)}
            maxLength={4000}
            disabled={busy || enabled !== true}
            placeholder={enabled ? "Ask Jarvis…" : "Jarvis is disabled"}
            className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button
            type="button"
            disabled={!voiceEnabled}
            title={voiceEnabled ? "HireGo voice input" : "Voice stays off until the self-hosted Voice Engine is production-ready"}
            className="min-h-12 min-w-12 rounded-xl border disabled:opacity-40"
            style={{ borderColor: "var(--outline)" }}
          >
            <span className="material-symbols-outlined">mic</span>
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
