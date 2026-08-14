"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE15() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  TopNavBar  */}
<header className="h-[64px] w-full sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl shadow-sm flex items-center justify-between ">
<div className="flex items-center gap-8">
<div className="relative w-72">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]" data-icon="search">search</span>
<input className="w-full h-[40px] bg-bg-subtle border-none rounded-full pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/50 placeholder:text-text-muted" placeholder="Search for opportunities..." type="text" />
</div>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-4">
<button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors active:scale-95">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-white/5 transition-colors active:scale-95">
<span className="material-symbols-outlined" data-icon="auto_awesome">auto_awesome</span>
</button>
</div>
<div className="h-8 w-[1px] bg-white/10"></div>
<div className="flex items-center gap-3">
<div className="text-right hidden sm:block">
<p className="text-sm font-bold leading-none mb-0.5">Alex Sterling</p>
<p className="text-[10px] text-primary uppercase tracking-widest font-bold">Pro Account</p>
</div>
<img className="w-10 h-10 rounded-full border border-white/10 object-cover" data-alt="A professional close-up portrait of a young tech professional with short dark hair and a confident expression, set against a blurred high-tech office background with neon blue and red accents. The lighting is crisp and modern, reflecting a high-fidelity, premium dark mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1o8eQM9w7mCIN_fGYzC4DQiZ0kUFUds3EshgNzOqFD1c9xhHTnDPz7iKssbWvci2h6DQjs7zz3R_7LUI_6_ZjMoSLQZJVNPY2jjvgh57IYcXaJJhebk-FfNKE0LeN9h4mgW9czvxY0w4GO5qFoe63sd9731jQtkCLbyv9JYm-i_-XVFQ4O9_ogx2KPp-uIfqZHZzCtFmV3SyReknQxtZex4wUKXkBS_hf5riVDWkr4wAXCivG8A2zfRch4iX5_u3tjjkar1B2m_Y" />
</div>
</div>
</header>
{/*  Main Content  */}
<div className="p-margin-desktop  mx-auto space-y-6 pb-32">
{/*  Overview & Score Bento  */}
<section className="grid grid-cols-1 md:grid-cols-12 gap-6">
{/*  Score Card  */}
<div className="md:col-span-4 glass-card p-8 flex flex-col justify-between overflow-hidden relative group">
<div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] -mr-16 -mt-16"></div>
<div>
<p className="text-text-secondary uppercase tracking-widest text-[12px] font-bold mb-2">Current Standing</p>
<h2 className="font-headline-md text-headline-md">AI Match Score</h2>
</div>
<div className="flex flex-col items-center py-6">
<div className="relative w-40 h-40 flex items-center justify-center">
<svg className="w-full h-full -rotate-90">
<circle className="text-white/5" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"></circle>
<circle className="text-primary" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="57" strokeWidth="8" ></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-display-xl text-display-xl font-extrabold text-primary leading-none">87%</span>
<span className="text-xs text-text-secondary font-bold uppercase mt-1">Excellent</span>
</div>
</div>
</div>
<div className="flex items-center gap-2 text-green text-sm font-bold">
<span className="material-symbols-outlined text-[18px]" data-icon="trending_up">trending_up</span>
<span>+4% from last week</span>
</div>
</div>
{/*  Statistics Overview  */}
<div className="md:col-span-8 glass-card p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
<div className="flex flex-col justify-between border-r border-white/5 pr-4">
<span className="material-symbols-outlined text-text-muted" data-icon="send">send</span>
<div>
<span className="block font-display-lg text-display-lg font-bold leading-none mb-1">14</span>
<p className="text-text-secondary text-sm">Applications Applied</p>
</div>
</div>
<div className="flex flex-col justify-between border-r border-white/5 px-4">
<span className="material-symbols-outlined text-primary" data-icon="forum">forum</span>
<div>
<span className="block font-display-lg text-display-lg font-bold leading-none mb-1">3</span>
<p className="text-text-secondary text-sm">Interviews Scheduled</p>
</div>
</div>
<div className="flex flex-col justify-between border-r border-white/5 px-4">
<span className="material-symbols-outlined text-green" data-icon="check_circle">check_circle</span>
<div>
<span className="block font-display-lg text-display-lg font-bold leading-none mb-1">1</span>
<p className="text-text-secondary text-sm">Active Job Offer</p>
</div>
</div>
<div className="flex flex-col justify-between pl-4">
<span className="material-symbols-outlined text-yellow" data-icon="visibility">visibility</span>
<div>
<span className="block font-display-lg text-display-lg font-bold leading-none mb-1">128</span>
<p className="text-text-secondary text-sm">Profile Views</p>
</div>
</div>
</div>
</section>
{/*  Quick Action Grid  */}
<section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
<button className="button-3d-red h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white group">
<span className="material-symbols-outlined group-hover:rotate-12 transition-transform" data-icon="rocket_launch">rocket_launch</span>
                        Boost Profile
                    </button>
