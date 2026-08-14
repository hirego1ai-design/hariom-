"use client";
import React from "react";
import Link from "next/link";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE64() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Page Content  */}
<div className="space-y-6">
{/*  Header  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h2 className="font-display-lg text-display-lg text-text-primary tracking-tight mb-2">Upcoming Interviews</h2>
<p className="text-text-secondary font-body-md max-w-lg">Manage your schedule and prepare for success with AI-powered insights tailored for each role.</p>
</div>
<div className="flex items-center gap-3">
<div className="text-right hidden md:block">
<p className="font-label-md text-label-md text-text-muted">Next interview in</p>
<p className="font-data-lg text-data-lg text-primary tracking-tighter">04:12:35</p>
</div>
<button className="h-[50px] px-8 rounded-full btn-blue-3d text-white font-bold flex items-center gap-2">
<span className="material-symbols-outlined text-[20px]">add</span>
                            Schedule New
                        </button>
</div>
</div>
{/*  Calendar Strip  */}
<div className="glass-card p-4 rounded-2xl flex items-center gap-4 overflow-x-auto no-scrollbar">
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-primary text-on-primary font-bold transition-transform active:scale-95">
<span className="text-[12px] opacity-70">MON</span>
<span className="text-xl">12</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5">
<span className="text-[12px]">TUE</span>
<span className="text-xl">13</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5">
<span className="text-[12px]">WED</span>
<span className="text-xl">14</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5">
<span className="text-[12px]">THU</span>
<span className="text-xl">15</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5">
<span className="text-[12px]">FRI</span>
<span className="text-xl">16</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5 opacity-50">
<span className="text-[12px]">SAT</span>
<span className="text-xl">17</span>
</button>
<button className="flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 bg-white/5 text-text-secondary hover:bg-white/10 transition-all border border-white/5 opacity-50">
<span className="text-[12px]">SUN</span>
<span className="text-xl">18</span>
</button>
</div>
{/*  Interviews List  */}
<div className="space-y-12">
{/*  Today Section  */}
<section className="space-y-4">
<div className="flex items-center gap-3">
<h3 className="font-headline-md text-headline-md text-text-primary">Today</h3>
<span className="w-2 h-2 rounded-full bg-red-light animate-pulse"></span>
<span className="text-red-light font-label-md text-label-md uppercase tracking-widest font-bold">Live Now</span>
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
{/*  Today Card 1  */}
<div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
<div className="absolute top-0 right-0 p-4">
<span className="px-3 py-1 bg-red-deep/20 text-red-light text-[10px] font-bold rounded-full border border-red-light/30 tracking-widest uppercase">Round 3: Final</span>
</div>
<div className="flex items-start gap-6">
<div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-3">
<img className="w-full h-full object-contain" data-alt="A sleek, modern minimalist vector logo for a high-tech software company named 'Nexus'. The logo uses sharp geometric lines and is presented against a clean white background, reflecting a professional and innovative corporate identity suitable for a dark-mode professional dashboard." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhkhHg1Cfk6mmG9vK9mXwmgaulHapm-YDyivlCgvTbi7SnQbxfn_7-x1boFPjABNv9yM4eIv_SoovsRNJfxFarI2qUx86-1AycEwfODzZZbtWth77D4MtbtE1lp4eR12sNFLgGD0O-1FRbVqQx3tKL00mioJ7LOIA2NCMoDbojGvvBPgZHT7g7qF-b9mlb7mRKgKRqWpPmPrB0lWautmFewuL1v-xftXkPXk9Qku5DILt7QPfSfjR9qy6fTtmblcY4eERXfuOj_Qs" />
</div>
<div className="flex-1">
<p className="font-data-md text-data-md text-primary mb-1">Nexus AI Systems</p>
<h4 className="font-headline-md text-headline-md text-text-primary leading-tight mb-4">Senior Product Designer</h4>
<div className="grid grid-cols-2 gap-4 mb-6">
<div className="flex items-center gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span className="font-label-md text-label-md">14:00 - 15:00</span>
</div>
<div className="flex items-center gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[18px]">person</span>
<span className="font-label-md text-label-md">Sarah Jenkins (VP Design)</span>
</div>
<div className="flex items-center gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[18px]">videocam</span>
<span className="font-label-md text-label-md">Google Meet</span>
</div>
<div className="flex items-center gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[18px]">timer</span>
<span className="font-data-md text-data-md text-red-light">Starting in 15m</span>
</div>
</div>
<Link href="/employer/active-video-interview-interviewer-view" className="w-full h-[50px] rounded-full btn-red-3d text-white font-bold flex items-center justify-center gap-2 glow-red group-hover:scale-[1.02] transition-transform">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                            Join Meeting Room
                                        </Link>
