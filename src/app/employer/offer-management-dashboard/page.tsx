"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE24() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header & Stats  */}
<div className="mb-6">
<h1 className="font-display-xl text-text-primary mb-stack-md">Offer Management</h1>
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
<div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
<span className="font-label-md text-text-muted">Offers Sent</span>
<span className="font-display-lg text-text-primary">08</span>
<div className="flex items-center gap-1 text-green text-sm mt-2">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span>+2 this month</span>
</div>
</div>
<div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-green/10 rounded-full blur-2xl group-hover:bg-green/20 transition-all"></div>
<span className="font-label-md text-text-muted">Accepted</span>
<span className="font-display-lg text-green">05</span>
<div className="flex items-center gap-1 text-text-muted text-sm mt-2">
<span>62.5% Success Rate</span>
</div>
</div>
<div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow/10 rounded-full blur-2xl group-hover:bg-yellow/20 transition-all"></div>
<span className="font-label-md text-text-muted">Pending</span>
<span className="font-display-lg text-yellow">02</span>
<div className="flex items-center gap-1 text-red-light text-sm mt-2">
<span className="material-symbols-outlined text-[16px]">schedule</span>
<span>1 Expiring soon</span>
</div>
</div>
<div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden group">
<div className="absolute -right-4 -top-4 w-24 h-24 bg-error/10 rounded-full blur-2xl group-hover:bg-error/20 transition-all"></div>
<span className="font-label-md text-text-muted">Declined</span>
<span className="font-display-lg text-error">01</span>
<div className="flex items-center gap-1 text-text-muted text-sm mt-2">
<span>Follow-up scheduled</span>
</div>
</div>
</div>
</div>
{/*  Main Content Area  */}
<div className="flex flex-col gap-stack-md">
{/*  Filters Tabs  */}
<div className="flex items-center justify-between">
<div className="flex bg-surface-container-low p-1 rounded-full border border-white/5">
<button className="px-6 py-2 rounded-full font-label-md bg-primary text-on-primary-fixed shadow-lg">All Offers</button>
<button className="px-6 py-2 rounded-full font-label-md text-on-surface-variant hover:text-on-surface transition-colors">Accepted</button>
<button className="px-6 py-2 rounded-full font-label-md text-on-surface-variant hover:text-on-surface transition-colors">Pending</button>
<button className="px-6 py-2 rounded-full font-label-md text-on-surface-variant hover:text-on-surface transition-colors">Declined</button>
</div>
<button className="flex items-center gap-2 btn-ghost px-6 rounded-full font-label-md">
<span className="material-symbols-outlined">filter_list</span>
                    More Filters
                </button>
