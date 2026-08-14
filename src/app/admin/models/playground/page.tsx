"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminModelPlaygroundPage() {
  const [prompt, setPrompt] = useState("System: You are an expert AI interviewer scoring candidate technical answers.");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTestPrompt = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOutput("Evaluation Output: Candidate answer demonstrates strong grasp of React 19 concurrent rendering. Score: 94/100.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="Prompt & Fine-Tuning Playground (LM02)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div>
            <h1 className="font-display-lg text-display-lg text-white">Prompt & Fine-Tuning Playground (LM02)</h1>
            <p className="text-text-muted text-sm">Test system prompts, temperature parameters, and fine-tuned checkpoints in real time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
              <label className="text-xs text-text-secondary block font-bold">System Prompt Input</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full rounded-xl bg-[#1E1E1E] border border-white/10 p-3 text-xs text-white font-mono"
              />
              <button
                onClick={handleTestPrompt}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
              >
                {loading ? "Simulating Inference..." : "Run Test Inference"}
              </button>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
              <label className="text-xs text-text-secondary block font-bold">Model Output Stream</label>
              <div className="min-h-[190px] p-4 rounded-xl bg-[#1E1E1E] border border-white/10 text-xs text-green font-mono leading-relaxed">
                {output || "Click 'Run Test Inference' to preview model response..."}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
