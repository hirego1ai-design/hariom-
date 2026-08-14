"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE12() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className="max-w-[1000px] mx-auto px-margin-mobile md: py-stack-lg">
{/*  Header Section  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-6">
<div>
<div className="flex items-center gap-4 mb-2">
<h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-text-primary">Notifications</h2>
<span className="bg-primary-container/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold font-data-md">
                            12 UNREAD
                        </span>
</div>
<p className="text-text-secondary font-body-md max-w-xl">
                        Stay updated on candidate activities, system insights, and automated proctoring alerts.
                    </p>
</div>
<div className="flex items-center gap-3">
<button className="h-[44px] px-6 rounded-full btn-depth-ghost flex items-center gap-2 text-text-primary text-sm font-medium">
<span className="material-symbols-outlined text-[18px]">done_all</span>
                        Mark All Read
                    </button>
<a className="text-primary hover:underline flex items-center gap-1 text-sm font-medium" href="#">
<span className="material-symbols-outlined text-[18px]">settings</span>
                        Settings
                    </a>
</div>
</div>
{/*  Filters  */}
<div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-6">
<button className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold shadow-lg flex-shrink-0">All</button>
<button className="px-6 py-2 bg-bg-elevated border border-white/5 text-text-secondary hover:text-white rounded-full text-sm font-medium transition-colors flex-shrink-0">Urgent</button>
<button className="px-6 py-2 bg-bg-elevated border border-white/5 text-text-secondary hover:text-white rounded-full text-sm font-medium transition-colors flex-shrink-0">Candidates</button>
<button className="px-6 py-2 bg-bg-elevated border border-white/5 text-text-secondary hover:text-white rounded-full text-sm font-medium transition-colors flex-shrink-0">Interviews</button>
<button className="px-6 py-2 bg-bg-elevated border border-white/5 text-text-secondary hover:text-white rounded-full text-sm font-medium transition-colors flex-shrink-0">Payments</button>
<button className="px-6 py-2 bg-bg-elevated border border-white/5 text-text-secondary hover:text-white rounded-full text-sm font-medium transition-colors flex-shrink-0">Team</button>
</div>
{/*  Notifications List  */}
<div className="space-y-6">
{/*  Group: Today  */}
<section>
<div className="flex items-center gap-4 mb-4">
<h3 className="text-text-muted font-bold uppercase tracking-widest text-[11px]">Today</h3>
<div className="h-px flex-1 bg-white/5"></div>
</div>
<div className="space-y-3">
{/*  Item 1: Candidate Top Match (Green)  */}
<div className="glass-card rounded-2xl p-4 flex gap-4 items-start relative group hover:bg-white/[0.03] transition-colors cursor-pointer">
<div className="absolute right-4 top-4 unread-dot"></div>
<div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center flex-shrink-0 border border-green/20">
<span className="material-symbols-outlined text-green" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-bold text-white text-body-md">Top Match: Sarah Chen</h4>
<span className="text-text-muted text-xs font-data-md">10:45 AM</span>
</div>
<p className="text-text-secondary text-sm leading-relaxed mb-3">
                                    A new application for <span className="text-primary">Lead Frontend Engineer</span> matches 98% of your requirements. Sarah specializes in React and AI integration.
                                </p>
<div className="flex gap-2">
<button className="bg-green/10 hover:bg-green/20 text-green px-4 py-1.5 rounded-full text-xs font-bold border border-green/20 transition-colors">View Profile</button>
<button className="bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-white/10 transition-colors">Dismiss</button>
</div>
</div>
</div>
{/*  Item 2: New Application (Blue)  */}
<div className="glass-card rounded-2xl p-4 flex gap-4 items-start relative group hover:bg-white/[0.03] transition-colors cursor-pointer">
<div className="absolute right-4 top-4 unread-dot"></div>
<div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center flex-shrink-0 border border-secondary-container/30">
<span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-bold text-white text-body-md">New Application Received</h4>
<span className="text-text-muted text-xs font-data-md">08:12 AM</span>
</div>
<p className="text-text-secondary text-sm leading-relaxed">
                                    James Wilson submitted an application for the <span className="text-primary">UX Architect</span> position. AI screening in progress.
                                </p>
