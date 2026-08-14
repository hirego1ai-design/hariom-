"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE54() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Mandatory Warning Banner  */}
<div className="bg-error-container text-on-error-container py-3  flex items-center justify-center gap-3 sticky top-[64px] z-40 shadow-lg border-b border-error/20">
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
<span className="font-bold tracking-wide">YOU MUST SUBMIT FEEDBACK TO PROCEED</span>
</div>
<div className="max-w-4xl mx-auto px-margin-mobile md: py-stack-lg">
{/*  Header Section  */}
<div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 className="font-display-lg text-display-lg text-text-primary mb-2">Interview Feedback</h1>
<div className="flex items-center gap-4 text-text-secondary">
<div className="flex items-center gap-2">
<img className="w-10 h-10 rounded-full border border-white/10" data-alt="Professional studio headshot of a female candidate, software engineer aesthetic, neutral background, sharp focus, vibrant yet professional lighting, high-end commercial photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQLGMSb6FyDXN1Xe10vKcMO-dp7310mdnhexJ-o42KCCUQY4U-Doybq00GF6kERh22MNkQqYLfbSdIhJjEWgi2lAwLhmzozjU8MhjteRJSuM1FSssPl-7CSP-88e2sJcTbFgpEDdegQYWVzAuKTKZ-IOS_Cw28qo1N5HXx28w4CoYwQ_1kFfHgVzO2GYLNbuoQ5M5zXl5fndytUg9kBpqBeTx3wxnaDPuCIJ1vF5oSX2-jDMTIRkWIvlZrLQP8Yrh6s5a5mgAJ4Hk" />
<div>
<p className="font-bold text-text-primary leading-none">Sarah Jenkins</p>
<p className="text-xs">Senior Frontend Engineer Role</p>
</div>
</div>
<div className="h-8 w-[1px] bg-white/10"></div>
<div>
<p className="text-xs uppercase tracking-tighter opacity-60">Session ID</p>
<p className="font-data-md text-sm">INT-8842-SJ</p>
</div>
</div>
</div>
<div className="flex gap-2">
<span className="status-pill px-3 py-1 rounded-full text-xs font-medium text-text-secondary">L4 Interview</span>
<span className="status-pill px-3 py-1 rounded-full text-xs font-medium text-text-secondary">Technical Round</span>
</div>
</div>
<form className="space-y-6" id="feedbackForm">
{/*  Overall Rating Section  */}
<section className="glass-card p-stack-md rounded-xl">
<h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
<span className="material-symbols-outlined text-primary">analytics</span>
                        Overall Rating
                    </h3>
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
<div>
<input className="hidden radio-card" id="rating_sh" name="overall_rating" required type="radio" />
<label className="flex flex-col items-center justify-center p-4 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center h-full" htmlFor="rating_sh">
<span className="material-symbols-outlined text-green mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
<span className="font-bold text-sm block">Strong Hire</span>
</label>
</div>
<div>
<input className="hidden radio-card" id="rating_h" name="overall_rating" type="radio" />
<label className="flex flex-col items-center justify-center p-4 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center h-full" htmlFor="rating_h">
<span className="material-symbols-outlined text-primary mb-2">thumb_up</span>
<span className="font-bold text-sm block">Hire</span>
</label>
</div>
<div>
<input className="hidden radio-card" id="rating_n" name="overall_rating" type="radio" />
<label className="flex flex-col items-center justify-center p-4 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center h-full" htmlFor="rating_n">
<span className="material-symbols-outlined text-text-muted mb-2">drag_handle</span>
<span className="font-bold text-sm block">Neutral</span>
</label>
</div>
<div>
<input className="hidden radio-card" id="rating_nh" name="overall_rating" type="radio" />
<label className="flex flex-col items-center justify-center p-4 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center h-full" htmlFor="rating_nh">
<span className="material-symbols-outlined text-yellow mb-2">thumb_down</span>
<span className="font-bold text-sm block">No Hire</span>
</label>
</div>
<div>
<input className="hidden radio-card" id="rating_snh" name="overall_rating" type="radio" />
<label className="flex flex-col items-center justify-center p-4 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center h-full" htmlFor="rating_snh">
<span className="material-symbols-outlined text-red-light mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>dangerous</span>
<span className="font-bold text-sm block">Strong No</span>
</label>
</div>
</div>
</section>
{/*  Category Sliders Section  */}
<section className="glass-card p-stack-md rounded-xl">
<h3 className="font-headline-md text-headline-md mb-8 flex items-center gap-2">
<span className="material-symbols-outlined text-primary">tune</span>
                        Core Competencies
                    </h3>
