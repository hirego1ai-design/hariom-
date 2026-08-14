"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE47() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Top Bar Navigation  */}
<header className="fixed top-0 right-0 left-0 md:left-[240px] z-30 h-[64px] border-b border-white/10 backdrop-blur-md bg-surface/80 flex items-center justify-between  shadow-md">
<div className="flex items-center gap-6 flex-1">
<div className="relative max-w-md w-full">
<div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
</div>
<input className="bg-bg-elevated text-on-surface w-full h-[32px] rounded-full pl-10 pr-4 text-sm border-none focus:ring-1 focus:ring-primary/50" placeholder="Search analytics..." type="text" />
</div>
</div>
{/*  Job Selector Dropdown (Top Center logic)  */}
<div className="absolute left-1/2 -translate-x-1/2 flex items-center">
<div className="glass-card rounded-full px-6 py-2 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all">
<div className="w-2 h-2 rounded-full bg-green"></div>
<span className="font-label-md font-bold text-on-surface whitespace-nowrap">Sr. Product Designer - AI Suite</span>
<span className="material-symbols-outlined text-on-surface-variant">keyboard_arrow_down</span>
</div>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-4 text-on-surface-variant">
<span className="material-symbols-outlined cursor-pointer hover:text-primary">notifications</span>
<span className="material-symbols-outlined cursor-pointer hover:text-primary">settings</span>
</div>
<div className="h-6 w-[1px] bg-white/10"></div>
<div className="flex items-center gap-3">
<span className="text-primary font-bold text-xs uppercase tracking-wider">Proctor Active</span>
<div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
<img className="w-full h-full object-cover" data-alt="A professional headshot of a corporate hiring manager, lit with cool blue tones and warm red rim lights to match the AI platform aesthetic. The subject is wearing a modern charcoal suit against a clean, blurred office background with subtle digital grid overlays." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdtGZ4fvliPck3c0t5EWqECeA7ADnpCJDwiLnWcubAUHodRIF9wuGDsJmg69YGO8IpBoDBDQRyS4qfXbPKkg72tTgMe5-AvJBTjSjb2EGNcosahj7EWnWiSmDJSXEGeOCZ_pwvJjKD5LPBZenZH0zTx7jAhaT5XK-wAT1xlzHOPUXO2OV4F4Duye7POpHy3w5sPQWk4anQqegr9o9l5pR8UuheMxb4aILGphEFPmVSX5xe_AvBJAHIYfenFWX5tSZ4REQestL4EtY" />
</div>
</div>
</div>
</header>
{/*  Analytics Content  */}
<div className="pt-[100px]  pb-stack-lg  mx-auto">
{/*  Page Header + Performance Alert  */}
<div className="flex items-end justify-between mb-6">
<div>
<h2 className="font-display-xl text-display-xl text-text-primary tracking-tight">Job Analytics</h2>
<p className="text-text-secondary font-body-md mt-1">Real-time performance tracking for #JOB-88291</p>
</div>
{/*  Performance Warning CTA (Boost Logic)  */}
<div className="flex items-center gap-6">
<div className="text-right hidden lg:block">
<p className="text-error font-bold text-label-md uppercase tracking-widest">Performance Below Benchmark</p>
<p className="text-text-muted text-xs italic">-12% vs. regional average</p>
</div>
<button className="h-[50px] px-8 rounded-full btn-3d-red text-on-primary font-bold flex items-center gap-2 group">
<span className="material-symbols-outlined group-hover:animate-pulse">rocket_launch</span>
                        Boost This Job
                    </button>
