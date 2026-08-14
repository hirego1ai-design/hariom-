"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState } from "react";

export function AiAgentManagerContent() {
  const [agents, setAgents] = useState([
    { name: "Resume HireScore Evaluator", status: "Active", model: "GPT-4o", tasks: 12400 },
    { name: "Mock Interview Copilot", status: "Active", model: "Claude 3.5 Sonnet", tasks: 8200 },
    { name: "Code Execution Security Judge", status: "Active", model: "Local CodeLlama", tasks: 3400 },
    { name: "Communication Coach Analyzer", status: "Active", model: "Whisper + GPT-4o", tasks: 6100 },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const toggleAgent = (name: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.name === name ? { ...a, status: a.status === "Active" ? "Paused" : "Active" } : a))
    );
    setToast(`AI Agent '${name}' state toggled!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FF5252] text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">AI Agent Manager (G10)</h1>
        <p className="text-text-muted text-sm">Monitor and control autonomous AI background agents operating across candidate & employer workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {agents.map((a) => (
          <div key={a.name} className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between bg-white/5">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#FF5252]/20 text-[#FF5252]">{a.model}</span>
              <h3 className="font-bold text-base text-white mt-1">{a.name}</h3>
              <p className="text-xs text-text-muted mt-0.5">{a.tasks.toLocaleString()} tasks completed today</p>
            </div>
            <button
              onClick={() => toggleAgent(a.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                a.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {a.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AiAgentManagerPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="flex-1 ml-[116px]">
        <AiAgentManagerContent />
      </div>
    </div>
  );
}