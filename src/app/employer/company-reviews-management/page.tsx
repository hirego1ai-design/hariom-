"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE23() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header / Top Bar  */}
<header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
<div>
<h2 className="font-display-xl text-display-xl text-text-primary tracking-tight">Company Reviews</h2>
<p className="text-text-secondary font-body-md">Analyze and manage your employer brand reputation.</p>
</div>
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
<span className="material-symbols-outlined text-text-secondary">notifications</span>
</div>
<div className="h-10 px-4 rounded-full glass-card flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-on-primary">JD</div>
<span className="font-label-md text-text-primary">John Doe</span>
</div>
</div>
</header>
{/*  Stats Bento Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
{/*  Overall Rating Card  */}
<div className="lg:col-span-4 glass-card p-stack-lg rounded-lg flex flex-col items-center justify-center text-center">
<div className="font-display-xl text-[72px] leading-none text-primary mb-2" >4.2</div>
<div className="flex gap-1 mb-2">
<span className="material-symbols-outlined text-gold-payment" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-text-muted" >star_half</span>
</div>
<p className="font-body-md text-text-secondary">Based on <span className="text-text-primary font-bold">127 reviews</span></p>
<div className="mt-6 w-full h-[1px] bg-white/5"></div>
<p className="mt-4 text-green font-label-md flex items-center gap-1">
<span className="material-symbols-outlined text-[18px]">trending_up</span>
                    +12% from last month
                </p>
