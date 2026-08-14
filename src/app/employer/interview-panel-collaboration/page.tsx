"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE52() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<div className="flex items-center gap-3 mb-2">
<span className="px-3 py-1 bg-surface-container-highest text-primary rounded-full font-label-md">E56 • Interview Collaborative</span>
<span className="w-2 h-2 rounded-full bg-green ai-glow"></span>
<span className="text-text-secondary font-label-md uppercase tracking-widest">Live Consensus</span>
</div>
<h1 className="font-display-xl text-text-primary mb-2">Alexander Sterling</h1>
<p className="font-body-lg text-text-secondary">Senior Principal Product Designer • San Francisco, CA</p>
</div>
<div className="flex gap-4">
<button className="btn-primary-blue h-[50px] px-8 rounded-full font-label-md text-white flex items-center gap-2">
<span className="material-symbols-outlined">trending_flat</span>
                    Move to Next Round
                </button>
<button className="btn-primary-red h-[50px] px-8 rounded-full font-label-md text-white flex items-center gap-2">
<span className="material-symbols-outlined">verified</span>
                    Move to Offer
                </button>
</div>
</header>
{/*  Disagreement Alert (Conditional)  */}
<div className="mb-6 bg-yellow/10 border border-yellow/20 rounded-2xl p-4 flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-yellow/20 flex items-center justify-center">
<span className="material-symbols-outlined text-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
</div>
<div>
<h4 className="font-label-md text-yellow font-bold">Consensus Alert: High Variance in Technical Assessment</h4>
<p className="text-on-surface-variant font-body-md">Two panelists have rated technical depth below 70 while the lead gave 95. Discussion recommended.</p>
</div>
<button className="ml-auto px-4 py-2 bg-yellow/20 text-yellow rounded-full font-label-md hover:bg-yellow/30 transition-all">Resolve Now</button>
</div>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-12 gap-6">
{/*  Sidebar: Panelists  */}
<aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
<div className="glass-card p-6">
<h3 className="font-headline-md text-text-primary mb-stack-md flex items-center justify-between">
                        Panelists
                        <span className="text-text-muted text-label-md">4 Total</span>
