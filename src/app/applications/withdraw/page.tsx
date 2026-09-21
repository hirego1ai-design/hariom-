"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "AI_INTERVIEW"
  | "ASSESSMENT"
  | "SHORTLISTED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

interface ApplicationRecord {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job?: {
    title?: string | null;
    location?: string | null;
    company?: {
      name?: string | null;
    } | null;
  } | null;
}

interface ApplicationsResponse {
  success?: boolean;
  applications?: ApplicationRecord[];
  error?: string;
}

interface WithdrawalResponse {
  success?: boolean;
  applicationId?: string;
  status?: "WITHDRAWN";
  error?: string;
}

const WITHDRAWABLE_STATUSES = new Set<ApplicationStatus>([
  "APPLIED",
  "SCREENING",
  "AI_INTERVIEW",
  "ASSESSMENT",
  "SHORTLISTED",
]);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export default function WithdrawApplicationPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [withdrawnId, setWithdrawnId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/applications", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body = await readJson<ApplicationsResponse>(response);
      if (!response.ok || !body.success || !Array.isArray(body.applications)) {
        throw new Error(body.error || "Your applications could not be loaded.");
      }
      setApplications(body.applications);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Your applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function withdrawApplication(applicationId: string) {
    if (submittingId) return;

    setSubmittingId(applicationId);
    setActionError("");
    setWithdrawnId(null);

    try {
      const response = await fetch("/api/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });
      const body = await readJson<WithdrawalResponse>(response);
      if (!response.ok || !body.success || body.status !== "WITHDRAWN") {
        throw new Error(body.error || "The application could not be withdrawn.");
      }

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? { ...application, status: "WITHDRAWN" }
            : application
        )
      );
      setConfirmingId(null);
      setWithdrawnId(applicationId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The application could not be withdrawn."
      );
    } finally {
      setSubmittingId(null);
    }
  }

  const activeApplications = applications.filter((application) =>
    WITHDRAWABLE_STATUSES.has(application.status) || application.id === withdrawnId
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <CandidateSidebar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 md:ml-[116px] md:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Applications
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Withdraw an application</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
              Only active applications from your HireGo account are shown. A confirmed
              withdrawal is saved immediately and may cancel scheduled interview activity.
            </p>
          </div>
          <Link
            href="/applications"
            className="inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-bold"
            style={{ borderColor: "var(--outline)", color: "var(--text-primary)" }}
          >
            Back to applications
          </Link>
        </div>

        {loadError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}
          >
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadApplications()}
              className="mt-3 font-bold text-primary"
            >
              Try again
            </button>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border p-4 text-sm"
            style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}
          >
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border p-8 text-sm" style={{ borderColor: "var(--outline)" }}>
            Loading your applications…
          </div>
        ) : activeApplications.length === 0 ? (
          <div
            className="rounded-2xl border p-8"
            style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
          >
            <h2 className="text-lg font-bold">No applications are eligible for withdrawal</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Withdrawn, rejected, hired, or placement-linked applications are not offered
              here. Their status remains available in your application tracker.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeApplications.map((application) => {
              const isConfirming = confirmingId === application.id;
              const isSubmitting = submittingId === application.id;
              const wasWithdrawn = withdrawnId === application.id;

              return (
                <article
                  key={application.id}
                  className="rounded-2xl border p-5"
                  style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold">
                        {application.job?.title || "Job application"}
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {application.job?.company?.name || "Company unavailable"}
                        {application.job?.location ? ` · ${application.job.location}` : ""}
                      </p>
                      <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        Applied {new Date(application.createdAt).toLocaleDateString()} ·{" "}
                        {application.status}
                      </p>
                    </div>

                    {wasWithdrawn ? (
                      <span className="rounded-full border border-green-600 px-4 py-2 text-sm font-bold text-green-600">
                        Withdrawn
                      </span>
                    ) : isConfirming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void withdrawApplication(application.id)}
                          className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "Withdrawing…" : "Confirm withdrawal"}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setConfirmingId(null);
                            setActionError("");
                          }}
                          className="rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-60"
                          style={{ borderColor: "var(--outline)" }}
                        >
                          Keep application
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingId(application.id);
                          setActionError("");
                          setWithdrawnId(null);
                        }}
                        className="rounded-full border px-4 py-2 text-sm font-bold text-primary"
                        style={{ borderColor: "var(--primary)" }}
                      >
                        Withdraw
                      </button>
                    )}
                  </div>

                  {wasWithdrawn && (
                    <p className="mt-4 text-sm font-semibold text-green-600" role="status">
                      This application was withdrawn and the change was saved.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
