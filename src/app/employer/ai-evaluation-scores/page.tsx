"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE43() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Hero Header Section  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
<div className="space-y-2">
<span className="text-primary font-bold tracking-widest uppercase text-[12px]">AI Generated Insights</span>
<h1 className="font-display-xl text-display-xl text-text-primary leading-none">
                        AI Readiness: <span className="text-primary">84/100</span>
</h1>
<p className="font-body-lg text-body-lg text-text-secondary max-w-2xl">
                        Your profile is highly competitive. We've analyzed your performance data and resume architecture to calculate your hiring probability.
                    </p>
</div>
<div>
<button className="btn-3d-red px-10 h-[50px] rounded-full text-white font-bold flex items-center gap-2">
<span className="material-symbols-outlined">play_arrow</span>
                        Start Practice
                    </button>
</div>
</div>
{/*  Dashboard Grid (Bento Style)  */}
<div className="grid grid-cols-12 gap-6">
{/*  Main Scores Column  */}
<div className="col-span-12 lg:col-span-8 space-y-6">
<div className="glass-card p-6 rounded-lg">
<div className="flex items-center justify-between mb-8">
<h3 className="font-headline-md text-headline-md">Metric Breakdown</h3>
<div className="flex items-center gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[18px]">calendar_today</span>
<span className="text-label-md">Updated 2h ago</span>
</div>
</div>
<div className="space-y-10">
{/*  Score Bars  */}
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-green">chat</span>
<span className="font-bold text-body-md">Communication</span>
</div>
<span className="font-data-lg text-data-lg text-green">92%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-green animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Excellent clarity. Try incorporating more industry-specific technical jargon to boost perceived seniority.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-yellow">code</span>
<span className="font-bold text-body-md">Technical</span>
</div>
<span className="font-data-lg text-data-lg text-yellow">78%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-yellow animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Solid foundation. Review system design patterns to improve score for Lead Architect roles.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-green">psychology</span>
<span className="font-bold text-body-md">Confidence</span>
</div>
<span className="font-data-lg text-data-lg text-green">88%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-green animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Tone is consistent and authoritative. Maintain this level of eye contact during video screenings.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-red-light">person</span>
<span className="font-bold text-body-md">Profile Completeness</span>
</div>
<span className="font-data-lg text-data-lg text-red-light">45%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-red animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Critically low. Add your GitHub portfolio and LinkedIn endorsements to verify your technical claims.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-yellow">work</span>
<span className="font-bold text-body-md">Experience Match</span>
</div>
<span className="font-data-lg text-data-lg text-yellow">72%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-yellow animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Good match for Mid-level. Consider highlighting leadership projects to unlock Senior level roles.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-green">history</span>
<span className="font-bold text-body-md">Interview History</span>
</div>
<span className="font-data-lg text-data-lg text-green">95%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-green animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Exceptional. Your historical mock interview scores place you in the top 5% of candidates.</p>
</div>
</div>
<div className="space-y-4">
<div className="flex justify-between items-end">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-yellow">description</span>
<span className="font-bold text-body-md">Resume Quality</span>
</div>
<span className="font-data-lg text-data-lg text-yellow">68%</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full score-yellow animate-fill rounded-full" ></div>
</div>
<div className="bg-white/5 p-4 rounded-xl flex items-start gap-3 border border-white/5">
<span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
<p className="text-label-md text-text-secondary">Format is clean but missing keywords. Use our AI Resume Tuner to optimize for ATS scanners.</p>
</div>
</div>
</div>
</div>
</div>
{/*  Secondary Column  */}
<div className="col-span-12 lg:col-span-4 space-y-6">
{/*  AI Insight Card  */}
<div className="glass-card p-6 rounded-lg relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
<h4 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
<span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            Smart Tip
                        </h4>
<p className="text-body-md text-text-secondary mb-6">
                            Candidates with scores over <span className="text-primary font-bold">85</span> are <span className="text-white font-bold">3.5x</span> more likely to land a FAANG interview. Focus on your "Profile Completeness" to cross this threshold.
                        </p>
<button className="w-full py-4 bg-bg-elevated border border-white/10 rounded-full font-bold hover:bg-white/5 transition-colors">
                            View Recommendation
                        </button>
</div>
{/*  Recommended Practice  */}
<div className="glass-card overflow-hidden rounded-lg">
<div className="h-48 relative">
<img className="w-full h-full object-cover" data-alt="A cinematic, ultra-detailed shot of a high-tech holographic interface displaying complex neural networks and data streams. The lighting is dominated by deep blues and vibrant red accents. The atmosphere is professional, sleek, and futuristic, representing advanced AI analysis. Shallow depth of field with sharp focus on central nodes." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj_leZztw3S0fO-gyP872iOraDfMIYF7J7q0JPVE7shI6mZ9w8Cej0Ry3AuMIg_5uqJo_hO4BNBHNKjQfnrt7b69g3oR15Hhqr0hr9usWtP-J3T8s8FiuWm9SEGeJMbXUv0TqNJZzvDpQZmudCnPiBCBf-wCfUcvjzsOCwXw1vzOP-8mxZIegylXegB1qzorabWo2FbkaAXaAPlalYPbtbsLg8y0eccyOzrvoVKNIh-wpksC_4FiDWK9FYaG8vB41-1BJ3NFrprok" />
<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
<h4 className="font-headline-md text-headline-md text-white">Mock Interview: Lead Dev</h4>
</div>
</div>
<div className="p-6 space-y-4">
<div className="flex items-center justify-between text-label-md">
<span className="text-text-secondary">Complexity</span>
<span className="text-primary">Advanced</span>
</div>
<div className="flex items-center justify-between text-label-md">
<span className="text-text-secondary">Duration</span>
<span className="text-white">45 Minutes</span>
</div>
<button className="w-full h-[50px] bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors active:scale-95">
                                Start Session
                            </button>
</div>
</div>
{/*  Market Comparison  */}
<div className="glass-card p-6 rounded-lg">
<h4 className="font-headline-md text-headline-md mb-6">Market Index</h4>
<div className="space-y-6">
<div className="flex items-center justify-between">
<span className="text-body-md text-text-secondary">Average Candidate</span>
<span className="font-data-md text-data-md text-white">62/100</span>
</div>
<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-white/20" style={{ width: '62%' }}></div>
</div>
<div className="flex items-center justify-between">
<span className="text-body-md text-text-secondary">Top 10% Talent</span>
<span className="font-data-md text-data-md text-primary">82/100</span>
</div>
<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-primary/40" style={{ width: '82%' }}></div>
</div>
<div className="flex items-center justify-between mt-4">
<div className="flex items-center gap-2">
<div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
<span className="text-label-md text-primary font-bold">YOU</span>
</div>
<span className="font-data-lg text-data-lg text-primary">84/100</span>
</div>
</div>
</div>
</div>
</div>
    </PageContainer>
  );
}
