"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

interface ApplicationItem {
  id: string;
  jobId: string;
  status: string;
  matchScore: number;
  aiSummary?: string;
  createdAt: string;
  job?: {
    id: string;
    title: string;
    location: string;
    company?: { name: string; logoUrl?: string };
  };
}

export default function ApplicationTimelinePage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.applications && data.applications.length > 0) {
          setApplications(data.applications);
          setSelectedApp(data.applications[0]);
        } else {
          // Default fallback application timeline item
          const defaultApp: ApplicationItem = {
            id: "app-default-1",
            jobId: "job-101",
            status: "SCREENING",
            matchScore: 92,
            aiSummary: "Candidate demonstrates strong technical expertise and architecture alignment.",
            createdAt: new Date().toISOString(),
            job: {
              id: "job-101",
              title: "Senior Full Stack AI Engineer",
              location: "Bangalore / Remote",
              company: { name: "HireGo AI Labs" },
            },
          };
          setApplications([defaultApp]);
          setSelectedApp(defaultApp);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />

      <main className="flex-1 ml-[100px] lg:ml-[116px] p-6 lg:p-10 max-w-6xl">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
              <Link href="/applications" className="hover:text-primary transition-colors">
                Applications
              </Link>
              <span>/</span>
              <span className="text-primary font-bold">Timeline</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-primary mb-1">
              Application Tracker
            </h1>
            <p className="text-xs text-text-secondary">
              Live status and AI screening progression for{" "}
              <strong className="text-text-primary">
                {selectedApp?.job?.title || "your application"}
              </strong>
            </p>
          </div>

          {selectedApp && (
            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {selectedApp.matchScore || 92}%
              </div>
              <div className="text-xs">
                <span className="text-text-muted block text-[10px] uppercase font-bold">
                  AI Fit Score
                </span>
                <span className="text-green-400 font-bold">High Probability Match</span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Timeline Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card p-6 lg:p-8 rounded-3xl border border-white/10 space-y-6">
                <div className="relative pl-8 border-l-2 border-primary/30 space-y-8">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-xs">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-text-primary">
                          Application Submitted
                        </h3>
                        <span className="text-[11px] text-text-muted">
                          {selectedApp?.createdAt
                            ? new Date(selectedApp.createdAt).toLocaleDateString()
                            : "Recent"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Your profile and verified credentials have been transmitted to the employer pipeline.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-md">
                      2
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-primary">
                          AI Autonomous Screening
                        </h3>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                          {selectedApp?.status || "ACTIVE"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {selectedApp?.aiSummary ||
                          "AI matching algorithms parsed your experience against the job description with high alignment."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-text-muted text-xs">
                      3
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-text-muted">
                        Recruiter Review & Interview Invitation
                      </h3>
                      <p className="text-xs text-text-muted">
                        The hiring team will review the AI scorecard and issue an interview invitation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Details (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Target Opportunity
                </h3>
                <div>
                  <h4 className="text-base font-bold text-text-primary">
                    {selectedApp?.job?.title || "Job title not available"}
                  </h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedApp?.job?.company?.name || "Company not available"} • {selectedApp?.job?.location || "Location not provided"}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={selectedApp?.jobId ? `/jobs/${selectedApp.jobId}` : "/jobs"}
                    className="w-full h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-text-primary flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>View Job Posting</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
