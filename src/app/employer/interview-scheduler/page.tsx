"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE37() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className=" mx-auto">
{/*  Header Section  */}
<div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<h1 className="font-display-lg text-text-primary mb-2">Schedule Interview</h1>
<p className="text-text-secondary max-w-xl font-body-md">Configure the meeting parameters and verify availability for Sarah Jenkins — Senior Frontend Engineer Candidate.</p>
</div>
<div className="flex gap-4">
<div className="glass-card px-4 py-2 rounded-lg flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
<span className="text-[12px] font-data-md uppercase tracking-wider text-text-secondary">Proctor Active</span>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/*  Form Section  */}
<div className="lg:col-span-7 flex flex-col gap-6">
<div className="glass-card p-stack-lg rounded-lg space-y-6">
{/*  Round Selector  */}
<div className="space-y-stack-sm">
<label className="text-on-surface-variant font-label-md block">Interview Round</label>
<div className="relative group">
<select className="w-full h-[50px] bg-bg-elevated border border-white/10 rounded-full px-6 appearance-none text-on-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none">
<option disabled>Round 1: Screening (Completed)</option>
<option >Round 2: Technical Deep Dive</option>
<option>Round 3: System Design</option>
<option>Round 4: Culture Fit</option>
</select>
<span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
</div>
</div>
{/*  Date & Time Row  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
<div className="space-y-stack-sm">
<label className="text-on-surface-variant font-label-md block">Preferred Date</label>
<div className="relative">
<input className="w-full h-[50px] bg-bg-elevated border border-white/10 rounded-full px-6 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none" type="date" defaultValue="2023-10-24" />
<span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">calendar_today</span>
</div>
</div>
<div className="space-y-stack-sm">
<label className="text-on-surface-variant font-label-md block">Start Time</label>
<div className="relative">
<input className="w-full h-[50px] bg-bg-elevated border border-white/10 rounded-full px-6 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none" type="time" defaultValue="14:00" />
<span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">schedule</span>
</div>
</div>
</div>
{/*  Meeting Link Display  */}
<div className="bg-surface-container-low border border-white/5 p-4 rounded-lg flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center">
<span className="material-symbols-outlined text-secondary">link</span>
</div>
<div>
<p className="text-text-secondary text-[12px] font-label-md uppercase">Auto-Generated Meeting Link</p>
<p className="text-text-primary font-data-md">hirego.ai/meet/vj2-99p-qwt</p>
</div>
</div>
<button className="text-primary hover:underline font-label-md">Regenerate</button>
</div>
{/*  Instructions Textarea  */}
<div className="space-y-stack-sm">
<label className="text-on-surface-variant font-label-md block">Custom Instructions (Optional)</label>
<textarea className="w-full bg-bg-elevated border border-white/10 rounded-2xl p-6 text-on-surface focus:ring-2 focus:ring-primary/50 transition-all outline-none min-h-[120px] resize-none" placeholder="Add any specific topics or instructions for the candidate..."></textarea>
</div>
</div>
{/*  Notification Settings Card  */}
<div className="glass-card p-stack-lg rounded-lg">
<h3 className="font-headline-md text-text-primary mb-6">Notification Channels</h3>
<div className="space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-on-surface-variant">mail</span>
<div>
<p className="text-on-surface font-label-md">Email Confirmation</p>
<p className="text-text-muted text-xs">Standard invite sent to both parties</p>
</div>
</div>
<input defaultChecked className="w-12 h-6 rounded-full bg-surface-container-high border-none text-primary focus:ring-0 cursor-pointer transition-all" type="checkbox" />
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-on-surface-variant">chat_bubble</span>
<div>
<p className="text-on-surface font-label-md">WhatsApp Notification</p>
<p className="text-text-muted text-xs">Instant ping to candidate's mobile</p>
</div>
</div>
<input defaultChecked className="w-12 h-6 rounded-full bg-surface-container-high border-none text-primary focus:ring-0 cursor-pointer transition-all" type="checkbox" />
</div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-on-surface-variant">event_available</span>
<div>
<p className="text-on-surface font-label-md">Calendar Invite</p>
<p className="text-text-muted text-xs">Add directly to Google/Outlook</p>
</div>
</div>
<input defaultChecked className="w-12 h-6 rounded-full bg-surface-container-high border-none text-primary focus:ring-0 cursor-pointer transition-all" type="checkbox" />
</div>
</div>
</div>
{/*  Primary Action  */}
<button className="w-full h-[60px] rounded-full btn-primary-red text-white font-headline-md uppercase tracking-widest flex items-center justify-center gap-3">
<span className="material-symbols-outlined">rocket_launch</span>
                        Schedule Interview
                    </button>
