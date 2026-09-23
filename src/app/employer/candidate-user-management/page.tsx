"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/employer/LayoutSystem";

type Candidate = {
  id: string;
  applicationId: string;
  name: string;
  matchScore: number;
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

export default function CandidateUserManagementPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employer/candidates?limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load candidates.");
        setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load candidates."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter((candidate) =>
      [candidate.name, candidate.currentRole, candidate.appliedJob, candidate.currentLocation, candidate.stage]
        .some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [candidates, query]);

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
          placeholder="Search candidates, roles, jobs, locations…"
          className="h-10 w-full max-w-xl rounded-xl border border-white/10 bg-bg-elevated px-4 text-sm text-white outline-none placeholder:text-text-muted focus:border-secondary"
        />
        <div className="text-xs text-text-muted">{filtered.length} record{filtered.length === 1 ? "" : "s"}</div>
      </div>

      {loading && <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-sm text-text-muted">Loading candidate records…</div>}
      {error && <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-8 text-center text-sm text-text-muted">
          No candidate applications match this view.
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#121215]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-text-muted">
              <tr><th className="p-4">Candidate</th><th className="p-4">Applied Role</th><th className="p-4">Stage</th><th className="p-4">Match</th><th className="p-4">Availability</th><th className="p-4">Applied</th><th className="p-4 text-right">Profile</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((candidate) => (
                <tr key={candidate.applicationId} className="hover:bg-white/[0.03]">
                  <td className="p-4">
                    <p className="font-bold text-white">{candidate.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{candidate.currentRole} · {candidate.currentLocation}</p>
                  </td>
                  <td className="p-4 text-text-secondary">{candidate.appliedJob}</td>
                  <td className="p-4 text-text-secondary">{candidate.stage.replaceAll("_", " ")}</td>
                  <td className="p-4 text-text-secondary">{Number.isFinite(candidate.matchScore) ? `${candidate.matchScore}/100` : "Not available"}</td>
                  <td className="p-4 text-text-secondary">{candidate.availability || "Not provided"}{candidate.jobReady ? " · Job Ready" : ""}</td>
                  <td className="p-4 text-text-secondary">{candidate.applicationDate}</td>
                  <td className="p-4 text-right">
                    <Link href={`/employer/full-candidate-profile-employer-view?id=${encodeURIComponent(candidate.id)}`} className="font-bold text-secondary hover:underline">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
