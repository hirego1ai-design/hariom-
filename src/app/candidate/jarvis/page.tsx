"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, Sparkles } from "lucide-react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type JarvisReply = {
  message: string;
  actions: Array<{ label: string; href: string }>;
};

type ChatItem = {
  id: string;
  role: "user" | "jarvis";
  text: string;
  reply?: JarvisReply;
};

export default function CandidateJarvisPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "jarvis",
      text: "Ask me to open jobs, check applications, show your next interview, find matching jobs, or help with your career and interview preparation.",
    },
  ]);
  const chatScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch("/api/candidate/jarvis", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Jarvis readiness unavailable.");
        }
        setEnabled(Boolean(payload.enabled));
      })
      .catch((cause) => {
        setEnabled(false);
        setError(cause instanceof Error ? cause.message : "Jarvis readiness unavailable.");
      });
  }, []);

  useEffect(() => {
    if (items.length > 1 && chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [items, busy]);

  const send = useCallback(async (event: FormEvent) => {
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
      setInput(message);
      setItems((current) => current.filter((item) => item.id !== userId));
    } finally {
      setBusy(false);
    }
  }, [busy, enabled, input]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              HireGo AI Assistant
            </p>
            <h1 className="mt-1 text-3xl font-extrabold flex items-center gap-2">
              Jarvis
              <Sparkles className="h-5 w-5" style={{ color: "var(--primary)" }} aria-hidden="true" />
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              Your career companion for jobs, applications and interview preparation. Type a message to get started.
            </p>
          </div>
          <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
            {enabled === null ? "Connecting…" : enabled ? "Ready to help" : "Unavailable"}
          </span>
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

        <section
          ref={chatScrollRef}
          aria-label="Jarvis conversation"
          className="mt-6 h-[clamp(360px,50vh,620px)] overflow-y-auto rounded-3xl border p-4 sm:p-6"
          style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
        >
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
                {item.reply?.actions?.length ? (
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
                ) : null}
              </article>
            ))}
            {busy && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--surface-container-high)" }}>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
            type="submit"
            disabled={busy || enabled !== true || !input.trim()}
            className="min-h-12 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-40 inline-flex items-center gap-2"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
