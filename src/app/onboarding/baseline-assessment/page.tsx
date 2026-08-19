"use client";

import React, { useState, useEffect } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/context/OnboardingContext";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

const quizMap: Record<string, Question[]> = {
  "software-engineering": [
    { id: 1, text: "Which data structure guarantees O(1) average lookup time?", options: ["Binary Search Tree", "Hash Table", "Linked List", "Stack"], correct: 1 },
    { id: 2, text: "In SQL, which clause filters aggregated GROUP BY results?", options: ["WHERE", "HAVING", "ORDER BY", "FILTER"], correct: 1 },
    { id: 3, text: "What is the primary benefit of immutability in React state?", options: ["Faster CPU execution", "Predictable state change detection", "Reduced memory usage", "Disables re-rendering"], correct: 1 },
  ],
  "customer-support": [
    { id: 1, text: "What is the first step when handling an escalated customer complaint?", options: ["Transfer immediately to a manager", "Acknowledge frustration with empathy", "Defend company policy", "Ask customer to email support"], correct: 1 },
    { id: 2, text: "Which metric measures customer satisfaction directly after an interaction?", options: ["CSAT", "NPS", "ARR", "Churn Rate"], correct: 0 },
    { id: 3, text: "Identify the correct formal grammar:", options: ["We was waiting for your reply", "We have received your request and are reviewing it.", "Your request has been received by us yesterday.", "We is processing your ticket."], correct: 1 },
  ],
  default: [
    { id: 1, text: "What is the primary key in relational databases?", options: ["A foreign reference", "A unique identifier for each row", "An indexed string", "A duplicate column"], correct: 1 },
    { id: 2, text: "Which strategy improves team communication during remote projects?", options: ["Siloed tasks", "Clear daily async updates", "No documentation", "Infrequent meetings"], correct: 1 },
    { id: 3, text: "What does KPI stand for in business operations?", options: ["Key Performance Indicator", "Known Process Integration", "Knowledge Protocol Index", "Key Product Insight"], correct: 0 },
  ],
};

export default function BaselineAssessmentPage() {
  const router = useRouter();
  const { state, updateState, markStepComplete, calculateHireGoScore } = useOnboarding();

  const category = state.jobCategory || "software-engineering";
  const questions = quizMap[category] || quizMap.default;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);

  const handleSelect = (qIdx: number, optIdx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx });
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) correct++;
    });
    const percent = Math.round((correct / questions.length) * 100);
    setScorePercent(percent);
    setIsCompleted(true);

    const result = {
      category,
      score: percent,
      totalQuestions: questions.length,
      correctAnswers: correct,
      timeTakenSec: 120,
    };

    updateState({
      baselineAssessmentCompleted: true,
      assessmentResults: [result],
    });
    markStepComplete(8);
  };

  const handleNext = () => {
    calculateHireGoScore();
    router.push("/onboarding/hire-score");
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />

      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        <header className="fixed top-0 left-[116px] right-0 z-40 bg-[#0E0E0E]/90 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-gutter h-20 shadow-md">
          <div>
            <h1 className="font-display-md text-headline-md text-white font-bold tracking-tight">
              Baseline Technical Assessment ({category})
            </h1>
            <p className="text-text-muted text-xs">Short role-specific quiz to evaluate technical baseline proficiency.</p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-text-muted">
              Skill baseline
            </span>
          </div>
        </header>

        <main className="flex-1 p-gutter pt-24 pb-12 space-y-6 max-w-[900px] w-full mx-auto overflow-y-auto">
          {!isCompleted ? (
            <div className="glass-card p-8 rounded-2xl border border-white/10 bg-[#141418] space-y-6 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-primary font-mono">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-xs text-text-muted font-mono">Time Limit: 05:00</span>
              </div>

              <h2 className="text-base font-bold text-white leading-relaxed">
                {questions[currentIdx].text}
              </h2>

              <div className="space-y-3">
                {questions[currentIdx].options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    onClick={() => handleSelect(currentIdx, oIdx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-xs ${
                      selectedAnswers[currentIdx] === oIdx
                        ? "bg-primary/20 border-primary text-white shadow-md"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-text-muted"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs disabled:opacity-30"
                >
                  Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((prev) => prev + 1)}
                    className="px-6 py-2 rounded-full bg-primary text-white font-bold text-xs"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-2.5 rounded-full bg-yellow text-bg-page font-bold text-xs shadow-[0_0_20px_rgba(255,200,0,0.3)]"
                  >
                    Submit Assessment
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-white/10 bg-[#141418] space-y-6 shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-green/20 border border-green/30 text-green flex items-center justify-center mx-auto text-3xl font-bold">
                {scorePercent}%
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white">Baseline Assessment Completed</h2>
                <p className="text-xs text-text-muted">
                  Your assessment score has been recorded and factored into your overall HireGo Score™.
                </p>
              </div>

              <button
                onClick={handleNext}
                className="px-8 py-3 rounded-full bg-yellow text-bg-page font-bold text-xs shadow-[0_0_20px_rgba(255,200,0,0.35)] hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                <span>Calculate HireGo Score™</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
