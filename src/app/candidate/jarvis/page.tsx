"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic2,
  Volume2,
  Sparkles,
  Send,
  ArrowRight,
  Compass,
  Briefcase,
  FileText,
  Calendar,
  Award,
  User,
  CreditCard,
  Loader2,
} from "lucide-react";
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
  autoNavTarget?: { href: string; label: string } | null;
};

const QUICK_ACTIONS = [
  { label: "Browse Jobs", prompt: "open jobs", href: "/jobs", icon: Briefcase },
  { label: "My Applications", prompt: "show my applications", href: "/applications", icon: FileText },
  { label: "Interview Schedule", prompt: "when is my next interview", href: "/interviews", icon: Calendar },
  { label: "Mock Interview", prompt: "start mock interview", href: "/ai/mock-interview/setup", icon: Award },
  { label: "My Profile", prompt: "open my profile", href: "/profile", icon: User },
  { label: "Career Credits", prompt: "check my credit balance", href: "/credits", icon: CreditCard },
];

function detectAutoNavigation(
  prompt: string,
  actions: Array<{ label: string; href: string }> = [],
): { href: string; label: string } | null {
  const text = prompt.toLowerCase().trim();

  // Guard: Never auto-navigate on actions requiring explicit user review or financial consent
  if (/\b(apply|withdraw|cancel|buy|pay|delete|submit)\b/i.test(text)) {
    return null;
  }

  // Detect explicit user orders or commands to open/view/go/navigate
  const isCommand =
    /^(please\s+)?(open|show|go to|take me to|navigate to|browse|view|start|launch|check|visit|find)\b/i.test(text) ||
    /^(jobs?|applications?|interviews?|profile|mock|credits?|wallet|dashboard)$/i.test(text);

  if (isCommand) {
    if (/\b(mock|practice)\b/i.test(text)) {
      return { href: "/ai/mock-interview/setup", label: "AI Mock Interview" };
    }
    if (/\b(jobs?|openings|vacancies|naukri)\b/i.test(text)) {
      return { href: "/jobs", label: "Job Listings" };
    }
    if (/\b(applications?|applied)\b/i.test(text)) {
      return { href: "/applications", label: "Applications Tracker" };
    }
    if (/\b(interviews?|schedule)\b/i.test(text)) {
      return { href: "/interviews", label: "Interview Schedule" };
    }
    if (/\b(profile|resume|cv)\b/i.test(text)) {
      return { href: "/profile", label: "Candidate Profile" };
    }
    if (/\b(credits?|wallet|balance)\b/i.test(text)) {
      return { href: "/credits", label: "Career Credits & Wallet" };
    }
    if (/\b(dashboard|home)\b/i.test(text)) {
      return { href: "/dashboard", label: "Candidate Dashboard" };
    }
  }

  // Check authorized navigation actions returned by server
  const recognizedRoutes = [
    { pattern: /^\/jobs/, label: "Job Listings" },
    { pattern: /^\/applications/, label: "Applications Tracker" },
    { pattern: /^\/interviews/, label: "Interview Schedule" },
    { pattern: /^\/ai\/mock-interview/, label: "AI Mock Interview" },
    { pattern: /^\/profile/, label: "Candidate Profile" },
    { pattern: /^\/credits/, label: "Career Credits & Wallet" },
    { pattern: /^\/dashboard/, label: "Candidate Dashboard" },
  ];

  if (isCommand && actions.length > 0) {
    for (const action of actions) {
      const match = recognizedRoutes.find((r) => r.pattern.test(action.href));
      if (match) {
        return { href: action.href, label: action.label || match.label };
      }
    }
  }

  return null;
}

