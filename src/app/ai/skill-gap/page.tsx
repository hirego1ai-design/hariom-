"use client";
import React from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function SkillGapPage() {
  const skills = [
    { name: "React 19 & Server Components", level: 95, target: 90, status: "Proficient ✓" },
    { name: "TypeScript Strict Mode", level: 92, target: 85, status: "Proficient ✓" },
    { name: "GraphQL & Relay", level: 60, target: 80, status: "Gap Identified ⚠️" },
    { name: "Docker & Kubernetes", level: 45, target: 70, status: "Gap Identified ⚠️" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              CF05 Module
            </span>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight mt-0.5">
              Skill Gap Matrix & Learning Path
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Dashboard
          </Link>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            {skills.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{s.name}</span>
                  <span className={s.level >= s.target ? "text-green font-bold" : "text-yellow font-bold"}>{s.status}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000" style={{ width: `${s.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
