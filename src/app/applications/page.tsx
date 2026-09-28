"use client";

import React, { useEffect, useMemo, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "AI_INTERVIEW"
  | "ASSESSMENT"
  | "SHORTLISTED"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

type ApplicationRecord = {
  id: string;
  status: ApplicationStatus;
  matchScore: number | null;
  aiSummary?: string | null;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    location?: string | null;
    company?: { name?: string | null } | null;
  } | null;
};

const STATUS_META: Record<ApplicationStatus, { label: string; badge: string }> = {
  APPLIED: { label: "Applied", badge: "badge-blue" },
  SCREENING: { label: "Screening", badge: "badge-yellow" },
  AI_INTERVIEW: { label: "AI Interview", badge: "badge-yellow" },
  ASSESSMENT: { label: "Assessment", badge: "badge-yellow" },
  SHORTLISTED: { label: "Shortlisted", badge: "badge-green" },
  HIRED: { label: "Hired", badge: "badge-green" },
  REJECTED: { label: "Rejected", badge: "badge-red" },
  WITHDRAWN: { label: "Withdrawn", badge: "badge-red" },
};

const ACTIVE_STATUSES = new Set<ApplicationStatus>(["APPLIED", "SCREENING", "AI_INTERVIEW", "ASSESSMENT"]);

export default function ApplicationsTrackerPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadApplications() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/applications", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !Array.isArray(data.applications)) {
          throw new Error(data.error || "Could not load applications.");
        }
        if (!cancelled) setApplications(data.applications);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load applications.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadApplications();
    return () => { cancelled = true; };
  }, []);

  const filteredApps = useMemo(() => applications.filter((app) => {
    if (activeTab === "active") return ACTIVE_STATUSES.has(app.status);
    if (activeTab === "shortlisted") return app.status === "SHORTLISTED";
    if (activeTab === "hired") return app.status === "HIRED";
    if (activeTab === "rejected") return app.status === "REJECTED";
    if (activeTab === "withdrawn") return app.status === "WITHDRAWN";
    return true;
  }), [activeTab, applications]);

  const count = (predicate: (app: ApplicationRecord) => boolean) => applications.filter(predicate).length;
  const tabs = [
    { id: "all", label: `All (${applications.length})` },
    { id: "active", label: `Active (${count((app) => ACTIVE_STATUSES.has(app.status))})` },
    { id: "shortlisted", label: `Shortlisted (${count((app) => app.status === "SHORTLISTED")})` },
    { id: "hired", label: `Hired (${count((app) => app.status === "HIRED")})` },
    { id: "rejected", label: `Rejected (${count((app) => app.status === "REJECTED")})` },
    { id: "withdrawn", label: `Withdrawn (${count((app) => app.status === "WITHDRAWN")})` },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <CandidateSidebar />
      <div className="flex-1 ml-0 md:ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header
          className="fixed top-0 left-0 md:left-[116px] right-0 z-40 backdrop-blur-xl flex justify-between items-center px-gutter h-20 shadow-sm"
          style={{ backgroundColor: "var(--bg-page)", borderBottom: "1px solid var(--outline)" }}
        >
          <div>
            <h1 className="text-headline-md font-bold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              Applications Tracker
            </h1>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Track the persisted status of your applications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/offers" className="min-h-11 inline-flex items-center px-4 rounded-full border text-xs font-bold" style={{ borderColor: "var(--outline)" }}>
              Offers
            </Link>
            <Link href="/jobs" className="min-h-11 inline-flex items-center px-4 rounded-full text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}>
              Browse Jobs
            </Link>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {loadError && (
            <div role="alert" className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--primary)", backgroundColor: "var(--bg-card)" }}>
              {loadError}
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="min-h-11 px-5 py-2 rounded-full font-bold text-xs transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isSelected ? "var(--primary)" : "var(--surface-container-high)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)",
                    border: `1px solid ${isSelected ? "var(--primary)" : "var(--outline)"}`,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center p-10" style={{ color: "var(--text-muted)" }}>Loading applications…</div>
            ) : !loadError && filteredApps.length === 0 ? (
              <div className="text-center p-12 border rounded-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: "var(--text-muted)" }}>assignment_add</span>
                <h2 className="text-lg font-bold">No applications found</h2>
                <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  There are no applications in this status.
                </p>
                <Link href="/jobs" className="min-h-11 inline-flex items-center px-5 rounded-full text-white text-xs font-bold" style={{ background: "var(--primary)" }}>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              filteredApps.map((app) => {
                const meta = STATUS_META[app.status] ?? { label: app.status, badge: "badge-blue" };
                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="block rounded-2xl p-6 border transition-all group hover:scale-[1.005]"
                    style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--outline)", boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0" style={{ backgroundColor: "var(--surface-container-high)", borderColor: "var(--outline)" }}>
                          <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--primary)" }}>work</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                            {app.job?.title || "Job application"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                            <span>{app.job?.company?.name || "Company unavailable"}</span>
                            {app.job?.location && <span>{app.job.location}</span>}
                            <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <p className="text-[11px] mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>{app.status}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid var(--outline)" }}>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {typeof app.matchScore === "number" ? `Persisted match score: ${app.matchScore}%` : "Match score not available"}
                      </div>
                      <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>View application →</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
