"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type ProctoringEvent = {
  id: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "HIGH";
  warningNumber: number | null;
  createdAt: string;
};

type AssessmentResponse = {
  id: string;
  durationSeconds: number;
  mediaType: "AUDIO" | "VIDEO";
  transcript: string | null;
  analysisStatus: string;
  analysisResult: unknown;
  mediaUrl: string;
  storedFile: null | { mimeType: string };
};

type AttemptQuestion = {
  id: string;
  questionText: string;
  answerDurationSeconds: number;
  response: AssessmentResponse | null;
};

type Attempt = {
  id: string;
  status: string;
  mediaType: "AUDIO" | "VIDEO";
  createdAt: string;
  candidateProfile: { user: { name: string; email: string } };
  proctoringEvents: ProctoringEvent[];
  questions: AttemptQuestion[];
};

function EvidenceSummary({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return null;
  const result = value as {
    signals?: Array<{ type?: string; confidence?: number; detail?: string }>;
    metrics?: Record<string, number>;
  };
  const signals = Array.isArray(result.signals) ? result.signals : [];
  const metrics = result.metrics && typeof result.metrics === "object"
    ? Object.entries(result.metrics)
    : [];
  if (!signals.length && !metrics.length) return null;

  return (
    <div className="rounded-xl border border-outline p-3 space-y-2">
      <p className="text-xs font-bold">Automated analysis evidence</p>
      {signals.map((signal, index) => (
        <p key={index} className="text-xs text-text-secondary">
          {signal.type || "Signal"}
          {typeof signal.confidence === "number" ? ` · ${Math.round(signal.confidence * 100)}% model confidence` : ""}
          {signal.detail ? ` · ${signal.detail}` : ""}
        </p>
      ))}
      {metrics.length > 0 && (
        <p className="text-xs text-text-secondary">
          {metrics.map(([key, metric]) => `${key}: ${metric}`).join(" · ")}
        </p>
      )}
      <p className="text-xs text-text-secondary">Automated signals support review; they do not determine selection, rejection, or misconduct.</p>
    </div>
  );
}

function ResponseMedia({ response }: { response: AssessmentResponse }) {
  if (!response.storedFile) return <p className="text-xs text-text-secondary">Media is unavailable.</p>;
  const common = {
    controls: true,
    preload: "metadata" as const,
    src: response.mediaUrl,
    className: "w-full max-w-xl rounded-xl",
  };
  return response.mediaType === "AUDIO" ? <audio {...common} /> : <video {...common} />;
}

export default function RecordedAssessmentReviewPage() {
  const params = useSearchParams();
  const jobId = params.get("jobId") || "";
  const [items, setItems] = useState<Attempt[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(jobId));
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchPage(cursor: string | null, signal?: AbortSignal) {
    const query = new URLSearchParams({ limit: "25" });
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(
      `/api/employer/jobs/${encodeURIComponent(jobId)}/recorded-assessment/attempts?${query.toString()}`,
      { cache: "no-store", signal },
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.success) throw new Error(body.error || "Unable to load assessments.");
    return {
      attempts: Array.isArray(body.attempts) ? body.attempts as Attempt[] : [],
      nextCursor: body.pagination?.nextCursor ?? null,
    };
  }

  useEffect(() => {
    if (!jobId) {
      setItems([]);
      setNextCursor(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchPage(null, controller.signal)
      .then((page) => {
        setItems(page.attempts);
        setNextCursor(page.nextCursor);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Unable to load assessments.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [jobId]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await fetchPage(nextCursor);
      setItems((current) => {
        const seen = new Set(current.map((attempt) => attempt.id));
        return [...current, ...page.attempts.filter((attempt) => !seen.has(attempt.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load more assessments.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (!jobId) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Choose a job first</h1>
          <p className="mt-3 text-sm text-text-secondary">Recorded assessment evidence is job-scoped. Open a job and then review its candidate attempts.</p>
          <Link href="/employer/job-listings-management" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-outline px-5 text-sm font-bold text-text-primary">
            Open job listings
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recorded Assessment Review</h1>
          <p className="text-sm text-text-secondary mt-1">Review candidate answers, transcripts and observable proctoring evidence. Hiring and misconduct decisions remain human decisions.</p>
        </div>

        {loading && <div className="rounded-2xl border border-outline bg-bg-card p-6">Loading assessments…</div>}
        {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">{error}</div>}
        {!loading && !error && items.length === 0 && <div className="rounded-2xl border border-outline bg-bg-card p-6">No recorded assessment attempts for this job yet.</div>}

        <div className="space-y-5">
          {items.map((attempt) => (
            <article key={attempt.id} className="rounded-3xl border border-outline bg-bg-card p-5 space-y-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-text-primary">{attempt.candidateProfile.user.name}</h2>
                  <p className="text-xs text-text-secondary">{attempt.candidateProfile.user.email}</p>
                </div>
                <div className="text-xs text-text-secondary">{attempt.status} · {attempt.mediaType} · {attempt.proctoringEvents.length} observed events</div>
              </div>

              <div className="space-y-4">
                {attempt.questions.map((question, index) => (
                  <section key={question.id} className="rounded-2xl bg-bg-elevated p-4 space-y-3">
                    <p className="text-xs font-bold">Question {index + 1}</p>
                    <p className="text-sm">{question.questionText}</p>
                    {question.response ? (
                      <>
                        <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                          <span>{question.response.durationSeconds}s recorded</span>
                          <span>Analysis: {question.response.analysisStatus}</span>
                        </div>
                        <ResponseMedia response={question.response} />
                        {question.response.transcript && (
                          <div>
                            <p className="text-xs font-bold mb-1">Transcript</p>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{question.response.transcript}</p>
                          </div>
                        )}
                        <EvidenceSummary value={question.response.analysisResult} />
                      </>
                    ) : (
                      <p className="text-xs text-text-secondary">No response saved.</p>
                    )}
                  </section>
                ))}
              </div>

              {attempt.proctoringEvents.length > 0 && (
                <details className="rounded-2xl border border-outline p-4">
                  <summary className="cursor-pointer font-bold text-sm">Proctoring evidence ({attempt.proctoringEvents.length})</summary>
                  <div className="mt-3 space-y-2">
                    {attempt.proctoringEvents.map((event) => (
                      <div key={event.id} className="text-xs text-text-secondary">
                        {event.eventType.replaceAll("_", " ")} · {event.severity}
                        {event.warningNumber ? ` · warning ${event.warningNumber}/3` : ""}
                        {" · "}{new Date(event.createdAt).toLocaleString()}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-text-secondary">These are observable device/browser events, not a finding of cheating.</p>
                </details>
              )}
            </article>
          ))}
        </div>

        {nextCursor && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="min-h-11 rounded-xl border border-outline px-5 text-sm font-bold text-text-primary disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more attempts"}
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