<div className="space-y-10">
{/*  Communication  */}
<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-bold text-text-primary">Communication</label>
<span className="font-data-md text-primary bg-primary/10 px-2 rounded" id="val_comm">5</span>
</div>
<input className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer custom-slider" max="10" min="1" onInput={() => {}} type="range" value="5" />
<div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
<span>Poor</span>
<span>Expert</span>
</div>
</div>
{/*  Tech Proficiency  */}
<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-bold text-text-primary">Technical Proficiency</label>
<span className="font-data-md text-primary bg-primary/10 px-2 rounded" id="val_tech">5</span>
</div>
<input className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer custom-slider" max="10" min="1" onInput={() => {}} type="range" value="5" />
<div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
<span>Junior</span>
<span>Principal</span>
</div>
</div>
{/*  Fit  */}
<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-bold text-text-primary">Culture Fit</label>
<span className="font-data-md text-primary bg-primary/10 px-2 rounded" id="val_fit">5</span>
</div>
<input className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer custom-slider" max="10" min="1" onInput={() => {}} type="range" value="5" />
<div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
<span>Clash</span>
<span>Synergistic</span>
</div>
</div>
{/*  Problem Solving  */}
<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-bold text-text-primary">Problem Solving</label>
<span className="font-data-md text-primary bg-primary/10 px-2 rounded" id="val_prob">5</span>
</div>
<input className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer custom-slider" max="10" min="1" onInput={() => {}} type="range" value="5" />
<div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
<span>Reactive</span>
<span>Visionary</span>
</div>
</div>
{/*  Enthusiasm  */}
<div className="space-y-2">
<div className="flex justify-between items-center">
<label className="font-bold text-text-primary">Enthusiasm</label>
<span className="font-data-md text-primary bg-primary/10 px-2 rounded" id="val_ent">5</span>
</div>
<input className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer custom-slider" max="10" min="1" onInput={() => {}} type="range" value="5" />
<div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
<span>Passive</span>
<span>Driven</span>
</div>
</div>
</div>
</section>
{/*  Written Feedback Section  */}
<div className="grid md:grid-cols-2 gap-stack-md">
<div className="glass-card p-stack-md rounded-xl relative group">
<h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
<span className="material-symbols-outlined text-green">add_task</span>
                            Key Strengths
                        </h3>
<textarea className="w-full h-40 bg-surface-container-lowest border border-white/10 rounded-lg p-4 focus:outline-none focus:border-primary/50 text-sm" id="strengths" minLength={50} placeholder="Detailed strengths observed during the interview (min 50 chars)..." required></textarea>
<div className="absolute bottom-6 right-8 text-[10px] text-text-muted font-data-md">
<span id="strengths-count">0</span> / 50 min
                        </div>
</div>
<div className="glass-card p-stack-md rounded-xl relative group">
<h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
<span className="material-symbols-outlined text-yellow">edit_document</span>
                            Areas to Improve
                        </h3>
<textarea className="w-full h-40 bg-surface-container-lowest border border-white/10 rounded-lg p-4 focus:outline-none focus:border-primary/50 text-sm" id="improve" minLength={50} placeholder="Development areas or knowledge gaps identified (min 50 chars)..." required></textarea>
<div className="absolute bottom-6 right-8 text-[10px] text-text-muted font-data-md">
<span id="improve-count">0</span> / 50 min
                        </div>
</div>
</div>
{/*  Red Flags Checkboxes  */}
<section className="glass-card p-stack-md rounded-xl">
<h3 className="font-bold text-red-light mb-4 flex items-center gap-2">
<span className="material-symbols-outlined">flag</span>
                        Red Flags (Optional)
                    </h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
<input className="rounded border-white/20 bg-transparent text-red-light focus:ring-red-light" type="checkbox" />
<span className="text-sm">Inconsistent technical answers</span>
</label>
<label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
<input className="rounded border-white/20 bg-transparent text-red-light focus:ring-red-light" type="checkbox" />
<span className="text-sm">Poor communication/Language barrier</span>
</label>
<label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
<input className="rounded border-white/20 bg-transparent text-red-light focus:ring-red-light" type="checkbox" />
<span className="text-sm">Attitude / Arrogance</span>
</label>
<label className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
<input className="rounded border-white/20 bg-transparent text-red-light focus:ring-red-light" type="checkbox" />
<span className="text-sm">Lack of research on company</span>
</label>
</div>
</section>
{/*  Final Recommendation Section  */}
<section className="glass-card p-stack-md rounded-xl border-t-4 border-t-primary">
<h3 className="font-headline-md text-headline-md mb-6">Final Recommendation</h3>
<div className="flex flex-wrap gap-4">
<div className="flex-1 min-w-[150px]">
<input className="hidden radio-card" id="rec_proceed" name="recommendation" required type="radio" />
<label className="flex flex-col items-center p-6 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center" htmlFor="rec_proceed">
<span className="material-symbols-outlined text-green text-3xl mb-2">check_circle</span>
<span className="font-bold">Proceed</span>
</label>
</div>
<div className="flex-1 min-w-[150px]">
<input className="hidden radio-card" id="rec_onhold" name="recommendation" type="radio" />
<label className="flex flex-col items-center p-6 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center" htmlFor="rec_onhold">
<span className="material-symbols-outlined text-yellow text-3xl mb-2">pause_circle</span>
<span className="font-bold">On Hold</span>
</label>
</div>
<div className="flex-1 min-w-[150px]">
<input className="hidden radio-card" id="rec_reject" name="recommendation" type="radio" />
<label className="flex flex-col items-center p-6 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-all text-center" htmlFor="rec_reject">
<span className="material-symbols-outlined text-red-light text-3xl mb-2">cancel</span>
<span className="font-bold">Reject</span>
</label>
</div>
</div>
</section>
{/*  Footer / Action Area  */}
<div className="flex items-center justify-between py-stack-lg border-t border-white/10">
<p className="text-text-muted text-xs flex items-center gap-2">
<span className="material-symbols-outlined text-[14px]">lock</span>
                        Feedback is visible only to the hiring panel.
                    </p>
<button className="btn-3d-red h-[50px] px-10 rounded-full font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2" disabled id="submitBtn" type="submit">
                        Submit Feedback
                        <span className="material-symbols-outlined text-[20px]">send</span>
</button>
</div>
</form>
</div>

    </PageContainer>
  );
}
