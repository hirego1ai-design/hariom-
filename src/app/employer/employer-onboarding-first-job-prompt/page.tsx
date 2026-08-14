"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

import { useRouter } from "next/navigation";

export default function EmployerPageE71() {
  const router = useRouter();
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className="container-max w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
{/*  Left Column: Rocket Imagery  */}
<div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
<div className="relative w-full max-w-[400px] lg:max-w-none aspect-square rocket-launchpad flex items-center justify-center">
{/*  Background Glow  */}
<div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
{/*  Rocket Illustration Component  */}
<div className="relative z-10 w-full h-full flex items-center justify-center p-8">
<div className="w-full h-full glass-card rounded-[4rem] overflow-hidden relative group">
<img className="w-full h-full object-cover" data-alt="A cinematic 3D render of a sleek, futuristic chrome rocket ship standing vertically on a dark high-tech launchpad. The setting is a atmospheric spaceport at dusk with a deep red and blue lighting scheme. Intense orange glowing flames begin to flicker at the base of the rocket, casting a dramatic light against the metallic hull. The style is premium, high-fidelity digital art with sharp details and shallow depth of field." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpaP7hWmPSAFt8G-hYbWXlRS6b7fMU0t2xSzr5_XreaxiTIozF0x3DsOcQtAAtHPPeFS6Gr2-4pDyTXhO_TgNVdvRsduejizs2ehMelmCmmHVwwCXmaW9VS9YAb8gQeuUu3ygk8yH0HzrGMCZh5idlTVIg8wRYYeUfD1Bx1JGIgfuQGn41Is_zjOr4IjWPAnw9KJfJk1sFxau7xJrOkP8Ay7UNaFmzy5BHdE4ctnBE0RK6oAKL866uTw0diVyMVjg8JMKbJehied8" />
{/*  Tactical Overlay  */}
<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
<div className="absolute bottom-8 left-8 right-8">
<div className="bg-surface/60 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-center gap-4">
<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
<span className="material-symbols-outlined text-primary">rocket_launch</span>
</div>
<div>
<p className="font-label-md text-primary">Systems Ready</p>
<p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-data-md">Ignition Sequence Confirmed</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
{/*  Right Column: Content & Flow  */}
<div className="lg:col-span-7 flex flex-col gap-stack-lg order-1 lg:order-2">
<div className="space-y-4">
<span className="inline-block px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-md text-sm">FINAL STEP</span>
<h1 className="font-display-xl text-text-primary">Ready for Lift Off?</h1>
<p className="font-body-lg text-on-surface-variant max-w-xl">
                        Your account is verified and the AI engine is primed. It's time to find your first top-tier talent. Here's exactly how we'll reach them:
                    </p>
</div>
{/*  Step-by-Step Preview Bento  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/*  Card 1  */}
<div className="glass-card p-6 rounded-lg group hover:border-primary/40 transition-all duration-300">
<div className="flex items-start gap-4">
<div className="flex-shrink-0 w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary border border-white/5">
<span className="material-symbols-outlined">edit_note</span>
</div>
<div className="space-y-1">
<h3 className="font-headline-md text-lg text-primary">Post Details</h3>
<p className="text-on-surface-variant text-sm">Tell us who you need. Our AI helps refine your job description for 40% more engagement.</p>
</div>
</div>
</div>
{/*  Card 2  */}
<div className="glass-card p-6 rounded-lg group hover:border-secondary/40 transition-all duration-300">
<div className="flex items-start gap-4">
<div className="flex-shrink-0 w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-secondary border border-white/5">
<span className="material-symbols-outlined">hub</span>
</div>
<div className="space-y-1">
<h3 className="font-headline-md text-lg text-primary">Global Distribution</h3>
<p className="text-on-surface-variant text-sm">We broadcast to 50+ specialized job boards and AI-curated talent pools instantly.</p>
</div>
</div>
</div>
{/*  Card 3  */}
<div className="glass-card p-6 rounded-lg group hover:border-green/40 transition-all duration-300">
<div className="flex items-start gap-4">
<div className="flex-shrink-0 w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-green border border-white/5">
<span className="material-symbols-outlined">fact_check</span>
</div>
<div className="space-y-1">
<h3 className="font-headline-md text-lg text-primary">AI Screening</h3>
<p className="text-on-surface-variant text-sm">Candidates are automatically graded against your requirements. Only the best hit your inbox.</p>
</div>
</div>
</div>
{/*  Card 4  */}
<div className="glass-card p-6 rounded-lg group hover:border-yellow/40 transition-all duration-300">
<div className="flex items-start gap-4">
<div className="flex-shrink-0 w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-yellow border border-white/5">
<span className="material-symbols-outlined">video_chat</span>
</div>
<div className="space-y-1">
<h3 className="font-headline-md text-lg text-primary">Smart Interviews</h3>
<p className="text-on-surface-variant text-sm">Coordinate interviews seamlessly with our integrated scheduling and video suite.</p>
</div>
</div>
</div>
</div>
{/*  CTA Section  */}
<div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
<button onClick={() => router.push("/employer/create-job-basic-info")} className="btn-primary-red w-full sm:w-auto h-[50px] px-10 flex items-center justify-center gap-3 rounded-full font-label-md text-on-primary font-bold group">
                        Post My First Job
                        <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
</button>
<button className="btn-ghost w-full sm:w-auto h-[50px] px-8 flex items-center justify-center rounded-full font-label-md text-on-surface-variant hover:text-primary transition-colors">
                        View Demo Posting
                    </button>
</div>
<div className="flex items-center gap-3 text-on-surface-variant/60 text-sm">
<span className="material-symbols-outlined text-lg">verified_user</span>
<span>No credit card required for your first 3 days of distribution.</span>
</div>
</div>
</div>

    </PageContainer>
  );
}
