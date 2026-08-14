"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE19() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-lg mb-6">
<div>
<h1 className="font-display-lg text-display-lg text-primary mb-2">Job Templates</h1>
<p className="font-body-md text-text-secondary max-w-2xl">Manage and standardize your recruitment workflow with reusable templates for job descriptions, screening stages, and interview rubrics.</p>
</div>
<div className="flex flex-wrap gap-stack-md">
<button className="btn-ghost px-6 h-[50px] rounded-full flex items-center gap-2 font-label-md text-text-primary">
<span className="material-symbols-outlined">add</span>
                        Add Question
                    </button>
<button className="btn-primary-red px-8 h-[50px] rounded-full flex items-center gap-2 font-label-md text-white">
<span className="material-symbols-outlined">note_add</span>
                        Create Template
                    </button>
</div>
</div>
{/*  Dashboard Stats / Filters Row  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-gutter">
<div className="glass-card p-6 rounded-2xl">
<div className="flex items-center justify-between mb-4">
<span className="text-[12px] font-bold text-red-light tracking-wider uppercase">Active Templates</span>
<span className="material-symbols-outlined text-text-secondary">stacks</span>
</div>
<div className="text-[32px] font-display-lg text-primary">24</div>
<div className="text-[12px] text-green flex items-center gap-1 mt-1">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
                        +3 this month
                    </div>
</div>
<div className="glass-card p-6 rounded-2xl">
<div className="flex items-center justify-between mb-4">
<span className="text-[12px] font-bold text-blue-400 tracking-wider uppercase">Usage Rate</span>
<span className="material-symbols-outlined text-text-secondary">analytics</span>
</div>
<div className="text-[32px] font-display-lg text-primary">82%</div>
<div className="text-[12px] text-text-secondary mt-1">Across 12 departments</div>
</div>
<div className="glass-card p-6 rounded-2xl relative overflow-hidden">
<div className="flex items-center justify-between mb-4">
<span className="text-[12px] font-bold text-yellow-400 tracking-wider uppercase">AI Optimized</span>
<span className="material-symbols-outlined text-text-secondary">bolt</span>
</div>
<div className="text-[32px] font-display-lg text-primary">18</div>
<div className="text-[12px] text-text-secondary mt-1">Ready for automated screening</div>
{/*  Subtle AI Glow  */}
<div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/20 blur-2xl rounded-full"></div>
</div>
</div>
{/*  Templates List Section  */}
<div className="glass-card rounded-2xl overflow-hidden mb-10">
<div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
<div className="flex items-center gap-4">
<div className="flex items-center gap-2 bg-[#1E1E1E] rounded-full px-4 h-9 border border-white/10">
<span className="material-symbols-outlined text-[18px] text-text-secondary">search</span>
<input className="bg-transparent border-none text-sm focus:ring-0 text-primary w-48 placeholder:text-text-muted" placeholder="Search templates..." type="text" />
</div>
<select className="bg-[#1E1E1E] border border-white/10 rounded-full px-4 h-9 text-sm text-on-surface-variant focus:ring-0">
<option>All Categories</option>
<option>Engineering</option>
<option>Marketing</option>
<option>Sales</option>
</select>
</div>
<div className="flex items-center gap-2">
<span className="text-[12px] text-text-secondary">Displaying 1-8 of 24</span>
<div className="flex gap-1">
<button className="p-1 hover:bg-white/10 rounded text-text-secondary"><span className="material-symbols-outlined">chevron_left</span></button>
<button className="p-1 hover:bg-white/10 rounded text-text-secondary"><span className="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
</div>
<div className="divide-y divide-white/5">
{/*  Template Item 1  */}
<div className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
<div className="flex items-center gap-stack-lg">
<div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">code</span>
</div>
<div>
<h3 className="font-body-lg font-bold text-primary">Senior Frontend Architect</h3>
<div className="flex gap-stack-sm mt-1">
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Engineering</span>
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Technical</span>
<span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-[11px] font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> AI Ready
                                    </span>