</div>
</div>
{/*  Bento Grid: Main Metrics  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
{/*  Views Card  */}
<div className="glass-card rounded-xl p-6 relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 rounded-lg bg-white/5">
<span className="material-symbols-outlined text-primary">visibility</span>
</div>
<span className="text-green text-xs font-bold font-data-md flex items-center">+4.2%</span>
</div>
<p className="text-text-secondary font-label-md uppercase tracking-wider mb-1">Total Views</p>
<p className="font-display-lg text-display-lg text-text-primary">2,840</p>
<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
<div className="h-full bg-primary w-2/3"></div>
</div>
</div>
{/*  Applies Card  */}
<div className="glass-card rounded-xl p-6 relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 rounded-lg bg-white/5">
<span className="material-symbols-outlined text-secondary">send</span>
</div>
<span className="text-error text-xs font-bold font-data-md flex items-center">-1.8%</span>
</div>
<p className="text-text-secondary font-label-md uppercase tracking-wider mb-1">Total Applies</p>
<p className="font-display-lg text-display-lg text-text-primary">142</p>
<div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/20">
<div className="h-full bg-secondary w-1/3"></div>
</div>
</div>
{/*  Apply Rate Card  */}
<div className="glass-card rounded-xl p-6 relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 rounded-lg bg-white/5">
<span className="material-symbols-outlined text-gold-payment">percent</span>
</div>
<span className="text-text-muted text-xs font-bold font-data-md flex items-center">Stable</span>
</div>
<p className="text-text-secondary font-label-md uppercase tracking-wider mb-1">Apply Rate</p>
<p className="font-display-lg text-display-lg text-text-primary">5.0%</p>
<div className="absolute bottom-0 left-0 right-0 h-1 bg-gold-payment/20">
<div className="h-full bg-gold-payment w-[5%]"></div>
</div>
</div>
{/*  Shortlisted Card  */}
<div className="glass-card rounded-xl p-6 relative overflow-hidden group">
<div className="flex justify-between items-start mb-4">
<div className="p-2 rounded-lg bg-white/5">
<span className="material-symbols-outlined text-green">star</span>
</div>
<span className="text-green text-xs font-bold font-data-md flex items-center">+12%</span>
</div>
<p className="text-text-secondary font-label-md uppercase tracking-wider mb-1">Shortlisted</p>
<p className="font-display-lg text-display-lg text-text-primary">18</p>
<div className="absolute bottom-0 left-0 right-0 h-1 bg-green/20">
<div className="h-full bg-green w-[65%]"></div>
</div>
</div>
</div>
{/*  Detailed Insights Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/*  Stage Funnel Card  */}
<div className="lg:col-span-2 glass-card rounded-xl p-8">
<div className="flex items-center justify-between mb-8">
<div>
<h3 className="font-headline-md text-headline-md text-text-primary">Candidate Funnel</h3>
<p className="text-text-secondary font-label-md">Pipeline conversion from first contact to offer.</p>
</div>
<div className="flex gap-2">
<button className="bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors">
<span className="material-symbols-outlined text-sm">filter_list</span>
</button>
</div>
</div>
<div className="space-y-4">
{/*  Funnel Steps  */}
<div className="relative">
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-on-surface-variant">Applications</span>
<span className="font-data-md text-text-primary">142</span>
</div>
<div className="h-10 bg-primary-container/20 rounded-lg overflow-hidden relative border border-primary-container/30">
<div className="absolute inset-0 bg-primary-container w-full funnel-step opacity-80"></div>
</div>
</div>
<div className="relative w-[90%] mx-auto">
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-on-surface-variant">Screening</span>
<span className="font-data-md text-text-primary">64 (45%)</span>
</div>
<div className="h-10 bg-secondary-container/20 rounded-lg overflow-hidden relative border border-secondary-container/30">
<div className="absolute inset-0 bg-secondary-container w-full funnel-step opacity-80"></div>
</div>
</div>
<div className="relative w-[75%] mx-auto">
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-on-surface-variant">Interviews</span>
<span className="font-data-md text-text-primary">12 (8%)</span>
</div>
<div className="h-10 bg-tertiary-container/20 rounded-lg overflow-hidden relative border border-tertiary-container/30">
<div className="absolute inset-0 bg-tertiary-container w-full funnel-step opacity-80"></div>
</div>
</div>
<div className="relative w-[50%] mx-auto">
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-on-surface-variant">Offered</span>
<span className="font-data-md text-text-primary">3 (2%)</span>
</div>
<div className="h-10 bg-gold-payment/20 rounded-lg overflow-hidden relative border border-gold-payment/30">
<div className="absolute inset-0 bg-gold-payment w-full funnel-step opacity-80"></div>
</div>
</div>
</div>
</div>
{/*  Source Donut Card  */}
<div className="glass-card rounded-xl p-8">
<h3 className="font-headline-md text-headline-md text-text-primary mb-2">Source Channels</h3>
<p className="text-text-secondary font-label-md mb-8">Where your candidates are coming from.</p>
<div className="relative h-64 flex items-center justify-center mb-8">
{/*  Custom SVG Donut  */}
<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
<circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12"></circle>
<circle cx="50" cy="50" fill="none" r="40" stroke="#E53935" strokeDasharray="100 251" strokeWidth="12"></circle>
<circle cx="50" cy="50" fill="none" r="40" stroke="#4285F4" strokeDasharray="80 251" strokeDashoffset="-100" strokeWidth="12"></circle>
<circle cx="50" cy="50" fill="none" r="40" stroke="#FBBC04" strokeDasharray="40 251" strokeDashoffset="-180" strokeWidth="12"></circle>
<circle cx="50" cy="50" fill="none" r="40" stroke="#34A853" strokeDasharray="31 251" strokeDashoffset="-220" strokeWidth="12"></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-display-lg text-text-primary">100%</span>
<span className="text-xs text-text-muted uppercase font-bold tracking-widest">Attribution</span>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="flex items-center gap-3">
<div className="w-3 h-3 rounded-full bg-red-light"></div>
<div className="flex flex-col">
<span className="text-xs font-bold text-text-primary">LinkedIn</span>
<span className="text-[10px] text-text-muted">40%</span>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-3 h-3 rounded-full bg-secondary-container"></div>
<div className="flex flex-col">
<span className="text-xs font-bold text-text-primary">Direct</span>
<span className="text-[10px] text-text-muted">32%</span>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-3 h-3 rounded-full bg-gold-payment"></div>
<div className="flex flex-col">
<span className="text-xs font-bold text-text-primary">Opportunitiess</span>
<span className="text-[10px] text-text-muted">16%</span>
</div>
</div>
<div className="flex items-center gap-3">
<div className="w-3 h-3 rounded-full bg-green"></div>
<div className="flex flex-col">
<span className="text-xs font-bold text-text-primary">Referral</span>
<span className="text-[10px] text-text-muted">12%</span>
</div>
</div>
</div>
</div>
{/*  Time on Stage Bar Chart  */}
<div className="lg:col-span-3 glass-card rounded-xl p-8">
<div className="flex items-center justify-between mb-8">
<div>
<h3 className="font-headline-md text-headline-md text-text-primary">Time on Stage</h3>
<p className="text-text-secondary font-label-md">Average days candidates spend in each status.</p>
</div>
<div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2">
<span className="text-sm font-bold text-primary">Avg: 14.2 Days</span>
</div>
</div>
<div className="flex items-end justify-between gap-6 h-[200px] pt-10 border-b border-white/5">
<div className="flex-1 flex flex-col items-center gap-4 group">
<div className="w-full bg-white/5 rounded-t-lg relative flex items-end">
<div className="w-full bg-primary-container/40 h-[40%] rounded-t-lg group-hover:bg-primary-container transition-colors relative">
<span className="absolute -top-8 left-1/2 -translate-x-1/2 font-data-md text-sm text-text-primary">2.4d</span>
</div>
</div>
<span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Inbox</span>
</div>
<div className="flex-1 flex flex-col items-center gap-4 group">
<div className="w-full bg-white/5 rounded-t-lg relative flex items-end">
<div className="w-full bg-primary-container/40 h-[85%] rounded-t-lg group-hover:bg-primary-container transition-colors relative">
<span className="absolute -top-8 left-1/2 -translate-x-1/2 font-data-md text-sm text-text-primary">5.1d</span>
</div>
</div>
<span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Screening</span>
</div>
<div className="flex-1 flex flex-col items-center gap-4 group">
<div className="w-full bg-white/5 rounded-t-lg relative flex items-end">
<div className="w-full bg-primary-container/40 h-[60%] rounded-t-lg group-hover:bg-primary-container transition-colors relative">
<span className="absolute -top-8 left-1/2 -translate-x-1/2 font-data-md text-sm text-text-primary">3.8d</span>
</div>
</div>
<span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Technical</span>
</div>
<div className="flex-1 flex flex-col items-center gap-4 group">
<div className="w-full bg-white/5 rounded-t-lg relative flex items-end">
<div className="w-full bg-primary-container/40 h-[100%] rounded-t-lg group-hover:bg-primary-container transition-colors relative">
<span className="absolute -top-8 left-1/2 -translate-x-1/2 font-data-md text-sm text-text-primary">6.4d</span>
</div>
</div>
<span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Management</span>
</div>
<div className="flex-1 flex flex-col items-center gap-4 group">
<div className="w-full bg-white/5 rounded-t-lg relative flex items-end">
<div className="w-full bg-primary-container/40 h-[25%] rounded-t-lg group-hover:bg-primary-container transition-colors relative">
<span className="absolute -top-8 left-1/2 -translate-x-1/2 font-data-md text-sm text-text-primary">1.5d</span>
</div>
</div>
<span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Offer</span>
</div>
</div>
</div>
</div>
{/*  Footer Stats  */}
<div className="mt-stack-lg border-t border-white/5 pt-stack-md flex justify-between items-center text-text-muted text-xs">
<p>© 2024 HireGo AI. All analytics are encrypted and GDPR compliant.</p>
<div className="flex gap-6">
<span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green"></div> Engine Online</span>
<span className="hover:text-primary cursor-pointer transition-colors">Export Report (PDF)</span>
</div>
</div>
</div>

    </PageContainer>
  );
}
