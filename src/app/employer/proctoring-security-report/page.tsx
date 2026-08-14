"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE8() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Top Nav Replacement/Breadcrumb  */}
<header className="flex items-center justify-between mb-12">
<div className="flex items-center gap-4">
<button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10">
<span className="material-symbols-outlined text-primary">arrow_back</span>
</button>
<div>
<h2 className="font-display-lg text-display-lg text-text-primary">Proctoring Security Analysis</h2>
<p className="font-body-md text-text-secondary">Candidate: Alex Rivera • Senior Frontend Engineer • Assessment ID: #HA-8821</p>
</div>
</div>
<div className="hidden md:flex items-center gap-4 bg-surface-container-high px-6 py-2 rounded-full border border-white/5">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
<span className="font-label-md text-green">Proctor Active</span>
</div>
<div className="w-[1px] h-4 bg-white/10"></div>
<span className="font-data-md text-text-primary">100% Analysis Complete</span>
</div>
</header>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Integrity Score Section  */}
<section className="lg:col-span-4 glass-card p-stack-lg flex flex-col items-center justify-center text-center">
<h3 className="font-headline-md text-headline-md mb-8">Integrity Score</h3>
<div className="relative w-48 h-48 mb-8">
<div className="score-ring w-full h-full rounded-full flex items-center justify-center p-4">
<div className="bg-bg-card w-full h-full rounded-full flex flex-col items-center justify-center">
<span className="font-display-xl text-display-xl text-primary">96</span>
<span className="font-label-md text-on-surface-variant">/ 100</span>
</div>
</div>
{/*  Tiny Pulsing Glow  */}
<div className="absolute inset-0 rounded-full blur-2xl bg-primary/20 -z-10 animate-pulse"></div>
</div>
<div className="flex flex-col gap-2">
<span className="font-headline-md text-green text-2xl">High Trust</span>
<p className="font-body-md text-text-muted px-4 text-sm">Automated AI verification confirms the candidate's environment remained secure throughout the 45-minute session.</p>
</div>
</section>
{/*  2x3 Metrics Grid  */}
<section className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-stack-md">
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-green/30">
<div className="flex items-center gap-2 mb-4 text-green">
<span className="material-symbols-outlined">face</span>
<span className="font-label-md uppercase tracking-wider text-xs">Face Visible</span>
</div>
<span className="font-data-lg text-display-lg">100%</span>
</div>
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-green/30">
<div className="flex items-center gap-2 mb-4 text-green">
<span className="material-symbols-outlined">person</span>
<span className="font-label-md uppercase tracking-wider text-xs">Single Person</span>
</div>
<span className="font-data-lg text-display-lg">Valid</span>
</div>
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-yellow/30">
<div className="flex items-center gap-2 mb-4 text-yellow">
<span className="material-symbols-outlined">tab_unselected</span>
<span className="font-label-md uppercase tracking-wider text-xs">Tab Switches</span>
</div>
<span className="font-data-lg text-display-lg">2</span>
</div>
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-green/30">
<div className="flex items-center gap-2 mb-4 text-green">
<span className="material-symbols-outlined">content_paste_off</span>
<span className="font-label-md uppercase tracking-wider text-xs">Copy Attempts</span>
</div>
<span className="font-data-lg text-display-lg">0</span>
</div>
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-primary/30">
<div className="flex items-center gap-2 mb-4 text-primary">
<span className="material-symbols-outlined">warning</span>
<span className="font-label-md uppercase tracking-wider text-xs">Total Violations</span>
</div>
<span className="font-data-lg text-display-lg">3</span>
</div>
<div className="glass-card p-6 flex flex-col justify-between border-b-2 border-b-yellow/30">
<div className="flex items-center gap-2 mb-4 text-yellow">
<span className="material-symbols-outlined">timer_off</span>
<span className="font-label-md uppercase tracking-wider text-xs">Outside Frame</span>
</div>
<span className="font-data-lg text-display-lg">12s</span>
</div>
</section>
{/*  Activity Timeline & Violation Details (Side by Side)  */}
<section className="lg:col-span-12 grid grid-cols-1 xl:grid-cols-5 gap-6">
{/*  Reverse Chronological Events  */}
<div className="xl:col-span-3 glass-card p-stack-lg">
<h3 className="font-headline-md text-headline-md mb-8 flex items-center gap-3">
<span className="material-symbols-outlined">timeline</span>
            Activity Timeline
          </h3>
