"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React from "react";
import parse from "html-react-parser";
import { useRouter } from "next/navigation";

const rawHtml = `
<div className="fixed inset-0 pointer-events-none bg-glow-red z-0"></div>
<div className="fixed inset-0 pointer-events-none bg-glow-blue z-0"></div>
<!-- Navigation Shell -->
<header className="fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-margin-desktop bg-surface/80 backdrop-blur-md shadow-md border-b border-white/10">
<div className="flex items-center gap-stack-lg">
<span className="font-display-lg text-[24px] font-bold tracking-tight text-primary">HireGo AI</span>
<nav className="hidden md:flex gap-stack-md">
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/jobs">Jobs</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/ai/practice-hub">AI Practice</a>
<a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/messages">Messages</a>
    </nav>
</div>
<div className="flex items-center gap-stack-md">
<div className="flex items-center gap-stack-sm text-on-surface-variant">
<span className="material-symbols-outlined">notifications</span>
<span className="material-symbols-outlined">settings</span>
</div>
<button className="px-6 py-2 rounded-full border border-white/10 text-label-md font-medium hover:bg-white/5 transition-all">
                Proctor Active
            </button>
<div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
<img className="w-full h-full object-cover" data-alt="Close-up professional portrait of a tech professional in a modern studio with soft blue and red accent lighting, high-fidelity dark mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo94SuSDE4LGvqn6bf9par2Boay6uiMDZCsDXy1XZkPkmZwoRyensC4o1fz6Kpy22EfZ7PzhoQA6S9rHQhUph_FnLbLNk-lj3CDKWF06xM_LWD8EHrCxYS__J4rl4kgyTNajFbyShx3eTrD5CccEiuOI-EP0SvxjG1BzfkWVMoCHE9FvhynqCWi8l0gLMBtCHa3tgwLssu4Begox7eAgquXOu9ciRS_aW_ZprH6h8EjX4J_MwrYwoWm8bbRXeYTal2K0JyD4JJqIo">
</div>
</div>
</header>
<main className="relative z-10 pt-[80px] pb-[32px] max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop overflow-hidden">
<!-- Header Section -->
<div className="text-center mb-[24px]">
<h1 className="font-display-xl text-headline-lg text-text-primary mb-1">Simple Honest Pricing</h1>
<p className="font-body-lg text-text-secondary max-w-xl mx-auto mb-3 text-xs">
                Unlock your career potential with HireGo AI. Choose a plan that suits your interview preparation needs.
            </p>
<!-- Currency & Toggle Cluster -->
<div className="flex flex-col md:flex-row items-center justify-center gap-3">
<!-- Currency Pill -->
<div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full border border-white/10 cursor-pointer hover:bg-surface-container transition-colors group text-xs">
<span className="text-label-md font-bold text-primary">INR</span>
<span className="text-label-md text-text-secondary">[Change]</span>
<span className="material-symbols-outlined text-[16px] text-text-secondary group-hover:translate-y-0.5 transition-transform">expand_more</span>
</div>
<!-- Toggle Switch -->
<div className="flex items-center p-1 bg-surface-container-low rounded-full border border-white/10 w-fit text-xs">
<button className="px-4 py-1 rounded-full text-label-md font-bold transition-all duration-300 bg-primary-container text-on-primary-container" id="toggle-payg" onClick="switchTab('payg')">
                        Pay As You Go
                    </button>
<button className="px-4 py-1 rounded-full text-label-md font-bold transition-all duration-300 text-on-surface-variant hover:text-on-surface" id="toggle-monthly" onClick="switchTab('monthly')">
                        Monthly Plans
                    </button>
</div>
</div>
</div>
<!-- PAY AS YOU GO CONTENT -->
<div className="active grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500" data-tab-content="" id="content-payg">
<!-- PAYG 1 -->
<div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
<span className="font-label-md text-text-secondary mb-1 uppercase tracking-widest text-xs">Entry Pack</span>
<div className="font-data-lg text-[32px] text-text-primary mb-1">₹100</div>
<div className="font-body-md text-text-secondary mb-3 text-xs">5 AI Interview Questions</div>
<div className="w-full h-[1px] bg-white/5 mb-3"></div>
<ul className="text-left w-full space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Instant Feedback
                    </li>
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Basic Analytics
                    </li>
</ul>
<button className="btn-primary-red w-full h-[48px] rounded-2xl text-white font-bold text-xs">Get Started</button>
</div>
<!-- PAYG 2 -->
<div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
<div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter rounded-bl-xl">Most Popular</div>
<span className="font-label-md text-text-secondary mb-1 uppercase tracking-widest text-xs">Growth Pack</span>
<div className="font-data-lg text-[32px] text-text-primary mb-1">₹150</div>
<div className="font-body-md text-text-secondary mb-3 text-xs">10 AI Interview Questions</div>
<div className="w-full h-[1px] bg-white/5 mb-3"></div>
<ul className="text-left w-full space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Video Recordings
                    </li>
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Detailed AI Scoring
                    </li>
</ul>
<button className="btn-primary-red w-full h-[48px] rounded-2xl text-white font-bold text-xs">Get Started</button>
</div>
<!-- PAYG 3 -->
<div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
<span className="font-label-md text-text-secondary mb-1 uppercase tracking-widest text-xs">Power Pack</span>
<div className="font-data-lg text-[32px] text-text-primary mb-1">₹200</div>
<div className="font-body-md text-text-secondary mb-3 text-xs">20 AI Interview Questions</div>
<div className="w-full h-[1px] bg-white/5 mb-3"></div>
<ul className="text-left w-full space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Priority Support
                    </li>
<li className="flex items-center gap-2 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-green text-[16px]">check_circle</span> Expert Review Session
                    </li>
</ul>
<button className="btn-primary-red w-full h-[48px] rounded-2xl text-white font-bold text-xs">Get Started</button>
</div>
</div>
<!-- MONTHLY PLANS CONTENT -->
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500" data-tab-content="" id="content-monthly">
<!-- Plan 1: Sprout -->
<div className="glass-card rounded-2xl p-4 flex flex-col group border-white/5">
<div className="mb-4">
<h3 className="font-headline-md text-[18px] text-text-primary mb-0.5">Sprout</h3>
<div className="flex items-baseline gap-1">
<span className="font-data-lg text-[28px] text-text-primary">Free</span>
</div>
</div>
<ul className="space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>2 Free AI Interviews</span>
</li>
<li className="flex items-start gap-1.5 text-label-md text-text-muted">
<span className="material-symbols-outlined text-[14px] mt-0.5">lock</span>
<span>Limited Feedback</span>
</li>
</ul>
<button className="w-full h-[48px] rounded-2xl border border-white/10 text-white font-bold text-xs hover:bg-white/5 transition-colors">Start Free</button>
</div>
<!-- Plan 2: Ignite -->
<div className="glass-card rounded-2xl p-4 flex flex-col group border-white/5">
<div className="mb-4">
<h3 className="font-headline-md text-[18px] text-text-primary mb-0.5">Ignite</h3>
<div className="flex items-baseline gap-1">
<span className="font-data-lg text-[28px] text-text-primary">₹299</span>
<span className="text-text-secondary text-xs">/mo</span>
</div>
</div>
<ul className="space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>10 AI Interviews /mo</span>
</li>
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>Detailed Response Analysis</span>
</li>
</ul>
<button className="btn-primary-red w-full h-[48px] rounded-2xl text-white font-bold text-xs">Get Started</button>
</div>
<!-- Plan 3: Ascend -->
<div className="glass-card rounded-2xl p-4 flex flex-col group border-white/20 ring-1 ring-primary/30 relative">
<div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-container px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase shadow-lg">Value Pack</div>
<div className="mb-4">
<h3 className="font-headline-md text-[18px] text-text-primary mb-0.5">Ascend</h3>
<div className="flex items-baseline gap-1">
<span className="font-data-lg text-[28px] text-text-primary">₹599</span>
<span className="text-text-secondary text-xs">/mo</span>
</div>
</div>
<ul className="space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>Unlimited AI Interviews</span>
</li>
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>Body Language Insights</span>
</li>
</ul>
<button className="btn-primary-red w-full h-[48px] rounded-2xl text-white font-bold text-xs">Get Started</button>
</div>
<!-- Plan 4: Apex -->
<div className="glass-card rounded-2xl p-4 flex flex-col group border-white/5">
<div className="mb-4">
<h3 className="font-headline-md text-[18px] text-text-primary mb-0.5">Apex</h3>
<div className="flex items-baseline gap-1">
<span className="font-data-lg text-[28px] text-text-primary">₹999</span>
<span className="text-text-secondary text-xs">/mo</span>
</div>
</div>
<ul className="space-y-2 mb-4 flex-grow text-xs">
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>Everything in Ascend</span>
</li>
<li className="flex items-start gap-1.5 text-label-md text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mt-0.5">check</span>
<span>1:1 Human Coaching Call</span>
</li>
</ul>
<button className="btn-payment-gold w-full h-[48px] rounded-2xl text-black font-bold text-xs">Get Apex</button>
</div>
</div>
<!-- Feature Comparison Table -->
<div className="mt-16">
<h2 className="font-display-lg text-center mb-6 text-headline-sm">Compare Features</h2>
<div className="glass-card rounded-2xl overflow-hidden border-white/5">
<div className="overflow-x-auto">
<table className="w-full border-collapse text-xs">
<thead>
<tr className="bg-white/5">
<th className="text-left p-4 font-display-md text-text-primary min-w-[160px]">Features</th>
<th className="p-4 font-display-md text-text-primary text-center">PAYG</th>
<th className="p-4 font-display-md text-text-primary text-center">Free</th>
<th className="p-4 font-display-md text-text-primary text-center">Ignite</th>
<th className="p-4 font-display-md text-text-primary text-center text-primary">Ascend</th>
<th className="p-4 font-display-md text-text-primary text-center">Apex</th>
</tr>
</thead>
<tbody className="divide-y divide-white/5">
<tr>
<td className="p-3 text-body-md text-on-surface-variant">AI Interview Sessions</td>
<td className="p-3 text-center font-data-md text-text-secondary">By Credit</td>
<td className="p-3 text-center font-data-md text-text-secondary">2 / mo</td>
<td className="p-3 text-center font-data-md text-text-secondary">10 / mo</td>
<td className="p-3 text-center font-data-md text-primary">Unlimited</td>
<td className="p-3 text-center font-data-md text-text-secondary">Unlimited</td>
</tr>
<tr>
<td className="p-3 text-body-md text-on-surface-variant">Advanced Analytics</td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
</tr>
<tr>
<td className="p-3 text-body-md text-on-surface-variant">Video Review</td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
</tr>
<tr>
<td className="p-3 text-body-md text-on-surface-variant">Personalized Coaching</td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-text-secondary"><span className="material-symbols-outlined text-[16px]">remove</span></td>
<td className="p-3 text-center text-green"><span className="material-symbols-outlined text-[16px]">check_circle</span></td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</main>
<!-- Simple Footer (since no Shell was specified for this sub-page intent) -->
<footer className="relative z-10 border-t border-white/5 py-6 px-margin-desktop bg-surface-container-lowest text-xs">
<div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
<div>
<span className="font-display-lg text-[16px] text-primary">HireGo AI</span>
<p className="text-label-md text-text-muted mt-1">Elevating Careers with Intelligence.</p>
</div>
<div className="flex gap-6">
<a className="text-label-md text-text-secondary hover:text-primary transition-colors" href="#">Privacy</a>
<a className="text-label-md text-text-secondary hover:text-primary transition-colors" href="#">Terms</a>
<a className="text-label-md text-text-secondary hover:text-primary transition-colors" href="#">Support</a>
</div>
<div className="text-label-md text-text-muted">
                © 2024 HireGo AI. All rights reserved.
            </div>
</div>
</footer>
`;

export default function C71Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="w-full min-h-screen">
      {parse(rawHtml)}
    </div>
    </div>
);
}