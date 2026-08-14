"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";
import { useJobCreationStore, ToneOfVoice } from "@/store/useJobCreationStore";

export default function EmployerPageE59() {
  const router = useRouter();
  const store = useJobCreationStore();

  const handleNext = () => {
    router.push("/employer/create-job-requirements");
  };

  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header Section  */}
<header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<div className="flex items-center gap-3 mb-2">
<div className="p-2 rounded-xl bg-surface-container-high border border-white/10">
<span className="material-symbols-outlined text-yellow text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
</div>
<span className="font-label-md text-label-md text-text-secondary">Step 2 of 3</span>
</div>
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-text-primary tracking-tight">AI Job Description Writer</h1>
<p className="font-body-md text-body-md text-text-secondary mt-2 max-w-xl">Leverage our enterprise AI to craft a high-conversion job description based on your specific requirements and company culture.</p>
</div>
<div className="flex gap-3">
<button 
    onClick={() => router.push("/employer/create-job-basic-info")}
    className="btn-ghost px-6 h-[50px] rounded-full font-label-md text-label-md text-text-primary flex items-center gap-2"
>
<span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back
                </button>
<button className="btn-ghost px-6 h-[50px] rounded-full font-label-md text-label-md text-text-primary">Save Draft</button>
</div>
</header>
{/*  Main Workspace: Bento Layout  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Sidebar: Input Controls  */}
<div className="lg:col-span-4 flex flex-col gap-6">
{/*  Input Card  */}
<div className="glass-card rounded-lg p-6 flex flex-col gap-6 relative overflow-hidden">
<div className="ai-glow"></div>
<div>
<label className="font-label-md text-label-md text-text-secondary block mb-3">Core Responsibilities</label>
<textarea 
  className="w-full min-h-[160px] bg-bg-page border border-white/10 rounded-2xl p-4 font-body-md text-body-md text-text-primary focus:border-primary outline-none transition-all placeholder:text-text-muted resize-none" 
  placeholder="e.g. Lead the migration to a microservices architecture..."
  value={store.coreResponsibilities}
  onChange={e => store.updateField('coreResponsibilities', e.target.value)}
/>
</div>
<div>
<label className="font-label-md text-label-md text-text-secondary block mb-3">Tone of Voice</label>
<div className="grid grid-cols-2 gap-2">
{(['Professional', 'Casual', 'Academic', 'Urgent'] as ToneOfVoice[]).map(t => (
  <button 
    key={t}
    onClick={() => store.updateField('toneOfVoice', t)}
    className={`flex items-center justify-center h-[40px] rounded-full font-label-md text-label-md transition-all ${store.toneOfVoice === t ? 'bg-white/5 border border-primary text-primary' : 'bg-white/5 border border-white/5 text-text-secondary hover:bg-white/10'}`}
  >
    {t === 'Casual' ? 'Casual/Modern' : t}
  </button>
))}
</div>
</div>
<div>
<label className="font-label-md text-label-md text-text-secondary block mb-3">Key Requirements</label>
<input 
  className="w-full h-[50px] bg-bg-page border border-white/10 rounded-full px-6 font-body-md text-body-md text-text-primary focus:border-primary outline-none transition-all placeholder:text-text-muted" 
  placeholder="e.g. 5+ years React, Go, AWS" 
  type="text" 
  value={store.keyRequirements}
  onChange={e => store.updateField('keyRequirements', e.target.value)}
/>
</div>
<div>
<label className="font-label-md text-label-md text-text-secondary block mb-3">AI Focus Areas (Hard/Soft Skills)</label>
<input 
  className="w-full h-[50px] bg-bg-page border border-white/10 rounded-full px-6 font-body-md text-body-md text-text-primary focus:border-primary outline-none transition-all placeholder:text-text-muted" 
  placeholder="e.g. emphasize leadership and python" 
  type="text" 
  value={store.aiFocusAreas}
  onChange={e => store.updateField('aiFocusAreas', e.target.value)}
/>
</div>
<div>
<label className="font-label-md text-label-md text-text-secondary block mb-3">Reference JD (Optional)</label>
<textarea 
  className="w-full min-h-[120px] bg-bg-page border border-white/10 rounded-2xl p-4 font-body-md text-body-md text-text-primary focus:border-primary outline-none transition-all placeholder:text-text-muted resize-none" 
  placeholder="Paste an existing JD for the AI to improve..."
  value={store.referenceJd}
  onChange={e => store.updateField('referenceJd', e.target.value)}
