"use client";

import { useEffect, useMemo, useState } from "react";
import type { SkillLevel, SkillPriority, RoleDefinition, RoleSkillSuggestion } from "@/lib/skill-master";

export type SelectedRoleSkill = {
  name: string;
  level: SkillLevel;
  priority: SkillPriority;
  isCustom?: boolean;
};

type RoleSkillSelectorProps = {
  role: string;
  onRoleChange: (role: string) => void;
  selectedSkills: SelectedRoleSkill[];
  onSelectedSkillsChange: (skills: SelectedRoleSkill[]) => void;
  mode: "candidate" | "employer";
  roleEditable?: boolean;
};

const levels: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];

export default function RoleSkillSelector({
  role,
  onRoleChange,
  selectedSkills,
  onSelectedSkillsChange,
  mode,
  roleEditable = true,
}: RoleSkillSelectorProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [suggestions, setSuggestions] = useState<RoleSkillSuggestion[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillResults, setSkillResults] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/skill-master?type=roles&q=${encodeURIComponent(role)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { roles: [] })
      .then((data) => setRoles(data.roles || []))
      .catch(() => {});
    return () => controller.abort();
  }, [role]);

  useEffect(() => {
    if (!role.trim()) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetch(`/api/skill-master?type=suggestions&role=${encodeURIComponent(role)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { skills: [] })
      .then((data) => setSuggestions(data.skills || []))
      .catch(() => setSuggestions([]))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [role]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/skill-master?type=skills&q=${encodeURIComponent(skillSearch)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { skills: [] })
      .then((data) => setSkillResults(data.skills || []))
      .catch(() => {});
    return () => controller.abort();
  }, [skillSearch]);

  const selectedNames = useMemo(() => new Set(selectedSkills.map((skill) => skill.name.toLowerCase())), [selectedSkills]);

  const toggleSkill = (name: string, defaults?: Partial<SelectedRoleSkill>) => {
    if (selectedNames.has(name.toLowerCase())) {
      onSelectedSkillsChange(selectedSkills.filter((skill) => skill.name.toLowerCase() !== name.toLowerCase()));
      return;
    }
    onSelectedSkillsChange([
      ...selectedSkills,
      { name, level: defaults?.level || "intermediate", priority: defaults?.priority || "preferred", isCustom: defaults?.isCustom },
    ]);
  };

  const updateSkill = (name: string, updates: Partial<SelectedRoleSkill>) => {
    onSelectedSkillsChange(selectedSkills.map((skill) => skill.name === name ? { ...skill, ...updates } : skill));
  };

  const addCustomSkill = async () => {
    const name = customSkill.trim();
    if (!name || selectedNames.has(name.toLowerCase())) return;
    setIsSubmittingCustom(true);
    try {
      await fetch("/api/skill-master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });
    } finally {
      toggleSkill(name, { isCustom: true });
      setCustomSkill("");
      setIsSubmittingCustom(false);
    }
  };

  const renderSuggestionGroup = (priority: SkillPriority, title: string, description: string) => {
    const group = suggestions.filter((skill) => skill.priority === priority);
    if (!group.length) return null;
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: priority === "required" ? "var(--primary)" : "var(--text-secondary)" }}>{title}</h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {group.map((skill) => {
            const isSelected = selectedNames.has(skill.name.toLowerCase());
            return (
              <label key={skill.name} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" style={{ backgroundColor: isSelected ? "var(--primary-container-bg)" : "var(--surface-container-high)", borderColor: isSelected ? "var(--primary)" : "var(--outline)" }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSkill(skill.name, { level: skill.recommendedLevel, priority: skill.priority })} className="accent-red-500" />
                <span className="min-w-0 flex-1 text-xs font-bold" style={{ color: "var(--text-primary)" }}>{skill.name}</span>
                <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{skill.category}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 relative">
        <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
          {mode === "candidate" ? "Target or current job role" : "Selected job role"}
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: "var(--text-muted)" }}>work</span>
          <input value={role} readOnly={!roleEditable} onChange={(event) => onRoleChange(event.target.value)} placeholder="Search a role, e.g. Software Developer" className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--outline)", color: "var(--text-primary)" }} />
        </div>
        {roleEditable && role.trim() && roles.length > 0 && (
          <div className="absolute z-20 w-full max-h-48 overflow-y-auto rounded-xl border shadow-xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--outline)" }}>
            {roles.map((item) => (
              <button key={item.title} type="button" onClick={() => onRoleChange(item.title)} className="w-full text-left px-4 py-3 hover:opacity-80 border-b last:border-b-0" style={{ borderColor: "var(--outline)" }}>
                <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.department} · {item.industry}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading role-specific skills…</p>}
      {!isLoading && role.trim() && suggestions.length === 0 && <p className="text-xs" style={{ color: "var(--text-muted)" }}>No mapped skills yet. Search or add a skill below; new suggestions are reviewed by an admin.</p>}

      {mode === "candidate" ? (
        <>
          {suggestions.length > 0 && <section className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "var(--surface-container-high)", border: "1px solid var(--outline)" }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: "#35d07f" }}>check_circle</span>
              <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Suggested Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {suggestions.map((skill) => {
                const isSelected = selectedNames.has(skill.name.toLowerCase());
                return <button key={skill.name} type="button" onClick={() => toggleSkill(skill.name, { level: skill.recommendedLevel, priority: skill.priority })} className="px-3.5 h-9 rounded-full border text-xs font-bold transition-colors" style={{ color: isSelected ? "#fff" : "var(--text-primary)", borderColor: isSelected ? "var(--primary)" : "var(--outline)", backgroundColor: isSelected ? "var(--primary)" : "var(--bg-card)" }}>{isSelected ? "✓ " : "+ "}{skill.name}</button>;
              })}
            </div>
          </section>}

          <div className="space-y-2">
            <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Add Custom Skill</label>
            <div className="flex gap-2">
              <input value={customSkill} onChange={(event) => { setCustomSkill(event.target.value); setSkillSearch(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addCustomSkill(); } }} placeholder="e.g., React, Python…" className="flex-1 h-11 px-4 rounded-xl text-sm outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--outline)", color: "var(--text-primary)" }} />
              <button type="button" onClick={() => void addCustomSkill()} disabled={!customSkill.trim() || isSubmittingCustom} className="px-6 rounded-xl text-xs font-extrabold text-white disabled:opacity-50" style={{ backgroundColor: "var(--primary)" }}>{isSubmittingCustom ? "Adding…" : "Add"}</button>
            </div>
            {customSkill && skillResults.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{skillResults.map((name) => <button key={name} type="button" onClick={() => { toggleSkill(name); setCustomSkill(""); setSkillSearch(""); }} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={{ color: "var(--text-primary)", borderColor: "var(--outline)", backgroundColor: "var(--surface-container-high)" }}>+ {name}</button>)}</div>}
          </div>
        </>
      ) : (
        <>
          {renderSuggestionGroup("required", "Core skills", "Select the skills candidates must have.")}
          {renderSuggestionGroup("preferred", "Additional skills", "Useful skills that are not mandatory.")}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--outline)" }}>
            <label className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Find another skill</label>
            <input value={skillSearch} onChange={(event) => setSkillSearch(event.target.value)} placeholder="Search the skill master" className="w-full h-10 px-4 rounded-xl text-sm outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--outline)", color: "var(--text-primary)" }} />
            {skillSearch && skillResults.length > 0 && <div className="flex flex-wrap gap-2">{skillResults.map((name) => <button key={name} type="button" onClick={() => toggleSkill(name)} className="px-3 py-1.5 rounded-full text-xs font-bold border" style={{ color: "var(--text-primary)", borderColor: "var(--outline)", backgroundColor: selectedNames.has(name.toLowerCase()) ? "var(--primary-container-bg)" : "var(--surface-container-high)" }}>{selectedNames.has(name.toLowerCase()) ? "✓ " : "+ "}{name}</button>)}</div>}
          </div>
          <div className="flex gap-2">
            <input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addCustomSkill(); } }} placeholder="Add a missing skill" className="flex-1 h-10 px-4 rounded-xl text-sm outline-none" style={{ backgroundColor: "var(--bg-input)", border: "1px dashed var(--outline)", color: "var(--text-primary)" }} />
            <button type="button" onClick={() => void addCustomSkill()} disabled={!customSkill.trim() || isSubmittingCustom} className="px-4 rounded-xl text-xs font-extrabold text-white disabled:opacity-50" style={{ backgroundColor: "var(--primary)" }}>{isSubmittingCustom ? "Adding…" : "Add skill"}</button>
          </div>
        </>
      )}

      {selectedSkills.length > 0 && <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--outline)" }}>
        <h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{mode === "candidate" ? "Your Skills" : `Selected skills (${selectedSkills.length})`}</h3>
        <div className="space-y-2">
          {selectedSkills.map((skill) => <div key={skill.name} className="flex flex-wrap items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--surface-container-high)" }}>
            <span className="text-sm font-bold mr-auto" style={{ color: "var(--text-primary)" }}>{skill.name}{skill.isCustom ? <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Pending review</span> : null}</span>
            {mode === "candidate" ? <select value={skill.level} onChange={(event) => updateSkill(skill.name, { level: event.target.value as SkillLevel })} className="h-8 px-2 rounded-lg text-xs" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--outline)" }}>{levels.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select> : <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--outline)" }}>{(["required", "preferred"] as SkillPriority[]).map((priority) => <button key={priority} type="button" onClick={() => updateSkill(skill.name, { priority })} className="px-2.5 h-8 text-[10px] font-extrabold uppercase" style={{ backgroundColor: skill.priority === priority ? "var(--primary)" : "var(--bg-input)", color: skill.priority === priority ? "#fff" : "var(--text-secondary)" }}>{priority}</button>)}</div>}
            <button type="button" onClick={() => toggleSkill(skill.name)} className="material-symbols-outlined text-[18px]" style={{ color: "var(--text-muted)" }}>close</button>
          </div>)}
        </div>
      </div>}
    </div>
  );
}
