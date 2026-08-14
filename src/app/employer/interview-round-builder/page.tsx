"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE9() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
<div>
<nav className="flex items-center gap-2 text-text-muted text-label-md mb-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/dashboard">Dashboard</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/hiring-pipeline">Talent</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/upcoming-interviews-list">Interviews</a>
    </nav>
<h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-text-primary tracking-tight">Define Your Interview Rounds</h2>
</div>
<button className="h-[50px] px-8 btn-3d-red rounded-full flex items-center justify-center gap-2 text-white font-bold group">
<span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                Add Round
            </button>
</header>
{/*  Builder Area  */}
<div className="max-w-[900px] space-y-6">
{/*  Round 1: Initial Screening  */}
<div className="glass-card rounded-lg overflow-hidden group/card transition-all hover:border-white/20">
{/*  Header / Collapsed State  */}
<div className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/[0.02]">
<div className="flex items-center gap-4">
<div className="drag-handle text-text-muted hover:text-white transition-colors">
<span className="material-symbols-outlined">drag_indicator</span>
</div>
<div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container font-bold text-sm">1</div>
<div>
<h3 className="font-headline-md text-text-primary">Initial AI Screening</h3>
<p className="text-text-muted text-label-md flex items-center gap-2">
<span className="material-symbols-outlined text-[14px]">schedule</span> 15 mins • 
                                <span className="material-symbols-outlined text-[14px]">psychology</span> AI Proctoring Enabled
                            </p>
</div>
</div>
<div className="flex items-center gap-3">
<span className="px-3 py-1 bg-bg-subtle text-primary border border-primary/20 rounded-full text-[12px] font-bold">ACTIVE</span>
<span className="material-symbols-outlined text-text-muted transition-transform group-open:rotate-180">expand_more</span>
</div>
</div>
{/*  Expanded Content  */}
<div className="p-6 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
<div className="space-y-4">
<div>
<label className="block text-label-md text-text-muted mb-2 font-medium">Round Name</label>
<input className="w-full h-[44px] bg-[#1E1E1E] border border-white/10 rounded-full px-6 text-on-surface focus:outline-none focus:border-primary-container transition-all" type="text" value="Initial AI Screening" />
</div>
<div>
<label className="block text-label-md text-text-muted mb-2 font-medium">Duration</label>
<div className="relative">
<select className="w-full h-[44px] bg-[#1E1E1E] border border-white/10 rounded-full px-6 text-on-surface appearance-none focus:outline-none focus:border-primary-container transition-all">
<option>15 mins</option>
<option>30 mins</option>
<option>45 mins</option>
<option>60 mins</option>
</select>
<span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">keyboard_arrow_down</span>
</div>
</div>
<div>
<label className="block text-label-md text-text-muted mb-2 font-medium">Interviewer(s)</label>
<div className="flex flex-wrap gap-2 p-2 bg-[#1E1E1E] border border-white/10 rounded-xl min-h-[44px]">
<div className="flex items-center gap-2 bg-primary-container/10 border border-primary-container/20 rounded-full pl-2 pr-3 py-1">
<div className="w-5 h-5 rounded-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional portrait of a senior AI recruitment lead, minimalist background, studio lighting, corporate photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_kjhrtempHAdZnPWlz5WfK2QIfZIscUCxYjY3m4xbAbwvaow2W0x7u8kq9DIfT7uXkHVWyTHZ6TykNFALCAvpx3HHF8nnCwdU9kawqtMqB9UPWa8IMfUSywzMfJ6dmtbZ5wsAHLMoFs-JUd3-MMKdM9bOCscbY6l_ieoKWRRsJWMem0bIx4dXA3hHRd2nDFqB7geLKvN0F_bblWKnQnbqx4d6vOfJPX0ZtOX_ihvHzbDAV-no-DyFZlWpbD5lLpMTuTteXp3KJ9c" />
</div>
<span className="text-label-md text-primary-container">HireGo AI Bot</span>
<button className="material-symbols-outlined text-[14px]">close</button>
</div>
<button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-text-muted hover:text-white hover:bg-white/10">
<span className="material-symbols-outlined text-sm">add</span>
</button>
</div>
</div>
</div>
{/*  Toggles Column  */}
<div className="space-y-4">
<div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
<div className="flex items-center justify-between">
<span className="text-body-md text-text-primary">Individual Round</span>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox" />
<div className="toggle-switch"></div>
</label>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md text-text-primary">AI Proctoring</span>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox" />
<div className="toggle-switch"></div>
</label>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md text-text-primary">Recording Enabled</span>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox" />
<div className="toggle-switch"></div>
</label>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md text-text-primary">Mandatory Feedback</span>
<label className="relative inline-flex items-center cursor-pointer">
<input className="sr-only peer" type="checkbox" />
<div className="toggle-switch"></div>
</label>
</div>
<div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
<span className="text-body-md font-bold text-gold-payment">Final Decision Round</span>
<label className="relative inline-flex items-center cursor-pointer">
<input className="sr-only peer" type="checkbox" />
<div className="toggle-switch"></div>
</label>
</div>
</div>
</div>
{/*  Footer Actions  */}
<div className="md:col-span-2 flex items-center justify-end gap-4 mt-2">
<button className="h-[44px] px-6 text-on-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-full transition-all flex items-center gap-2">
<span className="material-symbols-outlined">delete</span>
                            Delete
                        </button>
