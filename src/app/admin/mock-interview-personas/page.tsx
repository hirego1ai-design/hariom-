"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type Persona = {
  id: string;
  key: string;
  roleFamily: string;
  displayName: string;
  voiceKey: string | null;
  tone: string;
  rubricVersion: string;
  isActive: boolean;
  sessionCount: number;
};

export default function MockInterviewPersonasAdminPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/mock-interview-personas", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not load interviewer personas.");
      }
      setPersonas(data.personas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load personas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function patchLocal(id: string, patch: Partial<Persona>) {
    setPersonas((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function save(persona: Persona) {
    if (reason.trim().length < 3) {
      setError("Enter a change reason before saving.");
      return;
    }
    setSavingId(persona.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/mock-interview-personas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          personaId: persona.id,
          displayName: persona.displayName,
          voiceKey: persona.voiceKey?.trim() || null,
          tone: persona.tone,
          rubricVersion: persona.rubricVersion,
          isActive: persona.isActive,
          reason: reason.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not save interviewer persona.");
      }
      setMessage(`${persona.displayName} updated.`);
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save persona.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white">
      <AdminSidebar />
      <div className="md:pl-[120px]">
        <AdminHeader />
        <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#4285F4]">
              Mock Interview
            </p>
            <h1 className="mt-2 text-2xl font-black">
              Interviewer personas & voices
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              Persona names and voice IDs are production configuration. Voice
              Mode stays unavailable for a persona until an approved TTS voice
              key and a mock-interview-tts route are configured.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#15151a] p-5">
            <label className="block text-xs font-bold text-text-muted">
              Change reason
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                placeholder="Why are you changing persona or voice configuration?"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white"
              />
            </label>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#15151a] p-8 text-sm text-text-muted">
              Loading interviewer configuration...
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {personas.map((persona) => (
                <article
                  key={persona.id}
                  className="space-y-4 rounded-2xl border border-white/10 bg-[#15151a] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#4285F4]">
                        {persona.roleFamily}
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {persona.key} · {persona.sessionCount} sessions
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted">
                      <input
                        type="checkbox"
                        checked={persona.isActive}
                        onChange={(event) =>
                          patchLocal(persona.id, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                      Active
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-text-muted">
                      Display name
                      <input
                        value={persona.displayName}
                        maxLength={80}
                        onChange={(event) =>
                          patchLocal(persona.id, {
                            displayName: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white"
                      />
                    </label>
                    <label className="text-xs text-text-muted">
                      TTS voice key
                      <input
                        value={persona.voiceKey ?? ""}
                        maxLength={160}
                        onChange={(event) =>
                          patchLocal(persona.id, {
                            voiceKey: event.target.value || null,
                          })
                        }
                        placeholder="Provider voice ID"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white"
                      />
                    </label>
                  </div>

                  <label className="block text-xs text-text-muted">
                    Tone
                    <textarea
                      value={persona.tone}
                      maxLength={500}
                      rows={3}
                      onChange={(event) =>
                        patchLocal(persona.id, { tone: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white"
                    />
                  </label>

                  <label className="block text-xs text-text-muted">
                    Rubric version
                    <input
                      value={persona.rubricVersion}
                      maxLength={80}
                      onChange={(event) =>
                        patchLocal(persona.id, {
                          rubricVersion: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-2.5 text-white"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                        persona.voiceKey
                          ? "border-emerald-500/20 text-emerald-300"
                          : "border-amber-500/20 text-amber-300"
                      }`}
                    >
                      {persona.voiceKey
                        ? "Voice ID configured"
                        : "Voice ID required"}
                    </span>
                    <button
                      type="button"
                      disabled={
                        savingId === persona.id || reason.trim().length < 3
                      }
                      onClick={() => void save(persona)}
                      className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-black disabled:opacity-40"
                    >
                      {savingId === persona.id ? "Saving..." : "Save persona"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
