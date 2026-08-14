"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminModelRegistryPage() {
  const [models, setModels] = useState([
    { id: "gpt-4o", provider: "OpenAI", role: "Primary Resume Evaluation", active: true },
    { id: "claude-3-5-sonnet", provider: "Anthropic", role: "Mock Interview Avatar", active: true },
    { id: "codellama-70b", provider: "Local Ollama", role: "IDE Code Judge", active: true },
    { id: "whisper-large-v3", provider: "OpenAI", role: "Speech-to-Text Transcription", active: true },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const toggleModel = (id: string) => {
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
    setToast(`Model '${id}' status updated!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-[116px] flex flex-col min-w-0">
        <AdminHeader title="LLM Model Registry (LM01)" />
        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs">
              {toast}
            </div>
          )}

          <div>
            <h1 className="font-display-lg text-display-lg text-white">LLM Model Registry & Providers (LM01)</h1>
            <p className="text-text-muted text-sm">Register, configure, and switch primary AI model providers dynamically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {models.map((m) => (
              <div key={m.id} className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">{m.provider}</span>
                  <h3 className="font-bold text-base text-white mt-1">{m.id}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{m.role}</p>
                </div>
                <button
                  onClick={() => toggleModel(m.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    m.active ? "bg-green/20 text-green" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {m.active ? "Active ✓" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
