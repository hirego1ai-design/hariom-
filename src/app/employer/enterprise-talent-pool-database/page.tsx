"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/employer/LayoutSystem";

const mockTalent = [
  {
    id: "cand-1",
    name: "Alex Rivera",
    role: "Product Designer",
    score: 89,
    skills: ["Figma", "React", "AI UI"],
    activity: "2 days ago",
    status: "Top Match",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "cand-2",
    name: "Elena Kovic",
    role: "Backend Dev",
    score: 92,
    skills: ["Rust", "Go", "K8s"],
    activity: "Yesterday",
    status: "Interviewed",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "cand-3",
    name: "Jordan Smith",
    role: "Data Lead",
    score: 76,
    skills: ["Python", "PyTorch", "SQL"],
    activity: "5 days ago",
    status: "In Pipeline",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "cand-4",
    name: "Sarah Chen",
    role: "Senior DevOps",
    score: 98,
    skills: ["Kubernetes", "AWS", "Terraform"],
    activity: "3 days ago",
    status: "Top Match",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "cand-5",
    name: "Marcus Thorne",
    role: "AI Strategist",
    score: 94,
    skills: ["NLP", "PyTorch", "LLMs"],
    activity: "Saved 12 days ago",
    status: "Shortlisted",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

export default function EnterpriseTalentPoolDatabasePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredTalent = mockTalent.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedFilter === "top") return matchesSearch && c.score >= 90;
    return matchesSearch;
  });

  return (
    <PageContainer>
      {/* Header Section */}
      <header className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white font-display">Enterprise Candidate Intelligence</h2>
            <p className="text-xs text-text-muted mt-1">Search, evaluate, and source verified talent directly into your pipeline.</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedFilter === "all"
                  ? "bg-secondary text-white shadow-[0_0_15px_rgba(66,133,244,0.3)]"
                  : "bg-white/5 text-text-muted hover:bg-white/10"
              }`}
            >
              All Applicants ({mockTalent.length})
            </button>
            <button
              onClick={() => setSelectedFilter("top")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedFilter === "top"
                  ? "bg-secondary text-white shadow-[0_0_15px_rgba(66,133,244,0.3)]"
                  : "bg-white/5 text-text-muted hover:bg-white/10"
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-yellow-400">stars</span>
              Top AI Matches
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search talent database by name, role, skill..."
              className="bg-[#1C1C22] border border-white/10 rounded-full h-10 pl-10 pr-4 text-xs text-white placeholder-text-muted focus:outline-none focus:border-secondary w-72"
            />
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-text-muted text-[18px]">
              search
            </span>
          </div>
        </div>
      </header>

      {/* Main Data Table Section */}
      <section className="glass-card rounded-2xl overflow-hidden border border-white/10 bg-[#141418]">
        {/* Table Header */}
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center text-xs font-bold text-text-muted uppercase tracking-wider">
          <div className="w-1/4">Candidate</div>
          <div className="w-1/6">AI Match Score</div>
          <div className="w-1/3">Skill Matrix</div>
          <div className="w-1/6">Last Active</div>
          <div className="w-1/6 text-right">Action</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/5">
          {filteredTalent.map((candidate) => (
            <div
              key={candidate.id}
              className="px-6 py-4 flex items-center hover:bg-white/[0.03] transition-colors"
            >
              {/* Candidate info with clickable profile link */}
              <div className="w-1/4 flex items-center gap-3">
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <Link
                    href="/employer/full-candidate-profile-employer-view"
                    className="font-bold text-sm text-white hover:text-secondary transition-colors underline decoration-white/20 hover:decoration-secondary"
                  >
                    {candidate.name}
                  </Link>
                  <p className="text-xs text-text-muted">{candidate.role}</p>
                </div>
              </div>

              {/* Match score */}
              <div className="w-1/6">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1 w-fit">
                  <span className="material-symbols-outlined text-[14px]">diamond</span>
                  {candidate.score}%
                </span>
              </div>

              {/* Skills */}
              <div className="w-1/3 flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 bg-white/5 rounded-full text-[11px] text-text-muted border border-white/5"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Activity */}
              <div className="w-1/6 text-xs text-text-muted">{candidate.activity}</div>

              {/* View Action Link */}
              <div className="w-1/6 text-right">
                <Link
                  href="/employer/full-candidate-profile-employer-view"
                  className="px-3 py-1.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
                >
                  View Profile
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}

          {filteredTalent.length === 0 && (
            <div className="p-8 text-center text-text-muted text-xs">
              No candidates found matching "{searchTerm}".
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
