"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function ResumeScorePage() {
  const [score, setScore] = useState(88);
  const [suggestions, setSuggestions] = useState([
    "Add quantitative metrics (e.g. 'Improved speed by 40%')",
    "Include System Design & Micro-frontends keywords",
    "Add 2 GitHub repository links to project section"
  ]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              CF04 Module
            </span>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight mt-0.5">
              AI Resume Score & Optimizer
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center space-y-2 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center font-bold text-3xl text-white bg-primary/10">
                {score}/100
              </div>
              <h3 className="font-bold text-base text-white">ATS HireScore</h3>
              <p className="text-xs text-green font-bold">Top 5% of Candidates</p>
            </div>

            <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-white/10 space-y-3">
              <h3 className="font-bold text-base text-white">AI Enhancement Suggestions</h3>
              <ul className="space-y-2">
                {suggestions.map((item, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
