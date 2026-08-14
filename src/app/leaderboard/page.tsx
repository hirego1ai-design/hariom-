"use client";
import React from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function LeaderboardPage() {
  const leaders = [
    { rank: 1, name: "Aarav Sharma", score: 98, badge: "Grandmaster 🏆" },
    { rank: 2, name: "Priya Patel", score: 96, badge: "Expert ⭐️" },
    { rank: 3, name: "Rahul Verma (You)", score: 94, badge: "Master 🚀" },
    { rank: 4, name: "Ananya Roy", score: 91, badge: "Pro ⚡" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
              CF09 Module
            </span>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight mt-0.5">
              Platform Gamification Leaderboard
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
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">HireScore</th>
                  <th className="p-4">Badge Title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((l) => (
                  <tr key={l.rank} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">#{l.rank}</td>
                    <td className="p-4 font-bold text-white">{l.name}</td>
                    <td className="p-4 font-bold text-green">{l.score}/100</td>
                    <td className="p-4 text-gold-payment font-bold">{l.badge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
