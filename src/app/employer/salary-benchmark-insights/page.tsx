"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE25() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  TopNavBar (Authority: JSON)  */}
<header className="h-[64px] w-full sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between  shadow-sm">
<div className="flex items-center gap-6">
<span className="font-headline-md text-headline-md font-bold text-text-primary tracking-tight md:hidden">HireGo AI</span>
<div className="relative hidden sm:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
<input className="bg-surface-container-low rounded-full pill-input w-64 pl-10 focus:ring-1 focus:ring-primary/50 text-text-primary" placeholder="Search insights..." type="text" />
</div>
</div>
<div className="flex items-center gap-margin-mobile">
<nav className="hidden md:flex items-center gap-6 font-body-md text-body-md text-text-secondary">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/dashboard">Dashboard</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/pipeline">Talent</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/interviews">Interviews</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/messages">Messages</a>
    </nav>
<div className="flex items-center gap-4">
<button className="material-symbols-outlined text-text-secondary hover:bg-white/5 p-2 rounded-full transition-colors" data-icon="notifications">notifications</button>
<button className="material-symbols-outlined text-text-secondary hover:bg-white/5 p-2 rounded-full transition-colors" data-icon="auto_awesome">auto_awesome</button>
<div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
<img className="w-full h-full object-cover" data-alt="A professional business headshot of a diverse candidate, softly lit in a modern office setting with a shallow depth of field. The aesthetic is clean and high-trust, matching a dark-themed AI professional platform's premium visual language." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXWwF3S1TksM80qJS4Q3JoUvE98xKVlNNXTARsV8JbRhTb3yFEuR6QKaN5J3x6n1jDVnf2q96Zr7x5kgcjshPzHorP6pTVuFOtgc4HXiUtrBrPFv0RBeC7xokOmTBjHdqK8gmT6P5l_P5zBe5e_USJpKoYgSaOt5aCi609TYT-l-s5mFOBpCY3B11coCienLAH89MEbSoxIJYjRegouuOpPljcigWvOl0Na-yr41GGeJpq_Ysz1u_Z22JN8KxkHS5STQfznXG2Hr8" />
</div>
</div>
</div>
</header>
{/*  Page Content  */}
<div className="p-margin-desktop  mx-auto w-full space-y-6">
{/*  Page Header & Role Selector  */}
<section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
<div>
<h2 className="font-display-lg text-display-lg tracking-tight mb-2">SALARY BENCHMARK INSIGHTS</h2>
<p className="text-text-secondary font-body-lg">Real-time market analysis for technical and creative roles worldwide.</p>
</div>
<div className="w-full md:w-80">
<label className="text-label-md font-label-md text-text-muted uppercase tracking-widest mb-2 block">Analyze Position</label>
<div className="relative">
<select className="w-full h-[50px] bg-bg-elevated border border-white/10 rounded-full px-6 appearance-none text-text-primary focus:ring-2 focus:ring-primary/40 outline-none">
<option>Senior Full Stack Engineer</option>
<option>AI Research Scientist</option>
<option>Lead Product Designer</option>
<option>Blockchain Architect</option>
</select>
<span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
</div>
</div>
</section>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
{/*  Salary Distribution (Large Card)  */}
<div className="md:col-span-8 glass-card rounded-lg p-stack-lg relative overflow-hidden">
<div className="flex justify-between items-start mb-10">
<div>
<h3 className="font-headline-md text-headline-md mb-1">Salary Distribution</h3>
<p className="text-text-secondary text-label-md uppercase tracking-wider">San Francisco, CA • Remote Hybrid</p>
</div>
<div className="text-right">
<span className="font-data-lg text-data-lg text-primary">$185,000</span>
<p className="text-text-muted text-label-md">Current Expectation</p>
</div>
</div>
{/*  Chart Container  */}
<div className="h-64 flex items-end justify-between gap-1 relative pt-10">
{/*  Distribution Curve Visualization (CSS)  */}
<div className="absolute inset-x-0 bottom-0 h-48 opacity-20 pointer-events-none">
<svg className="w-full h-full fill-primary/30" viewBox="0 0 800 200">
<path d="M0,200 C150,200 250,50 400,50 C550,50 650,200 800,200 L800,200 L0,200 Z"></path>
</svg>
</div>
{/*  Marker Indicators  */}
<div className="absolute inset-0 flex items-start">
{/*  Market Median  */}
<div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
<div className="px-3 py-1 bg-surface-container rounded-full border border-white/10 text-label-md mb-2">Market Median</div>
<div className="w-px h-64 border-l border-dashed border-white/20"></div>
<span className="mt-2 font-data-md text-data-md">$162,400</span>
</div>
{/*  Your Ask  */}
<div className="absolute left-[65%] top-4 flex flex-col items-center">
<div className="px-3 py-1 bg-primary text-on-primary rounded-full text-label-md font-bold mb-2 shadow-lg">Your Ask</div>
<div className="w-px h-60 border-l-2 border-primary"></div>
</div>
{/*  Top 10%  */}
<div className="absolute left-[85%] top-12 flex flex-col items-center">
<div className="px-3 py-1 bg-surface-container rounded-full border border-white/10 text-label-md mb-2">Top 10%</div>
<div className="w-px h-52 border-l border-dashed border-white/20"></div>
<span className="mt-2 font-data-md text-data-md">$210,000+</span>
</div>
</div>
</div>
<div className="mt-10 flex flex-wrap gap-4">
<button className="h-[50px] px-8 rounded-full bg-transparent border border-white/10 text-text-primary hover:bg-white/5 transition-all active:scale-95">
                                [Update Expected Salary]
                            </button>
