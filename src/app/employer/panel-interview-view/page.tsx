"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE49() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Left Column: Video Feeds & Content  */}
<div className="flex-1 flex flex-col gap-6">
{/*  Hero Video Area (Split View)  */}
<div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
{/*  Large Candidate Feed (The Hero)  */}
<div className="col-span-8 relative rounded-lg overflow-hidden glass-panel active-speaker-glow group">
<img className="w-full h-full object-cover" data-alt="A cinematic medium shot of a candidate during a video interview. A young male professional in a modern home office, natural soft lighting from a window, thoughtful expression. The style is ultra-high fidelity, 4k resolution, professional tech aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9grvKrvPWFEqXHU3qR7U0Nc8f0tEa-2lPHl2k4ye-cnAVJXu31mFnKoA6cASuLgfREcUaEbGtqJnp1Hjj0n4aEdwbRYNLAlG-cw14m5bpSwn3hQbkRkTKYLl2G3F8NZL_lY2JG71eoGSm2WAR5LKXrnKzYp6RQ0nLuGwQ2ilfwfdhSziP3fI7LAJSXqMxM4Kj0rhW1wTzhVlXUZrK4Qc7rFxKC7DStgKNWL8gpooMsKXBLbt8g9I7ijro1o3P4qIk2rJj2qb4uAE" />
{/*  Identity Overlay  */}
<div className="absolute bottom-4 left-4 flex items-center gap-3">
<div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
<h2 className="font-headline-md text-body-lg text-white">Alex Rivera</h2>
<p className="font-label-md text-[12px] text-on-surface-variant opacity-80 uppercase tracking-widest">Candidate</p>
</div>
<div className="w-8 h-8 rounded-full bg-red-light flex items-center justify-center animate-pulse shadow-lg shadow-red-light/40">
<span className="material-symbols-outlined text-white text-lg">mic</span>
</div>
</div>
{/*  AI Insight Pop-up  */}
<div className="absolute top-4 right-4 bg-primary-container/20 backdrop-blur-xl border border-primary/30 p-4 rounded-lg w-64 transform translate-x-2 group-hover:translate-x-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
<div className="flex items-center gap-2 mb-2">
<span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
<span className="text-primary font-bold text-xs uppercase tracking-tighter">AI Insight</span>
</div>
<p className="text-white text-xs font-body-md leading-relaxed">Candidate displays high proficiency in React system design. Eye contact is consistent.</p>
</div>
</div>
{/*  Interviewer Stack (Right of Candidate)  */}
<div className="col-span-4 flex flex-col gap-4">
{/*  Interviewer 1  */}
<div className="flex-1 relative rounded-lg overflow-hidden glass-panel border border-white/10">
<img className="w-full h-full object-cover" data-alt="A professional headshot of Sarah Chen, a female interviewer. She is wearing a dark blazer, soft ring lighting, neutral background, looking engaged and attentive. High-end professional video conferencing aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq_XtE_iHL0W0bleHKM22SNTguGqpfvpzaCzs1UeqCbdRKKegMoHOBdcZIWC6-eOj1D32Q7tE1Rf9Rg7-ejGlVi711GlmQiFsUSaVsOsnd2JUmzosZOzRezGOwWgRMtJ038qHcx62l7x0mQ_qBpM4_kfyTxBVyvM1WvEu5yirLnV45SWTjEDz5WbMo2ttvxzgp3nfbx0heMKUMlL6M225vHCAOJP6Ghmnd7ruzfZEDuZ1vcfJeQ5b5qV35tLXSiDyKUFFK_lTI-cY" />
<div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
<p className="font-headline-md text-sm text-white">Sarah Chen (You)</p>
</div>
</div>
{/*  Interviewer 2  */}
<div className="flex-1 relative rounded-lg overflow-hidden glass-panel border border-white/10">
<img className="w-full h-full object-cover" data-alt="A professional headshot of Marcus Thorne, a male technical interviewer. Mid-40s, creative studio background with warm lighting, wearing a casual sweater. Sharp focus, high fidelity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKLGDFYIX5FecjQSzl8WY44qFhBoa_lXMnZjCxXscW8ZDsj6VxLGtd_TgJhpcnQNRY0e-Gb1s4wD3cA6fEucAcJDSW0XEHInfr0gDvlFP7xnb73Y06YN7ur8KAYSXOUMv_DPyowMrJ0TmU0o7OSYLkMtpdoEW89EFLeYwlWqkgkJjtU_7yWjr0gENi-kEMME1uGDoJn1jOauDWxd0EJMm7L8DxHdRght7vt0G6RgKCvrmhNvM8YXUAEG64zl1VF6_eYWB64TYg9HE" />
<div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
<p className="font-headline-md text-sm text-white">Marcus Thorne</p>
</div>
<div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
<span className="material-symbols-outlined text-white/40 text-sm">mic_off</span>
</div>
</div>
</div>
</div>
{/*  Bottom: Shared Screen / Presentation Area  */}
<div className="h-[180px] rounded-lg glass-panel overflow-hidden relative flex items-center justify-center border-dashed border-2 border-white/10">