</div>
{/*  Table Card  */}
<div className="glass-card overflow-hidden">
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-white/5 bg-white/2">
<th className="px-8 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Candidate</th>
<th className="px-6 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Role</th>
<th className="px-6 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Salary</th>
<th className="px-6 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Sent Date</th>
<th className="px-6 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Expiry</th>
<th className="px-6 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold">Status</th>
<th className="px-8 py-5 font-headline-md text-sm text-text-muted uppercase tracking-widest font-bold text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-white/5">
{/*  Row 1  */}
<tr className="group hover:bg-white/[0.02] transition-colors">
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-display-xl text-sm border border-white/10">EM</div>
<div>
<div className="font-body-md font-bold text-text-primary">Elena Martinez</div>
<div className="text-xs text-text-muted">elena.m@designco.com</div>
</div>
</div>
</td>
<td className="px-6 py-6 font-body-md text-text-secondary">Lead AI Researcher</td>
<td className="px-6 py-6 font-data-md text-text-primary">$185,000</td>
<td className="px-6 py-6 font-data-md text-text-secondary">Oct 12, 2023</td>
<td className="px-6 py-6">
<div className="flex items-center gap-2 text-yellow font-bold animate-pulse">
<span className="material-symbols-outlined text-sm">warning</span>
<span className="font-data-md text-sm">2 days left</span>
</div>
</td>
<td className="px-6 py-6">
<span className="status-badge bg-yellow/20 text-yellow border border-yellow/30">Pending</span>
</td>
<td className="px-8 py-6 text-right">
<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-white/5 rounded-full text-text-secondary" title="View"><span className="material-symbols-outlined">visibility</span></button>
<button className="p-2 hover:bg-white/5 rounded-full text-primary" title="Extend"><span className="material-symbols-outlined">event_repeat</span></button>
<button className="p-2 hover:bg-red-light/10 rounded-full text-red-light" title="Revoke"><span className="material-symbols-outlined">cancel</span></button>
</div>
</td>
</tr>
{/*  Row 2  */}
<tr className="group hover:bg-white/[0.02] transition-colors">
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
<img className="w-full h-full object-cover" data-alt="Portrait of a smiling software engineer with glasses, vibrant neon blue lighting from the side, dark high-tech background, digital art style, professional and innovative aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRjPuW_fRbUzcJHbgOszunWKZioZRv8zintxkUm4-TmVC50qDeBRg82-J6P3uEsM1_9FcYrVYyurTHU8FvBy4pHFi1oDkG-xfyhT7OBg7jw4enqrx9kAXLRqekDVOVuUb-5WmzCIV6vHmIG4rz0P9MDcINZ47vfC60HdCi1cN5YVI2fYsPMyyRKibNkHL6dyk0pXAii7uWsF21M-QYlwrKNl20QCbrF6z-r0YSkTNyXlWZLQxhiTrP630ZRbLMm0uF-ViVFBMnoUE" />
</div>
<div>
<div className="font-body-md font-bold text-text-primary">Marcus Chen</div>
<div className="text-xs text-text-muted">m.chen@techsolutions.io</div>
</div>
</div>
</td>
<td className="px-6 py-6 font-body-md text-text-secondary">Senior DevOps</td>
<td className="px-6 py-6 font-data-md text-text-primary">$160,000</td>
<td className="px-6 py-6 font-data-md text-text-secondary">Oct 10, 2023</td>
<td className="px-6 py-6 text-text-muted font-data-md text-sm">Expired</td>
<td className="px-6 py-6">
<span className="status-badge bg-green/20 text-green border border-green/30">Accepted</span>
</td>
<td className="px-8 py-6 text-right">
<div className="flex items-center justify-end gap-2">
<button className="h-10 px-4 bg-white/5 hover:bg-white/10 rounded-full font-label-md transition-colors">View Onboarding</button>
</div>
</td>
</tr>
{/*  Row 3  */}
<tr className="group hover:bg-white/[0.02] transition-colors">
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-display-xl text-sm border border-white/10">SJ</div>
<div>
<div className="font-body-md font-bold text-text-primary">Sarah Jenkins</div>
<div className="text-xs text-text-muted">sarah.j@creativeflow.com</div>
</div>
</div>
</td>
<td className="px-6 py-6 font-body-md text-text-secondary">Product Designer</td>
<td className="px-6 py-6 font-data-md text-text-primary">$145,000</td>
<td className="px-6 py-6 font-data-md text-text-secondary">Oct 05, 2023</td>
<td className="px-6 py-6 text-text-muted font-data-md text-sm">N/A</td>
<td className="px-6 py-6">
<span className="status-badge bg-error/20 text-error border border-error/30">Declined</span>
</td>
<td className="px-8 py-6 text-right">
<button className="h-10 px-4 btn-ghost rounded-full font-label-md hover:border-primary/50">View Feedback</button>
</td>
</tr>
{/*  Row 4  */}
<tr className="group hover:bg-white/[0.02] transition-colors">
<td className="px-8 py-6">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-display-xl text-sm border border-white/10">DW</div>
<div>
<div className="font-body-md font-bold text-text-primary">David Wu</div>
<div className="text-xs text-text-muted">dwu@fintech.com</div>
</div>
</div>
</td>
<td className="px-6 py-6 font-body-md text-text-secondary">Backend Engineer</td>
<td className="px-6 py-6 font-data-md text-text-primary">$175,000</td>
<td className="px-6 py-6 font-data-md text-text-secondary">Oct 14, 2023</td>
<td className="px-6 py-6 font-data-md text-text-secondary text-sm">5 days left</td>
<td className="px-6 py-6">
<span className="status-badge bg-yellow/20 text-yellow border border-yellow/30">Pending</span>
</td>
<td className="px-8 py-6 text-right">
<div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 hover:bg-white/5 rounded-full text-text-secondary"><span className="material-symbols-outlined">visibility</span></button>
<button className="p-2 hover:bg-white/5 rounded-full text-primary"><span className="material-symbols-outlined">event_repeat</span></button>
<button className="p-2 hover:bg-red-light/10 rounded-full text-red-light"><span className="material-symbols-outlined">cancel</span></button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-8 py-5 flex items-center justify-between bg-white/[0.02] border-t border-white/5">
<span className="text-text-muted font-label-md">Showing 4 of 8 total offers</span>
<div className="flex items-center gap-2">
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 border border-white/5 text-text-secondary">
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary-fixed font-bold">1</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-text-secondary">2</button>
<button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 border border-white/5 text-text-secondary">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</div>
{/*  Promotion / Action Area  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-stack-md">
<div className="glass-card p-stack-lg bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
<h3 className="font-headline-md text-text-primary mb-2">Automate Offer Flow</h3>
<p className="text-on-surface-variant mb-6 text-body-md">Enable AI-powered follow-ups and smart negotiation bounds to close candidates 30% faster.</p>
<button className="btn-primary-blue px-8 rounded-full text-white font-bold flex items-center gap-2">
                        Configure AI Agents
                        <span className="material-symbols-outlined">bolt</span>
</button>
</div>
<div className="glass-card p-stack-lg flex flex-col items-center justify-center text-center">
<div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-primary">
<span className="material-symbols-outlined text-3xl">insights</span>
</div>
<h3 className="font-headline-md text-text-primary mb-2">Offer Acceptance Insights</h3>
<p className="text-on-surface-variant mb-4 text-body-md">Your offer acceptance rate is 15% higher than industry average for Engineering roles.</p>
<a className="text-primary font-bold hover:underline" href="#">View Detailed Reports</a>
</div>
</div>
</div>

    </PageContainer>
  );
}
