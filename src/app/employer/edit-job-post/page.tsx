"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE3() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Top Nav Bar  */}
<header className="fixed top-0 right-0 left-0 md:left-[240px] z-50 h-[64px] flex items-center justify-between  backdrop-blur-md bg-surface/80 border-b border-white/10">
<div className="flex items-center gap-4">
<button className="md:hidden text-primary">
<span className="material-symbols-outlined" data-icon="menu">menu</span>
</button>
<h2 className="font-headline-md text-headline-md text-on-surface">Edit Job Post</h2>
</div>
<div className="flex items-center gap-6">
<div className="hidden lg:flex items-center gap-6">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Dashboard</a>
<a className="font-body-md text-body-md text-primary border-b-2 border-primary pb-1" href="#">Jobs</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Analytics</a>
</div>
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer" data-icon="notifications">notifications</span>
<div className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-white/10">
<img className="w-full h-full object-cover" data-alt="Professional headshot of a senior tech recruiter in a modern office, wearing a navy blazer, soft lighting, 8k resolution, high trust aesthetic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUxjNFm6EQ5AUkt3cknMsmq8PhA4j-HJ3IwppW7eJ9YkWC4kjKHcfccyXrwkwE6937Vk3r8Lf7jfmbIulbbBcAWQpD_MCGwnKP7rBYv84nrq53t4TLgfEmD23tvbDrwMZdKC16wDPnv1FVF20OfYAtzU_tdIl-q843ObaIZ-iHjvKsHHdb5Nbp_TdiAoTbkz7sZQPd1OxhkEW7YZYE_8et6YHONjQRgPWmjhQbnOzWiT9wQqLBT-LXL3qBNK4disvaH0t8iMdepY0" />
</div>
</div>
</div>
</header>
<div className="pt-[84px] px-margin-mobile md: pb-stack-lg  mx-auto">
{/*  Form Header & Progress  */}
<div className="mb-10">
<div className="flex items-center gap-2 text-text-muted mb-4">
<span className="material-symbols-outlined text-[18px]" data-icon="arrow_back">arrow_back</span>
<span className="font-label-md text-label-md">Back to Active Jobs</span>
</div>
<div className="flex flex-wrap items-center gap-8 border-b border-white/5">
<button className="pb-4 font-headline-md text-[18px] step-active">Basic Information</button>
<button className="pb-4 font-headline-md text-[18px] text-text-muted hover:text-on-surface transition-colors">Job Description</button>
<button className="pb-4 font-headline-md text-[18px] text-text-muted hover:text-on-surface transition-colors">Requirements</button>
<button className="pb-4 font-headline-md text-[18px] text-text-muted hover:text-on-surface transition-colors">Screening Questions</button>
<button className="pb-4 font-headline-md text-[18px] text-text-muted hover:text-on-surface transition-colors">AI Matching</button>
</div>
</div>
{/*  Warning Notification (Contextual Alert)  */}
<div className="hidden mb-8 p-4 rounded-xl bg-primary-container/10 border border-primary/20 flex items-start gap-4" id="candidate-warning">
<span className="material-symbols-outlined text-primary" data-icon="warning">warning</span>
<div>
<h4 className="font-label-md text-label-md text-primary font-bold">Caution: Affects Active Candidates</h4>
<p className="text-on-surface-variant text-body-md mt-1">Changing the "Minimum Experience" or "Required Skills" will re-evaluate <strong>14 active candidates</strong> currently in the pipeline. Some may be automatically disqualified.</p>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Main Form Section  */}
<div className="lg:col-span-8 space-y-6">
<section className="glass-card p-stack-lg rounded-2xl">
<h3 className="font-headline-md text-[24px] mb-8">Role Fundamentals</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
<div className="space-y-2">
<label className="font-label-md text-text-muted ml-4">Job Title</label>
<input className="input-pill w-full text-on-surface focus:outline-none focus:border-primary/50" type="text" value="Senior Backend Architect" />
</div>
<div className="space-y-2">
<label className="font-label-md text-text-muted ml-4">Department</label>
<select className="input-pill w-full text-on-surface appearance-none focus:outline-none focus:border-primary/50">
<option>Engineering</option>
<option>Product</option>
<option>Design</option>
</select>
</div>
<div className="space-y-2">
<label className="font-label-md text-text-muted ml-4">Employment Type</label>
<select className="input-pill w-full text-on-surface appearance-none focus:outline-none focus:border-primary/50">
<option>Full-time</option>
<option>Contract</option>
<option>Part-time</option>
</select>
</div>
<div className="space-y-2">
<label className="font-label-md text-text-muted ml-4">Work Mode</label>
<select className="input-pill w-full text-on-surface appearance-none focus:outline-none focus:border-primary/50">
<option>Remote</option>
<option>Hybrid</option>
<option>On-site</option>
</select>
</div>
</div>
<div className="mt-8 space-y-2">
<label className="font-label-md text-text-muted ml-4">Salary Range (Annual)</label>
<div className="flex items-center gap-4">
<div className="relative flex-1">
<span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted">$</span>
<input className="input-pill w-full pl-10 focus:outline-none focus:border-primary/50" type="number" value="140000" />
</div>
<span className="text-text-muted">to</span>
<div className="relative flex-1">
<span className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted">$</span>
<input className="input-pill w-full pl-10 focus:outline-none focus:border-primary/50" onChange={() => document.getElementById('candidate-warning')?.classList.remove('hidden')} type="number" value="190000" />
</div>
</div>
</div>
</section>
<section className="glass-card p-stack-lg rounded-2xl">
<div className="flex justify-between items-center mb-8">
<h3 className="font-headline-md text-[24px]">Location &amp; Compliance</h3>
<span className="bg-surface-container-highest px-3 py-1 rounded-full text-[12px] font-label-md text-secondary">Verified by AI</span>
</div>
<div className="space-y-6">
<div className="space-y-2">
<label className="font-label-md text-text-muted ml-4">Primary Location</label>
<div className="flex items-center gap-3 bg-[#1E1E1E] border border-white/5 rounded-full px-6 py-3">
<span className="material-symbols-outlined text-text-muted" data-icon="location_on">location_on</span>
<span className="text-on-surface">San Francisco, CA (Global Remote)</span>
</div>
<div className="w-full h-[180px] rounded-xl overflow-hidden mt-4 grayscale opacity-60">
<img className="w-full h-full object-cover" data-location="San Francisco" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASFYxe15qe2jBGDsXGVOeFvhLzEdzhr6RDdx05XalfGqQU2Mvh5bqpXgCnbhOKpumH6q8WJAl8Z-IDoUVEhReaRhPhIFIFab0V8Ijrae7nV96ZsKcvt6IzUPCw7B-SjVEznYJl0ptV6Hznkx2_Ln_zY0Gjy0hg6EqcHvLUgdqFoyRp99KqIrfgmZ84mYY2F9TFZ2vvhg1iC47DV_8ZWbbifg0BmrYDGl3jusBTLyeGq3-xBnogYeWsSiW_r8z3m61F4YnOsxM44rw" />
</div>
</div>
</div>
</section>
</div>
{/*  Sidebar Info / Stats  */}
<div className="lg:col-span-4 space-y-stack-md">
<div className="glass-card p-6 rounded-2xl border-primary/20 bg-primary/5">
<div className="flex items-center gap-3 mb-4">
<span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
<h4 className="font-headline-md text-[18px]">AI Post Audit</h4>
</div>
<ul className="space-y-4">
<li className="flex items-start gap-3">
<span className="material-symbols-outlined text-green text-[20px]" data-icon="check_circle">check_circle</span>
<p className="text-body-md text-on-surface-variant">Market-competitive salary range detected for <strong>Backend</strong> roles.</p>
</li>
<li className="flex items-start gap-3">
<span className="material-symbols-outlined text-yellow text-[20px]" data-icon="lightbulb">lightbulb</span>
<p className="text-body-md text-on-surface-variant">Adding <strong>"Golang"</strong> as a required skill could increase candidate quality by 22%.</p>
</li>
</ul>
</div>
<div className="glass-card p-6 rounded-2xl">
<h4 className="font-label-md text-text-muted mb-4 uppercase tracking-widest text-[11px]">Current Pipeline</h4>
<div className="flex items-end gap-2 mb-2">
<span className="font-display-lg text-[42px] leading-none">124</span>
<span className="text-green text-label-md pb-1 flex items-center"><span className="material-symbols-outlined text-[14px]" data-icon="arrow_upward">arrow_upward</span> 12%</span>
</div>
<p className="text-text-muted text-body-md">Total Applications received for this post since 12th Oct.</p>
<div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_8px_rgba(255,180,170,0.5)]"></div>
</div>
</div>
</div>
</div>
{/*  Sticky Bottom Actions  */}
<div className="fixed bottom-0 right-0 left-0 md:left-[240px] p-6 backdrop-blur-xl bg-background/60 border-t border-white/5 z-40">
<div className=" mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-yellow animate-pulse"></div>
<span className="text-label-md text-on-surface-variant">Unsaved changes detected in <strong>Salary Range</strong></span>
</div>
<div className="flex items-center gap-4 w-full md:w-auto">
<button className="btn-ghost flex-1 md:flex-none px-10 h-[50px] rounded-full text-on-surface font-label-md hover:bg-white/5 transition-all">
                            Discard
                        </button>
<button className="btn-primary-red flex-1 md:flex-none px-12 h-[50px] rounded-full text-white font-label-md font-bold tracking-wide active:scale-95 transition-transform" >
                            Save Changes
                        </button>
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
