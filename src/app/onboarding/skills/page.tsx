"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding, SkillEntry } from "@/context/OnboardingContext";

export default function SkillsPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete } = useOnboarding();

  const [skills, setSkills] = useState<SkillEntry[]>(
    state.skills && state.skills.length > 0
      ? state.skills
      : [
          { name: "React.js", level: "advanced" },
          { name: "Node.js", level: "expert" },
          { name: "System Architecture", level: "intermediate" },
          { name: "Python 3", level: "advanced" },
        ]
  );
  const [newSkillName, setNewSkillName] = useState("");

  const levels: SkillEntry["level"][] = ["beginner", "intermediate", "advanced", "expert"];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillName.trim()) {
      setSkills([...skills, { name: newSkillName.trim(), level: "intermediate" }]);
      setNewSkillName("");
    }
  };

  const handleRemove = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const toggleLevel = (name: string) => {
    setSkills(
      skills.map((s) => {
        if (s.name === name) {
          const nextIdx = (levels.indexOf(s.level) + 1) % levels.length;
          return { ...s, level: levels[nextIdx] };
        }
        return s;
      })
    );
  };

  const handleNext = () => {
    updateState({ skills });
    markStepComplete(6);
    router.push("/onboarding/resume-upload");
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
                Onboarding Step 6/10
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Core Competencies & Mastery Levels
              </span>
            </div>
            <h1
              className="text-headline-md font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Technical & Soft Skills Matrix
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
              Step 6 of 10
            </span>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-6 lg:p-12 space-y-6 max-w-[1000px] w-full mx-auto overflow-y-auto">
          {/* Main 3D Bento Card */}
          <div
            className="rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--outline)",
              boxShadow: "var(--shadow-sidebar)",
            }}
          >
            {/* Google Multi-Color Top Border Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 z-20"
              style={{ background: "linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)" }}
            />

            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline)" }}>
              <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>psychology</span>
                Candidate Skill Inventory ({skills.length})
              </h2>
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Click pill level tag to cycle mastery
              </span>
            </div>

            {/* Quick Add Input Form */}
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. Next.js, Kubernetes, Tailwind CSS..."
                className="flex-1 h-11 px-4 rounded-full outline-none text-xs font-semibold transition-all"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1.5px solid var(--outline)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--outline)";
                }}
              />
              <button
                type="submit"
                className="px-6 h-11 rounded-full text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                  boxShadow: "var(--shadow-btn-red)",
                }}
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Skill
              </button>
            </form>

            {/* Skill Chips Grid */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all shadow-sm"
                  style={{
                    backgroundColor: "var(--surface-container-high)",
                    borderColor: "var(--outline)",
                  }}
                >
                  <span className="font-extrabold text-xs" style={{ color: "var(--text-primary)" }}>
                    {skill.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleLevel(skill.name)}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all"
                    style={{
                      backgroundColor: "var(--primary-container-bg)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    {skill.level} ⟳
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(skill.name)}
                    className="hover:opacity-75 transition-opacity text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: "var(--outline)" }}>
            <Link
              href="/onboarding/experience"
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
              className="px-8 h-11 rounded-full text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                boxShadow: "var(--shadow-btn-red)",
              }}
            >
              <span>Next: Upload Resume</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}