<button className="h-[50px] px-8 rounded-full btn-3d-red text-on-primary font-bold">
                                View Full Report
                            </button>
</div>
</div>
{/*  AI Negotiation Tips  */}
<div className="md:col-span-4 border-2 border-secondary-container bg-surface-container-low rounded-lg p-stack-lg flex flex-col gap-stack-md relative overflow-hidden shadow-2xl">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
<h3 className="font-headline-md text-headline-md text-secondary">AI Negotiate Tips</h3>
</div>
<ul className="space-y-4">
<li className="flex gap-3">
<span className="text-secondary font-bold shrink-0">01</span>
<p className="text-body-md">Your current ask is in the 78th percentile. Focus the conversation on your <span className="text-secondary font-bold">Deep Learning portfolio</span> to justify the premium.</p>
</li>
<li className="flex gap-3">
<span className="text-secondary font-bold shrink-0">02</span>
<p className="text-body-md">The company "HyperLogix" usually offers high equity. Consider trading 5% base for <span className="text-secondary font-bold">additional stock options</span>.</p>
</li>
<li className="flex gap-3">
<span className="text-secondary font-bold shrink-0">03</span>
<p className="text-body-md">Mention your specific experience in <span className="text-secondary font-bold">PostgreSQL scaling</span> which is a key pain point for this hiring manager.</p>
</li>
</ul>
<div className="mt-auto pt-6">
<button className="w-full h-[50px] rounded-full bg-secondary-container/20 border border-secondary-container text-secondary font-bold hover:bg-secondary-container/30 transition-all">
                                Generate Custom Script
                            </button>
</div>
</div>
{/*  Skill Premiums (Bar Chart)  */}
<div className="md:col-span-6 glass-card rounded-lg p-stack-lg">
<h3 className="font-headline-md text-headline-md mb-6">Skill Premiums</h3>
<div className="space-y-6">
{/*  Skill Row  */}
<div>
<div className="flex justify-between mb-2">
<span className="text-label-md">Kubernetes / Orchestration</span>
<span className="font-data-md text-green">+14.2%</span>
</div>
<div className="h-3 bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-[72%]"></div>
</div>
</div>
{/*  Skill Row  */}
<div>
<div className="flex justify-between mb-2">
<span className="text-label-md">Generative AI / LLMs</span>
<span className="font-data-md text-green">+18.5%</span>
</div>
<div className="h-3 bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-[92%]"></div>
</div>
</div>
{/*  Skill Row  */}
<div>
<div className="flex justify-between mb-2">
<span className="text-label-md">System Design (Low Latency)</span>
<span className="font-data-md text-green">+9.8%</span>
</div>
<div className="h-3 bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-[58%]"></div>
</div>
</div>
{/*  Skill Row  */}
<div>
<div className="flex justify-between mb-2">
<span className="text-label-md">Rust / Performance Optimization</span>
<span className="font-data-md text-green">+12.1%</span>
</div>
<div className="h-3 bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-[65%]"></div>
</div>
</div>
</div>
</div>
{/*  Location Comparison Table  */}
<div className="md:col-span-6 glass-card rounded-lg p-stack-lg overflow-x-auto scroll-hide">
<h3 className="font-headline-md text-headline-md mb-6">Location Comparison</h3>
<table className="w-full text-left">
<thead>
<tr className="text-text-muted border-b border-white/5 uppercase text-[10px] tracking-widest">
<th className="pb-4 font-bold">Region</th>
<th className="pb-4 font-bold">Market Avg</th>
<th className="pb-4 font-bold">Purchasing Power</th>
</tr>
</thead>
<tbody className="divide-y divide-white/5">
<tr>
<td className="py-4 flex items-center gap-3">
<div className="w-6 h-4 bg-surface-container rounded-sm overflow-hidden flex items-center justify-center">
<span className="text-[8px]">🇺🇸</span>
</div>
<span className="font-body-md">San Francisco, CA</span>
</td>
<td className="py-4 font-data-md">$174,000</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="flex text-yellow text-sm">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
</div>
</div>
</td>
</tr>
<tr>
<td className="py-4 flex items-center gap-3">
<div className="w-6 h-4 bg-surface-container rounded-sm overflow-hidden flex items-center justify-center">
<span className="text-[8px]">🇺🇸</span>
</div>
<span className="font-body-md">Austin, TX</span>
</td>
<td className="py-4 font-data-md">$152,500</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="flex text-yellow text-sm">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
</div>
</div>
</td>
</tr>
<tr>
<td className="py-4 flex items-center gap-3">
<div className="w-6 h-4 bg-surface-container rounded-sm overflow-hidden flex items-center justify-center">
<span className="text-[8px]">🇩🇪</span>
</div>
<span className="font-body-md">Berlin, DE</span>
</td>
<td className="py-4 font-data-md">€98,000</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="flex text-yellow text-sm">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
</div>
</div>
</td>
</tr>
<tr>
<td className="py-4 flex items-center gap-3">
<div className="w-6 h-4 bg-surface-container rounded-sm overflow-hidden flex items-center justify-center">
<span className="text-[8px]">🇬🇧</span>
</div>
<span className="font-body-md">London, UK</span>
</td>
<td className="py-4 font-data-md">£115,000</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="flex text-yellow text-sm">
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
<span className="material-symbols-outlined text-[16px]">star</span>
</div>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>

    </PageContainer>
  );
}