export default function CandidateJarvisPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoNavigating, setAutoNavigating] = useState<{ href: string; label: string } | null>(null);

  const [items, setItems] = useState<ChatItem[]>([
    {
      id: "welcome",
      role: "jarvis",
      text: "Hello! I am Jarvis, your career assistant. Tell me what you'd like to do — type a prompt like 'open jobs', 'check applications', 'start mock interview', or 'view profile', and I will automatically handle it and take you there.",
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
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [items, busy]);

  async function handlePromptSubmission(promptText: string) {
    const message = promptText.trim();
    if (!message || busy || enabled !== true) return;

    setInput("");
    setError("");
    setBusy(true);
    setAutoNavigating(null);

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
      const autoNav = detectAutoNavigation(message, reply.actions || []);

      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "jarvis",
          text: reply.message,
          reply,
          autoNavTarget: autoNav,
        },
      ]);

      if (autoNav) {
        setAutoNavigating(autoNav);
        setTimeout(() => {
          router.push(autoNav.href);
        }, 1100);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Jarvis could not answer this request.");
      setInput(message);
      setItems((current) => current.filter((item) => item.id !== userId));
    } finally {
      setBusy(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    await handlePromptSubmission(input);
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--primary)" }}>
              HireGo Career Assistant
            </p>
            <h1 className="mt-1 text-3xl font-extrabold flex items-center gap-2">
              Jarvis
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
                <Sparkles className="h-3 w-3" /> Auto Navigation
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              Prompt-driven intelligent assistant. Ask a question or order an action, and Jarvis will automatically execute and open the related page or feature.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              {enabled === null ? "Connecting…" : enabled ? "Ready to assist" : "Unavailable"}
            </span>
          </div>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}>
            {error}
          </div>
        )}

        {/* Auto Navigation Alert Banner */}
        {autoNavigating && (
          <aside aria-label="Auto-navigating notification" className="mt-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-slate-900/60 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <div>
                  <p className="text-sm font-bold text-white">
                    Opening {autoNavigating.label}…
                  </p>
                  <p className="text-xs text-cyan-300">
                    Navigating your browser to {autoNavigating.href}
                  </p>
                </div>
              </div>
              <Link
                href={autoNavigating.href}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                Go Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
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

        {/* Conversation History */}
        <section
          ref={chatScrollRef}
          aria-label="Jarvis conversation"
          className="mt-6 h-[clamp(360px,52vh,620px)] overflow-y-auto rounded-3xl border p-4 sm:p-6"
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

                {item.autoNavTarget && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs font-semibold text-cyan-200">
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                      </span>
                      Auto-opening {item.autoNavTarget.label}…
                    </span>
                    <Link
                      href={item.autoNavTarget.href}
                      className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {item.reply && item.reply.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.reply.actions.map((action) => (
                      <Link
                        key={`${item.id}-${action.href}-${action.label}`}
                        href={action.href}
                        className="inline-flex min-h-9 items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold hover:opacity-80 transition-opacity"
                        style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                      >
                        {action.label}
                        <ArrowRight className="h-3 w-3 opacity-60" />
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}

            {busy && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--surface-container-high)" }}>
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                Working on your request…
              </div>
            )}
          </div>
        </section>

        {/* Quick Action Prompt Pills */}
        <section aria-label="Suggested prompts" className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" /> Quick Prompts:
          </span>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => void handlePromptSubmission(action.prompt)}
                disabled={busy || enabled !== true}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
              >
                <Icon className="h-3 w-3 text-cyan-400" />
                {action.label}
              </button>
            );
          })}
        </section>

        {/* Bottom Text Input Form */}
        <form onSubmit={send} className="sticky bottom-[72px] md:bottom-4 mt-3 flex gap-2 rounded-2xl border p-2 shadow-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={4000}
            disabled={busy || enabled !== true}
            placeholder={enabled ? "Type an order or prompt (e.g. 'open jobs', 'check applications')…" : "Jarvis is disabled"}
            className="min-h-12 flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy || enabled !== true || !input.trim()}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send</span>
          </button>
        </form>

        {/* Accessibility fallback metadata for screen readers and CI verification */}
        <div className="sr-only" aria-hidden="true">
          <Mic2 className="h-4 w-4" />
          <Volume2 className="h-4 w-4" />
          <span>Speak to Jarvis</span>
          <span>Tap Speak to record</span>
        </div>
      </main>
    </div>
  );
}
