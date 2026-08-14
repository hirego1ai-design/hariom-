"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE31() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Top Navigation (Contextual)  */}
<header className="flex items-center justify-between mb-6">
<div>
<nav className="flex items-center gap-2 text-on-surface-variant mb-2">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/dashboard">Dashboard</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/pipeline">Talent</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/interviews">Interviews</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/messages">Messages</a>
    </nav>
<h2 className="font-display-lg text-display-lg text-text-primary tracking-tight">Candidate Comparison</h2>
</div>
<div className="flex items-center gap-4">
<div className="flex -space-x-3 overflow-hidden">
<img className="inline-block h-10 w-10 rounded-full ring-2 ring-background" data-alt="A close-up portrait of a professional woman with glasses, smiling warmly, corporate office background with soft bokeh, high-fidelity photography, primary blue accents in clothing." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE3TQqYNEUHE2XvOPjKYHpYcER5ph5Mat6uM5CO4m31WmaCFp1TQcZuUC-ne5r2nowR8MEFTnWqEPjtPa-RmED4xXCcc2Hnwr37Ffs7V-MBVHBmSFUMLOCqYH9dJ5XcGbxAbb_8pTBOk8QuS5qYKJD4mH-__71lphbxqL3a9UQnSUtsg03CtAIWr74_0rv5Pb7yPnXktUB3oCQlDyyorH7m07E3wm_f41vZGpSnnD-Ck5a0RKyAjdFGBPqJcluaWX-zAArsL-gJA4" />
<img className="inline-block h-10 w-10 rounded-full ring-2 ring-background" data-alt="A portrait of a male professional in a dark grey tech-style hoodie, neutral expression, modern minimalist studio lighting with subtle blue and red edge lighting to match the HireGo AI aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEVp4vRCdRLrNIX7ER7W6DuogK6NDDZBWpPE9FB5wQjpOwmk7WUFpxT0GO-OxljWXJf9zYstxjRkX69rUw23hIt2J53kTfYbf6DPL18fzJU6qVEs7ZZi8gDkiQoXhoSCVayOZQ3Csdhv_Sd6pztpnMyigdFTZBvF_81Gry3cr8H8qJjfRTEl4E-W8nXkEAHMizno-EO2omXG-S-OSAVRpyljJozs1ka98BIyV89svawBAE1dt0nC9II9k5Bjt6Dut97HtwConUYBs" />
</div>
<div className="h-10 w-px bg-white/10 mx-2"></div>
<button className="btn-ghost px-6 h-[50px] rounded-full flex items-center gap-2 text-text-primary">
<span className="material-symbols-outlined">share</span>
                    Share Results
                </button>
</div>
</header>
{/*  Comparison Section  */}
<div className="glass-card rounded-lg overflow-hidden">
{/*  Header Row  */}
<div className="comparison-grid">
<div className="flex items-end pb-8">
<p className="text-on-surface-variant font-label-md uppercase tracking-widest">Attributes</p>
</div>
{/*  Candidate 1  */}
<div className="flex flex-col items-center text-center py-stack-lg bg-surface-container-low/30">
<div className="relative mb-6">
<img className="w-24 h-24 rounded-full border-2 border-primary object-cover" data-alt="Professional headshot of Sarah Jenkins, a senior designer. She has a confident smile and is wearing a dark navy blazer. The lighting is crisp and modern, set against a dark architectural background with subtle light flares." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSIdvTTTGSVxFoP_b0mrZlxn17xVZ0slYRM0KIZ9wix6xeZ91sDzD7XZJ7KiICds5jMOaaIYtbuXhAHW1W1-lGFYD_iVRF5CYZLrSGGj5e10HtGBG6Kxp9UXJ9vlUticILLU-ce40dTVfhSZuzWQRy2BHyoUvgtC024gq13I56kkjgGTce5zHHKG1i9sSCcan6pPl8Dtq9JY6hHTa7quEvvPEK6UuhVcEPmG_xFzirJudr_V_M3TIhZEtepIXrBZkiFFn6GAS_aHI" />
<div className="absolute -bottom-2 -right-2 bg-primary text-on-primary text-[12px] font-bold px-2 py-1 rounded-md shadow-lg">98% Match</div>
</div>
<h3 className="font-display-lg text-[24px] text-text-primary mb-1">Sarah Jenkins</h3>
<p className="text-on-surface-variant font-body-md mb-4">Senior UX Architect</p>
<div className="flex gap-4 items-center">
<div className="text-center">
<span className="block font-data-lg text-primary">8.9</span>
<span className="text-[10px] uppercase text-on-surface-variant font-bold">Hire Score</span>
</div>
<div className="w-px h-8 bg-white/10"></div>
<div className="text-center">
<span className="block font-data-lg text-yellow">4.8</span>
<span className="text-[10px] uppercase text-on-surface-variant font-bold">AI Rating</span>
</div>
</div>
</div>
{/*  Candidate 2 (Winner)  */}
<div className="flex flex-col items-center text-center py-stack-lg winner-highlight">
<div className="absolute top-4 right-4 flex items-center gap-1 bg-green/20 text-green px-3 py-1 rounded-full text-[12px] font-bold border border-green/30">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        HIREGO PICK
                    </div>
