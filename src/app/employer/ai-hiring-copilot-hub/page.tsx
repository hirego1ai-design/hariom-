"use client";

import React, { useState } from "react";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { useRouter } from "next/navigation";

export interface ConsultantAnswers {
  industry: string;
  companySize: string;
  hiringVolume: string;
  departments: string[];
  jobFamilies: string[];
  hiringGoals: string;
  hiringTimeline: string;
  requiredSkills: string[];
  experienceLevel: string;
  workMode: string;
  employmentType: string;
  hiringBudget: string;
  hiringChallenges: string[];
}

export interface HiringBlueprint {
  strategySummary: string;
  orgStructure: {
    departments: string[];
    recommendedRecruiters: number;
  };
  recruitmentWorkflow: {
    stage: string;
    description: string;
    autoTrigger: string;
  }[];
  assessmentStrategy: {
    type: string;
    passingScore: number;
    questionBank: string;
    proctoringRules: string;
  };
  interviewStrategy: {
    rounds: string[];
    aiEvaluationFocus: string[];
  };
  hireGoScoreConfig: {
    skillsWeight: number;
    experienceWeight: number;
    videoPresentationWeight: number;
    assessmentWeight: number;
  };
  estimates: {
    timeToHireDays: number;
    industryAverageDays: number;
    costSavingsPercent: number;
  };
  riskMitigation: string[];
  bestPractices: string[];
}

