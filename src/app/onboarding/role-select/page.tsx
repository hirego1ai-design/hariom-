"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, CandidateRole, JobCategory } from "@/context/OnboardingContext";

const roles: { id: CandidateRole; title: string; desc: string; icon: string; color: string }[] = [
  { id: "student", title: "Student", desc: "Currently enrolled in college or university.", icon: "school", color: "#4285F4" },
  { id: "fresher", title: "Fresher / Graduate", desc: "Recently graduated, looking for entry-level roles.", icon: "workspace_premium", color: "#EA4335" },
  { id: "experienced", title: "Experienced Professional", desc: "Working professional seeking career progression.", icon: "work", color: "#FBBC05" },
  { id: "freelancer", title: "Freelancer / Contract", desc: "Independent consultant or project contractor.", icon: "laptop", color: "#34A853" },
  { id: "intern", title: "Internship Seeker", desc: "Looking for hands-on industry internship experience.", icon: "badge", color: "#AB47BC" },
  { id: "career-switcher", title: "Career Switcher", desc: "Transitioning into a new industry or domain.", icon: "alt_route", color: "#00ACC1" },
];

const categories: { id: JobCategory; title: string; icon: string }[] = [
  { id: "software-engineering", title: "Software Engineering", icon: "code" },
  { id: "customer-support", title: "Customer Support", icon: "headset_mic" },
  { id: "sales", title: "Sales & Growth", icon: "trending_up" },
  { id: "hr", title: "Human Resources", icon: "groups" },
  { id: "data-entry", title: "Data Entry & Admin", icon: "keyboard" },
  { id: "marketing", title: "Marketing & Media", icon: "campaign" },
  { id: "finance", title: "Finance & Accounting", icon: "payments" },
  { id: "operations", title: "Operations", icon: "settings_suggest" },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<CandidateRole | null>(state.candidateRole || "fresher");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(state.jobCategory || "software-engineering");

  const handleNext = () => {
    if (selectedRole && selectedCategory) {
      updateState({ candidateRole: selectedRole, jobCategory: selectedCategory });
      markStepComplete(2);
      router.push("/onboarding/personal-details");
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen relative overflow-hidden">
        {/* Google-Style Ambient Lining Background & Quad Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 grid-bg opacity-35 ml-[116px]" />
        <div
          className="fixed inset-0 pointer-events-none -z-10 ml-[116px]"
          style={{
            background:
              "radial-gradient(ellipse at 85% 15%, rgba(66,133,244,0.1) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(234,67,53,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 10%, rgba(251,188,5,0.06) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(52,168,83,0.08) 0%, transparent 50%)",
          }}
        />

        {/* Top Header */}
        <header
          className="sticky top-0 z-40 h-20 backdrop-blur-xl px-8 flex items-center justify-between"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--primary-container-bg)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary)",
                }}
              >
                Onboarding Step 2/10
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Role & Domain Vector Alignment
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Select Candidate Role & Domain
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              Step 2 of 10
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-8 max-w-[1200px] w-full mx-auto overflow-y-auto">
          {/* Section 1: Candidate Type Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--primary)" }}>
                <span className="material-symbols-outlined text-[18px]">badge</span>
                1. Select Candidate Profile Type
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Tailors AI assessment difficulty
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className="p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative overflow-hidden group hover:scale-[1.015]"
                    style={{
                      backgroundColor: isSelected ? "var(--primary-container-bg)" : "var(--bg-card)",
                      borderColor: isSelected ? "var(--primary)" : "var(--outline)",
                      boxShadow: isSelected ? "var(--shadow-card-hover)" : "var(--shadow-card)",
                    }}
                  >
                    {/* Google Multi-Color Top Lining accent when selected */}
                    {isSelected && (
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5 z-10"
                        style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: isSelected ? "var(--primary)" : "var(--surface-container-high)",
                          color: isSelected ? "#FFF" : r.color,
                        }}
                      >
                        <span className="material-symbols-outlined text-[22px]">{r.icon}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--primary)" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>{r.title}</h3>
                      <p className="text-xs font-semibold leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Target Category Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--secondary)" }}>
                <span className="material-symbols-outlined text-[18px]">domain</span>
                2. Select Target Job Category
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Matches recruiter radar queries
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className="p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group hover:scale-[1.02]"
                    style={{
                      backgroundColor: isSelected ? "var(--secondary-container-bg, rgba(68,138,255,0.12))" : "var(--bg-card)",
                      borderColor: isSelected ? "var(--secondary)" : "var(--outline)",
                      boxShadow: isSelected ? "var(--shadow-card-hover)" : "var(--shadow-card)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: isSelected ? "var(--secondary)" : "var(--text-muted)" }}
                    >
                      {c.icon}
                    </span>
                    <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/welcome"
              className="px-6 h-11 rounded-full font-bold text-xs flex items-center gap-2 transition-all border"
              style={{
                backgroundColor: "var(--surface-container-high)",
                borderColor: "var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Link>

            <button
              onClick={handleNext}
              disabled={!selectedRole || !selectedCategory}
              className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Continue to Personal Info</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
