"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Candidate = {
  id: string;
  applicationId: string;
  name: string;
  matchScore: number | null;
  experience: string;
  stage: string;
  currentRole: string;
  appliedJob: string;
  currentLocation: string;
  applicationDate: string;
  lastActivity: string;
  availability: string;
  jobReady: boolean;
};

type CandidatePage = {
  success: boolean;
  candidates?: Candidate[];
  pagination?: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  error?: string;
};

const PAGE_SIZE = 50;

export default function CandidateUserManagementPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadCandidates = useCallback(async (
    search: string,
    cursor: string | null,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    const normalizedSearch = search.trim();
    if (normalizedSearch) params.set("q", normalizedSearch);
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`/api/employer/candidates?${params.toString()}`, {
      cache: "no-store",
      signal,
    });
    const payload = await response.json().catch(() => ({})) as CandidatePage;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Unable to load candidates.");
    }

    return {
      candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
      nextCursor: payload.pagination?.nextCursor ?? null,
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      loadCandidates(query, null, controller.signal)
        .then((page) => {
          setCandidates(page.candidates);
          setNextCursor(page.nextCursor);
        })
        .catch((reason) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          setCandidates([]);
          setNextCursor(null);
          setError(reason instanceof Error ? reason.message : "Unable to load candidates.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCandidates, query]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await loadCandidates(query, nextCursor);
      setCandidates((current) => {
        const seen = new Set(current.map((candidate) => candidate.applicationId));
        return [...current, ...page.candidates.filter((candidate) => !seen.has(candidate.applicationId))];
      });
      setNextCursor(page.nextCursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load more candidates.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Candidate Records"
        subtitle="Tenant-scoped candidate applications from the authoritative HireGo database. No demo profiles or generated totals are shown."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={100}
          placeholder="Search candidate, role, job, or location…"
          className="h-10 w-full max-w-xl rounded-xl border border-white/10 bg-bg-elevated px-4 text-sm text-white outline-none placeholder:text-text-muted focus:border-secondary"
        />
        <div className="text-xs text-text-muted">
          {candidates.length} loaded{nextCursor ? " · more available" : ""}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">
          Loading candidate records…
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      )}

      {!loading && candidates.length === 0 && !error && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">
          No candidate applications match this view.
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121215]">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Applied Role</th>
                  <th className="p-4">Stage</th>
                  <th className="p-4">Match</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Applied</th>
                  <th className="p-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates.map((candidate) => (
                  <tr key={candidate.applicationId} className="hover:bg-white/[0.03]">
                    <td className="p-4">
                      <p className="font-bold text-white">{candidate.name}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {candidate.currentRole} · {candidate.currentLocation}
                      </p>
                    </td>
                    <td className="p-4 text-text-secondary">{candidate.appliedJob}</td>
                    <td className="p-4 text-text-secondary">{candidate.stage.replaceAll("_", " ")}</td>
                    <td className="p-4 text-text-secondary">
                      {typeof candidate.matchScore === "number" && Number.isFinite(candidate.matchScore)
                        ? `${candidate.matchScore}/100`
                        : "Not available"}
                    </td>
                    <td className="p-4 text-text-secondary">
                      {candidate.availability || "Not provided"}
                      {candidate.jobReady ? " · Job Ready" : ""}
                    </td>
                    <td className="p-4 text-text-secondary">{candidate.applicationDate}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/employer/full-candidate-profile-employer-view?id=${encodeURIComponent(candidate.id)}`}
                        className="font-bold text-secondary hover:underline"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-white/10 bg-bg-elevated px-5 py-2.5 text-sm font-bold text-white transition hover:border-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
