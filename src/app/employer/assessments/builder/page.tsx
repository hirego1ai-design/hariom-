"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

type Assessment = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number;
  passingPercentage: number;
  isActive: boolean;
  scope: string;
  roleTitle?: string | null;
  authoringProvider?: string | null;
  authoringModel?: string | null;
  authoringVersion?: string | null;
  authoringSource?: string | null;
  jobListingId: string | null;
  jobListing?: { title: string; department: string | null } | null;
  _count?: { questions: number };
};

type Option = {
  id: string;
  optionText: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  questionText: string;
  explanation: string | null;
  points: number;
  difficulty: string;
  category: string | null;
  skillTags: string[];
  options: Option[];
};

type AssessmentPage = {
  success: boolean;
  assessments?: Assessment[];
  pagination?: { nextCursor: string | null; hasMore: boolean };
  error?: string;
};

export default function AssessmentCenterPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadAssessments = useCallback(async (cursor: string | null) => {
    const params = new URLSearchParams({ limit: "50" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/employer/assessments?${params.toString()}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({})) as AssessmentPage;
    if (!response.ok || !body.success) {
      throw new Error(body.error || "Unable to load assessments.");
    }
    return {
      assessments: Array.isArray(body.assessments) ? body.assessments : [],
      nextCursor: body.pagination?.nextCursor ?? null,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAssessments(null)
      .then((page) => {
        if (cancelled) return;
        setAssessments(page.assessments);
        setNextCursor(page.nextCursor);
        setSelectedId((current) => current || page.assessments[0]?.id || "");
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load assessments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadAssessments]);

  useEffect(() => {
    if (!selectedId) {
      setQuestions([]);
      return;
    }
    const controller = new AbortController();
    setQuestionsLoading(true);
    setError("");
    fetch(`/api/employer/assessments/${encodeURIComponent(selectedId)}/questions`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to load assessment questions.");
        return Array.isArray(body.questions) ? body.questions as Question[] : [];
      })
      .then((items) => setQuestions(items))
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setQuestions([]);
        setError(cause instanceof Error ? cause.message : "Unable to load assessment questions.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuestionsLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  const selected = assessments.find((assessment) => assessment.id === selectedId) || null;

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await loadAssessments(nextCursor);
      setAssessments((current) => {
        const seen = new Set(current.map((assessment) => assessment.id));
        return [...current, ...page.assessments.filter((assessment) => !seen.has(assessment.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load more assessments.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Assessment evidence</p>
            <h1 className="mt-2 text-3xl font-bold text-text-primary">Assessment Center</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-secondary">
              Job-specific assessments are generated automatically from the job role and approved skills when the employer enables assessment during job creation. Question count, scoring policy and authoring provenance are controlled by HireGo.
            </p>
          </div>
          <Link
            href="/employer/create-job-matching-config"
            className="inline-flex min-h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary"
          >
            Configure assessment on a job
          </Link>
        </header>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-outline bg-bg-card p-8 text-sm text-text-secondary">Loading assessments…</div>
        ) : assessments.length === 0 ? (
          <div className="rounded-2xl border border-outline bg-bg-card p-10 text-center">
            <h2 className="font-bold text-text-primary">No job-specific assessments yet</h2>
            <p className="mt-2 text-sm text-text-secondary">Enable the additional job-specific assessment while creating a job. HireGo will generate and validate it before the job is published.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-outline bg-bg-card p-3 lg:sticky lg:top-24 lg:self-start">
              <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                {assessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => setSelectedId(assessment.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedId === assessment.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-outline bg-bg-elevated hover:border-white/20"
                    }`}
                  >
                    <p className="truncate text-sm font-bold text-text-primary">{assessment.title}</p>
                    <p className="mt-1 truncate text-xs text-text-secondary">{assessment.jobListing?.title || "Unlinked legacy assessment"}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                      <span>{assessment._count?.questions ?? 0} questions</span>
                      <span>{assessment.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </button>
                ))}
              </div>
              {nextCursor && (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="mt-3 min-h-10 w-full rounded-xl border border-outline px-4 text-xs font-bold text-text-primary disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </aside>

            {selected && (
              <main className="space-y-5">
                <section className="rounded-2xl border border-outline bg-bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">{selected.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {selected.jobListing?.title || selected.roleTitle || "Assessment record"}
                        {selected.jobListing?.department ? ` · ${selected.jobListing.department}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      selected.isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-outline text-text-secondary"
                    }`}>
                      {selected.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-outline bg-bg-elevated p-3"><p className="text-[10px] uppercase tracking-wider text-text-muted">Duration</p><p className="mt-1 font-bold text-text-primary">{selected.durationMinutes} min</p></div>
                    <div className="rounded-xl border border-outline bg-bg-elevated p-3"><p className="text-[10px] uppercase tracking-wider text-text-muted">Passing policy</p><p className="mt-1 font-bold text-text-primary">{selected.passingPercentage}%</p></div>
                    <div className="rounded-xl border border-outline bg-bg-elevated p-3"><p className="text-[10px] uppercase tracking-wider text-text-muted">Scope</p><p className="mt-1 font-bold text-text-primary">{selected.scope.replaceAll("_", " ")}</p></div>
                    <div className="rounded-xl border border-outline bg-bg-elevated p-3"><p className="text-[10px] uppercase tracking-wider text-text-muted">Questions</p><p className="mt-1 font-bold text-text-primary">{selected._count?.questions ?? questions.length}</p></div>
                  </div>

                  <div className="mt-4 rounded-xl border border-outline bg-bg-elevated p-4 text-xs text-text-secondary">
                    <p className="font-bold text-text-primary">Authoring provenance</p>
                    <p className="mt-2">
                      Source: {selected.authoringSource || "Legacy / not recorded"}
                      {selected.authoringProvider ? ` · Provider: ${selected.authoringProvider}` : ""}
                      {selected.authoringModel ? ` · Model: ${selected.authoringModel}` : ""}
                      {selected.authoringVersion ? ` · Version: ${selected.authoringVersion}` : ""}
                    </p>
                    {selected.authoringSource !== "AI_GENERATED" && (
                      <p className="mt-2 text-amber-200">This is a legacy/non-generated record. Employer editing remains disabled; new job-specific assessments use the automatic policy.</p>
                    )}
                  </div>

                  {selected.description && <p className="mt-4 text-sm text-text-secondary">{selected.description}</p>}
                </section>

                <section className="rounded-2xl border border-outline bg-bg-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-text-primary">Persisted questions</h3>
                      <p className="mt-1 text-xs text-text-secondary">Read-only review of the generated assessment evidence.</p>
                    </div>
                  </div>

                  {questionsLoading ? (
                    <p className="text-sm text-text-secondary">Loading questions…</p>
                  ) : questions.length === 0 ? (
                    <p className="rounded-xl border border-outline bg-bg-elevated p-5 text-sm text-text-secondary">No persisted questions were found for this assessment.</p>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <article key={question.id} className="rounded-xl border border-outline bg-bg-elevated p-4">
                          <div className="flex gap-3">
                            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-text-primary">{question.questionText}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-text-secondary">
                                <span className="rounded-full border border-outline px-2 py-1">{question.difficulty}</span>
                                <span className="rounded-full border border-outline px-2 py-1">{question.points} point{question.points === 1 ? "" : "s"}</span>
                                {(question.skillTags?.length ? question.skillTags : question.category ? [question.category] : []).map((skill) => (
                                  <span key={skill} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-primary">{skill}</span>
                                ))}
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {question.options.map((option) => (
                                  <div key={option.id} className={`rounded-lg border p-3 text-sm ${
                                    option.isCorrect
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                      : "border-outline text-text-secondary"
                                  }`}>
                                    {option.optionText}{option.isCorrect ? " · correct" : ""}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && <p className="mt-3 text-xs text-text-secondary">{question.explanation}</p>}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </main>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
