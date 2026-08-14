"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE32() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      {/*  Header Section  */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-6">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-text-secondary font-label-md">
            <span className="hover:text-primary cursor-pointer">Applications</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary">Alex Rivera</span>
          </nav>
          <h1 className="font-display-lg text-display-lg text-text-primary">Why ranked #1?</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-6 py-2 rounded-full glass-card border-primary/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="font-data-md text-data-md text-primary tracking-wider uppercase">Top 3% of 184 applicants</span>
          </div>
        </div>
      </div>
      {/*  Bento Layout Content  */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/*  Hero Score Card  */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full min-h-[400px]">

            <div className="relative z-10">
              <p className="font-label-md text-label-md text-text-secondary uppercase tracking-[0.2em] mb-4">Overall AI Score</p>
              <span className="font-display-xl text-[120px] leading-none text-primary drop-shadow-[0_0_20px_rgba(255,180,170,0.3)]">94%</span>
              <div className="mt-8 flex flex-col gap-3">
                <p className="font-body-lg text-body-lg text-text-primary max-w-[280px] mx-auto">Highly Exceptional Candidate for Senior Product Engineer role.</p>
                <p className="font-data-md text-data-md text-text-muted">Calculated across 42 distinct data points.</p>
              </div>
            </div>
            {/*  Abstract AI Visual  */}
            <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
        </div>
        {/*  Reasoning Bars & AI Analysis  */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card rounded-lg p-6 flex flex-col gap-6">
            {/*  Reasoning Bar: Skills Match  */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-[20px] text-text-primary">Skills Match</span>
                <span className="font-data-lg text-data-lg text-primary">98%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary progress-bar-glow rounded-full" style={{ width: '98%' }}></div>
              </div>
              <p className="font-body-md text-body-md text-text-secondary mt-1">
                Expert-level proficiency in React, TypeScript, and Rust. Alex's technical assessment placed them in the 99th percentile for system architecture and performance optimization.
              </p>
            </div>
            {/*  Reasoning Bar: Experience  */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-[20px] text-text-primary">Experience</span>
                <span className="font-data-lg text-data-lg text-primary">92%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary progress-bar-glow rounded-full" style={{ width: '92%' }}></div>
              </div>
              <p className="font-body-md text-body-md text-text-secondary mt-1">
                8+ years at high-growth tech firms. Direct experience leading engineering teams during Series B transitions perfectly mirrors HireGo's current organizational trajectory.
              </p>
            </div>
            {/*  Reasoning Bar: Assessment Scores  */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-[20px] text-text-primary">Assessment Scores</span>
                <span className="font-data-lg text-data-lg text-primary">95%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary progress-bar-glow rounded-full" style={{ width: '95%' }}></div>
              </div>
              <p className="font-body-md text-body-md text-text-secondary mt-1">
                Consistent 'Platinum' status across algorithmic logic, live coding, and proctored technical interviews. Demonstrated zero anomalies during the 3-hour skill verification.
              </p>
            </div>
            {/*  Reasoning Bar: Communication  */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-[20px] text-text-primary">Communication</span>
                <span className="font-data-lg text-data-lg text-primary">89%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary progress-bar-glow rounded-full" style={{ width: '89%' }}></div>
              </div>
              <p className="font-body-md text-body-md text-text-secondary mt-1">
                Natural clarity in technical explanations. Video analysis suggests strong empathy and active listening skills, essential for cross-functional collaboration.
              </p>
            </div>
            {/*  Reasoning Bar: Cultural Fit  */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-[20px] text-text-primary">Cultural Fit</span>
                <span className="font-data-lg text-data-lg text-primary">91%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary progress-bar-glow rounded-full" style={{ width: '91%' }}></div>
              </div>
              <p className="font-body-md text-body-md text-text-secondary mt-1">
                Core values alignment regarding "Speed as a Feature" and "Radical Transparency". Psychometric profiling indicates a high degree of adaptability.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/*  Action Area  */}
      <div className="mt-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 glass-card rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full glass-card border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-text-primary">HireGo Recommendation</h3>
              <p className="font-body-md text-body-md text-text-secondary">AI recommends immediate advancement to final stakeholder interview.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none h-[50px] px-8 rounded-full bg-[#1E1E1E] border border-white/10 text-white font-label-md text-label-md hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">visibility</span>
              View Full Profile
            </button>
            <button className="flex-1 md:flex-none h-[50px] px-8 rounded-full btn-primary-blue text-white font-label-md text-label-md flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">calendar_today</span>
              Schedule Interview
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
