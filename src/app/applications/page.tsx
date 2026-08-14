"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplicationsTrackerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.applications) {
          // Map backend application data to frontend representation
          setApplications(data.applications.map((app: any) => ({
            id: app.id,
            role: app.job?.title || "Unknown Role",
            company: app.job?.company?.name || "Unknown Company",
            location: app.job?.location || "Remote",
            appliedDate: new Date(app.createdAt).toLocaleDateString(),
            status: app.status === "APPLIED" ? "Active" : 
                    app.status === "INTERVIEWING" ? "Under Review" :
                    app.status === "OFFERED" ? "Offer Received" :
                    app.status === "REJECTED" ? "Rejected" : "Active",
            statusDetail: app.status,
            tags: ["Job Match", "Applied"],
            statusBg: app.status === "REJECTED" ? "badge-red" : 
                      app.status === "OFFERED" ? "badge-green" :
                      app.status === "INTERVIEWING" ? "badge-yellow" : "badge-blue",
            icon: "work",
            iconColor: "var(--primary)",
            matchScore: app.matchScore || 85,
            targetUrl: `/applications/${app.id}`,
            isOffer: app.status === "OFFERED"
          })));
        }
      })
      .catch((err) => console.error("Error fetching applications:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredApps = applications.filter((app) => {
    if (activeTab === "active") return app.status === "Active";
    if (activeTab === "under_review") return app.status === "Under Review";
    if (activeTab === "shortlisted") return app.status === "Shortlisted";
    if (activeTab === "rejected") return app.status === "Rejected";
    if (activeTab === "offers") return app.status === "Offer Received";
    return true;
  });

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Navigation Rail */}
      <CandidateSidebar />

      {/* Main Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        {/* Fixed Header */}
        <header
          className="fixed top-0 left-[116px] right-0 z-40 backdrop-blur-xl flex justify-between items-center px-gutter h-20 shadow-sm"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Applications Tracker
            </h1>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Manage and track candidate application progress across positions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-full text-white text-xs font-bold transition-all shadow-sm"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              Browse New Jobs
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {/* Scrollable Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {[
              { id: "all",          label: `All (${applications.length})` },
              { id: "active",       label: "Active (1)" },
              { id: "under_review", label: "Under Review (1)" },
              { id: "shortlisted",  label: "Shortlisted (1)" },
              { id: "offers",       label: "Offers (1)" },
              { id: "rejected",     label: "Rejected (1)" },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-5 py-2 rounded-full font-bold text-xs transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: isSelected ? "var(--primary)" : "var(--surface-container-high)",
                    color: isSelected ? "#ffffff" : "var(--text-secondary)",
                    borderColor: isSelected ? "var(--primary)" : "var(--outline)",
                    boxShadow: isSelected ? "var(--shadow-btn-red)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Application Cards List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center p-10 text-slate-400">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center p-12 border rounded-xl" style={{ borderColor: "var(--outline)", backgroundColor: "var(--bg-card)" }}>
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: "var(--text-muted)" }}>assignment_add</span>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>No Applications Found</h3>
                <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-secondary)" }}>
                  You haven't applied to any jobs that match this status.
                </p>
                <Link href="/jobs" className="px-5 py-2.5 rounded-full text-white text-xs font-bold transition-all shadow-sm" style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}>
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <>
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => router.push(app.targetUrl)}
                    className="rounded-2xl p-6 border transition-all cursor-pointer relative overflow-hidden group hover:scale-[1.005]"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: app.isOffer ? "var(--color-yellow)" : "var(--outline)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {/* Centered 3D Icon Box */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: "var(--surface-container-high)",
                            borderColor: "var(--outline)",
                            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), 0 4px 10px rgba(0,0,0,0.1)",
                          }}
                        >
                          <span className="material-symbols-outlined text-[24px]" style={{ color: app.iconColor }}>
                            {app.icon}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                              {app.role}
                            </h3>
                            {app.isOffer && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                                style={{
                                  backgroundColor: "rgba(245,127,23,0.14)",
                                  color: "#E65100",
                                  border: "1px solid rgba(245,127,23,0.25)",
                                }}
                              >
                                Priority
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" style={{ color: "var(--text-muted)" }}>business</span>
                              {app.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" style={{ color: "var(--text-muted)" }}>location_on</span>
                              {app.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" style={{ color: "var(--text-muted)" }}>calendar_today</span>
                              {app.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${app.statusBg}`}>
                            {app.status}
                          </span>
                          <p className="text-[11px] mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>{app.statusDetail}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid var(--outline)" }}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--color-green-light, #2E7D32)" }}>verified</span>
                        <span className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>{app.matchScore}% Match Score</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(app.tags || []).map((t: any, idx: any) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium border"
                            style={{
                              backgroundColor: "var(--surface-container-high)",
                              borderColor: "var(--outline)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                        <span className="material-symbols-outlined text-[18px] ml-2 group-hover:translate-x-1 transition-transform" style={{ color: "var(--primary)" }}>
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}