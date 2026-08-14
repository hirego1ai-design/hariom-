"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE14() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Progress Bar Header  */}
<div className="flex flex-col items-center mb-6">
<h1 className="font-display-xl text-display-xl mb-stack-md">Generate Offer</h1>
<div className="flex items-center gap-stack-lg relative w-full max-w-2xl justify-between">
{/*  Connectors  */}
<div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2 z-0">
<div className="h-full bg-primary transition-all duration-500 w-[0%]" id="progress-line"></div>
</div>
{/*  Steps  */}
<div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" >
<div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-on-primary font-bold transition-all step-active" id="step-1-circle">1</div>
<span className="text-label-md font-bold text-primary">Details</span>
</div>
<div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" >
<div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high border border-white/10 text-on-surface-variant font-bold transition-all" id="step-2-circle">2</div>
<span className="text-label-md text-on-surface-variant">Preview</span>
</div>
<div className="z-10 flex flex-col items-center gap-2 group cursor-pointer" >
<div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high border border-white/10 text-on-surface-variant font-bold transition-all" id="step-3-circle">3</div>
<span className="text-label-md text-on-surface-variant">Send</span>
</div>
</div>
</div>
{/*  Step 1: Details  */}
<section className="block" id="step-1-content">
<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
{/*  Input Form  */}
<div className="md:col-span-8 glass-card rounded-lg p-stack-lg space-y-stack-md">
<div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Job Role</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="Senior AI Engineer" type="text" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Department</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="Machine Learning" type="text" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Reporting Manager</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="Sarah Chen, VP Eng" type="text" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Start Date</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" type="date" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Annual CTC ($)</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="185000" type="number" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Joining Bonus ($)</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="25000" type="number" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Stock Options (Units)</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="15,000 RSUs" type="text" />
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Offer Validity (Days)</label>
<input className="w-full h-12 bg-bg-elevated border-white/10 rounded-full px-6 focus:ring-primary focus:border-primary" placeholder="7" type="number" />
</div>
</div>
<div className="space-y-1">
<label className="text-label-md text-on-surface-variant ml-2">Additional Benefits</label>
<textarea className="w-full bg-bg-elevated border-white/10 rounded-[1.5rem] p-6 min-h-[100px] focus:ring-primary focus:border-primary" placeholder="Unlimited PTO, Health Insurance, Remote-first setup..."></textarea>
</div>
<div className="flex justify-end pt-4">
<button className="btn-3d-red px-10 h-[50px] rounded-full text-on-primary font-bold flex items-center gap-2" >
                            Review Offer Letter
                            <span className="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</div>
{/*  Info Sidebar  */}
<div className="md:col-span-4 space-y-stack-md">
<div className="glass-card rounded-lg p-stack-md">
<h3 className="font-headline-md text-headline-md mb-2">Compensation Benchmarks</h3>
<p className="text-body-md text-on-surface-variant mb-4">AI suggests this offer is in the 85th percentile for San Francisco.</p>
<div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
<div className="h-full bg-secondary-container w-[85%] shadow-[0_0_10px_rgba(1,98,207,0.5)]"></div>
</div>
<div className="flex justify-between mt-2 text-data-md">
<span>$140k</span>
<span className="text-primary font-bold">$185k (Offer)</span>
<span>$210k</span>
</div>
</div>
<div className="glass-card rounded-lg p-stack-md border-primary/20">
<div className="flex items-center gap-2 text-primary mb-2">
<span className="material-symbols-outlined">auto_awesome</span>
<span className="font-bold">AI Compliance Check</span>
</div>
<p className="text-body-md text-on-surface-variant">Standard clauses for Intellectual Property and Confidentiality are included. Non-compete terms follow state regulations.</p>
</div>
</div>
</div>
</section>
{/*  Step 2: Preview  */}
<section className="hidden" id="step-2-content">
<div className="max-w-4xl mx-auto glass-card rounded-lg p-margin-desktop bg-white relative text-black shadow-2xl">
{/*  Paper texture effect  */}
<div className="absolute inset-0 opacity-5 pointer-events-none" ></div>
<div className="flex justify-between items-start mb-12 relative z-10">
<div>
<div className="text-3xl font-bold tracking-tighter text-red-deep mb-2">HireGo AI</div>
<div className="text-sm uppercase tracking-widest text-gray-500 font-bold">Offer of Employment</div>
</div>
<div className="text-right text-gray-600 text-sm">
<p>Offer Reference: HG-2024-889</p>
<p>Date: October 24, 2024</p>
</div>
</div>
<div className="space-y-6 text-gray-800 relative z-10">
<p className="font-bold">Dear [Candidate Name],</p>
<p>We are thrilled to offer you the position of <span className="font-bold border-b border-gray-300">Senior AI Engineer</span> at HireGo AI. We were impressed with your technical expertise and passion for scaling ethical AI solutions.</p>
<div className="grid grid-cols-2 gap-8 my-8 py-6 border-y border-gray-100">
<div>
<h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Position Details</h4>
<ul className="space-y-1 text-sm">
<li><span className="font-medium">Department:</span> Machine Learning</li>
<li><span className="font-medium">Reporting to:</span> Sarah Chen</li>
<li><span className="font-medium">Start Date:</span> November 15, 2024</li>
</ul>
</div>
<div>
<h4 className="text-xs uppercase text-gray-400 font-bold mb-2">Compensation</h4>
<ul className="space-y-1 text-sm">
<li><span className="font-medium">Base Salary:</span> $185,000 / year</li>
<li><span className="font-medium">Equity:</span> 15,000 RSU Options</li>
<li><span className="font-medium">Joining Bonus:</span> $25,000</li>
</ul>
</div>
</div>
<p>This offer is contingent upon successful completion of standard background checks. This offer remains valid for 7 business days from the date of issuance.</p>
<div className="mt-16 pt-8 border-t border-gray-100">
<div className="flex justify-between items-end">
<div>
<div className="font-display-lg text-lg italic mb-1">James Harrison</div>
<div className="w-48 h-px bg-gray-400 mb-2"></div>
<p className="text-xs font-bold text-gray-500 uppercase">James Harrison, CEO - HireGo AI</p>
</div>
<div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 text-xs flex items-center justify-center w-40 h-24">
                                Candidate Signature Space
                            </div>
