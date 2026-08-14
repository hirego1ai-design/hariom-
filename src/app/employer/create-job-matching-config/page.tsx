"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";
import { useJobCreationStore, ProctoringLevel } from "@/store/useJobCreationStore";

export default function EmployerPageE62() {
  const router = useRouter();
  const store = useJobCreationStore();

  const handlePublish = () => {
    // In real app, make API call here
    router.push("/employer/job-listings-management");
  };

  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<header className="mb-6">
<h1 className="font-headline-md text-headline-md text-text-primary mb-2">Matching Configuration</h1>
<p className="text-text-secondary font-body-md">Step 4 of 4: Fine-tune how the AI selects and prioritizes your future hires.</p>
</header>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Main Config Area  */}
<div className="lg:col-span-8 space-y-gutter">
{/*  Section 1: Hire Score  */}
<section className="glass-card p-stack-lg rounded-lg">
<div className="flex items-center justify-between mb-stack-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">analytics</span>
</div>
<h2 className="font-body-lg text-body-lg font-bold">Minimum Hire Score</h2>
</div>
<div className="px-4 py-1 rounded-full bg-surface-container-highest text-primary font-data-md text-data-md" id="scoreValue">{store.autoArchiveScore}%</div>
</div>
<p className="text-text-secondary text-label-md mb-8">Candidates with an AI-calculated score below this threshold will be automatically archived.</p>
<div className="relative py-4">
<input 
  className="w-full" 
  max="100" 
  min="0" 
  type="range" 
  value={store.autoArchiveScore} 
  onChange={(e) => store.updateField('autoArchiveScore', parseInt(e.target.value))}
/>
<div className="flex justify-between mt-4 text-[12px] text-text-muted font-data-md">
<span>0%</span>
<span>25%</span>
<span>50%</span>
<span>75%</span>
<span>100%</span>
</div>
</div>
</section>
{/*  Section 2: Auto-Shortlist  */}
<section className="glass-card p-stack-lg rounded-lg">
<div className="flex items-center justify-between mb-stack-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">auto_awesome</span>
</div>
<h2 className="font-body-lg text-body-lg font-bold">Auto-Shortlist Engine</h2>
</div>
<label className="switch">
<input 
  type="checkbox" 
  checked={store.autoInterview}
  onChange={(e) => store.updateField('autoInterview', e.target.checked)}
/>
<span className="slider"></span>
</label>
</div>
<div className={`grid grid-cols-1 md:grid-cols-2 gap-stack-lg mt-6 ${!store.autoInterview && 'opacity-50 pointer-events-none'}`}>
<div className="space-y-4">
<p className="text-text-secondary text-label-md">Instantly move top-tier candidates into the 'Interview Pending' stage.</p>
<div className="flex items-center gap-3">
<span className="text-label-md font-bold">Limit to:</span>
<input 
  className="pill-input w-24 text-center" 
  max="100" 
  min="1" 
  type="number" 
  value={store.autoInterviewLimit} 
  onChange={(e) => store.updateField('autoInterviewLimit', parseInt(e.target.value))}
/>
<span className="text-label-md text-text-muted">candidates</span>
</div>
</div>
<div className="bg-surface-container-lowest/50 p-4 rounded-lg border border-white/5 border-dashed">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-secondary text-[20px]">info</span>
<p className="text-[13px] leading-relaxed text-text-secondary italic">"The AI will prioritize diversity and skills-overlap when filling these slots."</p>
</div>
</div>
</div>
</section>

{/*  Section 3: AI Proctoring & Weights  */}
<section className="glass-card p-stack-lg rounded-lg">
  <div className="flex items-center justify-between mb-stack-md">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-purple">
        <span className="material-symbols-outlined">gavel</span>
      </div>
      <h2 className="font-body-lg text-body-lg font-bold">AI Proctoring & Matching Weights</h2>
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg mt-4">
    <div className="space-y-4">
      <label className="font-label-md text-label-md text-text-secondary block mb-2">Proctoring Level</label>
      <select 
        className="w-full h-12 bg-bg-elevated border border-white/10 rounded-xl px-4 font-body-md text-text-primary transition-all appearance-none focus:border-primary focus:outline-none"
        value={store.proctoringLevel}
        onChange={(e) => store.updateField('proctoringLevel', e.target.value)}
      >
        <option>Standard</option>
        <option>High Security</option>
      </select>
      <p className="text-[12px] text-text-muted mt-2">Determines how strict the AI is about potential cheating in remote assessments.</p>
    </div>
    
    <div className="space-y-4">
      <label className="font-label-md text-label-md text-text-secondary block mb-2">Match Weighting</label>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Experience ({store.weightExperience}%)</span>
          <input type="range" min="0" max="100" value={store.weightExperience} onChange={(e) => store.updateField('weightExperience', parseInt(e.target.value))} className="w-1/2" />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Education ({store.weightEducation}%)</span>
          <input type="range" min="0" max="100" value={store.weightEducation} onChange={(e) => store.updateField('weightEducation', parseInt(e.target.value))} className="w-1/2" />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Skills ({store.weightSkills}%)</span>
          <input type="range" min="0" max="100" value={store.weightSkills} onChange={(e) => store.updateField('weightSkills', parseInt(e.target.value))} className="w-1/2" />
        </div>
      </div>
    </div>
  </div>
