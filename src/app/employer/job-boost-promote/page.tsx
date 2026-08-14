"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE13() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      <header className="mb-10 max-w-2xl">
        <nav className="flex items-center gap-2 text-text-secondary mb-4">
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/dashboard">Dashboard</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/hiring-pipeline">Talent</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="/employer/upcoming-interviews-list">Interviews</a>
        </nav>
        <h1 className="font-display-lg text-display-lg text-on-surface mb-2">Boost Your Reach</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Maximize exposure for your "Senior Product Designer" role. Get the best talent faster with AI-powered candidate matching and priority placement.</p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/*  7 Days Boost  */}
        <div className="glass-card glass-card-hover p-8 rounded-lg flex flex-col items-center text-center relative group cursor-pointer border-transparent">
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-white/10 flex items-center justify-center transition-colors" id="check-basic">
            <span className="material-symbols-outlined text-[16px] text-transparent">check</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] text-primary">bolt</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">7 Days</h3>
          <p className="font-data-lg text-data-lg text-primary mb-6">$49.00</p>
          <div className="w-full h-px bg-white/5 mb-6"></div>
          <ul className="space-y-4 text-left w-full mb-8">
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Top of Search for 1 week</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Featured Badge</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">2x Visibility Increase</span>
            </li>
          </ul>
        </div>
        {/*  14 Days Boost (Recommended)  */}
        <div className="glass-card glass-card-hover p-8 rounded-lg flex flex-col items-center text-center relative group cursor-pointer border-primary/40 ring-1 ring-primary/30">
          <div className="absolute -top-3 px-4 py-1 bg-primary text-on-primary rounded-full font-label-md text-[12px] font-bold uppercase tracking-widest shadow-lg">Most Popular</div>
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center" id="check-pro">
            <span className="material-symbols-outlined text-[16px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(197,34,31,0.3)]">
            <span className="material-symbols-outlined text-[32px] text-on-primary-container">rocket</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">14 Days</h3>
          <p className="font-data-lg text-data-lg text-primary mb-6">$89.00</p>
          <div className="w-full h-px bg-white/5 mb-6"></div>
          <ul className="space-y-4 text-left w-full mb-8">
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Top of Search for 2 weeks</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Featured Badge (Gold)</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">3x Visibility Increase</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">AI Active Candidate Alert</span>
            </li>
          </ul>
        </div>
        {/*  30 Days Boost  */}
        <div className="glass-card glass-card-hover p-8 rounded-lg flex flex-col items-center text-center relative group cursor-pointer border-transparent">
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-white/10 flex items-center justify-center transition-colors" id="check-elite">
            <span className="material-symbols-outlined text-[16px] text-transparent">check</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] text-primary">diamond</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">30 Days</h3>
          <p className="font-data-lg text-data-lg text-primary mb-6">$149.00</p>
          <div className="w-full h-px bg-white/5 mb-6"></div>
          <ul className="space-y-4 text-left w-full mb-8">
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Top of Search for full month</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Featured Badge (Premium)</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">5x Visibility Increase</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-green text-[20px]">check_circle</span>
              <span className="font-label-md text-label-md">Home Page Spotlight</span>
            </li>
          </ul>
        </div>
      </section>
      <section className="max-w-4xl mx-auto glass-card p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h4 className="font-headline-md text-[24px] text-on-surface mb-2">Order Summary</h4>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-yellow">payments</span>
            </div>
            <div>
              <p className="font-body-md text-on-surface font-bold" id="summary-text">14 Days Visibility Boost</p>
              <p className="text-[12px] text-on-surface-variant">Includes AI Matching and Featured Badge</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <span className="font-label-md text-on-surface-variant">Total Amount:</span>
            <span className="font-display-lg text-primary text-[32px]" id="summary-price">$89.00</span>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <button className="gold-button w-full md:w-[280px] h-[50px] rounded-full text-surface-container-lowest font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
            <span className="material-symbols-outlined">verified_user</span>
            Confirm and Pay
          </button>
          <p className="text-[11px] text-center text-on-surface-variant mt-4 opacity-60">Secure payment via HireGo AI Enterprise</p>
        </div>
      </section>
      {/*  Aesthetic Bento Addition  */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
        <div className="md:col-span-2 glass-card p-6 rounded-lg relative overflow-hidden group">
          <div className="relative z-10">
            <h5 className="font-label-md text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              AI Engine Priority
            </h5>
            <p className="text-on-surface-variant text-sm">Boosted jobs are automatically indexed by our neural matching engine, putting your role in front of passive candidates who fit 98% of your requirements.</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-lg">
          <h5 className="font-label-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Real-time Tracking
          </h5>
          <p className="text-on-surface-variant text-sm">Watch your impression count grow in the live dashboard once the boost is active.</p>
        </div>
        <div className="glass-card p-6 rounded-lg">
          <h5 className="font-label-md text-primary mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            Concierge Support
          </h5>
          <p className="text-on-surface-variant text-sm">Elite plan members receive a dedicated account manager for hiring.</p>
        </div>
      </section>
    </PageContainer>
  );
}