<button className="button-3d-red h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white group">
<span className="material-symbols-outlined group-hover:rotate-12 transition-transform" data-icon="post_add">post_add</span>
                        New Application
                    </button>
<button className="button-3d-red h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white group">
<span className="material-symbols-outlined group-hover:rotate-12 transition-transform" data-icon="psychology">psychology</span>
                        Practice AI
                    </button>
<button className="button-3d-red h-[50px] rounded-full flex items-center justify-center gap-2 font-bold text-white group">
<span className="material-symbols-outlined group-hover:rotate-12 transition-transform" data-icon="share">share</span>
                        Refer Connection
                    </button>
</section>
{/*  Career Sub-sections Grid  */}
<section>
<h3 className="font-headline-md text-headline-md mb-stack-md flex items-center gap-3">
<span className="material-symbols-outlined text-primary" data-icon="grid_view">grid_view</span>
                        Navigation Hub
                    </h3>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
{/*  Section Cards  */}
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="analytics">analytics</span>
</div>
<h4 className="font-bold text-lg mb-1">AI Scores</h4>
<p className="text-text-secondary text-xs">Deep analysis of your resume and profile matching.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="account_tree">account_tree</span>
</div>
<h4 className="font-bold text-lg mb-1">Pipeline</h4>
<p className="text-text-secondary text-xs">Manage active applications and movement stages.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="work">work</span>
</div>
<h4 className="font-bold text-lg mb-1">Recommended</h4>
<p className="text-text-secondary text-xs">Top picks based on your skill gap analysis.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="interpreter_mode">interpreter_mode</span>
</div>
<h4 className="font-bold text-lg mb-1">Interviews</h4>
<p className="text-text-secondary text-xs">Your upcoming calls and technical sessions.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="model_training">model_training</span>
</div>
<h4 className="font-bold text-lg mb-1">Practice</h4>
<p className="text-text-secondary text-xs">Unlimited mock interviews with HireGo AI.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="warning">warning</span>
</div>
<h4 className="font-bold text-lg mb-1">Skill Gap</h4>
<p className="text-text-secondary text-xs">Identify missing credentials for desired roles.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="group">group</span>
</div>
<h4 className="font-bold text-lg mb-1">Recruiters</h4>
<p className="text-text-secondary text-xs">Direct messages and inbound interests.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="payments">payments</span>
</div>
<h4 className="font-bold text-lg mb-1">Salary</h4>
<p className="text-text-secondary text-xs">Market data and negotiation assistance.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="military_tech">military_tech</span>
</div>
<h4 className="font-bold text-lg mb-1">Achievements</h4>
<p className="text-text-secondary text-xs">Badges, milestones, and career high-scores.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="history">history</span>
</div>
<h4 className="font-bold text-lg mb-1">History</h4>
<p className="text-text-secondary text-xs">Log of all past applications and results.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="monitoring">monitoring</span>
</div>
<h4 className="font-bold text-lg mb-1">Analytics</h4>
<p className="text-text-secondary text-xs">Success rate and conversion funnel metrics.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
<div className="glass-card p-6 group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
<div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="group_add">group_add</span>
</div>
<h4 className="font-bold text-lg mb-1">Referrals</h4>
<p className="text-text-secondary text-xs">Manage and track your outgoing referral links.</p>
<span className="material-symbols-outlined absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary" data-icon="chevron_right">chevron_right</span>
</div>
</div>
</section>
</div>

    </PageContainer>
  );
}