</div>
{/*  Availability Side Panel  */}
<div className="lg:col-span-5 flex flex-col gap-6">
<div className="glass-card p-stack-lg rounded-lg border-primary/20">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-text-primary">Availability Radar</h3>
<span className="text-[10px] font-data-md bg-surface-container-highest px-2 py-1 rounded text-text-secondary uppercase">UTC +2:00</span>
</div>
{/*  Calendar Grid UI  */}
<div className="space-y-4">
<div className="flex justify-between text-[12px] font-label-md text-text-muted px-2">
<span>Mon 23</span>
<span className="text-primary underline">Tue 24</span>
<span>Wed 25</span>
<span>Thu 26</span>
<span>Fri 27</span>
</div>
<div className="grid grid-cols-5 gap-2 h-[400px] overflow-y-auto custom-scrollbar pr-2">
{/*  Grid Mockup  */}
<div className="space-y-1">
<div className="h-12 bg-green/20 border border-green/30 rounded flex items-center justify-center">
<span className="text-[10px] text-green font-bold">FREE</span>
</div>
<div className="h-12 bg-error/20 border border-error/30 rounded flex items-center justify-center">
<span className="material-symbols-outlined text-error text-sm">block</span>
</div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
</div>
<div className="space-y-1">
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded ring-2 ring-primary ring-offset-2 ring-offset-bg-page flex items-center justify-center">
<span className="text-[10px] text-green font-bold">14:00</span>
</div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-error/20 border border-error/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
</div>
<div className="space-y-1">
<div className="h-12 bg-error/20 border border-error/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
</div>
<div className="space-y-1">
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-error/20 border border-error/30 rounded"></div>
<div className="h-12 bg-error/20 border border-error/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
</div>
<div className="space-y-1">
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-green/20 border border-green/30 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-surface-container border border-white/5 rounded"></div>
<div className="h-12 bg-error/20 border border-error/30 rounded"></div>
</div>
</div>
</div>
{/*  Legend  */}
<div className="mt-stack-lg pt-stack-md border-t border-white/5 flex gap-stack-md justify-center">
<div className="flex items-center gap-2">
<span className="w-3 h-3 bg-green/30 border border-green/50 rounded"></span>
<span className="text-[12px] text-text-secondary font-label-md">Available</span>
</div>
<div className="flex items-center gap-2">
<span className="w-3 h-3 bg-error/30 border border-error/50 rounded"></span>
<span className="text-[12px] text-text-secondary font-label-md">Conflict</span>
</div>
</div>
</div>
{/*  AI Insights Mini-Card  */}
<div className="bg-gradient-to-br from-secondary-container/10 to-transparent p-stack-lg rounded-lg border border-secondary-container/20 relative overflow-hidden group">
<div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
<span className="material-symbols-outlined text-[64px]">psychology</span>
</div>
<div className="relative z-10">
<h4 className="font-label-md text-secondary mb-2 flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                AI Smart Suggestion
                            </h4>
<p className="text-on-surface text-[13px] leading-relaxed">
                                Tuesday at 14:00 is the optimal slot. Both interviewers (Alex &amp; Jordan) are free, and it aligns with Sarah's historical peak engagement hours.
                            </p>
</div>
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