</h3>
<div className="flex flex-col gap-4">
{/*  Panelist 1  */}
<div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
<img className="w-10 h-10 rounded-full object-cover" data-alt="Close up portrait of a serious male engineering manager with glasses, high-end professional lighting, dark grey background, 8k resolution, cinematic quality. The overall mood is intelligent and focused, perfectly aligning with a high-trust AI platform aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKHGZiYOMr7MfyvrUYxxUEUyIju58b6g4oGOmgjJbSuDKLQ6qhQY_Jlm2PqSIToTJdlZYTk0oPcmBFhnVctjpTPAMtxhb5AryhGxkRz8xyBE5g_d496qDUNaMzAPlINUz8MjFhqU6PmuL3DUNbh-CY8Hz0KmaIHskKqK8kfVPwFerFDMEylC9uOIqxBvJeBB_1BqlLzIBGVWlfaE_YjXwWQkVj5IUidHZMFbo-AKhRGkDoY3aeZIkdyis6_HHCpErnslixZbDerOY" />
<div>
<p className="font-label-md text-text-primary">Marcus Chen</p>
<span className="text-[10px] uppercase font-bold text-red-light tracking-tighter">Technical Lead</span>
</div>
<span className="ml-auto material-symbols-outlined text-green text-[20px]">check_circle</span>
</div>
{/*  Panelist 2  */}
<div className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
<img className="w-10 h-10 rounded-full object-cover" data-alt="A portrait of a creative director with a vibrant, artistic look, set in a modern workspace with neon accents and a minimalist desk. The lighting is dramatic and moody, reflecting a high-fidelity tech design brand. High detail, photorealistic style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmP2HT7WxNGCmLr45jFq-972kFwVYbjTRt7AwkO-WjhF3kfB15_vnJy6IN1sXI69_RAdy2Mjph9OTKpDnW9caiX8wxO0kRtZ4wTFCJ0GhRrkfwsxbXs-_AgAoP33wT2lHqFZxi_d_HFu6g6tvU6Zi32fg-dHufS9tIfX85PqR4cg9wI8aTKxPa_HPQdBJ0JO57pAQFUIeor5S2KKWT85MgHGgqjz2T4_U3XG3eaXogJRyyqKHym2bMw-uNbUpaev-YONsgjnDXjVs" />
<div>
<p className="font-label-md text-text-primary">Sarah Jenkins</p>
<span className="text-[10px] uppercase font-bold text-secondary tracking-tighter">Product Owner</span>
</div>
<span className="ml-auto material-symbols-outlined text-green text-[20px]">check_circle</span>
</div>
{/*  Panelist 3  */}
<div className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
<img className="w-10 h-10 rounded-full object-cover" data-alt="A professional male recruiter with a clean, approachable appearance, wearing a sleek black blazer over a dark t-shirt. The background is a soft-focus office with elegant warm lighting. Cohesive with a dark-mode premium UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuT2Q0PPfebharGxw26WS8aORheu-PsZxfe_KqP8aOX-p724znLx_kFQFTv2U3ShPZJ3ACfEOWCZtgXRbT4Ph2p-eHAKMl6dAQcTBMDmslO8lxKdjrF6nGgfyv9bc3Spo_Enr2FhR2WimwqV4d1IcNAfP55ylbwIHKhmVcC6aWru_UjA3uFf-J1dVjRocBzY4EfJ2lOmMWmknSlKzK49i7RfyA-7CZ-xd39MnZuG_-rJFt24B5_n9zh_gGvMmvmQ4KAFh0OhWo3gU" />
<div>
<p className="font-label-md text-text-primary">David Volkov</p>
<span className="text-[10px] uppercase font-bold text-text-muted tracking-tighter">Talent Lead</span>
</div>
<span className="ml-auto material-symbols-outlined text-yellow text-[20px]">pending</span>
</div>
{/*  Panelist 4  */}
<div className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
<img className="w-10 h-10 rounded-full object-cover" data-alt="A portrait of a diverse female executive in an ultra-modern corporate setting. She is wearing a structured designer jacket, and the lighting highlights the sharp edges and sophisticated textures. The background features subtle digital data visualizations." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9bxmygR__YQR8q_x0_XcjveGw_T5VIIFzoD9BKCUmCbk2jGkl4jPLZ7zHg2q4Te5EJMpdl0PlQWrnDgSLqFX2N9K3xoWzIa53o_rCHfIU7YMnL9whqVz8CPZSbd77ay3JXJI8LlfwEVYSFgIjMBcHzPmZyfBZ66q_bYPQX_cQmi2MtDTqqBeeUd240wMFJESpk-CzjR_cirm-qLe5oFeYHR6F4UqlML8R9hc9avYrP5ddTOaPW05ngnds_tpiyuPySr1Prr1qhgM" />
<div>
<p className="font-label-md text-text-primary">Elena Rodriguez</p>
<span className="text-[10px] uppercase font-bold text-secondary tracking-tighter">UX Researcher</span>
</div>
<span className="ml-auto material-symbols-outlined text-green text-[20px]">check_circle</span>
</div>
</div>
</div>
{/*  Aggregated Score  */}
<div className="glass-card p-6 flex flex-col items-center justify-center text-center">
<h3 className="font-headline-md text-text-primary mb-6">Aggregated Score</h3>
<div className="score-ring w-40 h-40">
<div className="relative z-10">
<span className="font-display-lg text-text-primary block leading-none">88</span>
<span className="font-label-md text-text-muted uppercase tracking-widest">Match Score</span>
</div>
</div>
<div className="mt-8 w-full">
<div className="inline-flex items-center gap-2 px-4 py-2 bg-red-light/10 border border-red-light/30 rounded-full">
<span className="material-symbols-outlined text-red-light text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="font-label-md text-red-light font-bold">Strong Hire</span>
</div>
</div>
</div>
</aside>
{/*  Main Content: Feedback Grid  */}
<section className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
{/*  Feedback Card 1  */}
<div className="glass-card p-6 flex flex-col gap-4">
<div className="flex justify-between items-start">
<div className="flex items-center gap-3">
<img className="w-12 h-12 rounded-full object-cover" data-alt="A macro detail shot of a modern, sleek mechanical keyboard with RGB lighting in red and blue tones. The focus is on the precision and quality of the hardware. High-tech, futuristic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEjU5GqknQJ0yNHQ7FwaKruPWGF5cYjYrpkEtSHg4KhR6jtPwKeA1I1WbnYX_u7espR5m8eSiD3Qah9cNx_RTYTblWPVZTiFDpnsyNMOD4K8uzjjtcKakggp4AOLNZyxo1b7qHhxySXok6pyJ-G7uWfjwbtNh9WzzZSmPkWf80f4FLrDvWEKqwvoUJDkvAfMOlOfaaSWOueJLtobe2q8on2oFWOT0-csbv2Cjd-s_VIqbtKv9j7lF4EIY6HllNTsrByLLW_rnjFEI" />
<div>
<p className="font-label-md text-text-primary">Marcus Chen</p>
<p className="text-xs text-text-muted">Technical Interview • 2h ago</p>
</div>
</div>
<div className="bg-surface-container-highest px-3 py-1 rounded-full flex items-center gap-1">
<span className="font-data-md text-red-light">94</span>
<span className="text-[10px] text-text-muted">/100</span>
</div>
</div>
<div className="flex gap-1 text-red-light">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
</div>
<p className="font-body-md text-on-surface-variant leading-relaxed">
                        Alexander demonstrated exceptional depth in distributed systems design. His approach to scalability challenges in the live whiteboarding session was world-class. He clearly understands the trade-offs between consistency and availability in large-scale AI infrastructures.
                    </p>