<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
</div>
</div>
{/*  Today Card 2  */}
<div className="glass-card p-6 rounded-2xl relative overflow-hidden border-white/5 opacity-80">
<div className="absolute top-0 right-0 p-4">
<span className="px-3 py-1 bg-white/5 text-text-muted text-[10px] font-bold rounded-full border border-white/10 tracking-widest uppercase">Technical screening</span>
</div>
<div className="flex items-start gap-6">
<div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-3 opacity-80">
<img className="w-full h-full object-contain" data-alt="A minimalist tech logo for 'CloudFlow' featuring abstract circular flow elements in blue and silver. The image is on a white background, professionally rendered to sit within a sleek UI dashboard's interview card." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpidNNKVA3Ur_lk7glEsJgcLf1TJZdC9eJHK_dY6RNjhFqRhNTW0p8xed2M6E0ilHNc3iXBgs1CmBJnYnICUnVBjiO3lH7kejslCV7hyqKNy_14hvaKPnt6SGcyhvBMBkJjseiLbuwsbI7gPvEYiPFDebiq4ivLUCA0CEg4VLzGwGUrv4Ohuy8AiN-KEhiVdAi-BsJIeZvZEu2yuZmjTZ3sgSoENEcUqrE1ImUCStt63Id-AjDucq8F30sOCd93Wb3a7Nlz0S3mfo" />
</div>
<div className="flex-1">
<p className="font-data-md text-data-md text-text-muted mb-1">CloudFlow</p>
<h4 className="font-headline-md text-headline-md text-text-secondary leading-tight mb-4">Frontend Engineer</h4>
<div className="grid grid-cols-2 gap-4">
<div className="flex items-center gap-2 text-text-muted">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span className="font-label-md text-label-md">16:30 - 17:15</span>
</div>
<div className="flex items-center gap-2 text-text-muted">
<span className="material-symbols-outlined text-[18px]">person</span>
<span className="font-label-md text-label-md">David Chen (Lead Eng)</span>
</div>
</div>
<div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  Tomorrow Section  */}
<section className="space-y-4">
<h3 className="font-headline-md text-headline-md text-text-primary">Tomorrow, Jan 13</h3>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
{/*  Tomorrow Card 1  */}
<div className="glass-card p-6 rounded-2xl border-l-4 border-l-secondary flex flex-col h-full">
<div className="flex items-center justify-between mb-4">
<div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2">
<img className="w-full h-full object-contain" data-alt="A clean corporate logo for 'FinTrack', using bold green and dark blue geometric shapes on a white background. Designed for high visibility in a dark-themed UI software interface." src="https://lh3.googleusercontent.com/aida-public/AB6AXuADaaTcXI-wXcQ1BQS2wgvm5Y0T3d-Wj3lOzdn-Vc9sAb_HwouCM2EBIfSwSUuWCeSUMa5EEDyqQTEXO12nYiZWZ3Jnni0sRdRi9yfFGqz9nwnI6dvtUrPPc00ARdFNcDK0hfbfaNnlKNtdPtPxxpr5xBE8twRZ-vfbDaL_cp9CB-3fYtdkEScEfZGRFijMNegsmLztZEXaTB7sSSTcefx64OsN10jTg2sBQJo-Ypi5uodSBgY6nk5nWBJdtQGBLZf3H1auIuyVtfQ" />
</div>
<span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-md uppercase">1st Interview</span>
</div>
<h4 className="font-body-lg text-body-lg font-bold text-text-primary mb-1">FinTrack Analytics</h4>
<p className="text-text-secondary font-label-md text-label-md mb-4">Senior Data Analyst</p>
<div className="space-y-2 mb-6 flex-1">
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span>09:00 AM</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">person</span>
<span>Mark Wilson</span>
</div>
</div>
<button className="w-full h-[44px] rounded-full btn-blue-3d text-white font-bold text-sm flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[18px]">psychology</span>
                                    Prepare with AI
                                </button>