<button className="h-[44px] px-8 btn-3d-blue rounded-full text-white font-bold">
                            Save Round
                        </button>
</div>
</div>
</div>
{/*  Round 2: Technical Design Interview  */}
<div className="glass-card rounded-lg overflow-hidden group/card border-white/10">
<div className="flex items-center justify-between p-6 cursor-pointer">
<div className="flex items-center gap-4">
<div className="drag-handle text-text-muted hover:text-white">
<span className="material-symbols-outlined">drag_indicator</span>
</div>
<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-text-muted font-bold text-sm">2</div>
<div>
<h3 className="font-headline-md text-text-primary">Portfolio Deep Dive</h3>
<p className="text-text-muted text-label-md flex items-center gap-2">
<span className="material-symbols-outlined text-[14px]">schedule</span> 45 mins • Panel Round
                            </p>
</div>
</div>
<span className="material-symbols-outlined text-text-muted">expand_more</span>
</div>
</div>
{/*  Round 3: Cultural Fit  */}
<div className="glass-card rounded-lg overflow-hidden group/card border-white/10">
<div className="flex items-center justify-between p-6 cursor-pointer">
<div className="flex items-center gap-4">
<div className="drag-handle text-text-muted hover:text-white">
<span className="material-symbols-outlined">drag_indicator</span>
</div>
<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-text-muted font-bold text-sm">3</div>
<div>
<h3 className="font-headline-md text-text-primary">Culture &amp; Values Fit</h3>
<p className="text-text-muted text-label-md flex items-center gap-2">
<span className="material-symbols-outlined text-[14px]">schedule</span> 30 mins • Individual Round
                            </p>
</div>
</div>
<span className="material-symbols-outlined text-text-muted">expand_more</span>
</div>
</div>
</div>
{/*  Sticky Bottom Bar  */}
<div className="fixed bottom-0 left-0 md:left-[240px] right-0 p-6 glass-card border-t border-white/10 flex items-center justify-between z-50">
<div className="flex items-center gap-4">
<div className="flex -space-x-2">
<div className="w-10 h-10 rounded-full border-2 border-bg-page bg-surface flex items-center justify-center text-xs font-bold text-text-muted">1</div>
<div className="w-10 h-10 rounded-full border-2 border-bg-page bg-surface flex items-center justify-center text-xs font-bold text-text-muted">2</div>
<div className="w-10 h-10 rounded-full border-2 border-bg-page bg-surface flex items-center justify-center text-xs font-bold text-text-muted">3</div>
</div>
<p className="text-label-md text-text-muted">3 Rounds Defined • Estimated Duration: 1h 30m</p>
</div>
<div className="flex gap-4">
<button className="h-[50px] px-8 bg-bg-subtle text-white font-bold rounded-full border border-white/10 hover:bg-white/5">
                    Discard Changes
                </button>
<button className="h-[50px] px-12 btn-3d-red text-white font-bold rounded-full">
                    Publish Process
                </button>
</div>
</div>

    </PageContainer>
  );
}
