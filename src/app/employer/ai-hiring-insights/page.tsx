"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE48() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      {/*  Insights Dashboard Body  */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display-lg text-display-lg text-text-primary mb-2">AI Hiring Insights</h2>
            <p className="font-body-md text-text-secondary max-w-xl">Deep analysis of your current pipeline and market positioning. Actions are recommended based on real-time candidate behavior and industry benchmarks.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-bg-card px-4 py-2 rounded-lg border border-white/5 flex items-center gap-3">
              <span className="text-label-md text-text-muted">Last sync: 2 mins ago</span>
              <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
            </div>
          </div>
        </div>
        {/*  Bento Style Insights Layout  */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/*  Main Insights Stack (Left 8 Columns)  */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/*  Insight Card 1  */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-l-4 border-l-secondary-container">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-lg text-text-primary">Latency Warning: Screen Lag</h3>
                  <span className="text-data-md text-secondary uppercase tracking-widest text-[10px] bg-secondary/10 px-2 py-0.5 rounded">High Impact</span>
                </div>
                <p className="font-body-md text-text-secondary mb-6">3 candidates in screening have not been reviewed for 5+ days. Data suggests a 45% increase in churn risk if left unaddressed for another 48 hours.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary-red px-8 h-[50px] rounded-full text-white font-bold text-sm">Review Now</button>
                  <button className="btn-ghost px-8 h-[50px] rounded-full text-text-secondary font-medium hover:bg-white/5 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
            {/*  Insight Card 2  */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-l-4 border-l-secondary-container">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>trending_down</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-lg text-text-primary">Market Misalignment</h3>
                  <span className="text-data-md text-secondary uppercase tracking-widest text-[10px] bg-secondary/10 px-2 py-0.5 rounded">Critical</span>
                </div>
                <p className="font-body-md text-text-secondary mb-6">Offer acceptance dropped—salary may be below market. Competitive analysis shows the average offer for Senior Devs in your region is 12% higher.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary-red px-8 h-[50px] rounded-full text-white font-bold text-sm">Update Salary Band</button>
                  <button className="btn-ghost px-8 h-[50px] rounded-full text-text-secondary font-medium hover:bg-white/5 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
            {/*  Insight Card 3  */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-l-4 border-l-secondary-container">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_3</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-lg text-text-primary">Diversity Pipeline Weakness</h3>
                  <span className="text-data-md text-secondary uppercase tracking-widest text-[10px] bg-secondary/10 px-2 py-0.5 rounded">Opportunity</span>
                </div>
                <p className="font-body-md text-text-secondary mb-6">Top-of-funnel reach for underrepresented groups is down by 22%. AI suggests expanding your outreach to 'Women in Tech' networks and specified communities.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary-red px-8 h-[50px] rounded-full text-white font-bold text-sm">Boost Outreach</button>
                  <button className="btn-ghost px-8 h-[50px] rounded-full text-text-secondary font-medium hover:bg-white/5 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
            {/*  Insight Card 4  */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-l-4 border-l-secondary-container">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-lg text-text-primary">Unconscious Bias Detected</h3>
                  <span className="text-data-md text-secondary uppercase tracking-widest text-[10px] bg-secondary/10 px-2 py-0.5 rounded">Alert</span>
                </div>
                <p className="font-body-md text-text-secondary mb-6">Screening patterns for 'UI Designer' roles show a preference for specific university backgrounds. AI recommends enabling Blind Screening mode for the next 20 applicants.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary-red px-8 h-[50px] rounded-full text-white font-bold text-sm">Enable Blind Screening</button>
                  <button className="btn-ghost px-8 h-[50px] rounded-full text-text-secondary font-medium hover:bg-white/5 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
            {/*  Insight Card 5  */}
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 border-l-4 border-l-secondary-container">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary-container/10 flex items-center justify-center text-secondary-container">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-md text-lg text-text-primary">Competitor Speed Alert</h3>
                  <span className="text-data-md text-secondary uppercase tracking-widest text-[10px] bg-secondary/10 px-2 py-0.5 rounded">Strategic</span>
                </div>
                <p className="font-body-md text-text-secondary mb-6">Market rivals are concluding the hiring cycle in 12 days, compared to your 18 days. You are losing top 10% talent to faster decision-makers.</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn-primary-red px-8 h-[50px] rounded-full text-white font-bold text-sm">Shorten Cycle</button>
                  <button className="btn-ghost px-8 h-[50px] rounded-full text-text-secondary font-medium hover:bg-white/5 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
          {/*  Sidebar Stats (Right 4 Columns)  */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/*  AI Health Monitor  */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[120px]" data-icon="hub">hub</span>
              </div>
              <h4 className="font-headline-md text-sm text-secondary uppercase tracking-widest mb-6">Pipeline Health</h4>
              <div className="flex items-end justify-between mb-2">
                <span className="font-display-xl text-5xl text-text-primary">84%</span>
                <span className="font-data-md text-green mb-2">+4.2%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full mb-6">
                <div className="h-full bg-secondary-container rounded-full" style={{ width: '84%' }}></div>
              </div>
              <p className="font-body-md text-text-muted text-sm italic">Overall hiring efficiency is above average for your industry sector.</p>
            </div>
            {/*  Secondary Info Card  */}
            <div className="glass-card rounded-2xl p-6 border-t-2 border-t-gold-payment/20">
              <div className="flex items-center gap-3 mb-4 text-gold-payment">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <h4 className="font-headline-md text-sm uppercase tracking-widest">Premium Insights</h4>
              </div>
              <p className="font-body-md text-text-secondary text-sm mb-6">You've unlocked 'Competitor Intelligence' for this month. Explore how others are pricing talent.</p>
              <button className="w-full h-12 rounded-full border border-gold-payment/30 text-gold-payment font-bold hover:bg-gold-payment/10 transition-all">
                View Market Map
              </button>
            </div>
            {/*  Mini Chart Area  */}
            <div className="glass-card rounded-2xl p-6">
              <h4 className="font-headline-md text-sm text-text-primary mb-4">Talent Availability</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="font-label-md flex-1">Engineering</span>
                  <span className="font-data-md text-text-muted">Low</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-label-md flex-1">Marketing</span>
                  <span className="font-data-md text-text-muted">High</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold-payment"></div>
                  <span className="font-label-md flex-1">Leadership</span>
                  <span className="font-data-md text-text-muted">Scarse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
