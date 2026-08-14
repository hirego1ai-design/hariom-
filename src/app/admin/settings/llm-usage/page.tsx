"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { formatNumber, formatDate } from "@/utils";

export default function AdminLlmUsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPrompt, setTestPrompt] = useState("Generate a 3-bullet summary of a Senior AI Engineer candidate.");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [testResult, setTestResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const loadStats = () => {
    fetch("/api/admin/llm-usage")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleTestDispatch = async () => {
    if (!testPrompt.trim()) return;
    setExecuting(true);
    try {
      const res = await fetch("/api/agents/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "GENERAL",
          prompt: testPrompt,
          provider: selectedProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data);
        loadStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-[#0A0A0C] text-white min-h-screen relative">
      <AdminSidebar />
      <AdminHeader />

      <main className="md:ml-[116px] p-6 lg:p-8 pt-24 space-y-6 max-w-6xl mx-auto">
        <div className="border-b border-white/10 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-[#AB47BC]/10 text-[#AB47BC] border border-[#AB47BC]/20 mb-1">
            AI INFRASTRUCTURE
          </div>
          <h1 className="text-2xl font-bold text-white">Multi-LLM Router & Agent Monitoring</h1>
          <p className="text-xs text-slate-400">Monitor token consumption, LLM provider distribution & test Multi-LLM dispatch</p>
        </div>

        {/* Live Metrics */}
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Loading AI stats...</div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total AI Executions</span>
                <div className="text-xl font-extrabold text-white font-mono">{formatNumber(stats.totalRequests)}</div>
              </div>
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Tokens Consumed</span>
                <div className="text-xl font-extrabold text-[#29B6F6] font-mono">{formatNumber(stats.totalTokens)}</div>
              </div>
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Average Latency</span>
                <div className="text-xl font-extrabold text-[#26A69A] font-mono">{stats.avgLatencyMs} ms</div>
              </div>
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Estimated Cost (USD)</span>
                <div className="text-xl font-extrabold text-[#FFCA28] font-mono">${stats.totalCostUsd}</div>
              </div>
            </div>

            {/* Provider Distribution */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">LLM Provider Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "OpenAI (GPT-4o)", key: "openai", color: "#26A69A" },
                  { name: "Gemini (1.5 Pro)", key: "gemini", color: "#29B6F6" },
                  { name: "Claude (3.5 Sonnet)", key: "claude", color: "#AB47BC" },
                  { name: "DeepSeek (V3)", key: "deepseek", color: "#FFCA28" },
                ].map((p) => (
                  <div key={p.key} className="bg-[#16161B] p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-slate-300">{p.name}</span>
                    <div className="text-lg font-extrabold font-mono" style={{ color: p.color }}>
                      {stats.providerCounts[p.key] || 0} Requests
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Prompt Playground */}
            <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#29B6F6]">terminal</span> Multi-LLM Router Playground
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="text-xs text-slate-400 mb-1 block">Test Prompt</label>
                  <input
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Primary LLM Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full bg-[#16161B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                  >
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="gemini">Gemini (1.5 Pro)</option>
                    <option value="claude">Claude (3.5 Sonnet)</option>
                    <option value="deepseek">DeepSeek (V3)</option>
                  </select>
                </div>
              </div>

              <button
                disabled={executing}
                onClick={handleTestDispatch}
                className="px-6 py-2.5 rounded-xl bg-[#29B6F6] text-white text-xs font-bold hover:bg-[#29B6F6]/90 flex items-center gap-2"
              >
                {executing ? "Routing Prompt..." : "Execute LLM Request"}
              </button>

              {testResult && (
                <div className="bg-[#16161B] p-4 rounded-xl border border-white/10 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono border-b border-white/5 pb-2">
                    <span>Provider: <strong className="text-white uppercase">{testResult.log.provider}</strong></span>
                    <span>Tokens: {testResult.log.totalTokens}</span>
                    <span>Latency: {testResult.log.latencyMs} ms</span>
                  </div>
                  <pre className="text-xs text-[#26A69A] font-mono whitespace-pre-wrap">{testResult.result}</pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
