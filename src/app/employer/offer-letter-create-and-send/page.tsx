"use client";
import React from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

export default function EmployerPageE14() {
  return (
    <PageContainer>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-[#121215] border border-white/10 rounded-2xl max-w-2xl mx-auto my-12">
        <span className="material-symbols-outlined text-yellow text-5xl animate-pulse mb-4">construction</span>
        <h1 className="text-2xl font-bold text-white mb-2">Offer Letter Generation</h1>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
          The offer letter generation wizard is currently in development. This wizard will be unlocked once integration with secure docu-signing and digital signing APIs is finalized.
        </p>
      </div>
    </PageContainer>
  );
}
