"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE11() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Progress Stepper  */}
<div className="flex items-center justify-between mb-6 max-w-2xl mx-auto">
<div className="flex flex-col items-center gap-2">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold border-2 border-primary">
<span className="material-symbols-outlined text-sm" data-icon="check">check</span>
</div>
<span className="font-label-md text-label-md text-primary">Details</span>
</div>
<div className="h-[2px] flex-1 bg-primary-container/30 mx-4"></div>
<div className="flex flex-col items-center gap-2">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold border-2 border-primary">
<span className="material-symbols-outlined text-sm" data-icon="check">check</span>
</div>
<span className="font-label-md text-label-md text-primary">Team</span>
</div>
<div className="h-[2px] flex-1 bg-primary-container/30 mx-4"></div>
<div className="flex flex-col items-center gap-2">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold border-2 border-primary">
<span className="material-symbols-outlined text-sm" data-icon="check">check</span>
</div>
<span className="font-label-md text-label-md text-primary">Budget</span>
</div>
<div className="h-[2px] flex-1 bg-primary-container mx-4"></div>
<div className="flex flex-col items-center gap-2">
<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-[0_0_15px_rgba(255,180,170,0.4)]">
                    4
                </div>
<span className="font-label-md text-label-md text-on-surface">Screening</span>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Left Column: AI Parameters  */}
<div className="lg:col-span-8 flex flex-col gap-stack-md">
{/*  Section Header  */}
<div className="flex flex-col gap-2">
<h1 className="font-display-lg text-display-lg font-bold text-on-surface">AI Screening Setup</h1>
<p className="font-body-md text-body-md text-text-secondary max-w-2xl">Configure how HireGo AI evaluates your candidates. Define the strictness of automated filters and set mandatory assessment hurdles.</p>
</div>
{/*  AI Auto-Screen Card  */}
<div className="glass-card rounded-lg p-stack-md relative overflow-hidden group">

<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
<div className="flex items-start gap-4">
<div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center border border-tertiary/30">
<span className="material-symbols-outlined text-tertiary" data-icon="auto_awesome">auto_awesome</span>
</div>
<div>
<h3 className="font-headline-md text-headline-md text-on-surface">AI Auto-Screening</h3>
<p className="font-body-md text-body-md text-text-secondary">Automatically move high-match candidates to the next stage.</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only toggle-checkbox" type="checkbox" />
<div className="toggle-label w-14 h-7 bg-white/10 rounded-full transition-all duration-300">
<div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300"></div>
</div>
</label>
</div>
{/*  Threshold Slider  */}
<div className="mt-stack-lg p-stack-md bg-white/5 rounded-lg border border-white/5">
<div className="flex items-center justify-between mb-4">
<span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">AI Accuracy Threshold</span>
<span className="font-data-lg text-data-lg text-primary" id="threshold-value">85%</span>
</div>
<input className="w-full cursor-pointer" id="threshold-slider" max="100" min="0" type="range" value="85" />
<div className="flex justify-between mt-2 text-[10px] text-text-muted font-label-md uppercase">
<span>Flexible (0%)</span>
<span>Strict (100%)</span>
</div>
<p className="mt-4 text-sm text-text-secondary italic">Candidates below this score will be flagged for manual review but not rejected.</p>
</div>
</div>
{/*  Knockout Questions Section  */}
<div className="glass-card rounded-lg p-stack-md">
<div className="flex items-center justify-between mb-stack-md">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-red-light" data-icon="list_alt">list_alt</span>
<h3 className="font-headline-md text-headline-md">Knockout Questions</h3>
</div>
<button className="btn-ghost px-4 h-[40px] rounded-full flex items-center gap-2 text-sm text-on-surface hover:bg-white/10 transition-all">
<span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                            Add Question
                        </button>
