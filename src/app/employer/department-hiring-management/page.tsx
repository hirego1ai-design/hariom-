"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE57() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
<div>
<h1 className="font-display-lg text-display-lg text-text-primary mb-2">Departmental Overview</h1>
<p className="font-body-md text-text-secondary">Global talent acquisition performance across all functional divisions.</p>
</div>
<div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-full border border-white/5">
<button className="px-6 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md">Real-time</button>
<button className="px-6 py-2 rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-label-md">Last 30 Days</button>
</div>
</header>
{/*  Filter Chips  */}
<section className="flex flex-wrap gap-stack-sm mb-6">
<button className="px-5 py-2 rounded-full bg-primary-container text-white border border-primary/20 font-label-md text-label-md">All Departments</button>
<button className="px-5 py-2 rounded-full bg-bg-card text-on-surface-variant border border-white/10 hover:border-primary/50 transition-colors font-label-md text-label-md">Engineering</button>
<button className="px-5 py-2 rounded-full bg-bg-card text-on-surface-variant border border-white/10 hover:border-primary/50 transition-colors font-label-md text-label-md">Marketing</button>
<button className="px-5 py-2 rounded-full bg-bg-card text-on-surface-variant border border-white/10 hover:border-primary/50 transition-colors font-label-md text-label-md">Sales</button>
<button className="px-5 py-2 rounded-full bg-bg-card text-on-surface-variant border border-white/10 hover:border-primary/50 transition-colors font-label-md text-label-md">HR</button>
<button className="px-5 py-2 rounded-full bg-bg-card text-on-surface-variant border border-white/10 hover:border-primary/50 transition-colors font-label-md text-label-md">Finance</button>
</section>
{/*  KPI Rows & Detail View (Bento Style)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Department KPI Summary (Engineering - Featured)  */}
<div className="lg:col-span-12 glass-card rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-secondary">
<div className="flex items-center gap-4 min-w-[200px]">
<div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
<span className="material-symbols-outlined text-secondary">terminal</span>
</div>
<div>
<h3 className="font-headline-md text-headline-md text-text-primary">Engineering</h3>
<p className="text-secondary font-label-md">Core Product &amp; AI Team</p>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-stack-lg flex-1">
<div className="text-center md:text-left">
<p className="font-label-md text-text-muted uppercase tracking-tighter">Open Roles</p>
<p className="font-data-lg text-data-lg text-text-primary">14</p>
</div>
<div className="text-center md:text-left">
<p className="font-label-md text-text-muted uppercase tracking-tighter">Applicants</p>
<p className="font-data-lg text-data-lg text-text-primary">842</p>
</div>
<div className="text-center md:text-left">
<p className="font-label-md text-text-muted uppercase tracking-tighter">Interviews</p>
<p className="font-data-lg text-data-lg text-yellow">28</p>
</div>
<div className="text-center md:text-left">
<p className="font-label-md text-text-muted uppercase tracking-tighter">Hires</p>
<p className="font-data-lg text-data-lg text-green">12</p>
</div>
</div>
<a className="flex items-center gap-2 text-primary font-bold hover:underline" href="#">
                    View Department Details
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
{/*  Pipeline Visualization (Left)  */}
<div className="lg:col-span-7 glass-card rounded-lg p-8">
<div className="flex items-center justify-between mb-8">
<h4 className="font-headline-md text-headline-md">Hiring Pipeline</h4>
<span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[12px] text-text-muted">Live Tracking</span>
</div>
<div className="flex items-center justify-between w-full relative h-40">
{/*  Progress Line Background  */}
<div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2"></div>
{/*  Nodes  */}
<div className="flex flex-col items-center gap-3 relative z-10">
<div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-[0_0_20px_rgba(173,198,255,0.4)]">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
</div>
<p className="font-label-md text-text-primary">Sourcing</p>
<p className="font-data-md text-secondary">312</p>
</div>
<div className="flex flex-col items-center gap-3 relative z-10">
<div className="w-12 h-12 rounded-full bg-bg-elevated border border-white/20 flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined">assignment</span>
</div>
<p className="font-label-md text-on-surface-variant">Technical Test</p>
<p className="font-data-md text-text-muted">145</p>
</div>
<div className="flex flex-col items-center gap-3 relative z-10">
<div className="w-12 h-12 rounded-full bg-bg-elevated border border-white/20 flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined">forum</span>
</div>
<p className="font-label-md text-on-surface-variant">Interviews</p>
<p className="font-data-md text-text-muted">28</p>
</div>
<div className="flex flex-col items-center gap-3 relative z-10">
<div className="w-12 h-12 rounded-full bg-bg-elevated border border-white/20 flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined">handshake</span>
</div>
<p className="font-label-md text-on-surface-variant">Offer</p>
<p className="font-data-md text-text-muted">6</p>
</div>
</div>
<div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/5">
<div className="flex items-center gap-3 mb-2">
<span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
<p className="font-label-md text-text-primary">AI Insight</p>
</div>
<p className="text-body-md text-text-secondary leading-relaxed">The <span className="text-primary font-bold">Engineering</span> department's pipeline is healthy, but "Technical Test" phase is taking 24% longer than average. Recommend enabling AI-auto-grading for React roles.</p>
</div>
</div>
{/*  Dept Specific Metrics (Right)  */}
<div className="lg:col-span-5 flex flex-col gap-6">
<div className="glass-card rounded-lg p-6 flex-1">
<h4 className="font-label-md text-text-muted uppercase mb-4">Department Velocity</h4>
<div className="space-y-6">
<div>
<div className="flex justify-between items-center mb-2">
<p className="font-body-md text-text-primary">Time to Fill</p>
<p className="font-data-md text-primary">18 Days</p>
</div>
<div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
<div className="bg-primary h-full w-[70%]"></div>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-2">
<p className="font-body-md text-text-primary">Offer Acceptance Rate</p>
<p className="font-data-md text-green">92%</p>
</div>
<div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
<div className="bg-green h-full w-[92%]"></div>
</div>
</div>
<div>
<div className="flex justify-between items-center mb-2">
<p className="font-body-md text-text-primary">Diversity Score</p>
<p className="font-data-md text-secondary">8.4/10</p>
</div>
<div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
<div className="bg-secondary h-full w-[84%]"></div>
</div>
</div>
</div>
</div>
<div className="glass-card rounded-lg p-6">
<h4 className="font-label-md text-text-muted uppercase mb-4">Top Recruiters</h4>
<div className="flex -space-x-3 mb-4">
<img className="w-10 h-10 rounded-full border-2 border-[#1e1e1e] object-cover" data-alt="Recruiter profile photo, clean background, high contrast, matching the tech-focused AI brand aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4F1h7Kis4CeKiCAFCKGKAIu9B86mP6dxX7NSeVo50y1JI61j0CLn1zNI-nE-5OgSzCdqvCKf7pNX1gH8U2Rw70ZDTylXT-MN-kLs5m1NquA5ifbpxDxUvVdDHq5NOQPoImY8mgR9qIMGygWGyeIkQjZz0h_VGNTXOAFYLhOdpDECN9nBQ4lxDuWjvGW2sx2TiaKDkff2jmguSGdJECsFSPvomSp_uFC8EgYEbOMqGuvO6L6ofQVUhAtyLJ7FwSv7tzpl9WVyQbCs" />
<img className="w-10 h-10 rounded-full border-2 border-[#1e1e1e] object-cover" data-alt="Recruiter profile photo, clean background, high contrast, matching the tech-focused AI brand aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj0kJP-bGHrZ9FPUG88SLD_th7psjItc0ybBnoerz7Ani0gR22yFl9bUlPhk4KIsCYXNBFJ7Wm6BiBjQbR3zEKwguc4oo4bW39dK2pm076Tsu0K0A6nJN7mpwvsK4rETDxBscV2kwInWK44QtG2ctWfH498e9KvCujhhLxYgM-IwE5pcYrADVnPMHapkVbDqq7MCEALN3bmchpxUlHT6zsen2qoCXXo0wtu1btD6-ZV9o0o1k4QbOgPrZJxvm8WKA-9E4YMdbnxvI" />
<img className="w-10 h-10 rounded-full border-2 border-[#1e1e1e] object-cover" data-alt="Recruiter profile photo, clean background, high contrast, matching the tech-focused AI brand aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlSoxEgpaqzs1ZHs22HKeyelM0ITA_fKhCtByHknzctHmozLldgFPqAoRf7xuXoEKyfNubfBwtkjA90-eG4lNCDi4M3vai7YKacb9xRGDiOBa0XDqg60oF8n5WvL8B4EY93Eyp-cWR9h8q4iAmrcmySjYsgTI26bksj1zMbM2P-B52xlvtJcqouV09u6recREgUH6O7PksRUdn3SfRMzxdZqCYAoJ4-xewCjZXMPuEmmqUwSEp9OEzwVwfxAgDLjSULrvf5N7Svho" />
<div className="w-10 h-10 rounded-full border-2 border-[#1e1e1e] bg-bg-subtle flex items-center justify-center text-[12px] font-bold">+4</div>
</div>
<p className="text-body-md text-text-secondary">Recruiting team has increased throughput by <span className="text-green font-bold">12%</span> this quarter.</p>
</div>
</div>
{/*  Other Departments (Secondary Grid)  */}
<div className="lg:col-span-6 glass-card rounded-lg p-6 border-l-4 border-l-red-light">
<div className="flex items-center justify-between mb-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-red-light/10 flex items-center justify-center text-red-light">
<span className="material-symbols-outlined">campaign</span>
</div>
<div>
<h5 className="font-body-lg text-text-primary font-bold">Marketing</h5>
<p className="text-xs text-text-muted">3 Active Campaigns</p>
</div>
</div>
<div className="text-right">
<p className="font-data-lg text-text-primary">8 Roles</p>
<p className="text-xs text-text-muted">450 Apps</p>
</div>
</div>
<div className="flex justify-between items-center pt-4 border-t border-white/5">
<div className="flex gap-4">
<div className="text-center">
<p className="text-[10px] text-text-muted uppercase">Intv</p>
<p className="font-data-md">12</p>
</div>
<div className="text-center">
<p className="text-[10px] text-text-muted uppercase">Hires</p>
<p className="font-data-md">4</p>
</div>
</div>
<a className="text-primary text-sm font-bold" href="#">Details</a>
</div>
</div>
<div className="lg:col-span-6 glass-card rounded-lg p-6 border-l-4 border-l-yellow">
<div className="flex items-center justify-between mb-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-yellow/10 flex items-center justify-center text-yellow">
<span className="material-symbols-outlined">payments</span>
</div>
<div>
<h5 className="font-body-lg text-text-primary font-bold">Sales</h5>
<p className="text-xs text-text-muted">High Urgency</p>
</div>
</div>
<div className="text-right">
<p className="font-data-lg text-text-primary">12 Roles</p>
<p className="text-xs text-text-muted">620 Apps</p>
</div>
</div>
<div className="flex justify-between items-center pt-4 border-t border-white/5">
<div className="flex gap-4">
<div className="text-center">
<p className="text-[10px] text-text-muted uppercase">Intv</p>
<p className="font-data-md">45</p>
</div>
<div className="text-center">
<p className="text-[10px] text-text-muted uppercase">Hires</p>
<p className="font-data-md">8</p>
</div>
</div>
<a className="text-primary text-sm font-bold" href="#">Details</a>
</div>
</div>
</div>

    </PageContainer>
  );
}