<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
{/*  Tomorrow Card 2  */}
<div className="glass-card p-6 rounded-2xl border-l-4 border-l-secondary flex flex-col h-full">
<div className="flex items-center justify-between mb-4">
<div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2">
<img className="w-full h-full object-contain" data-alt="A minimal and professional vector logo for 'StreamLine' featuring a continuous flowing line in gradients of purple and blue on a white background. This logo is presented within a high-fidelity dashboard card for a tech recruitment platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCFFZYnCW4PTE21vB-oXuQVn_jsqqHq_O2HG40txcVae-atfrFNBTKKi0HtG5ipuVi0ZYGy4CTrV4KG341Q0Rm4uhoxhL5_9YzqPvIRfEqzpdeUI-l6KlNllIQJinQ6V89HMW0X_K99tKu-KKX9DL7QDewaOS832unDzjaz9svKwRSEyPeWcBRGuPmYxUT-YHN0XAMi8rgZSH1jLancbr_w6Q7FJj345_JmSomGcSSg2VhEbLuZBrmqXNktg5RWE7lhDbhB1fENo4" />
</div>
<span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-md uppercase">Final Review</span>
</div>
<h4 className="font-body-lg text-body-lg font-bold text-text-primary mb-1">StreamLine Inc</h4>
<p className="text-text-secondary font-label-md text-label-md mb-4">Marketing Director</p>
<div className="space-y-2 mb-6 flex-1">
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span>01:30 PM</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">person</span>
<span>Elena Rodriguez</span>
</div>
</div>
<button className="w-full h-[44px] rounded-full btn-blue-3d text-white font-bold text-sm flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[18px]">psychology</span>
                                    Prepare with AI
                                </button>
<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
{/*  Empty Slot for Tomorrow  */}
<div className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-text-muted p-6 opacity-40 hover:opacity-100 hover:border-primary/20 transition-all cursor-pointer">
<span className="material-symbols-outlined text-[40px] mb-2">add_circle</span>
<p className="font-label-md text-label-md">Schedule for tomorrow</p>
</div>
</div>
</section>
{/*  Rest of Week  */}
<section className="space-y-4">
<div className="flex items-center justify-between border-b border-white/5 pb-4">
<h3 className="font-headline-md text-headline-md text-text-primary">Later this week</h3>
<button className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline">
                                View Full Calendar <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
<div className="space-y-2">
<div className="glass-card px-6 py-4 rounded-xl flex flex-col gap-4 group hover:bg-white/5 transition-colors">
<div className="flex flex-wrap items-center justify-between gap-4 w-full">
<div className="flex items-center gap-4 min-w-[240px]">
<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
<span className="font-data-md text-data-md text-text-primary">14</span>
</div>
<div>
<h5 className="font-bold text-text-primary">Stellar Apps</h5>
<p className="text-text-secondary text-xs">Fullstack Developer</p>
</div>
</div>
<div className="flex items-center gap-8">
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">person</span>
<span>Thomas Hunt</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">call</span>
<span>Phone Screen</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm w-32">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span className="font-data-md">11:00 AM</span>
</div>
</div>
<button className="btn-ghost px-4 py-2 rounded-full text-xs font-bold text-text-secondary group-hover:text-text-primary group-hover:border-white/20 transition-all">Details</button>
</div>
<div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
<div className="glass-card px-6 py-4 rounded-xl flex flex-col gap-4 group hover:bg-white/5 transition-colors">
<div className="flex flex-wrap items-center justify-between gap-4 w-full">
<div className="flex items-center gap-4 min-w-[240px]">
<div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
<span className="font-data-md text-data-md text-text-primary">16</span>
</div>
<div>
<h5 className="font-bold text-text-primary">Orbit Tech</h5>
<p className="text-text-secondary text-xs">UX Research Lead</p>
</div>
</div>
<div className="flex items-center gap-8">
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">person</span>
<span>Amara Okafor</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm">
<span className="material-symbols-outlined text-[18px]">videocam</span>
<span>Zoom Meeting</span>
</div>
<div className="flex items-center gap-2 text-text-muted text-sm w-32">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span className="font-data-md">02:00 PM</span>
</div>
</div>
<button className="btn-ghost px-4 py-2 rounded-full text-xs font-bold text-text-secondary group-hover:text-text-primary group-hover:border-white/20 transition-all">Details</button>
</div>
<div className="flex flex-wrap gap-2 pt-4 border-t border-white/10 w-full">
    <Link href="/employer/interview-feedback-form" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">rate_review</span>
        Feedback
    </Link>
    <Link href="/employer/interview-reschedule-employer-view" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        Reschedule
    </Link>
    <Link href="/employer/interview-panel-collaboration" className="flex-1 min-w-[100px] btn-ghost h-10 flex items-center justify-center gap-2 rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
        <span className="material-symbols-outlined text-[16px]">groups</span>
        Panel
    </Link>
</div>
</div>
</div>
</section>
</div>
</div>

    </PageContainer>
  );
}