</div>
</div>
</div>
</div>
<div className="mt-stack-lg flex justify-center gap-stack-md">
<button className="h-[50px] px-8 rounded-full border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2" >
<span className="material-symbols-outlined">edit</span>
                    Edit Details
                </button>
<button className="btn-3d-red px-10 h-[50px] rounded-full text-on-primary font-bold flex items-center gap-2" >
                    Finalize &amp; Send
                    <span className="material-symbols-outlined">send</span>
</button>
</div>
</section>
{/*  Step 3: Send  */}
<section className="hidden" id="step-3-content">
<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
<div className="md:col-span-7 glass-card rounded-lg p-stack-lg">
<h3 className="font-headline-md text-headline-md mb-stack-md">Delivery Channels</h3>
<div className="space-y-stack-md mb-6">
<label className="flex items-center gap-4 p-4 rounded-lg bg-bg-elevated border border-primary/30 cursor-pointer">
<input defaultChecked className="rounded bg-bg-page border-white/20 text-primary focus:ring-primary" type="checkbox" />
<div className="flex-1">
<p className="font-bold">Email Notification</p>
<p className="text-body-md text-on-surface-variant">Send a secure link with a personalized email body.</p>
</div>
<span className="material-symbols-outlined text-primary">mail</span>
</label>
<label className="flex items-center gap-4 p-4 rounded-lg bg-bg-elevated border border-white/10 cursor-pointer hover:border-green transition-all">
<input className="rounded bg-bg-page border-white/20 text-green focus:ring-green" type="checkbox" />
<div className="flex-1">
<p className="font-bold">WhatsApp Instant Alert</p>
<p className="text-body-md text-on-surface-variant">Send a short magic link via official WhatsApp business API.</p>
</div>
<span className="material-symbols-outlined text-green">chat</span>
</label>
</div>
<div className="space-y-stack-sm">
<label className="text-label-md text-on-surface-variant ml-2">Personal Message (Optional)</label>
<textarea className="w-full bg-bg-elevated border-white/10 rounded-[1.5rem] p-6 min-h-[150px] focus:ring-primary focus:border-primary" placeholder="Hey! We are so excited to have you on board. Looking forward to making history together..."></textarea>
</div>
<div className="mt-stack-lg">
<button className="btn-3d-gold w-full h-[60px] rounded-full text-black font-extrabold text-lg flex items-center justify-center gap-3" id="send-offer-btn" >
<span className="material-symbols-outlined">rocket_launch</span>
                            SEND OFFER NOW
                        </button>
</div>
</div>
<div className="md:col-span-5 space-y-stack-md">
<div className="glass-card rounded-lg p-stack-md opacity-40 grayscale" id="tracking-card">
<h3 className="font-headline-md text-headline-md mb-stack-md">Tracking Timeline</h3>
<div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
<div className="relative">
<div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-high border-2 border-white/20 flex items-center justify-center">
<span className="w-2 h-2 rounded-full bg-white/20"></span>
</div>
<p className="font-bold text-on-surface-variant">Offer Dispatched</p>
<p className="text-label-md text-muted">Pending send</p>
</div>
<div className="relative">
<div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-high border-2 border-white/20 flex items-center justify-center">
<span className="w-2 h-2 rounded-full bg-white/20"></span>
</div>
<p className="font-bold text-on-surface-variant">Viewed by Candidate</p>
<p className="text-label-md text-muted">Awaiting access</p>
</div>
<div className="relative">
<div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-surface-container-high border-2 border-white/20 flex items-center justify-center">
<span className="w-2 h-2 rounded-full bg-white/20"></span>
</div>
<p className="font-bold text-on-surface-variant">Signed &amp; Accepted</p>
<p className="text-label-md text-muted">Final step</p>
</div>
</div>
</div>
<div className="p-6 rounded-lg bg-secondary-container/10 border border-secondary-container/30">
<div className="flex gap-4">
<span className="material-symbols-outlined text-secondary-container">verified_user</span>
<div>
<p className="font-bold text-secondary-container">Blockchain Verified</p>
<p className="text-sm text-on-surface-variant">This offer is cryptographically signed and stored on the private ledger for authenticity.</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  Success Message (Post-Send)  */}
<section className="hidden py-stack-lg flex flex-col items-center text-center" id="success-screen">
<div className="w-24 h-24 rounded-full bg-green/20 flex items-center justify-center mb-6 border-2 border-green shadow-[0_0_30px_rgba(52,168,83,0.4)]">
<span className="material-symbols-outlined text-5xl text-green">check_circle</span>
</div>
<h2 className="font-display-xl text-display-xl mb-4">Offer Sent Successfully!</h2>
<p className="text-body-lg text-on-surface-variant max-w-xl mb-6">We've dispatched the offer to the candidate via Email and WhatsApp. You'll be notified the moment they open the link.</p>
<div className="flex gap-4">
<button className="h-[50px] px-8 rounded-full bg-white/10 hover:bg-white/20 font-bold transition-all" >Go to Dashboard</button>
<button className="btn-3d-blue px-8 h-[50px] rounded-full text-white font-bold">Track Status</button>
</div>
</section>

    </PageContainer>
  );
}
