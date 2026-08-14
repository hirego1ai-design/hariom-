"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import EmployerHeader from "@/components/employer/EmployerHeader";
import EmployerSidebar from "@/components/employer/EmployerSidebar";

/* ─── THEME ─── */
const T = {
  pageBg: "#0A0A0C",
  card: "#121215",
  cardAlt: "#16161B",
  border: "rgba(255,255,255,0.08)",
  green: "#26A69A",
  blue: "#29B6F6",
  yellow: "#FFCA28",
  purple: "#AB47BC",
  slate: "#94A3B8",
};

const WIZARD_STEPS = [
  { id: 1, name: "Company Info", icon: "domain" },
  { id: 2, name: "Requirement", icon: "work" },
  { id: 3, name: "Skills & Education", icon: "psychology" },
  { id: 4, name: "Salary & Budget", icon: "payments" },
  { id: 5, name: "Priority", icon: "bolt" },
  { id: 6, name: "Attachments & Review", icon: "fact_check" },
];

export default function ManagedHiringRequirementWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company
    companyName: "Acme Technologies",
    industry: "Information Technology",
    website: "https://acme.example.com",
    contactPerson: "Rahul Verma",
    email: "rahul@acme.example.com",
    primaryMobile: "+91 98765 43210",
    alternatePhone: "",
    gstin: "",
    pan: "",
    billingAddress: "Bengaluru, KA, India",

    // Step 2: Requirement
    numberOfPositions: "3",
    multipleRoles: false,
    jobTitles: "Senior AI Fullstack Developer, Frontend Architect",
    department: "Engineering",
    experienceYears: "3-5 Years",
    employmentType: "Full-time",
    workMode: "Hybrid",
    location: "Bengaluru",
    shift: "Day Shift",
    noticePeriod: "Immediate to 30 Days",
    joiningTimeline: "Within 30 Days",

    // Step 3: Skills
    mandatorySkills: ["React", "Node.js", "TypeScript", "Next.js"],
    newMandatorySkill: "",
    preferredSkills: ["Python", "GraphQL", "Tailwind CSS"],
    newPreferredSkill: "",
    education: "B.Tech / B.E. in Computer Science or related field",
    certifications: "AWS Certified Developer (Optional)",
    languages: "English (Fluent), Hindi",
    tools: "Git, JIRA, Docker, Figma",

    // Step 4: Salary
    budgetMin: "2000000",
    budgetMax: "3500000",
    currency: "INR",
    variableComponent: "10% Performance Bonus",
    bonusIncentives: "Annual Health & ESOP Package",
    benefits: ["Health Insurance", "Remote Allowance", "Flexible Working Hours"],

    // Step 5: Priority
    hiringPriority: "Urgent",
    replacementExpectation: "90 Days",

    // Step 6: Attachments & Notes
    additionalNotes: "Looking for proactive engineers with startup background and strong product ownership.",
    jdFileName: "",
  });

  // Dynamic Positions state for Step 2
  const [positions, setPositions] = useState<any[]>([
    {
      id: 1,
      jobTitle: "Senior AI Fullstack Developer",
      numberOfPositions: "2",
      experienceYears: "3-5 Years",
      workMode: "Hybrid",
      location: "Bengaluru"
    },
    {
      id: 2,
      jobTitle: "Frontend Architect",
      numberOfPositions: "1",
      experienceYears: "5-8 Years",
      workMode: "Hybrid",
      location: "Bengaluru"
    }
  ]);

  const addPositionItem = () => {
    setPositions((prev) => [
      ...prev,
      {
        id: Date.now(),
        jobTitle: "",
        numberOfPositions: "1",
        experienceYears: "3-5 Years",
        workMode: "Hybrid",
        location: ""
      }
    ]);
  };

  const removePositionItem = (id: number) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePositionChange = (id: number, field: string, value: string) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addSkill = (type: "mandatory" | "preferred") => {
    if (type === "mandatory" && formData.newMandatorySkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        mandatorySkills: [...prev.mandatorySkills, prev.newMandatorySkill.trim()],
        newMandatorySkill: "",
      }));
    } else if (type === "preferred" && formData.newPreferredSkill.trim()) {
      setFormData((prev) => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, prev.newPreferredSkill.trim()],
        newPreferredSkill: "",
      }));
    }
  };

  const removeSkill = (type: "mandatory" | "preferred", skill: string) => {
    if (type === "mandatory") {
      setFormData((prev) => ({
        ...prev,
        mandatorySkills: prev.mandatorySkills.filter((s) => s !== skill),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        preferredSkills: prev.preferredSkills.filter((s) => s !== skill),
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const totalPositions = positions.reduce((acc, p) => acc + (parseInt(p.numberOfPositions) || 0), 0);
      const allJobTitles = positions.map(p => p.jobTitle).filter(Boolean).join(", ");
      const allExperiences = Array.from(new Set(positions.map(p => p.experienceYears))).join(", ");
      const allWorkModes = Array.from(new Set(positions.map(p => p.workMode))).join(", ");
      const allLocations = Array.from(new Set(positions.map(p => p.location).filter(Boolean))).join(", ");

      const payload = {
        ...formData,
        numberOfPositions: totalPositions || 1,
        jobTitles: allJobTitles || "Software Engineer",
        experienceYears: allExperiences || "3-5 Years",
        workMode: allWorkModes || "Hybrid",
        location: allLocations || "Remote",
        salaryRangeMin: parseFloat(formData.budgetMin) || 0,
        salaryRangeMax: parseFloat(formData.budgetMax) || 0,
      };

      const res = await fetch("/api/agreements/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedRef(data.referenceCode || "REQ-2026-ACTIVE");
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <EmployerSidebar />
      <EmployerHeader title="HireGo Managed Hiring™" subtitle="Submit your hiring requirements to our managed talent team" />

      <main className="md:ml-[116px] p-6 lg:p-10 max-w-6xl mx-auto pt-24 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#FFCA28]/10 text-[#FFCA28] border border-[#FFCA28]/20 mb-2">
              <span className="material-symbols-outlined text-sm">stars</span> HireGo Managed Hiring™ Engine
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Structured Requirement Wizard</h1>
            <p className="text-xs text-slate-400 mt-1">Configure position requirements for enterprise commercial matching</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/employer/dashboard")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {WIZARD_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-[#29B6F6]/10 border-[#29B6F6] text-white"
                    : isDone
                    ? "bg-[#26A69A]/10 border-[#26A69A]/40 text-slate-300"
                    : "bg-[#121215] border-white/5 text-slate-500 hover:border-white/20"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{step.icon}</span>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Step {step.id}</div>
                  <div className="text-xs font-bold truncate">{step.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Body Container */}
        <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-6 shadow-2xl">
          {/* STEP 1: COMPANY INFO */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">domain</span> Step 1: Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Company Name *</label>
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Industry *</label>
                  <input
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Contact Person *</label>
                  <input
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Work Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Primary Mobile *</label>
                  <input
                    name="primaryMobile"
                    value={formData.primaryMobile}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">GSTIN (Optional)</label>
                  <input
                    name="gstin"
                    placeholder="29AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Billing Address</label>
                  <input
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REQUIREMENT */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#29B6F6]">work</span> Step 2: Position Requirements
                </h2>
                <button
                  type="button"
                  onClick={addPositionItem}
                  className="px-4 py-2 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 transition-all flex items-center gap-1 shadow-md animate-pulse hover:animate-none"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add More Position
                </button>
              </div>

              <div className="space-y-6">
                {positions.map((pos, index) => (
                  <div key={pos.id} className="p-5 bg-[#16161B] border border-white/10 rounded-2xl space-y-4 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        Position #{index + 1}
                      </span>
                      {positions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePositionItem(pos.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Job Title / Role *</label>
                        <input
                          value={pos.jobTitle}
                          onChange={(e) => handlePositionChange(pos.id, "jobTitle", e.target.value)}
                          placeholder="e.g. Senior Full Stack Engineer"
                          className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Number of Positions *</label>
                        <input
                          type="number"
                          value={pos.numberOfPositions}
                          onChange={(e) => handlePositionChange(pos.id, "numberOfPositions", e.target.value)}
                          min="1"
                          className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Experience Required</label>
                        <select
                          value={pos.experienceYears}
                          onChange={(e) => handlePositionChange(pos.id, "experienceYears", e.target.value)}
                          className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                        >
                          <option value="0-1 Years">Fresher / 0-1 Years</option>
                          <option value="1-3 Years">Junior / 1-3 Years</option>
                          <option value="3-5 Years">Mid / 3-5 Years</option>
                          <option value="5-8 Years">Senior / 5-8 Years</option>
                          <option value="8+ Years">Lead / Executive 8+ Years</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Work Mode</label>
                        <select
                          value={pos.workMode}
                          onChange={(e) => handlePositionChange(pos.id, "workMode", e.target.value)}
                          className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                        >
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Onsite">Onsite</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Job Location *</label>
                        <input
                          value={pos.location}
                          onChange={(e) => handlePositionChange(pos.id, "location", e.target.value)}
                          placeholder="e.g. Bengaluru, Remote"
                          className="w-full bg-[#121215] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">psychology</span> Step 3: Skills & Criteria
              </h2>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">Mandatory Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={formData.newMandatorySkill}
                    onChange={(e) => setFormData({ ...formData, newMandatorySkill: e.target.value })}
                    placeholder="Add skill (e.g. React)..."
                    className="flex-1 bg-[#16161B] border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill("mandatory")}
                    className="px-4 py-2 bg-[#29B6F6] text-white text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.mandatorySkills.map((skill) => (
                    <span key={skill} className="px-3 py-1 rounded-lg bg-[#29B6F6]/20 border border-[#29B6F6]/40 text-[#29B6F6] text-xs font-bold flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill("mandatory", skill)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Education Requirement</label>
                <input
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: SALARY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">payments</span> Step 4: Salary & Budget
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Min Annual Budget (INR)</label>
                  <input
                    name="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Max Annual Budget (INR)</label>
                  <input
                    name="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Variable Component / Incentives</label>
                  <input
                    name="variableComponent"
                    value={formData.variableComponent}
                    onChange={handleChange}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PRIORITY */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">bolt</span> Step 5: Hiring Priority & SLA
              </h2>
              <div className="w-full md:w-1/2">
                <label className="text-xs font-bold text-slate-400 mb-1 block">Priority Level</label>
                <select
                  name="hiringPriority"
                  value={formData.hiringPriority}
                  onChange={handleChange}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#29B6F6]"
                >
                  <option value="Urgent">Urgent (Immediate Sourcing)</option>
                  <option value="Normal">Normal Standard</option>
                  <option value="Bulk">Bulk Hiring</option>
                  <option value="Executive">Executive Search</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 6: ATTACHMENTS & REVIEW */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">fact_check</span> Step 6: Review & Confirmation
              </h2>

              <div className="bg-[#16161B] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-slate-400">Company</span>
                  <span className="text-xs font-bold text-white">{formData.companyName}</span>
                </div>
                <div className="border-b border-white/10 pb-2 space-y-1.5">
                  <span className="text-xs text-slate-400 block font-bold">Positions List</span>
                  {positions.map((p, idx) => (
                    <div key={p.id} className="pl-3 border-l-2 border-indigo-500/60 flex justify-between text-xs text-slate-300 py-0.5">
                      <span>{idx + 1}. {p.jobTitle || "(Untitled Role)"}</span>
                      <span className="font-mono text-[#FFCA28] font-bold">{p.numberOfPositions} Candidates</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Budget Range</span>
                  <span className="text-xs font-bold text-[#26A69A]">₹{formData.budgetMin} - ₹{formData.budgetMax}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Additional Instructions</label>
                <textarea
                  name="additionalNotes"
                  rows={3}
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  className="w-full bg-[#16161B] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#29B6F6]"
                />
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="flex justify-between items-center border-t border-white/10 pt-6">
            <button
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-30"
            >
              Back
            </button>

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 shadow-lg"
              >
                Next Step
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-2.5 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90 shadow-xl flex items-center gap-2"
              >
                {loading ? "Submitting..." : "Submit Hiring Request"}
              </button>
            )}
          </div>
        </div>

        {/* Success Modal */}
        {submittedRef && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121215] border border-[#26A69A]/40 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-[#26A69A]">check_circle</span>
              <h3 className="text-xl font-bold text-white">Requirement Submitted!</h3>
              <p className="text-xs text-slate-300">
                Your requirement has been queued for Sales & Managed Talent Review.
              </p>
              <div className="p-3 bg-[#16161B] border border-white/10 rounded-xl text-sm font-mono text-[#FFCA28] font-bold">
                ID: {submittedRef}
              </div>
              <button
                onClick={() => router.push("/employer/managed-hiring")}
                className="w-full py-3 rounded-xl bg-[#26A69A] text-white text-xs font-bold hover:bg-[#26A69A]/90"
              >
                Go to Autonomous Hiring Center
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