export default function AIHiringConsultantPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"copilot" | "consultant" | "blueprint">("consultant");
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState("Enterprise Scale-up Blueprint");
  const [savedTemplates, setSavedTemplates] = useState<string[]>([
    "Engineering Hiring Blueprint v1",
    "Sales Fast-Track Hiring Blueprint",
  ]);

  // Guided Questions State
  const [answers, setAnswers] = useState<ConsultantAnswers>({
    industry: "Fintech & SaaS",
    companySize: "50-200 Employees",
    hiringVolume: "5-20 hires/month",
    departments: ["Engineering", "Product & Design"],
    jobFamilies: ["Senior Fullstack Engineer", "Product Designer"],
    hiringGoals: "Rapidly scale engineering team for Q3 launch",
    hiringTimeline: "Immediate (<30 days)",
    requiredSkills: ["React", "TypeScript", "Node.js", "System Design"],
    experienceLevel: "Senior (5+ Years)",
    workMode: "Hybrid / Remote",
    employmentType: "Full-time",
    hiringBudget: "$120,000 - $180,000 / hire",
    hiringChallenges: ["Slow Time-to-Hire", "Low Technical Skill Match", "High Candidate Dropout"],
  });

  // Generated Blueprint State
  const [blueprint, setBlueprint] = useState<HiringBlueprint | null>({
    strategySummary:
      "Automated 6-stage hiring operating system optimized for Fintech & SaaS scale-up. Replaces 3rd party headhunter screening with 10-point AI candidate vector matching and 2-minute video presentation analytics.",
    orgStructure: {
      departments: ["Engineering", "Product & Design"],
      recommendedRecruiters: 2,
    },
    recruitmentWorkflow: [
      { stage: "Sourced & Applied", description: "Candidate submits resume & profile", autoTrigger: "Auto-parse Resume Agent" },
      { stage: "Neural AI Resume Screen", description: "Skills vector match calculation", autoTrigger: "Filter >85% Match" },
      { stage: "2-Min Video Presentation", description: "Speech clarity & confidence analytics", autoTrigger: "Video Intelligence Agent" },
      { stage: "Technical Baseline Quiz", description: "Interactive Coding IDE or MCQ test", autoTrigger: "Pass Threshold 85%" },
      { stage: "WebRTC Live AI Interview", description: "Automated transcript & score matrix", autoTrigger: "Panel Feedback Request" },
      { stage: "Offer Letter Sent", description: "Automated e-signature offer creation", autoTrigger: "Hire Notification Agent" },
    ],
    assessmentStrategy: {
      type: "Role-Based Coding IDE + Technical MCQ",
      passingScore: 85,
      questionBank: "Enterprise Fullstack & System Architecture Bank (V4)",
      proctoringRules: "Tab Switch Suppression + Eye Tracking + Copy-Paste Lock",
    },
    interviewStrategy: {
      rounds: ["AI Speech & Video Screen", "Technical Live Pair Coding", "Leadership Culture Fit"],
      aiEvaluationFocus: ["Communication Clarity", "Code Optimization", "Problem Solving Speed", "Confidence Index"],
    },
    hireGoScoreConfig: {
      skillsWeight: 35,
      experienceWeight: 25,
      videoPresentationWeight: 25,
      assessmentWeight: 15,
    },
    estimates: {
      timeToHireDays: 11,
      industryAverageDays: 42,
      costSavingsPercent: 84,
    },
    riskMitigation: [
      "Auto-trigger WhatsApp reminders to prevent candidate drop-off after Stage 2.",
      "Cap interview response SLA at 48 hours for top 5% candidates.",
    ],
    bestPractices: [
      "Use 2-minute Video Resumes to evaluate candidate fluency before scheduling live technical rounds.",
      "Set HireGo Score™ baseline threshold at 85/100 for Senior roles.",
    ],
  });

  const handleGenerateBlueprint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setActiveTab("blueprint");
    }, 1500);
  };

  const handleSaveAsTemplate = () => {
    const templateName = `${answers.industry} ${answers.jobFamilies[0] || "Custom"} Blueprint`;
    if (!savedTemplates.includes(templateName)) {
      setSavedTemplates((prev) => [...prev, templateName]);
      setActiveTemplateName(templateName);
    }
    alert(`Successfully saved company hiring template: "${templateName}"!`);
  };

  const handleAcceptAllRecommendations = () => {
    alert("All recommendations applied! Your Employer Hiring Operating System has been updated with the AI Blueprint.");
    router.push("/employer/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex select-none">
      {/* Floating Vertical Rail Navigation */}
      <EmployerSidebar />

      {/* Main Content Area */}
      <div className="ml-[116px] w-full min-h-screen p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                AI Agent Active
              </span>
              <span className="text-xs text-gray-400 font-mono">Module E39</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              AI Hiring Consultant & Copilot Hub
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Intelligent onboarding assistant that designs and configures your enterprise hiring operating system.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-[#141418] p-1.5 rounded-full border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab("consultant")}
              className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all ${
                activeTab === "consultant"
                  ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.35)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎯 Guided Business Discovery
            </button>

            <button
              onClick={() => setActiveTab("blueprint")}
              className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all ${
                activeTab === "blueprint"
                  ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.35)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📄 AI Hiring Blueprint
            </button>
          </div>
        </header>

        {/* =========================================================
            TAB 1: GUIDED BUSINESS DISCOVERY CONSULTANT
           ========================================================= */}
        {activeTab === "consultant" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side: Step-by-Step Guided Form */}
            <div className="lg:col-span-8 bg-[#12131A] p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
                    {currentStep}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {currentStep === 1 && "Step 1: Company Profile & Scale"}
                      {currentStep === 2 && "Step 2: Hiring Strategy & Timeline"}
                      {currentStep === 3 && "Step 3: Target Roles & Skill Matrix"}
                      {currentStep === 4 && "Step 4: Compensation & Work Mode"}
                    </h3>
                    <p className="text-xs text-gray-400">Answer key business questions to train your AI Hiring Consultant</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      className={`w-7 h-2 rounded-full cursor-pointer transition-all ${
                        currentStep === step ? "bg-yellow-400" : currentStep > step ? "bg-emerald-500" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: COMPANY PROFILE & SCALE */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Industry Sector</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {["Fintech & SaaS", "Healthcare Tech", "E-Commerce & Retail", "AI & DeepTech", "Cybersecurity", "Manufacturing"].map((ind) => (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => setAnswers({ ...answers, industry: ind })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                            answers.industry === ind
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Company Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["1-20 Startup", "50-200 Scale-up", "200-1000 Mid-Market", "1000+ Enterprise"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setAnswers({ ...answers, companySize: sz })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                            answers.companySize === sz
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: HIRING STRATEGY & TIMELINE */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Monthly Hiring Volume</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["1-5 hires/mo", "5-20 hires/mo", "20-50 hires/mo", "50+ hires/mo"].map((vol) => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setAnswers({ ...answers, hiringVolume: vol })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                            answers.hiringVolume === vol
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {vol}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Key Hiring Challenges (Select Multiple)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Slow Time-to-Hire",
                        "Low Technical Skill Match",
                        "High Candidate Dropout",
                        "Lack of Video Screening",
                        "High Headhunter Agency Fees",
                        "Unreliable Interview Feedback",
                      ].map((chal) => {
                        const isSelected = answers.hiringChallenges.includes(chal);
                        return (
                          <button
                            key={chal}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? answers.hiringChallenges.filter((c) => c !== chal)
                                : [...answers.hiringChallenges, chal];
                              setAnswers({ ...answers, hiringChallenges: updated });
                            }}
                            className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                                : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                            }`}
                          >
                            <span>{chal}</span>
                            {isSelected && <span className="material-symbols-outlined text-base">check_circle</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: TARGET ROLES & SKILLS */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Target Job Family</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {["Senior Fullstack Engineer", "Product Designer", "Machine Learning Lead", "VP of Growth", "Data Engineer", "DevOps Specialist"].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setAnswers({ ...answers, jobFamilies: [role] })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                            answers.jobFamilies.includes(role)
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Experience Threshold</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["Junior (0-2 Yrs)", "Mid-Level (2-5 Yrs)", "Senior (5+ Yrs)", "Executive (8+ Yrs)"].map((exp) => (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setAnswers({ ...answers, experienceLevel: exp })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                            answers.experienceLevel === exp
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: COMPENSATION & WORK MODE */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Work Mode & Setup</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Remote", "Hybrid", "On-site"].map((wm) => (
                        <button
                          key={wm}
                          type="button"
                          onClick={() => setAnswers({ ...answers, workMode: wm })}
                          className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                            answers.workMode === wm
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-400"
                              : "bg-[#181924] border-white/10 text-gray-300 hover:border-white/20"
                          }`}
                        >
                          {wm}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-2">Annual Compensation Budget</label>
                    <input
                      type="text"
                      value={answers.hiringBudget}
                      onChange={(e) => setAnswers({ ...answers, hiringBudget: e.target.value })}
                      placeholder="e.g. $120,000 - $180,000 / yr"
                      className="w-full h-12 rounded-2xl bg-[#181924] border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-yellow-400/50"
                    />
                  </div>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs disabled:opacity-40"
                >
                  Previous Step
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                    className="px-6 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(234,179,8,0.35)]"
                  >
                    Next Question →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateBlueprint}
                    disabled={isGenerating}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 text-black font-extrabold text-xs shadow-[0_0_25px_rgba(234,179,8,0.35)] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>{isGenerating ? "Generating AI Blueprint..." : "Generate AI Hiring Blueprint"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side: Live AI Consultant Insights */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#12131A] p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">AI Consultant Core</h3>
                    <p className="text-[11px] text-gray-400">Real-time parameters derived</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs text-gray-300">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Industry:</span>
                    <span className="font-bold text-white">{answers.industry}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Target Role:</span>
                    <span className="font-bold text-yellow-400">{answers.jobFamilies[0]}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Hiring Volume:</span>
                    <span className="font-bold text-white">{answers.hiringVolume}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Work Mode:</span>
                    <span className="font-bold text-emerald-400">{answers.workMode}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-gray-400 italic leading-relaxed">
                    "Based on your inputs for {answers.industry}, the AI Consultant recommends implementing automated 2-minute video presentation screening to reduce time-to-hire from 42 days to 11 days."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: AI HIRING BLUEPRINT REPORT
           ========================================================= */}
        {activeTab === "blueprint" && blueprint && (
          <div className="space-y-8">
            {/* Blueprint Header & Quick Controls */}
            <div className="bg-[#12131A] p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      AI Generated Blueprint
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Template: {activeTemplateName}</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    {answers.industry} Enterprise Hiring Blueprint
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">{blueprint.strategySummary}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSaveAsTemplate}
                    className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark</span>
                    <span>Save Company Template</span>
                  </button>

                  <button
                    onClick={handleAcceptAllRecommendations}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(234,179,8,0.35)] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Accept & Activate Workspace</span>
                  </button>
                </div>
              </div>

              {/* 3 Metric ROI Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
                    ⚡
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">{blueprint.estimates.timeToHireDays} Days</p>
                    <p className="text-xs text-gray-400">Time-to-Hire (vs {blueprint.estimates.industryAverageDays} Avg)</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center font-bold text-xl">
                    📈
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">{blueprint.estimates.costSavingsPercent}% Lower</p>
                    <p className="text-xs text-gray-400">Recruitment Agency Cost Savings</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl">
                    🎯
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">98% Match</p>
                    <p className="text-xs text-gray-400">Skill Precision Vector Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Stage Automated Recruitment Workflow */}
            <div className="bg-[#12131A] p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400 text-xl">account_tree</span>
                Recommended Automated Recruitment Workflow
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blueprint.recruitmentWorkflow.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 relative group hover:border-yellow-500/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-mono text-[10px] font-bold">
                        Stage {idx + 1}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">{item.autoTrigger}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{item.stage}</h4>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment & HireGo Score™ Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assessment Strategy */}
              <div className="bg-[#12131A] p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-400 text-lg">quiz</span>
                  Assessment & Proctoring Strategy
                </h3>

                <div className="space-y-3 text-xs text-gray-300">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Assessment Type:</span>
                    <span className="font-bold text-white">{blueprint.assessmentStrategy.type}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Passing Threshold:</span>
                    <span className="font-bold text-emerald-400">{blueprint.assessmentStrategy.passingScore}% Score</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 block mb-1">Question Bank Assigned:</span>
                    <span className="font-bold text-white">{blueprint.assessmentStrategy.questionBank}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-gray-400 block mb-1">Proctoring Safeguards:</span>
                    <span className="font-bold text-yellow-400">{blueprint.assessmentStrategy.proctoringRules}</span>
                  </div>
                </div>
              </div>

              {/* HireGo Score Neural Weighting */}
              <div className="bg-[#12131A] p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-400 text-lg">donut_large</span>
                  HireGo Score™ Neural Weighting
                </h3>

                <div className="space-y-3 text-xs text-gray-300">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Technical Skills Weight:</span>
                    <span className="font-extrabold text-yellow-400">{blueprint.hireGoScoreConfig.skillsWeight}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Experience Vector Weight:</span>
                    <span className="font-extrabold text-white">{blueprint.hireGoScoreConfig.experienceWeight}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Video Presentation Weight:</span>
                    <span className="font-extrabold text-blue-400">{blueprint.hireGoScoreConfig.videoPresentationWeight}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-gray-400">Baseline Assessment Weight:</span>
                    <span className="font-extrabold text-emerald-400">{blueprint.hireGoScoreConfig.assessmentWeight}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
