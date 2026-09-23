"use client";

import Link from "next/link";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export function AiAgentManagerContent() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto">
      <div className="max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
        <h1 className="text-2xl font-bold text-white">AI Agent Configuration</h1>
        <p className="mt-3 text-sm text-text-secondary">
          Runtime agent enablement, provider/model assignment, task counters, and pause/resume controls are not exposed here because no authoritative agent-registry configuration API is connected.
        </p>
        <p className="mt-3 text-xs text-text-muted">
          The previous hardcoded agent names, models, task totals, and browser-only Active/Paused toggles have been removed.
        </p>
        <Link href="/admin/ai-command-centre-dashboard" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">
          Open live system evidence
        </Link>
      </div>
    </div>
  );
}

export default function AiAgentManagerPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="flex-1 md:ml-[116px]">
        <AiAgentManagerContent />
      </div>
    </div>
  );
}
