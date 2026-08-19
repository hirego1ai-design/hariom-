"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatCurrency, formatDate } from "@/utils";

export default function EmployerManagedHiringDashboard() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  const [requirements, setRequirements] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);

  // Mock candidates database for the autonomous AI Sourcing pool
  const mockCandidates = [
    {
      id: "cand-101",
      name: "Aravind Swamy",
      title: "Senior AI Systems Architect",
      matchScore: 98,
      experience: "7 Years",
      highlight: "Designed high-throughput LLM middleware with PyTorch, distributed training, and Next.js frontends.",
      avatar: "AS",
      status: "AI Vetted & Ready",
      scoreIcon: "verified",
      evaluationScore: "9.2/10",
      skills: ["PyTorch", "Distributed Systems", "Next.js", "Kubernetes"],
    },
    {
      id: "cand-102",
      name: "Neha Deshmukh",
      title: "Full Stack Machine Learning Engineer",
      matchScore: 94,
      experience: "5 Years",
      highlight: "Engineered FastAPI microservices for PyTorch models. Highly proficient with TypeScript, Next.js, and CI/CD.",
      avatar: "ND",
      status: "Video Proctoring Cleared",
      scoreIcon: "shield",
      evaluationScore: "8.9/10",
      skills: ["FastAPI", "React", "PyTorch", "Docker"],
    },
    {
      id: "cand-103",
      name: "Vikram Aditya",
      title: "Go Cloud Infrastructure Engineer",
      matchScore: 91,
      experience: "6 Years",
      highlight: "Spearheaded cloud architecture migration using Terraform, GCP infrastructure, and Golang microservices.",
      avatar: "VA",
      status: "Coding Test Passed (92%)",
      scoreIcon: "code",
      evaluationScore: "8.7/10",
      skills: ["Golang", "Kubernetes", "GCP", "Terraform"],
    },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [reqsRes, agrsRes] = await Promise.all([
          fetch("/api/agreements/requirements"),
          fetch("/api/agreements/contracts"),
        ]);
        const reqsData = await reqsRes.json();
        const agrsData = await agrsRes.json();

        if (reqsData.success) {
          setRequirements(reqsData.requirements || []);
          if (reqsData.requirements?.length > 0) {
            setSelectedRequirement(reqsData.requirements[0]);
          }
        }
        if (agrsData.success) {
          setAgreements(agrsData.agreements || []);
        }
      } catch (err) {
        console.error("Error loading managed hiring dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
      case "SUBMITTED":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "IN_DISCUSSION":
      case "UNDER_REVIEW":
      case "COMMERCIAL_DISCUSSION":
        return "bg-yellow/10 text-yellow border border-yellow/20";
      case "AGREEMENT_DRAFTED":
      case "AGREEMENT_SENT":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "ACTIVE":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      default:
        return "bg-white/10 text-slate-300 border border-white/20";
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      {isAdmin ? <AdminSidebar /> : <EmployerSidebar />}
      {isAdmin ? (
        <AdminHeader title="Autonomous Hiring Center" subtitle="Track end-to-end recruitment sourcing mandates and dynamic commissions" />
      ) : (
        <EmployerHeader title="Autonomous Hiring Center" subtitle="Track end-to-end recruitment sourcing mandates and dynamic commissions" />
      )}

      <main className="md:ml-[116px] p-6 lg:p-10 max-w-7xl mx-auto pt-24 space-y-8">
        
        {/* Banner: Hiring Model Info */}
        <div className="bg-gradient-to-r from-indigo-900/30 via-slate-900 to-indigo-950/20 border border-white/10 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <span className="material-symbols-outlined text-sm">psychology</span> Powered by HireGo Agentic AI™
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">HireGo Autonomous Hiring™</h2>
            <p className="text-xs lg:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Experience end-to-end automated recruitment. Our agentic AI sources, screens, match-evaluates, and proctor-interviews candidates, presenting you with vetted finalists. Billed under success placement commission terms with zero upfront software license fees.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={() => router.push("/employer/managed-hiring/request")}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              New Sourcing Requirement
            </button>
            <button
              onClick={() => router.push("/employer/managed-hiring/service-plan")}
              className="px-6 py-2.5 rounded-2xl bg-white/5 border border-indigo-400/30 text-indigo-200 hover:bg-indigo-400/10 font-medium text-[11px] transition-all text-center"
            >
              View Service & Interview Plan
            </button>
            <button
              onClick={() => router.push("/employer/employer-registration-business-model")}
              className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-medium text-[11px] transition-all text-center"
            >
              Change Hiring Model
            </button>
          </div>
        </div>

        {/* Dynamic Workflow Progress Line */}
        <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-lg">route</span>
            Hiring Workflow Progress Tracker
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 pt-2">
            {[
              { label: "1. Mandate Submitted", active: true, icon: "check_circle", color: "text-green-400" },
              { label: "2. AI JDs & Strategy", active: true, icon: "psychology", color: "text-indigo-400" },
              { label: "3. Sales Review", active: true, icon: "rate_review", color: "text-indigo-400" },
              { label: "4. B2B MSA Signed", active: selectedRequirement?.status === "ACTIVE", icon: selectedRequirement?.status === "ACTIVE" ? "check_circle" : "pending", color: selectedRequirement?.status === "ACTIVE" ? "text-green-400" : "text-yellow" },
              { label: "5. Autonomous Sourcing", active: selectedRequirement?.status === "ACTIVE", icon: "auto_mode", color: selectedRequirement?.status === "ACTIVE" ? "text-indigo-400 animate-spin" : "text-slate-500" },
              { label: "6. Assessment Rounds", active: selectedRequirement?.status === "ACTIVE", icon: "shield", color: selectedRequirement?.status === "ACTIVE" ? "text-indigo-400" : "text-slate-500" },
              { label: "7. Employer Interviews", active: false, icon: "video_call", color: "text-slate-500" },
              { label: "8. Joined & Invoiced", active: false, icon: "receipt_long", color: "text-slate-500" },
            ].map((step, idx) => (
              <div key={idx} className={`flex flex-col items-center text-center p-3 rounded-xl border ${step.active ? "bg-white/5 border-white/15" : "bg-black/20 border-white/5"} transition-all`}>
                <span className={`material-symbols-outlined text-[20px] mb-2 ${step.color}`}>
                  {step.icon}
                </span>
                <span className="text-[10px] font-bold text-slate-300 leading-tight">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column Left: Requirements List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400">assignment</span>
                  Active Mandates ({requirements.length})
                </h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-indigo-400 text-3xl">progress_activity</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {requirements.map((req) => {
                    const isSelected = selectedRequirement?.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequirement(req)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-950/20 border-indigo-500/50 shadow-lg"
                            : "bg-[#16161B] border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-mono text-[10px] text-indigo-400 font-bold">{req.referenceCode}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusBadgeClass(req.status)}`}>
                            {req.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug mb-1">{req.jobTitles.join(" & ")}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">group</span>
                          {req.numberOfPositions} Position(s) • {req.location}
                        </p>
                      </div>
                    );
                  })}
                  {requirements.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-6">No sourcing requirements submitted yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* B2B Placement Agreements Vault */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">gavel</span>
                MSA Agreements Vault
              </h3>
              <div className="space-y-3">
                {agreements.map((agr) => (
                  <div key={agr.id} className="bg-[#16161B] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-[#FFCA28] font-bold">{agr.agreementNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        agr.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow/10 text-yellow border border-yellow/20"
                      }`}>
                        {agr.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>Placement Fee:</span>
                        <span className="font-bold text-white">{agr.feeValue}% of CTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Replacement:</span>
                        <span className="font-bold text-white">{agr.replacementDays} Days</span>
                      </div>
                    </div>
                    {agr.status === "SENT_TO_EMPLOYER" && (
                      <button
                        onClick={() => router.push(`/employer/managed-hiring/agreements/${agr.id}`)}
                        className="w-full py-2 bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 text-yellow text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 animate-pulse"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_document</span>
                        Review & Sign Contract
                      </button>
                    )}
                  </div>
                ))}
                {agreements.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No active contracts drafted yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Column Right: Active Mandate Sourced Pipeline Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRequirement ? (
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* Mandate Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedRequirement.jobTitles.join(" / ")}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Priority: <span className="font-bold text-indigo-400">{selectedRequirement.hiringPriority}</span> • Required: <span className="font-bold text-white">{selectedRequirement.numberOfPositions} Candidates</span> • Location: <span className="font-medium text-slate-300">{selectedRequirement.location}</span>
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-indigo-400">
                    Ref: {selectedRequirement.referenceCode}
                  </div>
                </div>

                {/* Sourcing State message */}
                {selectedRequirement.status === "ACTIVE" ? (
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-400 animate-pulse mt-0.5">rss_feed</span>
                    <div className="text-xs leading-relaxed text-slate-300">
                      <span className="font-bold text-white">Sourcing Engine Running:</span> Agreement has been validated and activated. The agentic sourcing bot is currently crawling network directories and resume matching platforms for matched candidates.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow/5 border border-yellow/20 rounded-xl flex items-start gap-3">
                    <span className="material-symbols-outlined text-yellow mt-0.5">info</span>
                    <div className="text-xs leading-relaxed text-slate-300">
                      <span className="font-bold text-white">Agreement Execution Required:</span> Autonomous AI matching and proctored technical vetting will initiate immediately once the associated B2B Commercial placement contract is signed.
                    </div>
                  </div>
                )}

                {/* Candidate Matching Pool Preview */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 text-lg">supervised_user_circle</span>
                    Matched Candidates Pool ({selectedRequirement.status === "ACTIVE" ? "3" : "0"})
                  </h4>

                  {selectedRequirement.status === "ACTIVE" ? (
                    <div className="space-y-4">
                      {mockCandidates
                        .filter(c => {
                          if (selectedRequirement.jobTitles.join().toLowerCase().includes("systems architect")) {
                            return c.title.toLowerCase().includes("architect") || c.title.toLowerCase().includes("machine learning");
                          }
                          return c.title.toLowerCase().includes("cloud") || c.title.toLowerCase().includes("devops");
                        })
                        .map((candidate) => (
                          <div key={candidate.id} className="bg-[#16161B] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                                  {candidate.avatar}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-white">{candidate.name}</h5>
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-bold">
                                      Match: {candidate.matchScore}%
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">{candidate.title} • {candidate.experience} exp</p>
                                  <p className="text-[10px] text-slate-300 mt-2 italic leading-relaxed">
                                    "{candidate.highlight}"
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {candidate.skills.map((s, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-slate-400">{s}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex-shrink-0 flex flex-col items-end gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFCA28]/10 border border-[#FFCA28]/20 text-[#FFCA28] text-[9px] font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[12px]">{candidate.scoreIcon}</span>
                                  {candidate.status}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Evaluation Score: <span className="font-bold text-white">{candidate.evaluationScore}</span>
                                </div>
                                <button
                                  onClick={() => alert(`Scheduling final round interview with ${candidate.name}. The calendar invite has been dispatched.`)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-md"
                                >
                                  Schedule Final Round
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/15 border border-dashed border-white/5 rounded-xl space-y-2">
                      <span className="material-symbols-outlined text-4xl text-slate-600">lock</span>
                      <p className="text-xs font-bold text-slate-400">Pipeline Locked</p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-normal">
                        Candidate matches and AI vetting details will unlock once the placement agreement is completed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-[#121215] border border-white/10 rounded-2xl shadow-xl space-y-4">
                <span className="material-symbols-outlined text-5xl text-slate-600">explore</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Select a Requirement</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click on an active mandate from the left sidebar panel to review the sourcing workflow progress and match pool.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
