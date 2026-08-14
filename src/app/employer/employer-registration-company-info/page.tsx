"use client";
import React, { useState } from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";
import { useRouter } from "next/navigation";

export default function EmployerCompanyInfoPage() {
  const router = useRouter();
  const [companySize, setCompanySize] = useState("11-50");

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="w-full max-w-[1050px] mx-auto grid grid-cols-1 lg:grid-cols-12 glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10 my-auto ml-[116px] lg:ml-auto">
        {/* Left Side: Visual & Progress */}
        <section className="hidden md:flex md:col-span-5 lg:col-span-4 bg-surface-container-low/40 border-r border-white/10 flex-col p-6 lg:p-8 justify-between relative">
          {/* Brand Logo */}
          <div className="relative z-10">
            <span className="font-display-lg text-headline-sm text-primary tracking-tight font-bold">
              HireGo AI
            </span>
          </div>

          {/* Illustration Area */}
          <div className="relative flex-grow flex items-center justify-center my-4">
            <div className="relative w-full max-w-[200px] aspect-square">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-75 animate-pulse" />
              <img
                className="relative z-10 w-full h-full object-contain"
                alt="3D Corporate Headquarters Graphic"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsxYV2aREJbeHmmorT35Kdd3Eyo3rEUnfqu8PxRQPv0VH8ujIhTLUb8DQRPXGOCON7Jwd8NgixwTtLgaXkPhyMiUFjnUPR_Xt_UFZkAUA7_YcFL6ppfQidkwR4fvvv_DpkvKSi9rWtHPc786GaIniskb5aoPGXRxexpW3BRhU7rhLu9tuFb_g8rJnv2P6R85J5SHixzoAHz333EDBu_GZ0tXCx7VDmUODACmisj7nxoRoR4uwDrQ6YZyGkmWBNnnOoeY6KghM9vyE"
              />
            </div>
          </div>

          {/* 4-Step Progress Tracker */}
          <div className="relative z-10 space-y-3 pl-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                1
              </div>
              <div>
                <p className="font-label-md text-[10px] text-primary uppercase font-bold">
                  Step 1
                </p>
                <p className="font-body-md text-xs text-text-primary font-bold">
                  Company Profile
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                2
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 2
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  KYB Document Verification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                3
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 3
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Identity OTP Check
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                4
              </div>
              <div>
                <p className="font-label-md text-[10px] text-text-secondary uppercase">
                  Step 4
                </p>
                <p className="font-body-md text-xs text-text-secondary">
                  Business Model & Plan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="col-span-1 md:col-span-7 lg:col-span-8 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-[560px]">
            {/* Header */}
            <div className="mb-5">
              <h1 className="font-display-xl text-headline-md text-primary mb-1">
                Create Employer Account
              </h1>
              <p className="font-body-lg text-xs text-text-secondary">
                Start hiring elite talent with AI-driven precision.
              </p>
            </div>

            {/* Form */}
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                router.push("/employer/employer-registration-document-verification");
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Company Name *
                  </label>
                  <input
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="Acme Corp"
                    type="text"
                    required
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Work Email *
                  </label>
                  <input
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="name@company.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              {/* Industry Select */}
              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Industry *
                </label>
                <div className="relative">
                  <select className="input-pill w-full h-11 text-xs text-text-primary px-4 appearance-none cursor-pointer">
                    <option value="tech">Technology & Software</option>
                    <option value="fintech">Finance & Fintech</option>
                    <option value="health">Healthcare</option>
                    <option value="auto">Automotive</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Company Size Pills */}
              <div className="space-y-1">
                <label className="font-label-md text-xs text-on-surface-variant ml-2">
                  Company Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {["1-10", "11-50", "51-200", "201-500", "500+"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      className={`h-9 px-4 rounded-xl text-xs font-medium border transition-all ${
                        companySize === size
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white/5 text-on-surface-variant border-white/10 hover:bg-primary/20"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Password *
                  </label>
                  <input
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface-variant ml-2">
                    Confirm Password *
                  </label>
                  <input
                    className="input-pill w-full h-11 text-xs text-text-primary px-4"
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  className="btn-3d-red w-full h-12 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-2 group"
                  type="submit"
                >
                  <span>Continue to Document Verification</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>

              {/* Secondary Options */}
              <p className="text-center font-body-md text-xs text-text-secondary mt-3">
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/employer/employer-sign-in")}
                  className="text-primary hover:underline font-bold cursor-pointer"
                >
                  Sign In
                </span>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}