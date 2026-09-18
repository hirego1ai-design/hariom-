"use client";

import { FormEvent, useState } from "react";

type Question = {
  id: string;
  questionKey: string;
  questionText: string;
  roleTitle: string;
  skillTags: string[];
  answerDurationSeconds: number;
  version: number;
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
};

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function RecordedQuestionBankPage() {
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retiringId, setRetiringId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadQuestions() {
    const roleTitle = role.trim();
    if (!roleTitle || loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await readJson(await fetch(`/api/admin/recorded-assessment/questions?roleTitle=${encodeURIComponent(roleTitle)}`, { cache: "no-store" }));
      setQuestions(data.questions || []);
    } catch (cause) {
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
      const data = await readJson(await fetch("/api/admin/recorded-assessment/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          industry: form.industry.trim() || null,
          department: form.department.trim() || null,
          skillTags: form.skillTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      }));
      setQuestions((current) => [data.question, ...current]);
      setForm(initialForm);
      setMessage(`Question published as version ${data.question.version}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to publish the question.");
    } finally {
      setSaving(false);
    }
  }

  async function retireQuestion(id: string) {
    if (retiringId) return;
    setRetiringId(id);
    setError("");
    setMessage("");
    try {
      await readJson(await fetch(`/api/admin/recorded-assessment/questions/${id}`, { method: "DELETE" }));
      setQuestions((current) => current.filter((question) => question.id !== id));
      setMessage("Question retired from future assessments. Existing frozen attempts are unchanged.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to retire the question.");
    } finally {
      setRetiringId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Recorded Assessment Question Bank</h1>
        <p className="mt-1 text-sm text-text-secondary">Curate basic screening questions by role, industry, department and skill. Live attempts use frozen snapshots.</p>
      </header>

      <section className="flex flex-wrap gap-3 rounded-3xl border border-outline bg-bg-card p-5" aria-label="Find role question bank">
        <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role title, e.g. React Developer" className="min-h-11 min-w-64 flex-1 rounded-xl border border-outline bg-bg-elevated px-3" />
        <button type="button" disabled={loading} onClick={() => void loadQuestions()} className="min-h-11 rounded-full border border-outline px-5 font-bold disabled:opacity-50">{loading ? "Loading…" : "Load role bank"}</button>
      </section>

      <form onSubmit={addQuestion} className="grid gap-4 rounded-3xl border border-outline bg-bg-card p-5 sm:grid-cols-2">
        <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.questionKey} onChange={(event) => setForm({ ...form, questionKey: event.target.value.toLowerCase().trim() })} placeholder="Stable key, e.g. react-hooks-basics" className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3" />
        <input required minLength={2} value={form.roleTitle} onChange={(event) => setForm({ ...form, roleTitle: event.target.value })} placeholder="Role title" className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3" />
        <input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} placeholder="Industry (optional)" className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3" />
        <input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Department (optional)" className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3" />
        <input value={form.skillTags} onChange={(event) => setForm({ ...form, skillTags: event.target.value })} placeholder="Skills, comma separated" className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3" />
        <select value={form.answerDurationSeconds} onChange={(event) => setForm({ ...form, answerDurationSeconds: Number(event.target.value) as 30 | 60 })} className="min-h-11 rounded-xl border border-outline bg-bg-elevated px-3"><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select>
        <textarea required minLength={8} value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} placeholder="Basic screening question" className="min-h-24 rounded-xl border border-outline bg-bg-elevated p-3 sm:col-span-2" />
        <p className="flex min-h-11 items-center rounded-xl border border-outline bg-bg-elevated px-3 text-sm text-text-secondary">Version is assigned automatically. Difficulty is Basic screening.</p>
        <button disabled={saving} className="min-h-11 rounded-full btn-3d-red px-6 font-bold disabled:opacity-50 sm:col-span-2">{saving ? "Publishing…" : "Publish curated question"}</button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-outline p-3 text-sm">{error}</p>}
      {message && <p role="status" className="text-sm">{message}</p>}

      <section className="space-y-3" aria-label="Active curated questions">
        {questions.map((question) => (
          <article key={question.id} className="rounded-2xl border border-outline bg-bg-card p-4">
            <div className="flex justify-between gap-3"><p className="font-bold">{question.questionText}</p><span className="text-xs text-text-secondary">{question.answerDurationSeconds}s · v{question.version}</span></div>
            <p className="mt-2 text-xs text-text-secondary">{question.roleTitle} · {question.questionKey}{question.skillTags.length ? ` · ${question.skillTags.join(" · ")}` : ""}</p>
            <button type="button" disabled={retiringId !== null} onClick={() => void retireQuestion(question.id)} className="mt-3 min-h-11 rounded-full border border-outline px-4 text-xs font-bold disabled:opacity-50">{retiringId === question.id ? "Retiring…" : "Retire from future assessments"}</button>
          </article>
        ))}
      </section>
    </main>
  );
}
