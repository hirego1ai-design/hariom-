"use client";
import React from "react";
import { PageContainer } from "@/components/employer/LayoutSystem";

export default function E50Page() {
  return (
    <PageContainer>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-[#121215] border border-white/10 rounded-2xl max-w-2xl mx-auto my-12">
        <span className="material-symbols-outlined text-yellow text-5xl animate-pulse mb-4">construction</span>
        <h1 className="text-2xl font-bold text-white mb-2">Proctoring Telemetry Monitor</h1>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed">
          The live proctoring telemetry monitor is currently in development. This feature will be activated once the production WebRTC and STUN/TURN server configurations are finalized.
        </p>
      </div>
    </PageContainer>
  );
}
