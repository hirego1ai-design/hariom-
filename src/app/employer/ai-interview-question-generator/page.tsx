"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE26() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<header className="flex justify-between items-end mb-6">
<div>
<h2 className="font-display-lg text-display-lg text-text-primary mb-2">Question Generator</h2>
<p className="font-body-md text-text-secondary max-w-2xl">Leverage our high-fidelity AI models to generate targeted, role-specific interview questions in seconds.</p>
</div>
<button className="btn-red h-[50px] px-8 rounded-full flex items-center gap-2 text-on-primary-container font-bold">
<span className="material-symbols-outlined" data-icon="save">save</span>
                Save Question Set
            </button>
</header>
<div className="grid grid-cols-12 gap-6">
{/*  Input Panel (Left Column)  */}
<section className="col-span-4 space-y-gutter">
<div className="glass-card p-stack-lg rounded-lg">
<h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
<span className="material-symbols-outlined text-gold-payment" data-icon="psychology">psychology</span>
                        Parameters
                    </h3>
<div className="space-y-6">
{/*  Job Role  */}
<div className="space-y-2">
<label className="font-label-md text-text-secondary ml-2">Job Role</label>
<input className="w-full h-[50px] bg-bg-elevated border-none rounded-full px-6 text-text-primary focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted" placeholder="e.g. Senior Frontend Engineer" type="text" />
</div>
{/*  Experience Level  */}
<div className="space-y-2">
<label className="font-label-md text-text-secondary ml-2">Experience Level</label>
<div className="flex flex-wrap gap-2">
<button className="bg-primary-container text-on-primary-container h-[40px] px-5 rounded-full font-label-md border border-white/10">Senior</button>
<button className="bg-bg-subtle text-text-secondary h-[40px] px-5 rounded-full font-label-md hover:bg-bg-elevated transition-colors">Mid-Level</button>
<button className="bg-bg-subtle text-text-secondary h-[40px] px-5 rounded-full font-label-md hover:bg-bg-elevated transition-colors">Junior</button>
<button className="bg-bg-subtle text-text-secondary h-[40px] px-5 rounded-full font-label-md hover:bg-bg-elevated transition-colors">Lead</button>
</div>
</div>
{/*  Focus Areas  */}
<div className="space-y-2">
<label className="font-label-md text-text-secondary ml-2">Focus Areas</label>
<div className="flex flex-wrap gap-2">
<span className="bg-bg-subtle text-text-primary h-[32px] px-4 rounded-full font-label-md flex items-center gap-2 border border-white/5">
                                    React.js
                                    <span className="material-symbols-outlined text-[16px] cursor-pointer" data-icon="close">close</span>
</span>
<span className="bg-bg-subtle text-text-primary h-[32px] px-4 rounded-full font-label-md flex items-center gap-2 border border-white/5">
                                    System Architecture
                                    <span className="material-symbols-outlined text-[16px] cursor-pointer" data-icon="close">close</span>
</span>
<button className="bg-white/5 text-text-secondary h-[32px] px-4 rounded-full font-label-md border border-dashed border-white/20 hover:border-white/40">+ Add Area</button>
</div>
</div>
{/*  Generate Button  */}
<button className="btn-gold w-full h-[50px] rounded-full font-bold text-background flex items-center justify-center gap-2 mt-4 group">
                            Generate Questions
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="auto_awesome">auto_awesome</span>
</button>
</div>
</div>
{/*  Stats / AI Tip Card  */}
<div className="glass-card p-6 rounded-lg border-l-4 border-gold-payment">
<p className="font-body-md text-text-primary leading-relaxed italic">
                        "Generating questions based on 4.2M successful interview transcripts from top-tier tech firms."
                    </p>
