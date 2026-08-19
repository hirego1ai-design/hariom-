"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useJobCreationStore } from "@/store/useJobCreationStore";
import RoleSkillSelector, { SelectedRoleSkill } from "@/components/skills/RoleSkillSelector";

export default function JobRequirementsPage() {
  const router = useRouter();
  const store = useJobCreationStore();
  const role = store.selectedRoles[0] || "";
  const selectedSkills: SelectedRoleSkill[] = (store.skillRequirements.length ? store.skillRequirements : store.skillTags.map((name) => ({ name, priority: "preferred" as const }))).map((skill) => ({ ...skill, level: "intermediate" }));

  const updateSkills = (skills: SelectedRoleSkill[]) => {
    const requirements = skills.map(({ name, priority }) => ({ name, priority }));
    store.updateField("skillRequirements", requirements);
    store.updateField("skillTags", requirements.map((skill) => skill.name));
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <div className="max-w-5xl mx-auto p-6 lg:p-10">
        <div className="mb-8">
          <button onClick={() => router.push("/employer/create-job-ai-jd-writing")} className="material-symbols-outlined hover:bg-white/10 rounded-full p-1 transition-colors text-primary">arrow_back</button>
          <p className="font-label-md text-label-md uppercase tracking-widest opacity-60 text-primary mt-3">Job requirements</p>
          <h1 className="font-display-lg text-display-lg text-primary mt-2">Choose the right skills</h1>
          <p className="text-text-secondary font-body-md mt-2 max-w-2xl">Role-based suggestions are shown first. Mark each selected skill as required or preferred so matching stays accurate.</p>
        </div>

        {!role ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-primary text-3xl">work</span>
            <h2 className="font-headline-md text-xl mt-3">Select a job role first</h2>
            <p className="text-text-secondary text-sm mt-2">We use the role to show relevant skills instead of a long unrelated list.</p>
            <button onClick={() => router.push("/employer/create-job-basic-info")} className="btn-primary-red h-11 px-6 rounded-full text-white font-bold text-sm mt-5">Choose job role</button>
          </div>
        ) : (
          <section className="glass-card rounded-xl p-6 lg:p-8">
            <RoleSkillSelector role={role} onRoleChange={() => {}} selectedSkills={selectedSkills} onSelectedSkillsChange={updateSkills} mode="employer" roleEditable={false} />
          </section>
        )}

        <div className="flex items-center justify-between pt-8">
          <button onClick={() => router.push("/employer/create-job-ai-jd-writing")} className="btn-ghost h-[50px] px-8 rounded-full text-on-surface font-bold flex items-center gap-2 group hover:bg-white/5">
            <span className="material-symbols-outlined">chevron_left</span>Back
          </button>
          <button onClick={() => router.push("/employer/job-listings-management")} disabled={!role} className="btn-primary-red h-[50px] px-10 rounded-full text-white font-bold flex items-center gap-2 disabled:opacity-50">
            Publish Job<span className="material-symbols-outlined">rocket_launch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