</div>
</div>
</div>
<div className="flex items-center gap-stack-lg">
<div className="hidden xl:block">
<div className="text-[12px] text-text-muted mb-1">Last used</div>
<div className="text-sm text-on-surface-variant">2 days ago</div>
</div>
<div className="flex items-center gap-3">
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container/10 text-primary hover:bg-primary-container hover:text-white transition-all shadow-lg active:scale-95" title="Use Template">
<span className="material-symbols-outlined">send</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-primary hover:bg-white/10 transition-all active:scale-95" title="Edit">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-red-light hover:bg-red-light/10 transition-all active:scale-95" title="Delete">
<span className="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
{/*  Template Item 2  */}
<div className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
<div className="flex items-center gap-stack-lg">
<div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
<span className="material-symbols-outlined">campaign</span>
</div>
<div>
<h3 className="font-body-lg font-bold text-primary">Content Marketing Lead</h3>
<div className="flex gap-stack-sm mt-1">
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Marketing</span>
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Creative</span>
</div>
</div>
</div>
<div className="flex items-center gap-stack-lg">
<div className="hidden xl:block">
<div className="text-[12px] text-text-muted mb-1">Last used</div>
<div className="text-sm text-on-surface-variant">1 week ago</div>
</div>
<div className="flex items-center gap-3">
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container/10 text-primary hover:bg-primary-container hover:text-white transition-all shadow-lg active:scale-95" title="Use Template">
<span className="material-symbols-outlined">send</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-primary hover:bg-white/10 transition-all active:scale-95" title="Edit">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-red-light hover:bg-red-light/10 transition-all active:scale-95" title="Delete">
<span className="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
{/*  Template Item 3  */}
<div className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
<div className="flex items-center gap-stack-lg">
<div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
<span className="material-symbols-outlined">payments</span>
</div>
<div>
<h3 className="font-body-lg font-bold text-primary">Account Executive (Enterprise)</h3>
<div className="flex gap-stack-sm mt-1">
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Sales</span>
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Revenue</span>
</div>
</div>
</div>
<div className="flex items-center gap-stack-lg">
<div className="hidden xl:block">
<div className="text-[12px] text-text-muted mb-1">Last used</div>
<div className="text-sm text-on-surface-variant">3 days ago</div>
</div>
<div className="flex items-center gap-3">
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container/10 text-primary hover:bg-primary-container hover:text-white transition-all shadow-lg active:scale-95" title="Use Template">
<span className="material-symbols-outlined">send</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-primary hover:bg-white/10 transition-all active:scale-95" title="Edit">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-red-light hover:bg-red-light/10 transition-all active:scale-95" title="Delete">
<span className="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
{/*  Template Item 4 (No AI)  */}
<div className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
<div className="flex items-center gap-stack-lg">
<div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
<span className="material-symbols-outlined">brush</span>
</div>
<div>
<h3 className="font-body-lg font-bold text-primary">Senior Product Designer</h3>
<div className="flex gap-stack-sm mt-1">
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">Design</span>
<span className="px-2 py-0.5 rounded-full bg-bg-subtle border border-white/5 text-[11px] text-text-secondary font-medium">UX/UI</span>
</div>
</div>
</div>
<div className="flex items-center gap-stack-lg">
<div className="hidden xl:block">
<div className="text-[12px] text-text-muted mb-1">Last used</div>
<div className="text-sm text-on-surface-variant">1 month ago</div>
</div>
<div className="flex items-center gap-3">
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container/10 text-primary hover:bg-primary-container hover:text-white transition-all shadow-lg active:scale-95" title="Use Template">
<span className="material-symbols-outlined">send</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-primary hover:bg-white/10 transition-all active:scale-95" title="Edit">
<span className="material-symbols-outlined">edit</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-text-secondary hover:text-red-light hover:bg-red-light/10 transition-all active:scale-95" title="Delete">
<span className="material-symbols-outlined">delete</span>
</button>
</div>
</div>
</div>
</div>
<div className="p-6 bg-white/[0.03] text-center">
<button className="text-primary font-label-md hover:underline transition-all">Load More Templates</button>
</div>
</div>
{/*  Suggestion / Help Bento Area  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="glass-card p-8 rounded-2xl flex gap-6 items-start">
<div className="p-4 bg-red-light/10 rounded-2xl">
<span className="material-symbols-outlined text-red-light text-[32px]">lightbulb</span>
</div>
<div>
<h4 className="font-headline-md text-primary mb-2">Need a new template?</h4>
<p className="text-text-secondary font-body-md mb-6">Our AI can generate a comprehensive job description and interview rubric based on just a title and department.</p>
<button className="px-6 h-12 bg-white/5 border border-white/10 rounded-full font-label-md text-primary hover:bg-white/10 transition-all">Start with AI</button>
</div>
</div>
<div className="glass-card p-8 rounded-2xl flex gap-6 items-start relative overflow-hidden">
<div className="p-4 bg-blue-500/10 rounded-2xl">
<span className="material-symbols-outlined text-blue-400 text-[32px]">help_center</span>
</div>
<div>
<h4 className="font-headline-md text-primary mb-2">Standards &amp; Compliance</h4>
<p className="text-text-secondary font-body-md mb-6">Ensure all your templates meet your organization's DEI standards and legal requirements with our compliance checker.</p>
<button className="px-6 h-12 bg-white/5 border border-white/10 rounded-full font-label-md text-primary hover:bg-white/10 transition-all">View Guidelines</button>
</div>
</div>
</div>

    </PageContainer>
  );
}
