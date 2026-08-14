"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

import { useRouter } from "next/navigation";

export default function EmployerPageE56() {
  const router = useRouter();
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

<div className="container-max w-full flex flex-col md:flex-row items-center justify-between gap-6 py-stack-lg">
{/*  Left Column: Illustration & Visuals  */}
<div className="w-full md:w-1/2 flex flex-col items-center justify-center relative">
{/*  Background decorative elements  */}
<div className="absolute w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full"></div>
{/*  Main Rocket Illustration  */}
<div className="relative rocket-float z-20">
<img className="w-full max-w-[480px] object-contain drop-shadow-[0_20px_50px_rgba(229,57,53,0.3)]" data-alt="A sophisticated, high-fidelity 3D rocket illustration designed in a tech-noir aesthetic. The rocket body features brushed dark titanium textures with glowing red neon pulse lines along its aerodynamic fins. It is ascending through a field of translucent glass-morphism geometric shapes and subtle particles. The lighting is dramatic, with a strong red bottom-glow simulating thruster ignition against a deep space dark background, consistent with a premium AI-native enterprise platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAivSjfQMI3fmMN0JvR-cPTnuxSUF9_5sRhgG-p5wHq-qsGOE3MT9HaUtoJM4i2p6GYrfwRZPyTpDoRSpDkARSErsP8ctyv5q7QtqkCCvTeC4NgF1w6kcfr_h6t1DSMSd5hqnxCU6T1to8GubPCvvKPVf8T9eC2cVmyouM0J-z-lulBhu5MeGkVZfAvuLd_ewN_JmerftDzcbXLS-7Tri6PjrQCxlBryMwv2pO8p0aUSrlkIo01U46Kez6GrdbFTA0oWd9MuMpx_DE" />
</div>
{/*  Floating UI Indicators  */}
<div className="absolute top-0 right-0 glass-card px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
<div className="w-2 h-2 rounded-full bg-green"></div>
<span className="font-label-md text-label-md text-on-surface">AI Engine Active</span>
</div>
</div>
{/*  Right Column: Welcome Content  */}
<div className="w-full md:w-1/2 flex flex-col gap-stack-lg text-center md:text-left items-center md:items-start">
<div className="flex flex-col gap-stack-sm">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border-primary/20 w-fit">
<span className="w-1.5 h-1.5 rounded-full bg-red-light"></span>
<span className="font-label-md text-label-md uppercase tracking-widest text-primary">Onboarding Phase 1</span>
</div>
<h1 className="font-display-xl text-display-xl leading-tight">
                        Smart hiring <br />
<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-light to-red-deep">starts here.</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-[480px]">
                        Welcome to HireGo AI. We've redesigned the recruitment funnel using autonomous agents to help you find top-tier talent in record time.
                    </p>
</div>
{/*  Action Area  */}
<div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
<button onClick={() => router.push("/employer/employer-registration-company-info")} className="btn-primary-red h-[50px] px-10 rounded-full font-label-md text-label-md text-white flex items-center justify-center gap-3 group w-full sm:w-auto">
                        Show Me How
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
<button onClick={() => router.push("/employer/employer-sign-in")} className="h-[50px] px-8 rounded-full bg-surface-container-low border border-white/10 hover:bg-white/5 transition-all font-label-md text-label-md text-on-surface w-full sm:w-auto">
                        Skip Tour
                    </button>
</div>
{/*  Social Proof / Context  */}
<div className="pt-stack-lg border-t border-white/5 flex flex-col gap-stack-md w-full">
<p className="font-label-md text-label-md text-text-muted">TRUSTED BY INNOVATIVE TEAMS</p>
<div className="flex flex-wrap gap-8 opacity-40 grayscale contrast-125">
<img className="h-6" data-alt="A minimalist logo for a fictional tech company named 'Nebula Systems', styled in clean white lines for dark mode UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtM2gIHVFiHK41RerJCmM3z7EjpZ9eU2lffZlLQToF7DW9e08n7pfy35D6vhhyCitVXCPdTV22SGMXNQX4A9dvvY7aqzQGJHNidSMvuwpjJZatpfG2Z1QHJ4py70jh-jJlGv1MN0O67lXnNamIzpaIvrMcIFGieRUjK-acxm4let4wJuOWYk-3KgdokKhbo-BUnXprHAmH3d7LPIISg50MeC6q0b4R3Dci9b3-mUFHH2QAkULuIBiB11OM9GJhHVrx8fqaam7bT3s" />
<img className="h-6" data-alt="A minimalist logo for a fictional tech company named 'Vector Lab', styled in clean white lines for dark mode UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSD0f2D8Zr_eV62LzkFjxtJmzDuPt8Bc-XAsDBATnB1x9QYRAgAdDzxglOh4aPy2d8_qSgWI3DAfrbsuj2m52mpi8gmOFrEdESmsivGdfj5ynkxmxXRW-MfSgv6Ju_gCU76DzMS1WSgGzepyKhNVKLD0Kjam0MS5lhpmfFrrxkfpV6SSNETUPx86BJT9MIueUlRkXWdEdHihuwNTECuIGvZwLD0as_Pa-atdrCU1DkpgqgCrdplNVJR9GSMyE4NbgLAtZeYk0q7-g" />
<img className="h-6" data-alt="A minimalist logo for a fictional tech company named 'Aether AI', styled in clean white lines for dark mode UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXp7WGPTHyDrnKprb8xU0wYVNYmeyO3EVfVf3egB_YnEjesweqW9Hhotwvsucn2t3sIdiVNm_AslOFBgkMbDHDZOwIRBiC-t02wqUXhBe7gUS-CmyXhFrYQxS3EAfGvah9xjO1npq1Ioh7ZUr2BYsRU4af_TmoG7MpILU23NJMWtuNpyHI-hgDH1Z7qO4ZlmeaqhyxcTYp-NDHiopRGOnFcIMw3ZnjtMIRZD_mOkcn3xSMEjVtLvaD6B5O_aIpLxQf9SsnNz6RgSY" />
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