</section>

{/*  Section 4: Visibility & Notifications  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{/*  Visibility Boost  */}
<div className="glass-card p-stack-lg rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="material-symbols-outlined text-yellow">stars</span>
<label className="switch">
<input 
  type="checkbox" 
  checked={store.boostJob}
  onChange={(e) => store.updateField('boostJob', e.target.checked)}
/>
<span className="slider"></span>
</label>
</div>
<h3 className="font-body-md text-body-md font-bold mb-2">Featured Visibility</h3>
<p className="text-text-secondary text-label-md">Boost your job to the top of candidate feeds for 48 hours. Uses 1 Credit.</p>
</div>
</div>
{/*  Candidate Notify  */}
<div className="glass-card p-stack-lg rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-4">
<span className="material-symbols-outlined text-green">mail</span>
<label className="switch">
<input 
  type="checkbox" 
  checked={store.notifyMatches}
  onChange={(e) => store.updateField('notifyMatches', e.target.checked)}
/>
<span className="slider"></span>
</label>
</div>
<h3 className="font-body-md text-body-md font-bold mb-2">Smart Notification</h3>
<p className="text-text-secondary text-label-md">Notify candidates who are a 90%+ match as soon as you publish.</p>
</div>
</div>
</div>
{/*  Action Buttons  */}
<div className="flex items-center justify-between pt-stack-md">
<button onClick={() => router.push("/employer/create-job-requirements")} className="btn-ghost h-[50px] px-8 rounded-full font-label-md text-label-md text-text-primary flex items-center gap-2">
<span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
<div className="flex gap-4">
<button className="btn-ghost h-[50px] px-8 rounded-full font-label-md text-label-md text-text-primary">Save Draft</button>
<button onClick={handlePublish} className="btn-primary-red h-[50px] px-10 rounded-full font-label-md text-label-md text-white flex items-center gap-2">
                            Publish Job
                            <span className="material-symbols-outlined">rocket_launch</span>
</button>
</div>
</div>
</div>
{/*  Side Summary Area  */}
<div className="lg:col-span-4 space-y-gutter">
<div className="glass-card p-stack-lg rounded-lg sticky top-[84px]">
<h3 className="font-headline-md text-[20px] mb-stack-md">Job Profile Summary</h3>
<div className="space-y-4 border-b border-white/5 pb-stack-md mb-stack-md">
<div className="flex justify-between items-start">
<div>
<p className="text-[12px] text-text-muted uppercase tracking-wider">Role</p>
<p className="font-body-md font-bold text-primary">Senior AI Engineer</p>
</div>
<div className="text-right">
<p className="text-[12px] text-text-muted uppercase tracking-wider">Budget</p>
<p className="font-body-md font-bold text-on-surface">$140k - $180k</p>
</div>
</div>
<div>
<p className="text-[12px] text-text-muted uppercase tracking-wider">Department</p>
<p className="font-body-md font-bold text-on-surface">Core Infrastructure</p>
</div>
</div>
<div className="space-y-4 mb-6">
<h4 className="text-label-md font-bold flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">verified</span>
                            AI Validation Pulse
                        </h4>
<div className="space-y-3">
<div>
<div className="flex justify-between text-[12px] mb-1">
<span className="text-text-secondary">Matching Precision</span>
<span className="text-green font-data-md">High</span>
</div>
<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-green w-[92%]"></div>
</div>
</div>
<div>
<div className="flex justify-between text-[12px] mb-1">
<span className="text-text-secondary">Market Competitiveness</span>
<span className="text-yellow font-data-md">Top 15%</span>
</div>
<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-yellow w-[85%]"></div>
</div>
</div>
</div>
</div>
<button className="btn-gold w-full h-[50px] rounded-full font-label-md text-label-md flex items-center justify-center gap-2">
<span className="material-symbols-outlined">workspace_premium</span>
                        Upgrade to Gold Priority
                    </button>
<p className="text-center text-[11px] text-text-muted mt-3">Get 2x better matches with AI Agent outreach</p>
</div>
{/*  Preview Card  */}
<div className="relative overflow-hidden rounded-lg group h-48">
<img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="A cinematic, high-contrast image of a futuristic office interior at night, with neon blue and red lights reflecting off dark glass and metallic surfaces. The atmosphere is professional yet cutting-edge, perfectly aligning with the dark-mode aesthetic of the HireGo recruitment platform. Soft bokeh highlights of data streams or binary codes in the background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2O2vS_CHTIulftffL9eVIsL3sNhQVduQm22_c_-sOROXTcigMNaJn80h7M3O4pRfQSoftvcH5LK2G0qDbcaIyleaOcrAeO8DvSsXuskWO9rLqc5nOPwjkgGnPpEMCyoijqoUkmdqIx-z_4P8au9IPvPIke791xicxiN3KG2v4Dn89--iEC4xd7LW4EED6cBpcLeuIHx7lUNksTWTi2SWSDCA69jucMZGMmlBiw1W8RFJm0WDBaoU3OkTePfPIP2xtEK3GIptCGuc" />
<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
<div>
<p className="text-white font-bold text-body-md">Candidate Experience</p>
<p className="text-white/60 text-[12px]">See how candidates view this posting</p>
</div>
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
