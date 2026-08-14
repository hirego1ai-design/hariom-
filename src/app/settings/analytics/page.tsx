"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React from "react";

export default function PlatformAnalyticsHubPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">Platform Analytics Hub (G12)</h1>
        <p className="text-text-muted text-sm">Deep-dive analytics across user signups, application volume, interview pass rates, and subscription retention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Candidate Signups</p>
          <h3 className="font-bold text-3xl text-white mt-1">48,420</h3>
          <p className="text-green text-xs mt-2 font-bold">+12.4% MoM</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Applications Submitted</p>
          <h3 className="font-bold text-3xl text-primary mt-1">182,900</h3>
          <p className="text-secondary text-xs mt-2 font-bold">+24% MoM</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Interviews Completed</p>
          <h3 className="font-bold text-3xl text-white mt-1">14,210</h3>
          <p className="text-green text-xs mt-2 font-bold">88.2% completion rate</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Paid Conversion Rate</p>
          <h3 className="font-bold text-3xl text-gold-payment mt-1">2.61%</h3>
          <p className="text-green text-xs mt-2 font-bold">Target &gt; 2.5% met</p>
        </div>
      </div>
    </div>
    </div>
);
}