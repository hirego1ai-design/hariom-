"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE35() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className="max-w-[800px] mx-auto px-margin-mobile md:px-gutter py-stack-lg flex flex-col items-center">
{/*  Breadcrumbs  */}
<div className="w-full flex items-center gap-2 mb-6 text-on-surface-variant font-label-md">
<span>Interviews</span>
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
<span>Candidate Schedule</span>
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
<span className="text-primary">Reschedule Request</span>
</div>
{/*  Reschedule Card  */}
<div className="glass-card w-full rounded-xl p-8 relative overflow-hidden">
{/*  AI Subtle Glow  */}
<div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 blur-[80px] rounded-full"></div>
{/*  Header: Candidate Info  */}
<div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
<div className="relative">
<div className="w-24 h-24 rounded-full border-2 border-primary/30 p-1">
<img className="w-full h-full object-cover rounded-full" data-alt="A studio portrait of a talented software engineer candidate with a friendly smile, styled in a high-fidelity digital art aesthetic. The character is illuminated by cinematic soft lighting, with a professional dark background that subtly features faint technical grid patterns and a soft blue glow consistent with a premium AI recruiting platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0KVErY_7FeJXNRNkIUbDIt__OSPBAyUG5UQ5UAm3DuDS980_S8yy6Lkc3PbsU9tbtXhF-AksPM9RF-4aOOWwYeWNTXwiHl4dhq1NPSjSFNNLSX1mg7qJmoIIC64EEaJUQ60kttxTmbFxZjcv1M9vvu4lp8T6GyWr3AWHtIcJqT5uE7VwRlysoK5WwVbHNgvrGiEsHInUfJVKtKKor1eiopxuJBTjyUW3gNFL-EPFh4J9CwHKh88SttSf96NfxKzEq-mF-uTK2xt8" />
</div>
<div className="absolute bottom-0 right-0 w-6 h-6 bg-red-light rounded-full border-2 border-bg-page flex items-center justify-center">
<span className="material-symbols-outlined text-[14px] text-white">event_busy</span>
</div>
</div>
<div className="text-center md:text-left flex-1">
<h1 className="font-display-lg text-display-lg text-white mb-1">Alex Rivera</h1>
<p className="font-body-md text-primary mb-4">Senior Full-Stack Developer</p>
<div className="bg-surface-container p-4 rounded-lg border border-white/5">
<div className="flex items-center gap-2 text-on-surface-variant font-label-md mb-2">
<span className="material-symbols-outlined text-[18px]">info</span>
                                Reason for Reschedule
                            </div>
<p className="text-on-surface font-body-md italic leading-relaxed">
                                "Personal emergency - My apologies for the inconvenience, I've had an unexpected family matter arise that requires my immediate attention today. I am still very excited about this role and would love to connect at your earliest convenience."
                            </p>
</div>
</div>
</div>
{/*  Proposed Slots  */}
<div className="space-y-4 mb-6">
<h2 className="font-headline-md text-white flex items-center gap-3">
<span className="material-symbols-outlined text-primary">schedule</span>
                        Proposed New Time Slots
                    </h2>
<div className="grid gap-3">
{/*  Slot 1  */}
<div className="group flex flex-col md:flex-row items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all">
<div className="flex items-center gap-4 mb-4 md:mb-0">
<div className="w-12 h-12 rounded-full bg-surface-container-highest flex flex-col items-center justify-center border border-white/10">
<span className="text-[10px] font-bold text-on-surface-variant uppercase">Oct</span>
<span className="text-lg font-bold text-white">14</span>
</div>
<div>
<p className="font-label-md text-white">Monday, October 14th</p>
<p className="font-data-md text-on-surface-variant">10:00 AM — 11:00 AM EST</p>
</div>
</div>
<button className="w-full md:w-auto h-[50px] px-8 bg-green text-white rounded-full font-bold flex items-center justify-center gap-2 button-shadow-green active:translate-y-[2px] active:shadow-none transition-all">
<span className="material-symbols-outlined">check_circle</span>
                                Accept This Slot
                            </button>
</div>
{/*  Slot 2  */}
<div className="group flex flex-col md:flex-row items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all">
<div className="flex items-center gap-4 mb-4 md:mb-0">
<div className="w-12 h-12 rounded-full bg-surface-container-highest flex flex-col items-center justify-center border border-white/10">
<span className="text-[10px] font-bold text-on-surface-variant uppercase">Oct</span>
<span className="text-lg font-bold text-white">15</span>
</div>
<div>
<p className="font-label-md text-white">Tuesday, October 15th</p>
<p className="font-data-md text-on-surface-variant">02:30 PM — 03:30 PM EST</p>
</div>
</div>
<button className="w-full md:w-auto h-[50px] px-8 bg-green text-white rounded-full font-bold flex items-center justify-center gap-2 button-shadow-green active:translate-y-[2px] active:shadow-none transition-all">
<span className="material-symbols-outlined">check_circle</span>
                                Accept This Slot
                            </button>