<div className="mt-auto flex flex-wrap gap-2">
<span className="px-2 py-1 bg-bg-subtle text-text-secondary text-[11px] rounded uppercase font-bold border border-white/5">System Design</span>
<span className="px-2 py-1 bg-bg-subtle text-text-secondary text-[11px] rounded uppercase font-bold border border-white/5">Problem Solving</span>
</div>
</div>
{/*  Feedback Card 2  */}
<div className="glass-card p-6 flex flex-col gap-4">
<div className="flex justify-between items-start">
<div className="flex items-center gap-3">
<img className="w-12 h-12 rounded-full object-cover" data-alt="A portrait of a modern business leader in a high-tech conference room, illuminated by blue and red ambient lighting. The background features blurred silhouettes of team members collaborating. High-trust, professional, and sophisticated atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2sKVqPR87D9lBkbVBcdmfiyoFye8aGhAi_DSIusCMzdXzMldPFQlFOuwyOq7rRQgEuhClhilPVRQriVXg757YGocnTbMBouEJHc4wRLBWpMoEhzZBilFzzWLJ5POAaZQQMuZwUi4LNeUE_BEoFxm9Mxq8EaAAGChcJy5r5_Oo2faNaszvAT-Vj5HD0XGapqwPSoOrgnauZd307rtYV9v_AhKgfuOnpGwuWUUx9mQPGBvA52EVXkaYcyf9cWSggKp1W5Ix9o1AbtU" />
<div>
<p className="font-label-md text-text-primary">Sarah Jenkins</p>
<p className="text-xs text-text-muted">Cultural Fit • 4h ago</p>
</div>
</div>
<div className="bg-surface-container-highest px-3 py-1 rounded-full flex items-center gap-1">
<span className="font-data-md text-secondary">82</span>
<span className="text-[10px] text-text-muted">/100</span>
</div>
</div>
<div className="flex gap-1 text-secondary">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" >star</span>
</div>
<p className="font-body-md text-on-surface-variant leading-relaxed">
                        Solid cultural alignment. Showed great empathy when discussing past project failures. He will integrate well with the existing engineering squad, though he might need some time to adjust to our extreme async workflow given his recent background.
                    </p>