/>
</div>
<button className="btn-gold w-full h-[50px] rounded-full flex items-center justify-center gap-2 text-black font-label-md text-label-md font-bold mt-2">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>magic_button</span>
                        Generate JD with AI
                    </button>
</div>
{/*  Tips Card  */}
<div className="bg-surface-container-low border border-white/5 rounded-lg p-6">
<h3 className="font-label-md text-label-md text-text-primary mb-3 flex items-center gap-2">
<span className="material-symbols-outlined text-yellow text-[18px]">lightbulb</span>
                        AI Writing Tips
                    </h3>
<ul className="space-y-3">
<li className="flex gap-3 items-start">
<span className="material-symbols-outlined text-[16px] text-green mt-1">check_circle</span>
<p className="font-body-md text-[13px] leading-relaxed text-text-secondary">Be specific about tech stack versions to attract the right expertise.</p>
</li>
<li className="flex gap-3 items-start">
<span className="material-symbols-outlined text-[16px] text-green mt-1">check_circle</span>
<p className="font-body-md text-[13px] leading-relaxed text-text-secondary">Mention daily impacts rather than just abstract responsibilities.</p>
</li>
</ul>
</div>
</div>
{/*  Main Panel: Output Editor  */}
<div className="lg:col-span-8">
<div className="glass-card rounded-lg flex flex-col h-[740px] overflow-hidden">
{/*  Editor Toolbar  */}
<div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/2">
<div className="flex items-center gap-4">
<div className="flex items-center gap-1">
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">format_bold</span></button>
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">format_italic</span></button>
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">format_list_bulleted</span></button>
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">format_list_numbered</span></button>
<div className="w-[1px] h-6 bg-white/10 mx-1"></div>
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">link</span></button>
<button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">image</span></button>
</div>
</div>
<div className="flex items-center gap-2">
<button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-all text-label-md font-label-md">
<span className="material-symbols-outlined text-[18px]">history</span>
                                History
                            </button>
<button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-all text-label-md font-label-md">
<span className="material-symbols-outlined text-[18px]">download</span>
                                Export
                            </button>
</div>
</div>
{/*  Editor Content  */}
<div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-bg-page/40">
<article className="max-w-3xl mx-auto space-y-8">
<section>
<h2 className="font-headline-md text-headline-md text-text-primary mb-4">Senior Full-Stack Engineer (AI Platforms)</h2>
<p className="text-text-secondary leading-relaxed">Join HireGo AI's core engineering team to build the future of autonomous recruitment. We are looking for a visionary engineer who excels at bridging the gap between sophisticated AI models and intuitive user interfaces.</p>
</section>
<section>
<h3 className="font-label-md text-label-md text-primary tracking-widest uppercase mb-4">The Mission</h3>
<ul className="list-disc list-inside space-y-3 text-text-secondary leading-relaxed">
<li>Architect and maintain high-performance microservices using Go and Node.js.</li>
<li>Integrate advanced LLMs into our proprietary ranking and matching engines.</li>
<li>Work closely with UX designers to implement pixel-perfect, glassmorphic interfaces using Tailwind and React.</li>
<li>Mentor a distributed team of 5+ developers across multiple timezones.</li>
</ul>
</section>
<section>
<h3 className="font-label-md text-label-md text-primary tracking-widest uppercase mb-4">Who You Are</h3>
<ul className="list-disc list-inside space-y-3 text-text-secondary leading-relaxed">
<li>7+ years of professional software development experience.</li>
<li>Deep expertise in React, TypeScript, and modern CSS frameworks.</li>
<li>Proven track record with AWS infrastructure and CI/CD pipelines.</li>
<li>Passion for AI/ML and its practical applications in enterprise SaaS.</li>
</ul>
</section>
<section className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
<h3 className="font-label-md text-label-md text-text-primary mb-2">Perks &amp; Culture</h3>
<p className="text-text-secondary text-body-md">We offer a fully remote environment, comprehensive health benefits, equity packages, and an annual $3k learning stipend. At HireGo AI, we value deep work and async communication.</p>
</section>
</article>
</div>
{/*  Footer Action  */}
<div className="p-6 border-t border-white/10 bg-white/2 flex justify-between items-center">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-green"></span>
<span className="text-label-md font-label-md text-text-secondary">Changes saved 2m ago</span>
</div>
<button 
    onClick={handleNext}
    className="h-[50px] px-10 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_4px_0_#9B1B18] active:translate-y-1 active:shadow-none transition-all"
>
                            Continue to Step 3
                        </button>
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
