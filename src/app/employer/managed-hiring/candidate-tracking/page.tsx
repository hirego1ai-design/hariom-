"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

const stages = ["SCREENING", "ASSESSMENT", "AI_INTERVIEW", "SHORTLISTED", "HIRED", "REJECTED"];
const labels: Record<string, string> = {
  SCREENING: "Screening",
  ASSESSMENT: "Assessment",
  AI_INTERVIEW: "Interview",
  SHORTLISTED: "Shortlisted",
  HIRED: "Joined",
  REJECTED: "Rejected",
};

function normalizeStage(stage: unknown) {
  const value = String(stage || "SCREENING").toUpperCase().replaceAll(" ", "_");
  return value === "APPLIED" ? "SCREENING" : value;
}

export default function ManagedHiringCandidateTrackingPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employer/candidates")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to load candidates");
        setCandidates(data.candidates || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load candidates"))
      .finally(() => setLoading(false));
  }, []);

  async function move(applicationId: string, stage: string) {
    setError("");
    const response = await fetch(`/api/employer/candidates/${encodeURIComponent(applicationId)}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setError(data.error || "Unable to update stage");
      return;
    }
    setCandidates((items) => items.map((item) => (item.applicationId === applicationId ? { ...item, stage: labels[stage] || stage } : item)));
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-7">
          <p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">HireGo Managed Hiring™</p>
          <h1 className="text-3xl font-bold text-white">Candidate tracking</h1>
          <p className="text-text-secondary text-sm mt-2">Move candidates through the managed pipeline, schedule rounds, and generate the joining invoice.</p>
        </div>
        {error && <p className="mb-4 p-3 rounded-lg bg-red-400/10 text-red-300 text-sm">{error}</p>}
        {loading ? <p className="text-text-secondary">Loading pipeline...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter((candidate) => normalizeStage(candidate.stage) === stage);
              return (
                <section key={stage} className="glass-card rounded-xl p-3 min-h-[260px]">
                  <h2 className="text-xs font-bold text-white mb-3">{labels[stage]} <span className="text-text-muted">({stageCandidates.length})</span></h2>
                  <div className="space-y-2">
                    {stageCandidates.map((candidate) => (
                      <div key={candidate.applicationId || candidate.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-white font-bold">{candidate.name}</p>
                        <p className="text-[10px] text-text-secondary mt-1">{candidate.appliedJob}</p>
                        <p className="text-[10px] text-primary mt-2">Match {candidate.matchScore}%</p>
                        <select
                          aria-label={`Move ${candidate.name}`}
                          value={normalizeStage(candidate.stage)}
                          onChange={(event) => move(candidate.applicationId, event.target.value)}
                          disabled={!candidate.applicationId}
                          className="mt-2 w-full rounded bg-black/30 border border-white/10 p-1 text-[10px] text-white"
                        >
                          {stages.map((option) => <option key={option} value={option}>{labels[option]}</option>)}
                        </select>
                        {candidate.applicationId && <>
                          <Link href={`/employer/interview-scheduler?applicationId=${encodeURIComponent(candidate.applicationId)}`} className="mt-2 block text-center rounded bg-primary/20 text-primary p-1.5 text-[10px] font-bold">Schedule interview</Link>
                          <Link href={`/employer/managed-hiring/join?applicationId=${encodeURIComponent(candidate.applicationId)}&candidateName=${encodeURIComponent(candidate.name || "Candidate")}&jobTitle=${encodeURIComponent(candidate.appliedJob || "Role")}`} className="mt-2 block text-center rounded bg-emerald-400/15 text-emerald-300 p-1.5 text-[10px] font-bold">Mark joined & generate invoice</Link>
                        </>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
