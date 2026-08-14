"use client";
import React, { useState } from "react";
import Link from "next/link";

interface ProviderCostItem {
  id: string;
  provider: string;
  model: string;
  tokens: string;
  cost: string;
  pct: string;
  color: string;
  latency: string;
  status: "Optimal" | "Degraded" | "Active";
}

interface FeatureCostItem {
  feature: string;
  description: string;
  cost: string;
  share: string;
  primaryModel: string;
  requestsCount: string;
  avgCostPerReq: string;
}

const providerCosts: ProviderCostItem[] = [
  { id: "P-1", provider: "OpenAI", model: "GPT-4o & Embeddings v3", tokens: "92.8 M Tokens", cost: "₹2,73,000", pct: "65.0%", color: "bg-primary", latency: "280ms", status: "Optimal" },
  { id: "P-2", provider: "Anthropic", model: "Claude 3.5 Sonnet", tokens: "35.7 M Tokens", cost: "₹1,05,000", pct: "25.0%", color: "bg-secondary", latency: "340ms", status: "Optimal" },
  { id: "P-3", provider: "Google Cloud", model: "Gemini 1.5 Pro / Flash", tokens: "10.1 M Tokens", cost: "₹25,200", pct: "6.0%", color: "bg-tertiary", latency: "210ms", status: "Optimal" },
  { id: "P-4", provider: "Whisper & ElevenLabs", model: "Speech-to-Text & Neural Voice", tokens: "4.2 M Tokens", cost: "₹16,800", pct: "4.0%", color: "bg-emerald-500", latency: "190ms", status: "Optimal" },
];

const featureCosts: FeatureCostItem[] = [
  { feature: "AI Mock Interviews (Voice + Vision)", description: "Real-time voice conversational interviewer + eye-tracking proctoring", cost: "₹1,89,000", share: "45.0%", primaryModel: "GPT-4o + Whisper", requestsCount: "14,200 Sessions", avgCostPerReq: "₹13.30" },
  { feature: "Resume Screening & Semantic Ranking", description: "Automated candidate-to-JD vector embedding & skill gap matching", cost: "₹1,26,000", share: "30.0%", primaryModel: "Text-Embedding-3 + Claude 3.5", requestsCount: "48,420 Resumes", avgCostPerReq: "₹2.60" },
  { feature: "AI JD Writer & Question Generator", description: "Employer 1-click job post generator and dynamic technical quizzes", cost: "₹63,000", share: "15.0%", primaryModel: "Claude 3.5 Sonnet", requestsCount: "3,860 Posts", avgCostPerReq: "₹16.32" },
  { feature: "Code Execution AST & Proctoring Checks", description: "Coding test syntax linting, security vulnerability checks & tab-switch logging", cost: "₹42,000", share: "10.0%", primaryModel: "Gemini 1.5 Flash", requestsCount: "18,900 Runs", avgCostPerReq: "₹2.22" },
];

export default function LlmUsageMonitorPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>("All");

  return (
    <div className="space-y-6 text-text-primary">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141418] p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-muted hover:text-white transition-all flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Dashboard
          </Link>
          <span className="text-white/20">|</span>
          <span className="text-xs font-bold text-text-secondary">Monthly AI Spend:</span>
          <span className="text-sm font-extrabold text-white font-data-md">₹4,20,000</span>
          <span className="text-xs text-text-muted">(6.7% of ₹62.4L MRR)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-green/10 border border-green/30 text-green text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            Cost Budget: 70% Utilized (₹6.0L Cap)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Monthly Token Ingestion</p>
          <h3 className="font-bold text-3xl text-white mt-1 font-data-md">142.8 M Tokens</h3>
          <p className="text-green text-xs mt-2 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span> +18% throughput efficiency
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total AI API Spend</p>
          <h3 className="font-bold text-3xl text-gold-payment mt-1 font-data-md">₹4,20,000</h3>
          <p className="text-text-muted text-xs mt-2 font-bold">Cost per active candidate: ₹8.67</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Global P95 AI Latency</p>
          <h3 className="font-bold text-3xl text-emerald-400 mt-1 font-data-md">285 ms</h3>
          <p className="text-emerald-400/80 text-xs mt-2 font-bold">Optimal Edge Streaming Active</p>
        </div>
      </div>

      {/* Breakdown by Provider Bento Grid */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-base text-white">AI Infrastructure Spend by Provider</h4>
            <p className="text-text-muted text-xs">Cost allocation across foundation model endpoints</p>
          </div>
          <span className="text-xs font-bold text-primary font-data-md">₹4.2L Total Spend</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {providerCosts.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProvider(selectedProvider === p.provider ? "All" : p.provider)}
              className={`p-4 rounded-xl bg-white/5 border cursor-pointer transition-all ${
                selectedProvider === p.provider ? "border-primary shadow-lg" : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-white">{p.provider}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white/10 text-white font-data-md">
                  {p.pct}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">{p.model}</p>
              <h4 className="text-xl font-bold text-gold-payment mt-2 font-data-md">{p.cost}</h4>
              <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] text-text-muted">
                <span>{p.tokens}</span>
                <span className="text-emerald-400 font-bold">{p.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown by Feature Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">neurology</span>
            Feature-Level AI Cost & Token Attribution
          </h4>
          <p className="text-text-muted text-xs">Direct cost allocation to each HireGo product feature</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Feature Name</th>
                <th className="p-4">Underlying Model</th>
                <th className="p-4 text-center">Requests / Sessions</th>
                <th className="p-4 text-right">Avg Cost / Request</th>
                <th className="p-4 text-right">Total Cost</th>
                <th className="p-4 text-center">Cost Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {featureCosts.map((f, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white">{f.feature}</p>
                    <p className="text-[11px] text-text-muted">{f.description}</p>
                  </td>
                  <td className="p-4 text-white font-medium">{f.primaryModel}</td>
                  <td className="p-4 text-center font-bold text-white font-data-md">{f.requestsCount}</td>
                  <td className="p-4 text-right text-text-muted font-data-md">{f.avgCostPerReq}</td>
                  <td className="p-4 text-right font-bold text-gold-payment font-data-md">{f.cost}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/20 text-primary">
                      {f.share}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}