</div>
{/*  Slot 3  */}
<div className="group flex flex-col md:flex-row items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all">
<div className="flex items-center gap-4 mb-4 md:mb-0">
<div className="w-12 h-12 rounded-full bg-surface-container-highest flex flex-col items-center justify-center border border-white/10">
<span className="text-[10px] font-bold text-on-surface-variant uppercase">Oct</span>
<span className="text-lg font-bold text-white">17</span>
</div>
<div>
<p className="font-label-md text-white">Thursday, October 17th</p>
<p className="font-data-md text-on-surface-variant">09:00 AM — 10:00 AM EST</p>
</div>
</div>
<button className="w-full md:w-auto h-[50px] px-8 bg-green text-white rounded-full font-bold flex items-center justify-center gap-2 button-shadow-green active:translate-y-[2px] active:shadow-none transition-all">
<span className="material-symbols-outlined">check_circle</span>
                                Accept This Slot
                            </button>
</div>
</div>
</div>
{/*  Footer Actions  */}
<div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-stack-lg border-t border-white/10">
<button className="w-full md:w-auto h-[50px] px-10 bg-[#1E1E1E] text-white border border-white/10 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all" >
<span className="material-symbols-outlined">calendar_today</span>
                        Propose Different Time
                    </button>
<button className="w-full md:w-auto h-[50px] px-10 bg-transparent text-error border border-error/30 hover:border-error hover:bg-error/5 rounded-full font-bold flex items-center justify-center gap-2 transition-all">
<span className="material-symbols-outlined">cancel</span>
                        Cancel Interview
                    </button>
</div>
</div>
{/*  Date Picker Modal (Hidden by Default)  */}
<div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm hidden" id="datePickerModal">
<div className="glass-card w-full max-w-[400px] p-6 rounded-xl animate-in fade-in zoom-in duration-300">
<div className="flex justify-between items-center mb-6">
<h3 className="font-headline-md text-white">Select New Date</h3>
<button className="text-on-surface-variant hover:text-white" >
<span className="material-symbols-outlined">close</span>
</button>
</div>
{/*  Mock Date Picker  */}
<div className="grid grid-cols-7 gap-1 text-center mb-6">
<span className="text-[10px] text-muted font-bold">SU</span>
<span className="text-[10px] text-muted font-bold">MO</span>
<span className="text-[10px] text-muted font-bold">TU</span>
<span className="text-[10px] text-muted font-bold">WE</span>
<span className="text-[10px] text-muted font-bold">TH</span>
<span className="text-[10px] text-muted font-bold">FR</span>
<span className="text-[10px] text-muted font-bold">SA</span>
<div className="p-2 text-muted">29</div>
<div className="p-2 text-muted">30</div>
<div className="p-2 text-white bg-primary rounded-full font-bold">1</div>
<div className="p-2 hover:bg-white/10 rounded-full cursor-pointer">2</div>
<div className="p-2 hover:bg-white/10 rounded-full cursor-pointer">3</div>
<div className="p-2 hover:bg-white/10 rounded-full cursor-pointer">4</div>
<div className="p-2 hover:bg-white/10 rounded-full cursor-pointer">5</div>
{/*  ... simplified for brevity  */}
</div>
<div className="space-y-4">
<div className="flex flex-col gap-2">
<label className="font-label-md text-on-surface-variant px-4">Start Time</label>
<input className="pill-input text-white w-full" type="time" value="09:00" />
</div>
<button className="w-full h-[50px] bg-gradient-to-r from-secondary-container to-on-secondary-fixed-variant text-white rounded-full font-bold button-shadow-blue flex items-center justify-center gap-2">
                            Confirm Proposal
                        </button>
</div>
</div>
</div>
{/*  AI Insight Widget  */}
<div className="mt-stack-lg w-full p-6 glass-card rounded-xl border-l-4 border-l-secondary flex items-start gap-4">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
</div>
<div>
<p className="font-label-md text-secondary font-bold mb-1">HireGo AI Optimization</p>
<p className="font-body-md text-on-surface-variant leading-snug">
                        Alex's technical score (98/100) is among the top 1% for this role. We recommend rescheduling quickly to maintain engagement, as he is currently in the final interview stages with 2 other companies.
                    </p>
</div>
</div>
</div>

    </PageContainer>
  );
}
