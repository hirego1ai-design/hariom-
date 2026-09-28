"use client";

import { FormEvent, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Question = {
  id: string;
  questionKey: string;
  questionText: string;
  roleTitle: string;
  skillTags: string[];
  answerDurationSeconds: number;
  version: number;
  updatedAt: string;
};

const initialForm = {
  questionKey: "",
  roleTitle: "",
  industry: "",
  department: "",
  skillTags: "",
  questionText: "",
  answerDurationSeconds: 30 as 30 | 60,
  difficulty: "BASIC" as const,
  reason: "",
};

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || "Request failed.");
  return data;
}

export default function RecordedQuestionBankPage() {
  const [role, setRole] = useState("");
  const [loadedRole, setLoadedRole] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retireTarget, setRetireTarget] = useState<Question | null>(null);
  const [retireReason, setRetireReason] = useState("");
  const [retiring, setRetiring] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadQuestions(nextRole = role) {
    const roleTitle = nextRole.trim();
    if (!roleTitle || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await readJson(
        await fetch(
          `/api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(roleTitle)}`,
          { cache: "no-store" },
        ),
      );
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setLoadedRole(roleTitle);
      setRole(roleTitle);
    } catch (cause) {
      setQuestions([]);
      setLoadedRole("");
      setError(cause instanceof Error ? cause.message : "Unable to load the question bank.");
    } finally {
      setLoading(false);
    }
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await readJson(
        await fetch("/api/admin/recorded-assessment/questions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...form,
            industry: form.industry.trim() || null,
            department: form.department.trim() || null,
            skillTags: form.skillTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            reason: form.reason.trim(),
          }),
        }),
      );

      const published = data.question as Question;
      setForm(initialForm);
      setMessage(`Question published as version ${published.version} and audit evidence recorded.`);

      if (loadedRole && loadedRole.toLowerCase() === published.roleTitle.toLowerCase()) {
        setQuestions((current) => [published, ...current]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to publish the question.");
    } finally {
      setSaving(false);
    }
  }

  async function retireQuestion() {
    if (!retireTarget || retiring || retireReason.trim().length < 3) return;
    setRetiring(true);
    setError("");
    setMessage("");
    try {
      await readJson(
        await fetch(
          `/api/admin/recorded-assessment/questions/${encodeURIComponent(retireTarget.id)}`,
          {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              reason: retireReason.trim(),
              expectedUpdatedAt: retireTarget.updatedAt,
            }),
          },
        ),
      );
      setQuestions((current) => current.filter((question) => question.id !== retireTarget.id));
      setMessage(
        "Question retired from future assessments. Existing frozen attempts remain unchanged.",
      );
      setRetireTarget(null);
      setRetireReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retire the question.");
    } finally {
      setRetiring(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Recorded Assessment Question Bank"
          subtitle="Curated, versioned screening questions used by future recorded-assessment sessions."
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          {error && (
            <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#141418] p-5" aria-labelledby="role-bank-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs text-slate-400">
                Role title
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. React Developer"
                  maxLength={120}
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white"
                />
              </label>
              <button
                type="button"
                disabled={loading || role.trim().length < 2}
                onClick={() => void loadQuestions()}
                className="min-h-11 rounded-xl border border-white/10 px-5 text-xs font-bold disabled:opacity-40"
              >
                {loading ? "Loading…" : "Load role bank"}
              </button>
            </div>
            <p id="role-bank-heading" className="mt-3 text-xs text-slate-500">
              Only active questions for the exact role are returned. Historical versions remain persisted for frozen attempts.
            </p>
          </section>

          <form onSubmit={addQuestion} className="grid gap-4 rounded-2xl border border-white/10 bg-[#141418] p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="font-bold">Publish curated question</h2>
              <p className="mt-1 text-xs text-slate-500">Publishing requires canonical skill tags and an audit reason.</p>
            </div>

            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={form.questionKey}
              onChange={(event) =>
                setForm({ ...form, questionKey: event.target.value.toLowerCase().trim() })
              }
              placeholder="Stable key, e.g. react-hooks-basics"
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <input
              required
              minLength={2}
              maxLength={120}
              value={form.roleTitle}
              onChange={(event) => setForm({ ...form, roleTitle: event.target.value })}
              placeholder="Role title"
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <input
              value={form.industry}
              onChange={(event) => setForm({ ...form, industry: event.target.value })}
              placeholder="Industry (optional)"
              maxLength={120}
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <input
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              placeholder="Department (optional)"
              maxLength={120}
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <input
              value={form.skillTags}
              onChange={(event) => setForm({ ...form, skillTags: event.target.value })}
              placeholder="Canonical skills, comma separated"
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <select
              value={form.answerDurationSeconds}
              onChange={(event) =>
                setForm({
                  ...form,
                  answerDurationSeconds: Number(event.target.value) as 30 | 60,
                })
              }
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
            </select>

            <textarea
              required
              minLength={8}
              maxLength={500}
              value={form.questionText}
              onChange={(event) => setForm({ ...form, questionText: event.target.value })}
              placeholder="Basic screening question"
              className="min-h-24 rounded-xl border border-white/10 bg-black/20 p-3 sm:col-span-2"
            />

            <label className="text-xs text-slate-400 sm:col-span-2">
              Publication reason
              <textarea
                required
                minLength={3}
                maxLength={500}
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                placeholder="Why is this question being added or replaced?"
                className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <p className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-400 sm:col-span-2">
              Version is assigned automatically. Difficulty is Basic screening. An active questionKey must be retired before a replacement version is published.
            </p>

            <button
              disabled={saving || form.reason.trim().length < 3}
              className="min-h-11 rounded-xl bg-primary px-6 font-bold text-white disabled:opacity-40 sm:col-span-2"
            >
              {saving ? "Publishing…" : "Publish curated question"}
            </button>
          </form>

          <section className="space-y-3" aria-label="Active curated questions">
            {loading ? (
              <div role="status" aria-live="polite" className="rounded-2xl border border-white/10 p-6 text-sm text-slate-400">
                Loading active role questions…
              </div>
            ) : !loadedRole ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                Load a role bank to review active questions.
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                No active curated questions exist for {loadedRole}.
              </div>
            ) : (
              questions.map((question) => (
                <article key={question.id} className="rounded-2xl border border-white/10 bg-[#141418] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold">{question.questionText}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {question.roleTitle} · {question.questionKey}
                        {question.skillTags.length ? ` · ${question.skillTags.join(" · ")}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {question.answerDurationSeconds}s · v{question.version}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRetireReason("");
                      setRetireTarget(question);
                    }}
                    className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-xs font-bold text-red-300"
                  >
                    Retire from future assessments
                  </button>
                </article>
              ))
            )}
          </section>
        </main>
      </div>

      {retireTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="retire-question-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="retire-question-title" className="text-lg font-bold">Retire question version?</h2>
            <p className="mt-2 text-sm text-slate-400">
              {retireTarget.questionKey} v{retireTarget.version} will stop being selected for future assessments. Existing frozen attempts are unchanged.
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Retirement reason
              <textarea
                value={retireReason}
                onChange={(event) => setRetireReason(event.target.value)}
                minLength={3}
                maxLength={500}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={retiring}
                onClick={() => {
                  setRetireTarget(null);
                  setRetireReason("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={retiring || retireReason.trim().length < 3}
                onClick={() => void retireQuestion()}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {retiring ? "Retiring…" : "Retire question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
