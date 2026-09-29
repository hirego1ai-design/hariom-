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

const PAGE_SIZE = 25;

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
  if (!response.ok || data.success === false) throw new Error(data.error || "Request failed.");
  return data;
}

export default function RecordedQuestionBankPage() {
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retireTarget, setRetireTarget] = useState<Question | null>(null);
  const [retireReason, setRetireReason] = useState("");
  const [retiring, setRetiring] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function loadQuestions(nextPage = 1) {
    const roleTitle = role.trim();
    if (!roleTitle || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const params = new URLSearchParams({
        roleTitle,
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      const data = await readJson(
        await fetch(`/api/admin/recorded-assessment/questions?${params.toString()}`, {
          cache: "no-store",
        }),
      );
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(typeof data.page === "number" ? data.page : nextPage);
    } catch (cause) {
      setQuestions([]);
      setTotal(0);
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
            skillTags: form.skillTags.split(",").map((tag) => tag.trim()).filter(Boolean),
            reason: form.reason.trim(),
          }),
        }),
      );
      const created = data.question as Question;
      setForm(initialForm);
      setMessage(`Question published as version ${created.version} and recorded in the audit trail.`);

      if (role.trim().toLowerCase() === created.roleTitle.trim().toLowerCase()) {
        setQuestions((current) => [created, ...current].slice(0, PAGE_SIZE));
        setTotal((current) => current + 1);
        setPage(1);
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
        await fetch(`/api/admin/recorded-assessment/questions/${encodeURIComponent(retireTarget.id)}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reason: retireReason.trim(),
            expectedUpdatedAt: retireTarget.updatedAt,
          }),
        }),
      );

      setRetireTarget(null);
      setRetireReason("");
      setMessage("Question retired from future assessments. Existing frozen attempts are unchanged.");
      await loadQuestions(page);
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
          subtitle="Versioned curated screening questions with audited publication and retirement"
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {message}
            </p>
          )}

          <section className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#141418] p-5 sm:flex-row" aria-label="Find role question bank">
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role title, e.g. React Developer"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-white"
            />
            <button
              type="button"
              disabled={loading || !role.trim()}
              onClick={() => void loadQuestions(1)}
              className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-bold disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load role bank"}
            </button>
          </section>

          <form onSubmit={addQuestion} className="grid gap-4 rounded-3xl border border-white/10 bg-[#141418] p-5 sm:grid-cols-2">
            <input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={form.questionKey}
              onChange={(event) => setForm({ ...form, questionKey: event.target.value.toLowerCase().trim() })}
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
              maxLength={120}
              onChange={(event) => setForm({ ...form, industry: event.target.value })}
              placeholder="Industry (optional)"
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3"
            />
            <input
              value={form.department}
              maxLength={120}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              placeholder="Department (optional)"
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
              onChange={(event) => setForm({ ...form, answerDurationSeconds: Number(event.target.value) as 30 | 60 })}
              className="min-h-11 rounded-xl border border-white/10 bg-[#1A1A20] px-3"
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
                placeholder="Why is this question/version being published?"
                className="mt-1 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>
            <p className="flex min-h-11 items-center rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-slate-400">
              Version is assigned automatically. Difficulty is Basic screening.
            </p>
            <button
              disabled={saving}
              className="min-h-11 rounded-xl bg-primary px-6 font-bold text-white disabled:opacity-50 sm:col-span-2"
            >
              {saving ? "Publishing…" : "Publish audited question"}
            </button>
          </form>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#141418]" aria-label="Active curated questions">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <h2 className="font-bold">Active questions</h2>
                <p className="mt-1 text-xs text-slate-400">{total} active question{total === 1 ? "" : "s"} for the loaded role</p>
              </div>
              {total > PAGE_SIZE && <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>}
            </div>

            {loading ? (
              <div role="status" aria-live="polite" className="p-8 text-sm text-slate-400">Loading questions…</div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">No active questions are loaded for this role.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {questions.map((question) => (
                  <article key={question.id} className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-bold">{question.questionText}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {question.roleTitle} · {question.questionKey}
                          {question.skillTags.length ? ` · ${question.skillTags.join(" · ")}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{question.answerDurationSeconds}s · v{question.version}</span>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(retireTarget)}
                      onClick={() => {
                        setRetireReason("");
                        setRetireTarget(question);
                      }}
                      className="mt-3 min-h-10 rounded-xl border border-red-500/30 px-4 text-xs font-bold text-red-300 disabled:opacity-50"
                    >
                      Retire from future assessments
                    </button>
                  </article>
                ))}
              </div>
            )}

            {!loading && total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 p-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => void loadQuestions(Math.max(1, page - 1))}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => void loadQuestions(Math.min(totalPages, page + 1))}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {retireTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="retire-question-title" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl">
            <h2 id="retire-question-title" className="text-lg font-bold">Retire question version?</h2>
            <p className="mt-2 text-sm text-slate-400">
              This removes version {retireTarget.version} of {retireTarget.questionKey} from future selection. Existing frozen attempts remain unchanged.
            </p>
            <label className="mt-5 block text-xs text-slate-400">
              Retirement reason
              <textarea
                value={retireReason}
                onChange={(event) => setRetireReason(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Why should this question stop being selected?"
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