<div className="mt-4 flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-gold-payment/20 flex items-center justify-center">
<span className="material-symbols-outlined text-gold-payment text-[18px]" data-icon="lightbulb">lightbulb</span>
</div>
<span className="font-label-md text-gold-payment">AI Insight: Focus on state management for this role.</span>
</div>
</div>
</section>
{/*  Results List (Right Column)  */}
<section className="col-span-8 space-y-6 pb-12">
{/*  Category: Technical  */}
<div className="space-y-stack-md">
<div className="flex items-center gap-4 px-2">
<div className="w-2 h-2 rounded-full bg-secondary"></div>
<h4 className="font-headline-md text-[22px] text-secondary">Technical Proficiency</h4>
</div>
<div className="grid grid-cols-1 gap-4">
{/*  Question Card 1  */}
<div className="glass-card p-6 rounded-lg group hover:bg-white/10 transition-all">
<div className="flex justify-between items-start mb-3">
<span className="bg-bg-subtle text-on-surface-variant font-label-md px-3 py-1 rounded-full border border-white/10">Hard</span>
<div className="flex gap-2">
<button className="btn-ghost w-[40px] h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary" title="Regenerate">
<span className="material-symbols-outlined text-[20px]" data-icon="refresh">refresh</span>
</button>
<button className="btn-ghost h-[40px] px-4 rounded-full flex items-center gap-2 text-text-secondary hover:text-text-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-label-md">Add to Interview</span>
</button>
</div>
</div>
<h5 className="font-headline-md text-lg text-text-primary mb-2">Explain the internal workings of the React Fiber architecture and how it differs from the previous stack reconciler.</h5>
<p className="font-body-md text-text-secondary">Look for mentions of concurrency, work units, and the prioritization of updates.</p>
</div>
{/*  Question Card 2  */}
<div className="glass-card p-6 rounded-lg group hover:bg-white/10 transition-all">
<div className="flex justify-between items-start mb-3">
<span className="bg-bg-subtle text-green font-label-md px-3 py-1 rounded-full border border-white/10">Medium</span>
<div className="flex gap-2">
<button className="btn-ghost w-[40px] h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary" title="Regenerate">
<span className="material-symbols-outlined text-[20px]" data-icon="refresh">refresh</span>
</button>
<button className="btn-ghost h-[40px] px-4 rounded-full flex items-center gap-2 text-text-secondary hover:text-text-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-label-md">Add to Interview</span>
</button>
</div>
</div>
<h5 className="font-headline-md text-lg text-text-primary mb-2">How would you optimize a large-scale application using React.memo, useMemo, and useCallback?</h5>
<p className="font-body-md text-text-secondary">Assess understanding of memoization costs vs benefits.</p>
</div>
</div>
</div>
{/*  Category: Behavioral  */}
<div className="space-y-stack-md">
<div className="flex items-center gap-4 px-2">
<div className="w-2 h-2 rounded-full bg-primary"></div>
<h4 className="font-headline-md text-[22px] text-primary">Behavioral &amp; Cultural</h4>
</div>
<div className="grid grid-cols-1 gap-4">
<div className="glass-card p-6 rounded-lg group hover:bg-white/10 transition-all">
<div className="flex justify-between items-start mb-3">
<span className="bg-bg-subtle text-green font-label-md px-3 py-1 rounded-full border border-white/10">Medium</span>
<div className="flex gap-2">
<button className="btn-ghost w-[40px] h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary" title="Regenerate">
<span className="material-symbols-outlined text-[20px]" data-icon="refresh">refresh</span>
</button>
<button className="btn-ghost h-[40px] px-4 rounded-full flex items-center gap-2 text-text-secondary hover:text-text-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-label-md">Add to Interview</span>
</button>
</div>
</div>
<h5 className="font-headline-md text-lg text-text-primary mb-2">Describe a time you had a technical disagreement with a team lead. How was it resolved?</h5>
<p className="font-body-md text-text-secondary">Focus on communication skills and maturity in conflict resolution.</p>
</div>
</div>
</div>
{/*  Category: System Design  */}
<div className="space-y-stack-md">
<div className="flex items-center gap-4 px-2">
<div className="w-2 h-2 rounded-full bg-gold-payment"></div>
<h4 className="font-headline-md text-[22px] text-gold-payment">System Design</h4>
</div>
<div className="grid grid-cols-1 gap-4">
<div className="glass-card p-6 rounded-lg group hover:bg-white/10 transition-all">
<div className="flex justify-between items-start mb-3">
<span className="bg-bg-subtle text-on-surface-variant font-label-md px-3 py-1 rounded-full border border-white/10">Hard</span>
<div className="flex gap-2">
<button className="btn-ghost w-[40px] h-[40px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary" title="Regenerate">
<span className="material-symbols-outlined text-[20px]" data-icon="refresh">refresh</span>
</button>
<button className="btn-ghost h-[40px] px-4 rounded-full flex items-center gap-2 text-text-secondary hover:text-text-primary">
<span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
<span className="font-label-md">Add to Interview</span>
</button>
</div>
</div>
<h5 className="font-headline-md text-lg text-text-primary mb-2">Design a real-time collaborative code editor like VS Code Live Share.</h5>
<p className="font-body-md text-text-secondary">Evaluate knowledge of WebSockets, Operational Transformation (OT), or CRDTs.</p>
</div>
</div>
</div>
</section>
</div>

    </PageContainer>
  );
}