<div className="relative z-10 text-center">
<span className="material-symbols-outlined text-primary text-4xl mb-2">screen_share</span>
<p className="font-label-md text-on-surface-variant">Screen share is currently idle</p>
<button className="mt-2 text-primary font-bold text-sm hover:underline">Start Presentation</button>
</div>
</div>
</div>
{/*  Right Column: Sidebar (Notes & Feedback)  */}
<aside className="w-[380px] flex flex-col gap-stack-lg">
{/*  Panel Shared Notes  */}
<div className="flex-1 glass-panel rounded-lg flex flex-col overflow-hidden">
<div className="p-stack-md border-b border-white/10 flex items-center justify-between bg-white/5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary">edit_note</span>
<h3 className="font-headline-md text-lg text-primary">Team Notes</h3>
</div>
<span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Internal Only</span>
</div>
<div className="flex-1 overflow-y-auto p-stack-md flex flex-col gap-4 scrollbar-hide">
{/*  Note Entry 1  */}
<div className="space-y-1">
<div className="flex justify-between items-center">
<span className="text-[11px] font-bold text-on-surface-variant">Marcus T. • 10:14 AM</span>
</div>
<p className="font-body-md text-sm text-on-surface-variant leading-relaxed">Strong understanding of distributed systems. Explained CAP theorem well but struggled slightly with sharding strategies.</p>
</div>
{/*  Note Entry 2  */}
<div className="space-y-1">
<div className="flex justify-between items-center">
<span className="text-[11px] font-bold text-on-surface-variant">Sarah C. (You) • 10:28 AM</span>
</div>
<div className="bg-white/5 p-3 rounded-lg border border-white/5">
<p className="font-body-md text-sm text-primary leading-relaxed">Communication skills are top-notch. High emotional intelligence detected in scenario response.</p>
</div>
</div>
{/*  AI Suggested Tags  */}
<div className="mt-4">
<p className="text-[10px] font-bold text-muted uppercase mb-2">AI Highlight Tags</p>
<div className="flex flex-wrap gap-2">
<span className="px-2 py-1 bg-green/10 text-green rounded-full text-[10px] font-bold">#ScalabilityExpert</span>
<span className="px-2 py-1 bg-yellow/10 text-yellow rounded-full text-[10px] font-bold">#LowLatencyDesign</span>
<span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold">#LeadershipPotential</span>
</div>
</div>
</div>
{/*  Input Area  */}
<div className="p-stack-md bg-black/40 border-t border-white/10">
<div className="relative">
<input className="w-full h-12 bg-bg-elevated border-none rounded-full px-6 text-sm focus:ring-1 focus:ring-primary/50 text-white placeholder:text-muted" placeholder="Add a quick note..." type="text" />
<button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
<span className="material-symbols-outlined text-sm">send</span>
</button>
</div>
</div>
</div>
{/*  Action Cluster  */}
<div className="flex flex-col gap-3">
<button className="w-full h-[50px] rounded-full btn-3d-red flex items-center justify-center gap-2 text-white font-headline-md tracking-tight">
<span className="material-symbols-outlined">how_to_reg</span>
                    Submit Individual Feedback
                </button>
<div className="grid grid-cols-2 gap-3">
<button className="h-[50px] rounded-full btn-3d-ghost flex items-center justify-center gap-2 text-on-surface font-label-md">
<span className="material-symbols-outlined">pause_circle</span>
                        Pause
                    </button>
<button className="h-[50px] rounded-full bg-red-deep/20 border border-red-deep/40 text-red-light flex items-center justify-center gap-2 font-headline-md hover:bg-red-deep/40 transition-all">
<span className="material-symbols-outlined">call_end</span>
                        End Interview
                    </button>
</div>
</div>
</aside>

    </PageContainer>
  );
}
