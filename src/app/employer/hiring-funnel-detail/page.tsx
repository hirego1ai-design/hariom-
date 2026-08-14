"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE16() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className=" mx-auto space-y-6">
{/*  Page Header Actions  */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface">Recruitment Pipeline</h2>
<p className="text-text-secondary">Tracking data for 1,248 total applicants over the last 30 days.</p>
</div>
<div className="flex items-center gap-stack-md">
<button className="px-6 h-[50px] rounded-full border border-white/10 bg-bg-elevated text-on-surface hover:bg-white/5 flex items-center gap-2 transition-all">
<span className="material-symbols-outlined">filter_list</span>
                        Filter
                    </button>
<button className="px-6 h-[50px] rounded-full btn-3d-blue text-white font-bold flex items-center gap-2">
<span className="material-symbols-outlined">ios_share</span>
                        Export Detailed Report
                    </button>
</div>
</div>
{/*  Bento Grid - Funnel Visualization (Large Span)  */}
<section className="glass-card rounded-lg p-stack-lg">
<div className="flex items-center justify-between mb-6">
<h3 className="font-display-lg text-[24px] text-primary flex items-center gap-2">
<span className="material-symbols-outlined">query_stats</span>
                        Visual Pipeline Canvas
                    </h3>
<div className="flex gap-4">
<div className="flex items-center gap-2 text-sm text-text-muted">
<span className="w-3 h-3 rounded-full bg-primary-container"></span> Candidates
                        </div>
<div className="flex items-center gap-2 text-sm text-text-muted">
<span className="w-3 h-3 rounded-full bg-secondary-container"></span> Conversion Rate
                        </div>
</div>
</div>
{/*  Funnel SVG/CSS Hybrid  */}
<div className="relative w-full overflow-x-auto pb-6">
<div className="flex min-w-[1000px] h-64 items-stretch">
{/*  Applied  */}
<div className="funnel-stage funnel-stage-first flex-1 bg-surface-container-highest/50 relative group">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-primary font-data-lg text-display-lg">1,248</span>
<span className="text-on-surface-variant font-label-md uppercase tracking-wider">Applied</span>
<div className="mt-4 flex items-center gap-1 text-green text-sm font-data-md">
<span className="material-symbols-outlined text-sm">trending_up</span> +12%
                                </div>
</div>
</div>
{/*  Screened  */}
<div className="funnel-stage flex-[0.85] bg-surface-container-high/60 relative -ml-6 z-10">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-primary font-data-lg text-display-lg">842</span>
<span className="text-on-surface-variant font-label-md uppercase tracking-wider">Screened</span>
<div className="mt-4 text-secondary font-data-md bg-secondary/10 px-3 py-1 rounded-full">
                                    67.4%
                                </div>
</div>
</div>
{/*  Shortlisted  */}
<div className="funnel-stage flex-[0.7] bg-surface-container/70 relative -ml-6 z-20">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-primary font-data-lg text-display-lg">156</span>
<span className="text-on-surface-variant font-label-md uppercase tracking-wider">Shortlisted</span>
<div className="mt-4 text-secondary font-data-md bg-secondary/10 px-3 py-1 rounded-full">
                                    18.5%
                                </div>
</div>
</div>
{/*  Interview  */}
<div className="funnel-stage flex-[0.55] bg-surface-variant/80 relative -ml-6 z-30">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-primary font-data-lg text-display-lg">42</span>
<span className="text-on-surface-variant font-label-md uppercase tracking-wider">Interview</span>
<div className="mt-4 text-secondary font-data-md bg-secondary/10 px-3 py-1 rounded-full">
                                    26.9%
                                </div>
</div>
</div>
{/*  Offer  */}
<div className="funnel-stage flex-[0.4] bg-primary-container/60 relative -ml-6 z-40">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-primary font-data-lg text-display-lg">8</span>
<span className="text-on-surface-variant font-label-md uppercase tracking-wider">Offer</span>
<div className="mt-4 text-secondary font-data-md bg-secondary/10 px-3 py-1 rounded-full">
                                    19%
                                </div>
</div>
</div>
{/*  Hired  */}
<div className="funnel-stage-last flex-[0.3] bg-green/40 relative -ml-6 z-50 border-r border-green/50">
<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
<span className="text-green font-data-lg text-display-lg">5</span>
<span className="text-white font-label-md uppercase tracking-wider">Hired</span>
<div className="mt-4 text-green font-data-md bg-green/10 px-3 py-1 rounded-full">
                                    62.5%
                                </div>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-2 md:grid-cols-6 gap-stack-md mt-stack-lg border-t border-white/5 pt-stack-lg">
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">2.4 Days</p>
</div>
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">5.1 Days</p>
</div>
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">1.2 Days</p>
</div>
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">8.4 Days</p>
</div>
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">3.0 Days</p>
</div>
<div className="text-center">
<p className="text-text-muted text-label-md">Avg. Time</p>
<p className="font-data-md text-on-surface">22 Days</p>
</div>
</div>
</section>
{/*  Bottom Row: AI Insights & Rejection Analysis  */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/*  AI Insight Card  */}
<div className="lg:col-span-2 glass-card rounded-lg overflow-hidden relative group">
{/*  AI Background Animation  */}

<div className="relative p-stack-lg h-full flex flex-col">
<div className="flex items-center gap-3 mb-6">
<div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center glow-red">
<span className="material-symbols-outlined text-white">psychology</span>
</div>
<h3 className="font-headline-md text-primary">AI Drop-off Analysis</h3>
</div>
<div className="space-y-6 flex-1">
<div className="p-4 rounded-lg bg-white/5 border border-white/10">
<h4 className="text-primary font-bold mb-2 flex items-center gap-2">
<span className="material-symbols-outlined text-yellow">warning</span>
                                    High Drop-off at "Shortlisted"
                                </h4>
<p className="text-on-surface-variant text-body-md leading-relaxed">
                                    81% of candidates are dropping out between Screening and Shortlisting. AI Analysis suggests the technical assessment complexity is 34% higher than industry average for this role level.
                                </p>
</div>
<div className="p-4 rounded-lg bg-white/5 border border-white/10">
<h4 className="text-primary font-bold mb-2 flex items-center gap-2">
<span className="material-symbols-outlined text-secondary">info</span>
                                    Time-to-Hire Optimization
                                </h4>
<p className="text-on-surface-variant text-body-md leading-relaxed">
                                    The interview stage is currently averaging 8.4 days. Reducing wait time between interviews by just 48 hours could improve candidate retention by up to 15%.
                                </p>
</div>
</div>
<button className="mt-8 text-secondary font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                            View Detailed Strategy Guide <span className="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</div>
{/*  Rejection Reasons Bento  */}
<div className="glass-card rounded-lg p-stack-lg flex flex-col">
<h3 className="font-headline-md text-on-surface mb-6">Rejection Root Causes</h3>
<div className="space-y-stack-md flex-1">
<div className="group cursor-default">
<div className="flex justify-between mb-2">
<span className="text-on-surface-variant font-label-md">Technical Skills Gap</span>
<span className="text-primary font-data-md">42%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary-container group-hover:bg-primary transition-colors" style={{ width: '42%' }}></div>
</div>
</div>
<div className="group cursor-default">
<div className="flex justify-between mb-2">
<span className="text-on-surface-variant font-label-md">Culture Alignment</span>
<span className="text-primary font-data-md">28%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary-container group-hover:bg-secondary transition-colors" style={{ width: '28%' }}></div>
</div>
</div>
<div className="group cursor-default">
<div className="flex justify-between mb-2">
<span className="text-on-surface-variant font-label-md">Salary Expectations</span>
<span className="text-primary font-data-md">15%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-yellow group-hover:filter group-hover:brightness-110 transition-all" style={{ width: '15%' }}></div>
</div>
</div>
<div className="group cursor-default">
<div className="flex justify-between mb-2">
<span className="text-on-surface-variant font-label-md">Remote vs Hybrid Preference</span>
<span className="text-primary font-data-md">10%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-tertiary-container group-hover:bg-tertiary transition-colors" style={{ width: '10%' }}></div>
</div>
</div>
<div className="group cursor-default">
<div className="flex justify-between mb-2">
<span className="text-on-surface-variant font-label-md">Other</span>
<span className="text-primary font-data-md">5%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-outline-variant transition-colors" style={{ width: '5%' }}></div>
</div>
</div>
</div>
<div className="mt-stack-lg p-4 bg-error-container/20 rounded-lg border border-error/20">
<div className="flex items-center gap-2 text-error font-bold mb-1">
<span className="material-symbols-outlined text-sm">trending_up</span> 1,092 Rejections
                        </div>
<p className="text-xs text-on-surface-variant">Total rejected applicants across all funnel stages.</p>
</div>
</div>
</div>
{/*  Historical Comparison Section  */}
<section className="glass-card rounded-lg p-stack-lg overflow-hidden">
<div className="flex items-center justify-between mb-8">
<h3 className="font-display-lg text-[20px] text-on-surface">Conversion Over Time</h3>
<div className="flex gap-2">
<button className="px-4 py-1 text-xs rounded-full bg-surface-variant text-on-surface border border-white/10">30 Days</button>
<button className="px-4 py-1 text-xs rounded-full text-on-surface-variant hover:bg-white/5 transition-all">90 Days</button>
<button className="px-4 py-1 text-xs rounded-full text-on-surface-variant hover:bg-white/5 transition-all">1 Year</button>
</div>
</div>
<div className="h-[300px] w-full flex items-end justify-between gap-2 px-4">
{/*  Dynamic CSS Chart Bars  */}
<div className="flex-1 group relative">
<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">12%</div>
<div className="bg-primary/20 w-full rounded-t-sm group-hover:bg-primary/40 transition-all" ></div>
<div className="bg-primary w-full rounded-t-sm group-hover:filter group-hover:brightness-125 transition-all" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
<div className="flex-1 group relative">
<div className="bg-primary/20 w-full rounded-t-sm" ></div>
<div className="bg-primary w-full rounded-t-sm" ></div>
</div>
</div>
<div className="flex justify-between mt-4 px-4 text-xs text-text-muted font-data-md">
<span>Oct 1</span>
<span>Oct 15</span>
<span>Oct 30</span>
</div>
</section>
</div>

    </PageContainer>
  );
}
