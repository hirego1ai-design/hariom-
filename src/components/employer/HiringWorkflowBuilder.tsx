"use client";

import React, { useState } from "react";

export interface WorkflowStage {
  id: string;
  name: string;
  type: "ai_screening" | "coding" | "technical_interview" | "hr_interview" | "typing_test" | "final_offer";
  assignedRole: string;
  slaDays: number;
  passScore: number;
  isAiEvaluated: boolean;
}

export default function HiringWorkflowBuilder() {
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [stages, setStages] = useState<WorkflowStage[]>([
    { id: "1", name: "AI Resume Screening", type: "ai_screening", assignedRole: "HireGo AI Parser", slaDays: 1, passScore: 85, isAiEvaluated: true },
    { id: "2", name: "Coding & Algorithmic IDE", type: "coding", assignedRole: "Automated Sandbox", slaDays: 2, passScore: 90, isAiEvaluated: true },
    { id: "3", name: "Technical Round 1 (System Design)", type: "technical_interview", assignedRole: "Senior Architect", slaDays: 3, passScore: 80, isAiEvaluated: false },
    { id: "4", name: "Engineering Manager Culture Fit", type: "technical_interview", assignedRole: "Engineering Lead", slaDays: 2, passScore: 85, isAiEvaluated: false },
    { id: "5", name: "HR & Compensation Negotiation", type: "hr_interview", assignedRole: "HR Director", slaDays: 2, passScore: 100, isAiEvaluated: false },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleAddStage = () => {
    const newStage: WorkflowStage = {
      id: String(Date.now()),
      name: "New Interview Stage",
      type: "technical_interview",
      assignedRole: "Technical Panel",
      slaDays: 2,
      passScore: 80,
      isAiEvaluated: false,
    };
    setStages((prev) => [...prev, newStage]);
  };

  const handleRemoveStage = (id: string) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveWorkflow = () => {
    setToast(`Workflow saved for ${selectedRole} (${stages.length} stages)`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="w-full bg-[#141418] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="font-bold text-lg text-white">Role-Based Hiring Workflow Builder</h3>
          <p className="text-xs text-text-muted mt-1">Configure multi-round evaluation stages, SLAs, and AI vs Manual evaluation rules.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl px-4 py-2 focus:outline-none cursor-pointer"
          >
            <option value="Software Engineer" className="bg-[#141418]">Software Engineer</option>
            <option value="Customer Support Specialist" className="bg-[#141418]">Customer Support Specialist</option>
            <option value="Enterprise Sales Lead" className="bg-[#141418]">Enterprise Sales Lead</option>
            <option value="Data Scientist" className="bg-[#141418]">Data Scientist</option>
          </select>

          <button
            onClick={handleSaveWorkflow}
            className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 hover:scale-105 transition-all"
          >
            Save Workflow
          </button>
        </div>
      </div>

      {/* Drag & Drop Workflow Stage Cards */}
      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-lg bg-white/10 font-mono font-bold text-xs flex items-center justify-center text-primary border border-white/10">
                0{idx + 1}
              </span>
              <div>
                <input
                  value={stage.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, name: val } : s)));
                  }}
                  className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-primary"
                />
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  <span>Assigned: <strong className="text-white">{stage.assignedRole}</strong></span>
                  <span>•</span>
                  <span>SLA: <strong className="text-white">{stage.slaDays} Days</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${
                stage.isAiEvaluated ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}>
                {stage.isAiEvaluated ? "AI Evaluation" : "Manual Panel"}
              </span>

              <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span>Pass:</span>
                <input
                  type="number"
                  value={stage.passScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, passScore: val } : s)));
                  }}
                  className="w-14 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-center font-bold focus:outline-none"
                />
                <span>%</span>
              </div>

              <button
                onClick={() => handleRemoveStage(stage.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                title="Remove Stage"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddStage}
        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-text-muted hover:text-white hover:border-primary/50 text-xs font-bold flex items-center justify-center gap-2 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        <span>Add Stage to Workflow</span>
      </button>
    </div>
  );
}
