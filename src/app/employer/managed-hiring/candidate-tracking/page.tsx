"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";
import { fetchEmployerCandidates } from "@/lib/employerCandidates";

const stages = [
  "SCREENING",
  "ASSESSMENT",
  "AI_INTERVIEW",
  "SHORTLISTED",
  "HIRED",
  "REJECTED",
];
const movableStages = [
  "SCREENING",
  "ASSESSMENT",
  "AI_INTERVIEW",
  "SHORTLISTED",
];
const labels: Record<string, string> = {
  SCREENING: "Screening",
  ASSESSMENT: "Assessment",
  AI_INTERVIEW: "Interview",
  SHORTLISTED: "Shortlisted",
  HIRED: "Joined",
  REJECTED: "Rejected",
};

type RejectionDraft = {
  applicationId: string;
  candidateName: string;
  reason: string;
  approvalId?: string;
  workflowId?: string;
};

function normalizeStage(stage: unknown) {
  const value = String(stage || "SCREENING").toUpperCase().replaceAll(" ", "_");
  return value === "APPLIED" ? "SCREENING" : value;
}

export default function ManagedHiringCandidateTrackingPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejection, setRejection] = useState<RejectionDraft | null>(null);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchEmployerCandidates<any>()
      .then(setCandidates)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load candidates",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  async function move(applicationId: string, stage: string) {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/employer/candidates/${encodeURIComponent(applicationId)}/stage`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Unable to update stage");
        return;
      }
      setCandidates((items) =>
        items.map((item) =>
          item.applicationId === applicationId
            ? { ...item, stage: data.stage }
            : item,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update stage",
      );
    }
  }

  async function rejectCandidate() {
    if (!rejection || rejection.reason.trim().length < 10) {
      setError("Add a clear rejection reason with at least 10 characters.");
      return;
    }

    setRejecting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `/api/employer/candidates/${encodeURIComponent(rejection.applicationId)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT",
            reason: rejection.reason.trim(),
            ...(rejection.approvalId && rejection.workflowId
              ? {
                  approvalId: rejection.approvalId,
                  workflowId: rejection.workflowId,
                  confirmApproval: true,
                }
              : {}),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to process candidate rejection.");
      }

      if (data.requiresConfirmation && data.approvalId && data.workflowId) {
        setRejection((current) =>
          current
            ? {
                ...current,
                approvalId: data.approvalId,
                workflowId: data.workflowId,
              }
            : current,
        );
        setSuccess(
          "Human approval request saved. Review the reason and click Confirm rejection to execute it.",
        );
        return;
      }

      if (data.status === "REJECTED") {
        setCandidates((items) =>
          items.map((item) =>
            item.applicationId === rejection.applicationId
              ? { ...item, stage: "REJECTED" }
              : item,
          ),
        );
        setSuccess(
          `${rejection.candidateName} was rejected only after explicit human confirmation. The reason and approval are audit-recorded.`,
        );
        setRejection(null);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to process candidate rejection.",
      );
    } finally {
      setRejecting(false);
    }
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-7">
          <p className="text-yellow text-xs font-bold uppercase tracking-[0.2em] mb-2">
            HireGo Managed Hiring™
          </p>
          <h1 className="text-3xl font-bold text-white">Candidate tracking</h1>
          <p className="text-text-secondary text-sm mt-2">
            Evidence-first screening never auto-rejects a candidate. Missing
            evidence should go to assessment or human review; rejection requires
            explicit human approval.
          </p>
        </div>

        {error && (
          <p className="mb-4 p-3 rounded-lg bg-red-400/10 text-red-300 text-sm">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 p-3 rounded-lg bg-emerald-400/10 text-emerald-300 text-sm">
            {success}
          </p>
        )}

        {loading ? (
          <p className="text-text-secondary">Loading pipeline...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter(
                (candidate) => normalizeStage(candidate.stage) === stage,
              );
              return (
                <section
                  key={stage}
                  className="glass-card rounded-xl p-3 min-h-[260px]"
                >
                  <h2 className="text-xs font-bold text-white mb-3">
                    {labels[stage]}{" "}
                    <span className="text-text-muted">
                      ({stageCandidates.length})
                    </span>
                  </h2>

                  <div className="space-y-2">
                    {stageCandidates.map((candidate) => {
                      const currentStage = normalizeStage(candidate.stage);
                      const isTerminal = ["HIRED", "REJECTED"].includes(
                        currentStage,
                      );
                      const rejectionOpen =
                        rejection?.applicationId === candidate.applicationId;

                      return (
                        <div
                          key={candidate.applicationId || candidate.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <p className="text-xs text-white font-bold">
                            {candidate.name}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-1">
                            {candidate.appliedJob}
                          </p>
                          <p className="text-[10px] text-primary mt-2">
                            Match {candidate.matchScore}%
                          </p>

                          {!isTerminal ? (
                            <select
                              aria-label={`Move ${candidate.name}`}
                              value={currentStage}
                              onChange={(event) =>
                                move(candidate.applicationId, event.target.value)
                              }
                              disabled={!candidate.applicationId}
                              className="mt-2 w-full rounded bg-black/30 border border-white/10 p-1 text-[10px] text-white"
                            >
                              {movableStages.map((option) => (
                                <option key={option} value={option}>
                                  {labels[option]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="mt-2 rounded border border-white/10 bg-black/20 p-2 text-[10px] text-text-secondary">
                              Terminal status: {labels[currentStage]}
                            </p>
                          )}

                          {candidate.applicationId && !isTerminal && (
                            <>
                              <Link
                                href={`/employer/interview-scheduler?applicationId=${encodeURIComponent(candidate.applicationId)}`}
                                className="mt-2 block text-center rounded bg-primary/20 text-primary p-1.5 text-[10px] font-bold"
                              >
                                Schedule interview
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setError("");
                                  setSuccess("");
                                  setRejection({
                                    applicationId: candidate.applicationId,
                                    candidateName:
                                      candidate.name || "Candidate",
                                    reason: "",
                                  });
                                }}
                                className="mt-2 w-full rounded border border-red-400/30 bg-red-400/5 p-1.5 text-[10px] font-bold text-red-300"
                              >
                                Start controlled rejection
                              </button>
                            </>
                          )}

                          {candidate.applicationId &&
                            currentStage === "SHORTLISTED" && (
                              <Link
                                href={`/employer/managed-hiring/join?applicationId=${encodeURIComponent(candidate.applicationId)}&candidateName=${encodeURIComponent(candidate.name || "Candidate")}&jobTitle=${encodeURIComponent(candidate.appliedJob || "Role")}`}
                                className="mt-2 block text-center rounded bg-emerald-400/15 text-emerald-300 p-1.5 text-[10px] font-bold"
                              >
                                Mark joined & generate invoice
                              </Link>
                            )}

                          {rejectionOpen && rejection && (
                            <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/5 p-2">
                              <label className="block text-[10px] font-bold text-red-200">
                                Human rejection reason
                                <textarea
                                  value={rejection.reason}
                                  disabled={Boolean(rejection.approvalId)}
                                  onChange={(event) =>
                                    setRejection({
                                      ...rejection,
                                      reason: event.target.value,
                                    })
                                  }
                                  maxLength={2000}
                                  className="mt-1 min-h-20 w-full rounded border border-white/10 bg-black/30 p-2 text-[10px] text-white disabled:opacity-70"
                                  placeholder="Record the evidence-based reason. Missing resume/profile evidence alone is not a valid automatic rejection signal."
                                />
                              </label>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    rejecting ||
                                    rejection.reason.trim().length < 10
                                  }
                                  onClick={() => void rejectCandidate()}
                                  className="flex-1 rounded bg-red-500/20 p-2 text-[10px] font-bold text-red-200 disabled:opacity-40"
                                >
                                  {rejection.approvalId
                                    ? "Confirm rejection"
                                    : "Request human approval"}
                                </button>
                                <button
                                  type="button"
                                  disabled={rejecting}
                                  onClick={() => setRejection(null)}
                                  className="rounded border border-white/10 px-3 text-[10px] text-text-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