</div>
</div>
</div>
</section>
{/*  Group: Yesterday  */}
<section>
<div className="flex items-center gap-4 mb-4">
<h3 className="text-text-muted font-bold uppercase tracking-widest text-[11px]">Yesterday</h3>
<div className="h-px flex-1 bg-white/5"></div>
</div>
<div className="space-y-3">
{/*  Item 3: Feedback Overdue (Red)  */}
<div className="glass-card rounded-2xl p-4 flex gap-4 items-start relative group hover:bg-white/[0.03] transition-colors cursor-pointer">
<div className="absolute right-4 top-4 unread-dot"></div>
<div className="w-12 h-12 rounded-full bg-red-light/10 flex items-center justify-center flex-shrink-0 border border-red-light/20">
<span className="material-symbols-outlined text-red-light" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-bold text-white text-body-md">Feedback Overdue</h4>
<span className="text-text-muted text-xs font-data-md">Yesterday, 4:20 PM</span>
</div>
<p className="text-text-secondary text-sm leading-relaxed mb-3">
                                    The interview feedback for <span className="text-white font-medium">Michael Aris</span> is 24 hours overdue. Complete the scorecard to maintain hiring velocity.
                                </p>
<button className="bg-red-light/10 hover:bg-red-light/20 text-red-light px-4 py-1.5 rounded-full text-xs font-bold border border-red-light/20 transition-colors">Complete Scorecard</button>
</div>
</div>
{/*  Item 4: Payment (Yellow)  */}
<div className="glass-card rounded-2xl p-4 flex gap-4 items-start group hover:bg-white/[0.03] transition-colors cursor-pointer opacity-80 hover:opacity-100">
<div className="w-12 h-12 rounded-full bg-yellow/10 flex items-center justify-center flex-shrink-0 border border-yellow/20">
<span className="material-symbols-outlined text-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-bold text-white text-body-md">Invoice Processed</h4>
<span className="text-text-muted text-xs font-data-md">Yesterday, 11:30 AM</span>
</div>
<p className="text-text-secondary text-sm leading-relaxed">
                                    Monthly subscription for <span className="text-white font-medium">Enterprise Plan</span> was successfully charged to your card ending in •••• 4402.
                                </p>
</div>
</div>
</div>
</section>
{/*  Group: This Week  */}
<section>
<div className="flex items-center gap-4 mb-4">
<h3 className="text-text-muted font-bold uppercase tracking-widest text-[11px]">This Week</h3>
<div className="h-px flex-1 bg-white/5"></div>
</div>
<div className="space-y-3">
{/*  Item 5: Team Activity  */}
<div className="glass-card rounded-2xl p-4 flex gap-4 items-start group hover:bg-white/[0.03] transition-colors cursor-pointer opacity-70 hover:opacity-100">
<div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
<span className="material-symbols-outlined text-text-muted">group</span>
</div>
<div className="flex-1">
<div className="flex justify-between items-start mb-1">
<h4 className="font-bold text-white text-body-md">Team Member Invited</h4>
<span className="text-text-muted text-xs font-data-md">Oct 24, 2:15 PM</span>
</div>
<p className="text-text-secondary text-sm leading-relaxed">
<span className="text-white font-medium">Elena Rodriguez</span> has joined the workspace as a Senior Recruiter.
                                </p>
</div>
</div>
</div>
</section>
{/*  Empty State Check (Hidden by default)  */}
<div className="hidden flex-col items-center justify-center py-20 text-center">
<div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
<span className="material-symbols-outlined text-text-muted text-5xl">notifications_off</span>
</div>
<h3 className="text-display-lg-mobile font-display-lg mb-2">Clear Skies!</h3>
<p className="text-text-secondary max-w-xs mx-auto">You've addressed all your notifications. Enjoy the productivity!</p>
</div>
</div>
{/*  Footer Pagination/More  */}
<div className="mt-stack-lg flex justify-center">
<button className="h-[50px] px-8 rounded-full btn-depth-ghost text-white font-bold text-sm">
                    Load More History
                </button>
</div>
</div>

    </PageContainer>
  );
}
