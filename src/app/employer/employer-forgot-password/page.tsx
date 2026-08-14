"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE66() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Logo/Brand Anchor  */}
<div className="flex flex-col items-center gap-stack-sm mb-4">
<h1 className="font-display-lg text-display-lg text-primary tracking-tight">HireGo AI</h1>
<div className="h-1 w-12 bg-primary-container rounded-full"></div>
</div>
{/*  Glassmorphism Container  */}
<section className="glass-card rounded-lg p-stack-lg flex flex-col gap-stack-md">
<div className="text-center flex flex-col gap-2">
<h2 className="font-headline-md text-headline-md text-on-surface">Forgot Password</h2>
<p className="font-body-md text-on-surface-variant">Enter your employer email address and we'll send you a link to reset your password.</p>
</div>
{/*  Forgot Password Form  */}
<form className="flex flex-col gap-stack-md mt-4" id="forgot-password-form" onSubmit={(e) => e.preventDefault()}>
<div className="flex flex-col gap-2">
<label className="font-label-md text-label-md text-on-surface-variant ml-4" htmlFor="email">Corporate Email Address</label>
<div className="relative group">
<span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">mail</span>
<input className="custom-input w-full pl-14 font-body-md" id="email" placeholder="name@company.com" required type="email" />
</div>
</div>
<button className="btn-primary-red h-[50px] w-full rounded-full flex items-center justify-center gap-2 font-label-md text-white mt-2 group" id="submit-btn" type="submit">
<span id="btn-text">Send Reset Link</span>
<span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform" id="btn-icon">arrow_forward</span>
</button>
</form>
<div className="flex items-center justify-center gap-2 mt-4">
<span className="text-on-surface-variant text-label-md">Remembered your password?</span>
<a className="text-primary font-label-md hover:underline underline-offset-4 transition-all" href="hirego.ai/employer/login">Sign In</a>
</div>
</section>
{/*  Help Section  */}
<div className="flex items-center justify-center gap-6">
<a className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
<span className="material-symbols-outlined text-[18px]">help</span>
<span className="text-label-md">Support</span>
</a>
<div className="h-4 w-px bg-white/10"></div>
<a className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors" href="#">
<span className="material-symbols-outlined text-[18px]">shield</span>
<span className="text-label-md">Privacy Policy</span>
</a>
</div>

    </PageContainer>
  );
}