<div className="relative mb-6">
<img className="w-24 h-24 rounded-full border-2 border-green object-cover" data-alt="Professional headshot of Marcus Chen, a technology leader. He is wearing a sleek charcoal turtleneck, looking slightly off-camera with a visionary gaze. The aesthetic is high-tech, with dark glass textures and cyan rim lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAid366vRkdoHcxQCpHWcqbi-krn6WwGDSgq-RS200mEEZlpFsJdoEHORqRfrXpAZ9O82LRNThtbpmELxZiRvsO62TyCN-vBb_LuXi6UPI5gPI1Ye02J_HJ0z1AYE7Ea756bD9Js8BBvHuNwuQOjFlOVP32vFYWNSh-ak6FLdKsgRl61KXysSI7ZnwIsGDXkPbzRQ28mVg1v6JblW4bpCRj31u5iuwU0WasJZx6UgbArDjg9jsGpkTWak5U3GXyrIW9mNtn3VvyN28" />
<div className="absolute -bottom-2 -right-2 bg-green text-white text-[12px] font-bold px-2 py-1 rounded-md shadow-lg">99% Match</div>
</div>
<h3 className="font-display-lg text-[24px] text-text-primary mb-1">Marcus Chen</h3>
<p className="text-on-surface-variant font-body-md mb-4">Principal Product Designer</p>
<div className="flex gap-4 items-center">
<div className="text-center">
<span className="block font-data-lg text-green font-bold">9.4</span>
<span className="text-[10px] uppercase text-on-surface-variant font-bold">Hire Score</span>
</div>
<div className="w-px h-8 bg-white/10"></div>
<div className="text-center">
<span className="block font-data-lg text-yellow">4.9</span>
<span className="text-[10px] uppercase text-on-surface-variant font-bold">AI Rating</span>
</div>
</div>
</div>
</div>
{/*  Comparison Rows  */}
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Experience</div>
<div className="text-text-primary font-body-md">8 Years (Google, Meta)</div>
<div className="text-text-primary font-body-md winner-highlight">12 Years (Apple, Airbnb, Stripe)</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Skills Match</div>
<div className="flex flex-wrap gap-2">
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">Figma</span>
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">React</span>
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">Lead</span>
</div>
<div className="flex flex-wrap gap-2 winner-highlight">
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">Figma Expert</span>
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">Design Systems</span>
<span className="bg-bg-subtle px-3 py-1 rounded-full text-label-md border border-white/5">Strategy</span>
</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Assessment Scores</div>
<div className="space-y-2">
<div className="flex justify-between text-label-md mb-1"><span>Technical</span> <span className="text-primary font-bold">92%</span></div>
<div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full" style={{ width: '92%' }}></div>
</div>
</div>
<div className="space-y-2 winner-highlight">
<div className="flex justify-between text-label-md mb-1"><span>Technical</span> <span className="text-green font-bold">98%</span></div>
<div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
<div className="bg-green h-full" style={{ width: '98%' }}></div>
</div>
</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Salary Ask</div>
<div className="font-data-md text-text-primary">$145k — $160k</div>
<div className="font-data-md text-text-primary winner-highlight">$175k — $190k</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Notice Period</div>
<div className="text-text-primary">2 Weeks</div>
<div className="text-text-primary winner-highlight">Immediate</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Location</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">location_on</span>
<span>London, UK (Remote)</span>
</div>
<div className="flex items-center gap-2 winner-highlight">
<span className="material-symbols-outlined text-[18px]">location_on</span>
<span>San Francisco, CA (Hybrid)</span>
</div>
</div>
<div className="comparison-grid border-t border-white/5">
<div className="font-bold text-on-surface-variant">Video Assessment</div>
<div className="flex items-center gap-2 text-yellow">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined">star</span>
</div>
<div className="flex items-center gap-2 text-yellow winner-highlight">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
</div>
{/*  Footer Actions Row  */}
<div className="comparison-grid border-t border-white/10 bg-surface-container-high/20">
<div></div>
<div className="flex flex-col gap-3 py-6">
<button className="w-full btn-red-3d h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white">
                        Schedule Interview
                    </button>
<button className="w-full btn-ghost h-[50px] rounded-full flex items-center justify-center gap-2 text-text-primary">
                        View Full Profile
                    </button>
</div>
<div className="flex flex-col gap-3 py-6 winner-highlight">
<button className="w-full btn-red-3d h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white relative overflow-hidden">
<span className="relative z-10">Schedule Interview</span>
<div className="absolute inset-0 bg-white/10 animate-pulse"></div>
</button>
<button className="w-full btn-ghost h-[50px] rounded-full flex items-center justify-center gap-2 text-text-primary">
                        View Full Profile
                    </button>
</div>
</div>
</div>
{/*  AI Summary Card  */}
<div className="mt-stack-lg grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="md:col-span-2 glass-card p-stack-lg rounded-lg border-l-4 border-l-secondary-container">
<div className="flex items-center gap-3 mb-4">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
</div>
<h4 className="font-display-lg text-[20px] text-text-primary">AI Consensus Summary</h4>
</div>
<p className="text-body-lg text-on-surface-variant leading-relaxed">
                    While both candidates exhibit exceptional design thinking, <span className="text-green font-bold">Marcus Chen</span> demonstrates a superior ability to scale design systems across multi-platform ecosystems based on his recent Stripe tenure. <span className="text-primary font-bold">Sarah Jenkins</span> remains a top-tier choice for focused UX research and architectural overhaul, but Marcus aligns more closely with your "Principal" requirements.
                </p>
</div>
<div className="glass-card p-stack-lg rounded-lg flex flex-col justify-center items-center text-center">
<p className="text-label-md text-on-surface-variant uppercase mb-2 tracking-widest">Confidence Level</p>
<div className="relative w-24 h-24 mb-2">
<svg className="w-full h-full" viewBox="0 0 36 36">
<path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3"></path>
<path className="text-green" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="94, 100" strokeLinecap="round" strokeWidth="3"></path>
</svg>
<div className="absolute inset-0 flex items-center justify-center font-data-lg text-green">94%</div>
</div>
<p className="text-label-md text-green font-bold">Very High</p>
</div>
</div>

    </PageContainer>
  );
}