</div>
{/*  Star Distribution Card  */}
<div className="lg:col-span-8 glass-card p-stack-lg rounded-lg">
<h3 className="font-headline-md text-headline-md mb-stack-md">Rating Distribution</h3>
<div className="space-y-4">
{/*  5 Stars  */}
<div className="flex items-center gap-4">
<span className="w-12 font-data-md text-text-secondary">5 star</span>
<div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
<div className="rating-bar-fill h-full rounded-full" style={{ width: '65%;' }}></div>
</div>
<span className="w-12 font-data-md text-right text-text-primary">82</span>
</div>
{/*  4 Stars  */}
<div className="flex items-center gap-4">
<span className="w-12 font-data-md text-text-secondary">4 star</span>
<div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
<div className="rating-bar-fill h-full rounded-full" style={{ width: '25%;' }}></div>
</div>
<span className="w-12 font-data-md text-right text-text-primary">31</span>
</div>
{/*  3 Stars  */}
<div className="flex items-center gap-4">
<span className="w-12 font-data-md text-text-secondary">3 star</span>
<div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
<div className="rating-bar-fill h-full rounded-full" style={{ width: '8%;' }}></div>
</div>
<span className="w-12 font-data-md text-right text-text-primary">10</span>
</div>
{/*  2 Stars  */}
<div className="flex items-center gap-4">
<span className="w-12 font-data-md text-text-secondary">2 star</span>
<div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
<div className="rating-bar-fill h-full rounded-full" style={{ width: '3%;' }}></div>
</div>
<span className="w-12 font-data-md text-right text-text-primary">4</span>
</div>
{/*  1 Star  */}
<div className="flex items-center gap-4">
<span className="w-12 font-data-md text-text-secondary">1 star</span>
<div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
<div className="rating-bar-fill h-full rounded-full" style={{ width: '0%;' }}></div>
</div>
<span className="w-12 font-data-md text-right text-text-primary">0</span>
</div>
</div>
</div>
</div>
{/*  Filter Bar  */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-stack-md">
<div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
<button className="h-10 px-6 rounded-full bg-primary-container text-on-primary-container font-label-md whitespace-nowrap">All Reviews</button>
<button className="h-10 px-6 rounded-full glass-card text-text-secondary hover:text-text-primary font-label-md whitespace-nowrap transition-colors">Recent</button>
<button className="h-10 px-6 rounded-full glass-card text-text-secondary hover:text-text-primary font-label-md whitespace-nowrap transition-colors">Highest Rated</button>
<button className="h-10 px-6 rounded-full glass-card text-text-secondary hover:text-text-primary font-label-md whitespace-nowrap transition-colors">Lowest Rated</button>
</div>
<div className="flex items-center gap-3">
<div className="relative">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
<input className="h-10 pl-10 pr-4 bg-[#1E1E1E] border-none rounded-full text-sm w-64 focus:ring-1 focus:ring-primary/30" placeholder="Search reviews..." type="text" />
</div>
</div>
</div>
{/*  Review List  */}
<div className="space-y-gutter">
{/*  Review Card 1  */}
<div className="glass-card p-stack-lg rounded-lg relative overflow-hidden group">
<div className="flex flex-col md:flex-row justify-between gap-4">
<div className="flex-1">
<div className="flex items-center gap-4 mb-4">
<div className="flex gap-0.5">
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-label-md text-text-primary">Senior Product Designer</span>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-data-md text-text-muted">Oct 24, 2023</span>
</div>
<h4 className="font-headline-md text-headline-md mb-2">Great culture and AI-driven workflows</h4>
<p className="font-body-md text-text-secondary leading-relaxed mb-6">
                            Working at HireGo AI has been an incredible journey. The team is genuinely passionate about revolutionizing the recruitment space. The internal tools are state-of-the-art, and there's a strong emphasis on work-life balance despite the fast-paced nature of a scale-up.
                        </p>
<div className="flex flex-wrap gap-2">
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Work-life balance</span>
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Innovation</span>
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Management</span>
</div>
</div>
<div className="flex md:flex-col items-end justify-between md:justify-start gap-4">
<button className="btn-ghost h-9 px-4 rounded-full flex items-center gap-2 text-[12px] text-text-muted group-hover:text-error transition-colors">
<span className="material-symbols-outlined text-[16px]">flag</span>
                            Report Review
                        </button>
</div>
</div>
</div>
{/*  Review Card 2  */}
<div className="glass-card p-stack-lg rounded-lg relative overflow-hidden group">
<div className="flex flex-col md:flex-row justify-between gap-4">
<div className="flex-1">
<div className="flex items-center gap-4 mb-4">
<div className="flex gap-0.5">
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">star</span>
</div>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-label-md text-text-primary">Backend Engineer</span>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-data-md text-text-muted">Sep 12, 2023</span>
</div>
<h4 className="font-headline-md text-headline-md mb-2">High technical standards, but can be intense</h4>
<p className="font-body-md text-text-secondary leading-relaxed mb-6">
                            If you love solving hard problems, this is the place. The tech stack is cutting edge (Rust, Go, Kubernetes). However, the release cycles are very tight, which sometimes leads to weekend work during major launches. Management is supportive but very metrics-driven.
                        </p>
<div className="flex flex-wrap gap-2">
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Tech Stack</span>
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Growth</span>
</div>
</div>
<div className="flex md:flex-col items-end justify-between md:justify-start gap-4">
<button className="btn-ghost h-9 px-4 rounded-full flex items-center gap-2 text-[12px] text-text-muted group-hover:text-error transition-colors">
<span className="material-symbols-outlined text-[16px]">flag</span>
                            Report Review
                        </button>
</div>
</div>
</div>
{/*  Review Card 3 (Lowest for Demo)  */}
<div className="glass-card p-stack-lg rounded-lg relative overflow-hidden group border-l-2 border-primary-container">
<div className="flex flex-col md:flex-row justify-between gap-4">
<div className="flex-1">
<div className="flex items-center gap-4 mb-4">
<div className="flex gap-0.5">
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-gold-payment text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">star</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">star</span>
<span className="material-symbols-outlined text-text-muted text-[18px]">star</span>
</div>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-label-md text-text-primary">Sales Representative (Former)</span>
<span className="w-[1px] h-4 bg-white/10"></span>
<span className="font-data-md text-text-muted">Aug 05, 2023</span>
</div>
<h4 className="font-headline-md text-headline-md mb-2">Challenging sales quotas</h4>
<p className="font-body-md text-text-secondary leading-relaxed mb-6">
                            The product is great and practically sells itself, but the quotas are extremely aggressive. Communication between the product team and sales could be better. If you aren't hitting 120% of target, you'll feel the pressure immediately.
                        </p>
<div className="flex flex-wrap gap-2">
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Sales</span>
<span className="px-3 py-1 bg-white/5 rounded-full text-[12px] font-label-md text-text-secondary">Quota</span>
</div>
</div>
<div className="flex md:flex-col items-end justify-between md:justify-start gap-4">
<button className="btn-ghost h-9 px-4 rounded-full flex items-center gap-2 text-[12px] text-text-muted group-hover:text-error transition-colors">
<span className="material-symbols-outlined text-[16px]">flag</span>
                            Report Review
                        </button>
</div>
</div>
</div>
</div>
{/*  Pagination  */}
<div className="flex items-center justify-center gap-2 mt-stack-lg">
<button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container font-bold">1</button>
<button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">2</button>
<button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">3</button>
<span className="text-text-muted mx-2">...</span>
<button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">12</button>
<button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>

    </PageContainer>
  );
}