<div className="mt-auto flex flex-wrap gap-2">
<span className="px-2 py-1 bg-bg-subtle text-text-secondary text-[11px] rounded uppercase font-bold border border-white/5">Leadership</span>
<span className="px-2 py-1 bg-bg-subtle text-text-secondary text-[11px] rounded uppercase font-bold border border-white/5">Communication</span>
</div>
</div>
{/*  Feedback Card 3 (The Outlier/Amber Highlight)  */}
<div className="glass-card p-6 flex flex-col gap-4 border-yellow/20 bg-yellow/5">
<div className="flex justify-between items-start">
<div className="flex items-center gap-3">
<img className="w-12 h-12 rounded-full object-cover" data-alt="A creative workspace with multiple monitors displaying complex code and architectural diagrams. The lighting is cool-toned with subtle red highlights on the hardware. High-fidelity, detailed, and professional." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO1iDsaIsn_qdfb6xHUg4CkTTPrCvUQXpJyEGBp0jQg2lVzd6PVyaN3rG2aWFIKA0L0Uo_iyTAl7u6GIqdlLROLc-CvzucilgcHvZpT-rtBmb8aSBTB6YSa83c3qOxwayiZyH7QkhfmL4JVbbKlC_uenJI8DFIljtDig82QC78bDIKSq0HXdkRel9U1_MlElOkXPMKa2EnDPuxqQukJo41BJ5BNYH63RQ7AyfwN2kkOBOevtwKIfLAv2fB3a-zldHlVNJMy91aKjM" />
<div>
<p className="font-label-md text-text-primary">Elena Rodriguez</p>
<p className="text-xs text-text-muted">Technical Deep-dive • 5h ago</p>
</div>
</div>
<div className="bg-yellow/20 px-3 py-1 rounded-full flex items-center gap-1 border border-yellow/30">
<span className="font-data-md text-yellow">64</span>
<span className="text-[10px] text-yellow/60">/100</span>
</div>
</div>
<div className="flex gap-1 text-yellow">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined" >star</span>
<span className="material-symbols-outlined" >star</span>
</div>
<p className="font-body-md text-on-surface-variant leading-relaxed">
                        Concerned about his familiarity with our specific React/Node stack. While his architectural knowledge is strong, the hands-on coding portion was slower than expected. We need to verify if this was just interview nerves or a fundamental skill gap.
                    </p>
<div className="mt-auto flex flex-wrap gap-2">
<span className="px-2 py-1 bg-yellow/10 text-yellow text-[11px] rounded uppercase font-bold border border-yellow/10">Hands-on Coding</span>
</div>
</div>
{/*  Feedback Card 4  */}
<div className="glass-card p-6 flex flex-col gap-4 border-dashed border-white/10 bg-transparent">
<div className="flex flex-col items-center justify-center h-full text-center py-12">
<div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 border border-white/5">
<span className="material-symbols-outlined text-text-muted">add</span>
</div>
<h4 className="font-label-md text-text-primary mb-1">Add Supplementary Feedback</h4>
<p className="text-xs text-text-muted px-8">Include peer reviews or secondary technical assessments.</p>
</div>
</div>
</section>
</div>
{/*  AI Insights Footer  */}
<section className="mt-gutter glass-card p-8 border-primary/20 relative overflow-hidden">
{/*  Background Decoration  */}
<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
<div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
<div className="p-4 bg-primary-container/20 rounded-2xl border border-primary/20">
<span className="material-symbols-outlined text-primary text-[32px] ai-glow" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
</div>
<div className="flex-1">
<h3 className="font-headline-md text-text-primary mb-2">HireGo Intelligence Summary</h3>
<p className="font-body-lg text-on-surface-variant mb-6 max-w-3xl">
                        Alexander ranks in the <span className="text-primary font-bold">top 2% of candidates</span> globally for this role profile. Despite the technical outlier, AI sentiment analysis of the interview transcripts suggests the "slower coding" was due to meticulous edge-case handling rather than lack of knowledge. Consensus probability for retention: <span className="text-green font-bold">94%</span>.
                    </p>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="bg-white/5 p-4 rounded-xl border border-white/5">
<p className="text-[10px] text-text-muted uppercase font-bold mb-1">Risk Factor</p>
<p className="font-label-md text-text-primary">Very Low</p>
</div>
<div className="bg-white/5 p-4 rounded-xl border border-white/5">
<p className="text-[10px] text-text-muted uppercase font-bold mb-1">Growth Potential</p>
<p className="font-label-md text-text-primary">Exponential</p>
</div>
<div className="bg-white/5 p-4 rounded-xl border border-white/5">
<p className="text-[10px] text-text-muted uppercase font-bold mb-1">Expected ROI</p>
<p className="font-label-md text-text-primary">6 Months</p>
</div>
</div>
</div>
</div>
</section>

    </PageContainer>
  );
}
