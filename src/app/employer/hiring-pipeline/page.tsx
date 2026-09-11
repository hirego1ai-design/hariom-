"use client";

import React, { useState, useMemo } from "react";
import { useEmployer } from "@/context/EmployerContext";
import Link from "next/link";

type StageId =
  | "Applied"
  | "Shortlisted"
  | "AI Screening"
  | "Video Resume Review"
  | "Assessment"
  | "AI Interview"
  | "Technical Interview"
  | "HR Interview"
  | "Client Interview"
  | "Offer"
  | "Documentation"
  | "Joined"
  | "Rejected"
  | "Withdrawn";

interface StageConfig {
  id: StageId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STAGES: StageConfig[] = [
  { id: "AI Screening", label: "AI Screening", color: "text-[#7C4DFF]", bgColor: "bg-[#7C4DFF]/10", borderColor: "border-[#7C4DFF]/30" },
  { id: "Assessment", label: "Assessment", color: "text-[#FF9800]", bgColor: "bg-[#FF9800]/10", borderColor: "border-[#FF9800]/30" },
  { id: "AI Interview", label: "AI Interview", color: "text-[#E040FB]", bgColor: "bg-[#E040FB]/10", borderColor: "border-[#E040FB]/30" },
  { id: "Shortlisted", label: "Shortlisted", color: "text-[#66BB6A]", bgColor: "bg-[#66BB6A]/10", borderColor: "border-[#66BB6A]/30" },
  { id: "Joined", label: "Joined", color: "text-[#2E7D32]", bgColor: "bg-[#2E7D32]/10", borderColor: "border-[#2E7D32]/30" },
  { id: "Rejected", label: "Rejected", color: "text-[#EF5350]", bgColor: "bg-[#EF5350]/10", borderColor: "border-[#EF5350]/30" },
];

export default function HiringPipelinePage() {
  const { candidates, jobs, updateCandidateStage } = useEmployer();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("All");
  const [selectedExperience, setSelectedExperience] = useState<string>("All");
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>("All");
  const [selectedMinScore, setSelectedMinScore] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>("All");

  // View States
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "table" | "timeline" | "analytics">("kanban");
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [expandedNotesCard, setExpandedNotesCard] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Derive unique values for filter dropdowns
  const uniqueLocations = useMemo(() => {
    const locations = candidates.map((c) => c.currentLocation.split(",")[0].trim());
    return Array.from(new Set(locations));
  }, [candidates]);

  // Handle Drag / Move candidate action
  const handleMove = async (applicationId: string, targetStage: StageId) => {
    const candidate = candidates.find((c) => c.applicationId === applicationId);
    if (!candidate) return;
    if (await updateCandidateStage(applicationId, targetStage)) showToast(`Moved ${candidate.name} to ${targetStage}`);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter logic
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.currentRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJob = selectedJob === "All" || c.jobId === selectedJob;
      const matchesExp =
        selectedExperience === "All" ||
        (selectedExperience === "8y+" && parseInt(c.experience) >= 8) ||
        (selectedExperience === "5y-7y" && parseInt(c.experience) >= 5 && parseInt(c.experience) <= 7) ||
        (selectedExperience === "<5y" && parseInt(c.experience) < 5);
      const matchesRecommendation =
        selectedRecommendation === "All" || c.recommendation === selectedRecommendation;
      const matchesScore = c.matchScore >= selectedMinScore;
      const matchesLocation =
        selectedLocation === "All" || c.currentLocation.toLowerCase().includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesJob && matchesExp && matchesRecommendation && matchesScore && matchesLocation;
    });
  }, [candidates, searchQuery, selectedJob, selectedExperience, selectedRecommendation, selectedMinScore, selectedLocation]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredCandidates.length;
    const avgScore = total ? Math.round(filteredCandidates.reduce((acc, c) => acc + c.matchScore, 0) / total) : 0;
    const highlyRecCount = filteredCandidates.filter((c) => c.recommendation === "Highly Recommended").length;
    const joinedCount = filteredCandidates.filter((c) => c.stage === "Joined").length;
    const offersCount = filteredCandidates.filter((c) => c.stage === "Shortlisted").length;
    
    // Average experience calculation
    const avgExpVal = total 
      ? (filteredCandidates.reduce((acc, c) => acc + (parseInt(c.experience) || 0), 0) / total).toFixed(1)
      : "0";

    return {
      total,
      avgScore,
      highlyRecCount,
      joinedCount,
      offersCount,
      avgExpVal,
      openJobsCount: jobs.filter(j => j.status === "Active").length,
    };
  }, [filteredCandidates, jobs]);

  // Selected job details for Job Summary banner
  const pinnedJobDetails = useMemo(() => {
    if (selectedJob === "All") return null;
    return jobs.find((j) => j.id === selectedJob);
  }, [selectedJob, jobs]);

  // Get stage statistics based on currently filtered candidates
  const getStageStats = (stageId: StageId) => {
    const stageCandidates = filteredCandidates.filter((c) => c.stage === stageId);
    const count = stageCandidates.length;
    const avgScore = count ? Math.round(stageCandidates.reduce((acc, c) => acc + c.matchScore, 0) / count) : 0;
    const avgExp = count
      ? (stageCandidates.reduce((acc, c) => acc + (parseInt(c.experience) || 0), 0) / count).toFixed(1)
      : "0";
    return { count, avgScore, avgExp };
  };

  return (
    <div className="pt-24 pb-12 pr-2 min-h-screen text-text-primary">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C22] border border-secondary/40 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hero Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Active Jobs</p>
          <p className="font-display text-2xl text-white mt-1">{stats.openJobsCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Pipeline Candidates</p>
          <p className="font-display text-2xl text-white mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Avg AI Match</p>
          <p className="font-display text-2xl text-green mt-1">{stats.avgScore}%</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Shortlisted</p>
          <p className="font-display text-2xl text-secondary mt-1">{stats.offersCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Joined Workspace</p>
          <p className="font-display text-2xl text-green mt-1">{stats.joinedCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Highly Recommended</p>
          <p className="font-display text-2xl text-yellow mt-1">{stats.highlyRecCount}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md hover:scale-[1.02] transition-transform duration-200">
          <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider">Avg Experience</p>
          <p className="font-display text-2xl text-white mt-1">{stats.avgExpVal} yrs</p>
        </div>
      </section>

      {/* Pinned Job Summary Details */}
      {pinnedJobDetails && (
        <section className="glass-card p-4 rounded-2xl border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-secondary-container-bg to-transparent">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-2xl">pin</span>
            <div>
              <h3 className="font-bold text-sm text-white">{pinnedJobDetails.title}</h3>
              <p className="text-xs text-text-muted">{pinnedJobDetails.location} · {pinnedJobDetails.type}</p>
            </div>
          </div>
          <div className="flex gap-6 text-xs text-text-muted">
            <div>
              <p>Activity Level</p>
              <p className="text-white font-bold">{pinnedJobDetails.activityLevel}</p>
            </div>
            <div>
              <p>Applications Rec.</p>
              <p className="text-white font-bold">{pinnedJobDetails.applications}</p>
            </div>
            <div>
              <p>Hiring Progress</p>
              <div className="w-24 bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: "35%" }}></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search & Sticky Filters Toolbar */}
      <section className="sticky top-20 z-30 glass-card p-4 rounded-2xl border border-white/10 bg-[#0E0E10]/80 backdrop-blur-xl shadow-lg mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl min-w-[280px]">
            <span className="material-symbols-outlined text-text-muted text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search candidate name, experience, role..."
              className="bg-transparent border-none outline-none text-xs text-white w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "kanban" ? "bg-secondary text-white shadow-md" : "text-text-muted hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_week</span>
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "list" ? "bg-secondary text-white shadow-md" : "text-text-muted hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">list</span>
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-white transition-all flex items-center gap-1.5 opacity-60 cursor-not-allowed"
              title="Table View (Coming Soon)"
              disabled
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-white transition-all flex items-center gap-1.5 opacity-60 cursor-not-allowed"
              title="Analytics View (Coming Soon)"
              disabled
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>Analytics</span>
            </button>
          </div>

          {/* Collapsible Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInsightsOpen(!isInsightsOpen)}
              className={`h-[38px] px-4 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-2 transition-all ${
                isInsightsOpen ? "bg-white/10 text-white" : "bg-transparent text-text-muted hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>AI Insights</span>
            </button>
            <Link
              href="/employer/create-job-basic-info"
              className="h-[38px] px-4 rounded-xl bg-yellow text-bg-page hover:bg-yellow/90 text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Job</span>
            </Link>
          </div>
        </div>

        {/* Extended Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted uppercase font-bold">Job Posting</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value="All">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted uppercase font-bold">Experience</label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value="All">All Experience</option>
              <option value="8y+">Senior (8y+ Exp)</option>
              <option value="5y-7y">Mid-Senior (5y-7y Exp)</option>
              <option value="<5y">Junior (&lt;5y Exp)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted uppercase font-bold">Recommendation</label>
            <select
              value={selectedRecommendation}
              onChange={(e) => setSelectedRecommendation(e.target.value)}
              className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value="All">All Recommendations</option>
              <option value="Highly Recommended">⭐ Highly Recommended</option>
              <option value="Recommended">✅ Recommended</option>
              <option value="Consider">Consider</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Not Recommended">Not Recommended</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted uppercase font-bold">Min AI Match</label>
            <select
              value={selectedMinScore}
              onChange={(e) => setSelectedMinScore(Number(e.target.value))}
              className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value={0}>Any Score</option>
              <option value={90}>≥ 90% Match</option>
              <option value={80}>≥ 80% Match</option>
              <option value={70}>≥ 70% Match</option>
              <option value={50}>≥ 50% Match</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted uppercase font-bold">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedJob("All");
              setSelectedExperience("All");
              setSelectedRecommendation("All");
              setSelectedMinScore(0);
              setSelectedLocation("All");
            }}
            className="self-end px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs text-text-muted hover:text-white transition-all font-bold"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Main Board Area with Collapsible Insights panel */}
      <div className="flex items-start gap-4">
        {/* Kanban Board Container */}
        {viewMode === "kanban" ? (
          <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-4" style={{ width: `${STAGES.length * 360}px` }}>
              {STAGES.map((col) => {
                const stageCandidates = filteredCandidates.filter((c) => c.stage === col.id);
                const stageStat = getStageStats(col.id);

                return (
                  <div
                    key={col.id}
                    className="w-[340px] flex-shrink-0 flex flex-col glass-card p-4 rounded-2xl border border-white/5 bg-[#141418] min-h-[620px]"
                  >
                    {/* Stage Header */}
                    <div className="flex flex-col gap-2 pb-3 border-b border-white/5 mb-4">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${col.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {col.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white font-bold font-mono">
                          {stageStat.count}
                        </span>
                      </div>
                      {stageStat.count > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
                          <span>Avg Exp: {stageStat.avgExp}y</span>
                          <span>Avg Match: {stageStat.avgScore}%</span>
                        </div>
                      )}
                    </div>

                    {/* Candidate Cards stack */}
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[560px] pr-1">
                      {stageCandidates.map((c) => (
                        <CandidateCard
                          key={c.applicationId}
                          candidate={c}
                          onMoveStage={(stage) => handleMove(c.applicationId, stage)}
                          expandedNotesCard={expandedNotesCard}
                          setExpandedNotesCard={setExpandedNotesCard}
                        />
                      ))}
                      {stageCandidates.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-6 text-center text-text-muted text-xs">
                          <span className="material-symbols-outlined text-white/20 text-3xl mb-2">inbox</span>
                          <p>No candidates at this stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* List View Mode */
          <div className="flex-1 flex flex-col gap-4">
            {filteredCandidates.map((c) => (
              <div
                key={c.applicationId}
                className="glass-card p-5 rounded-2xl border border-white/10 bg-[#141418] hover:border-secondary/40 hover:scale-[1.01] transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <Link href={`/employer/full-candidate-profile-employer-view?id=${c.id}`} className="flex items-start gap-4 hover:opacity-80 transition-opacity relative z-10">
                  <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-secondary/30 shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-secondary underline decoration-secondary/30">
                        {c.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-text-muted border border-white/10">
                        {c.appliedJob}
                      </span>
                      <RecommendationBadge rec={c.recommendation} />
                    </div>
                    <p className="text-xs text-text-muted font-bold mt-1">{c.currentRole} at {c.currentCompany}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px] text-text-muted">
                      <span>🎓 {c.education}</span>
                      <span>💼 {c.experience}</span>
                      <span>📍 {c.currentLocation}</span>
                      <span>💰 {c.expectedSalary}</span>
                      <span>⏳ Notice: {c.noticePeriod}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-6 self-stretch md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5 justify-between">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-text-muted font-bold uppercase">AI Match</span>
                    <ScoreBadge score={c.matchScore} size="sm" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <span className="text-[10px] text-text-muted font-bold uppercase">Pipeline Stage</span>
                    <select
                      value={c.stage}
                      onChange={(e) => handleMove(c.applicationId, e.target.value as StageId)}
                      className="bg-[#1C1C22] border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none w-full"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {filteredCandidates.length === 0 && (
              <div className="glass-card p-12 rounded-2xl border border-white/5 bg-[#141418] text-center text-text-muted">
                <span className="material-symbols-outlined text-4xl mb-3 text-white/30">search_off</span>
                <p className="text-sm font-bold">No candidates found matching the selected filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedJob("All");
                    setSelectedExperience("All");
                    setSelectedRecommendation("All");
                    setSelectedMinScore(0);
                    setSelectedLocation("All");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Right Side Insights panel */}
        {isInsightsOpen && (
          <aside className="w-[320px] flex-shrink-0 glass-card p-5 rounded-2xl border border-white/10 bg-[#141418]/90 flex flex-col gap-5 sticky top-60">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
                <h3 className="font-bold text-sm text-white">AI Hiring Insights</h3>
              </div>
              <p className="text-[11px] text-text-muted">Active evaluations and urgent pipeline priorities.</p>
            </div>

            <div className="p-3 bg-secondary-container-bg rounded-xl border border-secondary/20 flex flex-col gap-1">
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Hiring Health Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-display text-white">92</span>
                <span className="text-xs text-green font-bold">Excellent (+3.4%)</span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-normal">Your response rate and scheduling speeds exceed industry benchmarks for tech roles.</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] text-text-muted uppercase font-bold tracking-wider">Top AI Recommendations</h4>
              {candidates
                .filter((c) => c.recommendation === "Highly Recommended")
                .slice(0, 2)
                .map((c) => (
                  <div key={c.applicationId} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{c.currentRole}</p>
                    </div>
                    <span className="text-xs font-bold text-green font-mono">{c.matchScore}%</span>
                  </div>
                ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] text-text-muted uppercase font-bold tracking-wider">Urgent Alerts</h4>
              <div className="p-3 bg-red-deep/10 border border-red-light/20 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                  <span className="material-symbols-outlined text-[14px] text-red-light">error</span>
                  <span>Review Candidate</span>
                </div>
                <p className="text-[10px] text-text-muted">Jordan S. has been in "Applied" stage for over 4 days. AI match is 98%.</p>
              </div>
              
              <div className="p-3 bg-yellow/5 border border-yellow/20 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                  <span className="material-symbols-outlined text-[14px] text-yellow">schedule</span>
                  <span>Interviews Setup Pending</span>
                </div>
                <p className="text-[10px] text-text-muted">Aarav Sharma completed the coding assessment. Score: 96%.</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* --- Redesigned Premium Candidate Card Component --- */
function CandidateCard({
  candidate,
  onMoveStage,
  expandedNotesCard,
  setExpandedNotesCard,
}: {
  candidate: any;
  onMoveStage: (stage: StageId) => void;
  expandedNotesCard: string | null;
  setExpandedNotesCard: (id: string | null) => void;
}) {
  const isNotesExpanded = expandedNotesCard === candidate.id;

  return (
    <div className="group relative glass-card p-4 rounded-[20px] bg-[#16161B] hover:bg-[#1E1E24] border border-white/5 hover:border-secondary/40 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex flex-col gap-3">
      {/* Top Header Row */}
      <div className="flex justify-between items-start gap-2">
        <Link
          href={`/employer/full-candidate-profile-employer-view?id=${candidate.id}`}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity relative z-10"
        >
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-secondary/30"
          />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-secondary underline decoration-secondary/30 truncate">
              {candidate.name}
            </h4>
            <p className="text-[10px] text-text-muted truncate">{candidate.currentRole}</p>
          </div>
        </Link>
        <ScoreBadge score={candidate.matchScore} size="sm" />
      </div>

      {/* Info Stats List */}
      <div className="space-y-1.5 text-[11px] text-text-muted">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold truncate text-white max-w-[160px] bg-white/5 border border-white/5 px-2 py-0.5 rounded">
            {candidate.appliedJob}
          </span>
          <span className="font-mono text-[10px]">{candidate.experience}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] pt-1">
          <span className="truncate max-w-[120px]">{candidate.education}</span>
          <span className="truncate max-w-[120px] text-right">{candidate.currentCompany}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] pt-0.5 border-t border-white/5">
          <span>{candidate.currentLocation}</span>
          <span className="text-white font-bold">{candidate.expectedSalary}</span>
        </div>
      </div>

      {/* Recommendation and reason badge */}
      <div className="flex flex-col gap-1">
        <RecommendationBadge rec={candidate.recommendation} />
        {candidate.recommendationReason && (
          <p className="text-[9px] text-text-muted italic leading-normal px-1">
            "{candidate.recommendationReason}"
          </p>
        )}
      </div>

      {/* Expanded Notes section */}
      <div className="text-[10px] border-t border-white/5 pt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text-muted uppercase font-bold">Recruiter Notes</span>
          <button
            onClick={() => setExpandedNotesCard(isNotesExpanded ? null : candidate.id)}
            className="text-secondary hover:underline font-bold text-[9px]"
          >
            {isNotesExpanded ? "Show Less" : "Expand"}
          </button>
        </div>
        {isNotesExpanded ? (
          <p className="text-text-secondary leading-normal bg-white/5 p-2 rounded-lg border border-white/5">
            {candidate.recruiterNotes || "No recruiter notes recorded."}
          </p>
        ) : (
          <p className="text-text-muted truncate leading-normal">
            {candidate.recruiterNotes || "No recruiter notes recorded."}
          </p>
        )}
      </div>

      {/* Quick Interactive Actions Row */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/5">
        {/* Stage selection Dropdown Menu */}
        <select
          value={candidate.stage}
          onChange={(e) => onMoveStage(e.target.value as StageId)}
          className="bg-[#1C1C22] border border-white/10 hover:border-white/20 text-white rounded-lg px-2 py-1 text-[10px] outline-none flex-1 max-w-[140px] cursor-pointer"
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Link
            href="/employer/ai-candidate-ranking-explanation"
            className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 flex items-center justify-center text-secondary transition-all"
            title="AI Ranking Explanation"
          >
            <span className="material-symbols-outlined text-[14px]">psychology</span>
          </Link>
          <Link
            href="/employer/ai-evaluation-scores"
            className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 flex items-center justify-center text-secondary transition-all"
            title="AI Evaluation Scores"
          >
            <span className="material-symbols-outlined text-[14px]">fact_check</span>
          </Link>
          <Link
            href="/employer/candidate-comparison"
            className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 flex items-center justify-center text-secondary transition-all"
            title="Compare Candidates"
          >
            <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
          </Link>
          {candidate.hasVideoResume && (
            <button
              onClick={() => alert(`Launching video resume presentation for ${candidate.name}`)}
              className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 flex items-center justify-center text-secondary transition-all"
              title="Watch Video Resume"
            >
              <span className="material-symbols-outlined text-[14px]">videocam</span>
            </button>
          )}
          <Link
            href={`/employer/full-candidate-profile-employer-view?id=${candidate.id}`}
            className="w-7 h-7 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 flex items-center justify-center text-secondary transition-all"
            title="View Full Candidate Profile"
          >
            <span className="material-symbols-outlined text-[14px]">account_circle</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Color Coded Score badge widget */
function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const isHigh = score >= 90;
  const isMedium = score >= 70;

  const colorClass = isHigh
    ? "text-green bg-green/10 border-green/20"
    : isMedium
    ? "text-yellow bg-yellow/10 border-yellow/20"
    : "text-red-light bg-red-light/10 border-red-light/20";

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`rounded-full border font-bold font-mono ${colorClass} ${sizeClass}`}>
      {score}%
    </span>
  );
}

/* Recommendation state pills */
function RecommendationBadge({ rec }: { rec: string }) {
  let badgeColor = "bg-white/5 text-text-muted border-white/10";
  let icon = "info";

  switch (rec) {
    case "Highly Recommended":
      badgeColor = "bg-green/10 text-green border-green/20";
      icon = "stars";
      break;
    case "Recommended":
      badgeColor = "bg-[#26A69A]/10 text-[#26A69A] border-[#26A69A]/20";
      icon = "check_circle";
      break;
    case "Consider":
      badgeColor = "bg-yellow/10 text-yellow border-yellow/20";
      icon = "help";
      break;
    case "Needs Review":
      badgeColor = "bg-orange-500/10 text-orange-500 border-orange-500/20";
      icon = "warning";
      break;
    case "Not Recommended":
      badgeColor = "bg-red-light/10 text-red-light border-red-light/20";
      icon = "cancel";
      break;
  }

  return (
    <div className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 w-fit ${badgeColor}`}>
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      <span>{rec}</span>
    </div>
  );
}
