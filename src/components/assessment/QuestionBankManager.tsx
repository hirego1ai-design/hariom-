"use client";

import React, { useState } from "react";

export interface QuestionItem {
  id: string;
  title: string;
  category: string;
  type: "MCQ" | "Multiple Select" | "Coding" | "SQL" | "Scenario" | "Audio/Video";
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  negativeMarks: number;
  timeLimitSec: number;
}

export default function QuestionBankManager() {
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: "Q101", title: "Explain CAP Theorem tradeoffs in distributed systems.", category: "System Design", type: "Scenario", difficulty: "Hard", marks: 10, negativeMarks: 0, timeLimitSec: 300 },
    { id: "Q102", title: "Write SQL to find top 3 highest earning employees per department.", category: "Database SQL", type: "SQL", difficulty: "Medium", marks: 5, negativeMarks: 1, timeLimitSec: 180 },
    { id: "Q103", title: "Which data structures guarantee O(1) average lookup time?", category: "Algorithms", type: "MCQ", difficulty: "Easy", marks: 2, negativeMarks: 0.5, timeLimitSec: 60 },
  ]);

  const [toast, setToast] = useState<string | null>(null);

  const handleImport = () => {
    setToast("Imported 12 new questions from JSON Question Bank");
    setTimeout(() => setToast(null), 3500);
  };

  const handleExport = () => {
    setToast("Exported Question Bank to enterprise JSON template");
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
          <h3 className="font-bold text-lg text-white">Enterprise Question Bank Manager</h3>
          <p className="text-xs text-text-muted mt-1">Manage MCQ, Coding, SQL, Case Studies, and AI-generated assessment items.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            <span>Import Questions</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Bank</span>
          </button>
        </div>
      </div>

      {/* Question Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-text-muted uppercase text-[10px]">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Question Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Difficulty</th>
              <th className="py-3 px-4">Marks</th>
              <th className="py-3 px-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {questions.map((q) => (
              <tr key={q.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-4 font-bold text-primary">{q.id}</td>
                <td className="py-3.5 px-4 text-white font-sans font-medium">{q.title}</td>
                <td className="py-3.5 px-4 text-text-muted">{q.category}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                    {q.type}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    q.difficulty === "Easy" ? "bg-green/20 text-green" : q.difficulty === "Medium" ? "bg-yellow/20 text-yellow" : "bg-red-500/20 text-red-400"
                  }`}>
                    {q.difficulty}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-white">{q.marks} (-{q.negativeMarks})</td>
                <td className="py-3.5 px-4 text-text-muted">{q.timeLimitSec}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