<div className="space-y-6 max-h-[600px] overflow-y-auto no-scrollbar pr-4">
{/*  Event 1 (Violation)  */}
<div className="relative pl-8 border-l-2 border-primary/30 py-2">
<div className="absolute -left-[9px] top-4 w-4 h-4 bg-primary rounded-full ring-4 ring-primary/20"></div>
<div className="flex justify-between items-start mb-2">
<h4 className="font-bold text-primary">Off-screen Tab Navigation</h4>
<span className="font-data-md text-xs text-text-muted">14:22:45</span>
</div>
<p className="font-body-md text-text-secondary text-sm mb-4">The candidate switched focus to a secondary browser window. Captured URL: "StackOverflow - Redux Middleware".</p>
<div className="flex gap-4">
<div className="w-48 h-28 rounded-lg overflow-hidden border border-white/10 hover:border-primary/50 transition-colors group cursor-pointer relative">
<div className="bg-cover bg-center w-full h-full" data-alt="A high-tech digital screenshot of a computer monitor in a dark room, showing a coding interface with a browser tab slightly visible in the background, captured in a cinematic proctoring security style with red digital markers, 4k resolution, dark mode aesthetic." ></div>
<div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
<span className="material-symbols-outlined text-white">zoom_in</span>
</div>
</div>
<div className="flex-1 p-3 bg-white/5 rounded-lg border border-white/5">
<span className="font-label-md text-primary text-xs uppercase tracking-widest block mb-1">AI Context Note</span>
<p className="text-xs text-text-secondary italic">"Context analysis suggests searching for specific API documentation. Severity: High."</p>
</div>
</div>
</div>
{/*  Event 2  */}
<div className="relative pl-8 border-l-2 border-white/10 py-2 opacity-80">
<div className="absolute -left-[9px] top-4 w-4 h-4 bg-white/20 rounded-full"></div>
<div className="flex justify-between items-start mb-2">
<h4 className="font-bold text-text-primary">Eye Tracking Divergence</h4>
<span className="font-data-md text-xs text-text-muted">14:15:10</span>
</div>
<p className="font-body-md text-text-secondary text-sm">Gaze detected outside of primary workspace for 4.5s. Potential mobile device usage suspected but not visually confirmed.</p>
</div>
{/*  Event 3  */}
<div className="relative pl-8 border-l-2 border-white/10 py-2 opacity-80">
<div className="absolute -left-[9px] top-4 w-4 h-4 bg-white/20 rounded-full"></div>
<div className="flex justify-between items-start mb-2">
<h4 className="font-bold text-text-primary">Session Initialized</h4>
<span className="font-data-md text-xs text-text-muted">14:00:00</span>
</div>
<p className="font-body-md text-text-secondary text-sm">Biometric facial scan completed. Identity match 99.4% with government ID.</p>
</div>
</div>
</div>
{/*  Verdict & Controls  */}
<div className="xl:col-span-2 space-y-gutter">
<div className="glass-card p-stack-lg">
<h3 className="font-headline-md text-headline-md mb-6">Employer Verdict</h3>
<div className="space-y-4 mb-8">
<label className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-all group">
<input defaultChecked className="w-5 h-5 text-green bg-bg-card border-white/20 focus:ring-green" name="verdict" type="radio" />
<div>
<p className="font-bold text-text-primary">Legitimate</p>
<p className="text-xs text-text-muted">Violations deemed minor or false positives.</p>
</div>
</label>
<label className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-all group">
<input className="w-5 h-5 text-yellow bg-bg-card border-white/20 focus:ring-yellow" name="verdict" type="radio" />
<div>
<p className="font-bold text-text-primary">Have Concerns</p>
<p className="text-xs text-text-muted">Flags require a follow-up interview for clarity.</p>
</div>
</label>
<label className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:bg-white/10 cursor-pointer transition-all group">
<input className="w-5 h-5 text-primary bg-bg-card border-white/20 focus:ring-primary" name="verdict" type="radio" />
<div>
<p className="font-bold text-primary">Reject for Integrity</p>
<p className="text-xs text-text-muted">Definitive violation of assessment guidelines.</p>
</div>
</label>
</div>
<div className="space-y-4">
<label className="block font-label-md text-text-secondary mb-2">Final Evaluation Notes</label>
<textarea className="w-full bg-bg-card border border-white/10 rounded-xl p-4 h-32 focus:border-primary focus:ring-0 transition-all text-body-md" placeholder="Add your assessment summary here..."></textarea>
<button className="w-full h-[50px] rounded-full btn-3d-red font-bold text-white flex items-center justify-center gap-2 mt-4">
<span className="material-symbols-outlined">verified_user</span>
                Save Assessment
              </button>
</div>
</div>
<div className="glass-card p-stack-lg border-2 border-dashed border-white/10 flex items-center justify-center gap-3 cursor-pointer hover:border-secondary transition-colors">
<span className="material-symbols-outlined text-secondary">file_download</span>
<span className="font-bold text-secondary">Download PDF Report</span>
</div>
</div>
</section>
</div>

    </PageContainer>
  );
}