</div>
<div className="flex flex-col gap-3">
{/*  Question Card 1  */}
<div className="p-4 bg-white/5 border border-white/5 rounded-lg flex items-start justify-between group">
<div className="flex-1">
<div className="flex items-center gap-3 mb-1">
<span className="px-2 py-0.5 bg-red-deep/20 text-red-light text-[10px] font-bold rounded uppercase">Mandatory</span>
<span className="text-xs text-text-muted">Boolean Question</span>
</div>
<p className="text-on-surface font-body-md">Do you have at least 5 years of experience with React and Tailwind CSS?</p>
</div>
<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-white/10 rounded-full text-text-muted"><span className="material-symbols-outlined text-sm" data-icon="edit">edit</span></button>
<button className="p-2 hover:bg-red-light/20 rounded-full text-red-light"><span className="material-symbols-outlined text-sm" data-icon="delete">delete</span></button>
</div>
</div>
{/*  Question Card 2  */}
<div className="p-4 bg-white/5 border border-white/5 rounded-lg flex items-start justify-between group">
<div className="flex-1">
<div className="flex items-center gap-3 mb-1">
<span className="px-2 py-0.5 bg-red-deep/20 text-red-light text-[10px] font-bold rounded uppercase">Mandatory</span>
<span className="text-xs text-text-muted">Multiple Choice</span>
</div>
<p className="text-on-surface font-body-md">Are you legally authorized to work in the United States without sponsorship?</p>
</div>
<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-white/10 rounded-full text-text-muted"><span className="material-symbols-outlined text-sm" data-icon="edit">edit</span></button>
<button className="p-2 hover:bg-red-light/20 rounded-full text-red-light"><span className="material-symbols-outlined text-sm" data-icon="delete">delete</span></button>
</div>
</div>
</div>
</div>
</div>
{/*  Right Column: Assessments  */}
<div className="lg:col-span-4 flex flex-col gap-stack-md">
<div className="glass-card rounded-lg p-stack-md h-fit">
<h3 className="font-headline-md text-headline-md mb-2 text-on-surface">Required Assessments</h3>
<p className="font-label-md text-label-md text-text-secondary mb-stack-md">Select interactive stages for candidates.</p>
<div className="space-y-4">
{/*  Assessment Item: Video  */}
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container" data-icon="videocam">videocam</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">Video Interview</p>
<p className="text-[10px] text-text-muted">AI-scored response</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer scale-90">
<input className="sr-only toggle-checkbox" type="checkbox" />
<div className="toggle-label w-12 h-6 bg-white/10 rounded-full transition-all duration-300">
<div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"></div>
</div>
</label>
</div>
{/*  Assessment Item: MCQ  */}
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container" data-icon="quiz">quiz</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">Technical MCQ</p>
<p className="text-[10px] text-text-muted">20 randomized questions</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer scale-90">
<input defaultChecked className="sr-only toggle-checkbox" type="checkbox" />
<div className="toggle-label w-12 h-6 bg-white/10 rounded-full transition-all duration-300">
<div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"></div>
</div>
</label>
</div>
{/*  Assessment Item: Typing  */}
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container" data-icon="keyboard">keyboard</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">Typing Test</p>
<p className="text-[10px] text-text-muted">WPM &amp; accuracy check</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer scale-90">
<input className="sr-only toggle-checkbox" type="checkbox" />
<div className="toggle-label w-12 h-6 bg-white/10 rounded-full transition-all duration-300">
<div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"></div>
</div>
</label>
</div>
{/*  Assessment Item: Coding  */}
<div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-on-primary-container" data-icon="terminal">terminal</span>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">Coding Challenge</p>
<p className="text-[10px] text-text-muted">Live IDE monitoring</p>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer scale-90">
<input defaultChecked className="sr-only toggle-checkbox" type="checkbox" />
<div className="toggle-label w-12 h-6 bg-white/10 rounded-full transition-all duration-300">
<div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"></div>
</div>
</label>
</div>
</div>
<div className="mt-stack-md pt-stack-md border-t border-white/5">
<div className="flex items-center gap-2 text-primary">
<span className="material-symbols-outlined text-sm" data-icon="info">info</span>
<span className="text-[11px] font-bold uppercase">Estimated completion time</span>
</div>
<p className="text-xl font-bold text-on-surface mt-1">45 Minutes</p>
</div>
</div>
{/*  Live Preview Card  */}
<div className="glass-card rounded-lg p-stack-md border-primary/20 bg-primary-container/5">
<h4 className="font-label-md text-label-md text-primary uppercase tracking-tighter mb-2">Candidate Experience</h4>
<div className="bg-black/40 rounded p-4 border border-white/5 aspect-video flex flex-col items-center justify-center text-center gap-3">
<span className="material-symbols-outlined text-3xl text-primary" data-icon="rocket_launch">rocket_launch</span>
<p className="text-xs text-on-surface-variant px-4">"Thanks for applying! Please complete our AI-powered screening process to proceed."</p>
<div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
<div className="w-1/4 h-full bg-primary"></div>
</div>
</div>
</div>
</div>
</div>
{/*  Footer Actions  */}
<div className="mt-stack-lg flex items-center justify-between pt-stack-md border-t border-white/10">
<button className="btn-ghost px-8 h-[50px] rounded-full text-on-surface hover:bg-white/5 transition-all">Back to Budget</button>
<div className="flex items-center gap-4">
<button className="text-text-secondary hover:text-on-surface font-label-md">Save as Draft</button>
<button className="btn-primary-red px-10 h-[50px] rounded-full text-on-primary font-bold flex items-center gap-2">
                    Review Job Posting
                    <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</div>

    </PageContainer>
  );
}
