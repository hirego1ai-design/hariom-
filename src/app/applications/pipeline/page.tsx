"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplicationPipelinePage() {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState("all");
  const [sortBy, setSortBy] = useState("Recent Activity");

  const funnelStages = [
    { id: "applied",     label: "Applied",     count: 14, diff: "+12%",  color: "var(--primary)" },
    { id: "screened",    label: "Screened",    count: 8,  diff: "-42.8%", color: "var(--secondary)" },
    { id: "shortlisted", label: "Shortlisted", count: 4,  diff: "-50%",   color: "var(--tertiary)" },
    { id: "scheduled",   label: "Scheduled",   count: 3,  diff: "-25%",   color: "var(--color-yellow)" },
    { id: "interviewed", label: "Interviewed", count: 2,  diff: "-33.3%", color: "#AB47BC" },
    { id: "offer",       label: "Offer",       count: 1,  diff: "-50%",   color: "var(--color-green-light, #2E7D32)" },
    { id: "hired",       label: "Hired",       count: 0,  diff: "0%",     color: "var(--text-muted)" },
  ];

  const candidates = [
    {
      id: 842,
      name: "Marcus Chen",
      role: "Senior Cloud Architect",
      matchScore: 98,
      appliedTime: "2 hours ago",
      stage: "Applied",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 839,
      name: "Elena Rodriguez",
      role: "Lead UI/UX Designer",
      matchScore: 94,
      appliedTime: "4 hours ago",
      stage: "Screened",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    },
    {
      id: 831,
      name: "Samir Kulkarni",
      role: "ML Engineer",
      matchScore: 89,
      appliedTime: "1 day ago",
      stage: "Shortlisted",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-6 flex items-center justify-between"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--primary-container-bg)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  Live Pipeline
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Real-time Candidate Analytics
                </span>
              </div>
              <h1
                className="text-headline-md font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Application Pipeline
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/applications"
              className="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Applications Tracker
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          
          {/* Section 1: Proportioned 3D Hiring Funnel Bar */}
          <div
            className="rounded-2xl p-6"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--outline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span className="material-symbols-outlined text-[22px]" style={{ color: "var(--primary)" }}>filter_alt</span>
                  Hiring Funnel Analytics
                </h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Tracking candidate progression through evaluation stages
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(46,125,50,0.12)", color: "#2E7D32" }}>
                +12% conversion vs last month
              </span>
            </div>

            {/* Proportioned Stage Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
              {funnelStages.map((stg) => {
                const isSelected = activeStage === stg.id;
                return (
                  <button
                    key={stg.id}
                    onClick={() => setActiveStage(isSelected ? "all" : stg.id)}
                    className="p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center group"
                    style={{
                      backgroundColor: isSelected ? "var(--primary-container-bg)" : "var(--surface-container-high)",
                      borderColor: isSelected ? "var(--primary)" : "var(--outline)",
                      boxShadow: isSelected ? "var(--shadow-card-hover)" : "none",
                    }}
                  >
                    <span className="text-2xl font-extrabold font-mono mb-1" style={{ color: stg.color }}>
                      {stg.count}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: "var(--text-primary)" }}>
                      {stg.label}
                    </span>
                    <span className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>
                      {stg.diff}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Active Candidates List */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--outline)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  Active Candidates ({candidates.length})
                </h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Candidates currently progressing in active hiring workflows
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span style={{ color: "var(--text-muted)" }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border outline-none font-bold cursor-pointer"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    borderColor: "var(--outline)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option>Recent Activity</option>
                  <option>Match Score</option>
                </select>
              </div>
            </div>

            {/* Candidate Cards Table Rows */}
            <div className="space-y-3">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push("/applications")}
                  className="p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group hover:scale-[1.005]"
                  style={{
                    backgroundColor: "var(--surface-container-low)",
                    borderColor: "var(--outline)",
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-11 h-11 rounded-full object-cover border"
                      style={{ borderColor: "var(--outline)" }}
                    />
                    <div>
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </h4>
                      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        {c.role} • Application #{c.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold font-mono block" style={{ color: "var(--primary)" }}>
                        {c.matchScore}% Match
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                        {c.appliedTime}
                      </span>
                    </div>

                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "var(--primary-container-bg)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary)",
                      }}
                    >
                      {c.stage}
                    </span>

                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform" style={{ color: "var(--primary)" }}>
                      arrow_forward
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}