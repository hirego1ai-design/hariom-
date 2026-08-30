"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: "passed" | "failed" | "pending";
  runtime: string;
}

interface SubmissionHistory {
  id: number;
  time: string;
  language: string;
  status: "Accepted" | "Time Limit Exceeded" | "Wrong Answer";
  score: string;
  runtime: string;
  memory: string;
}

const initialCodeTemplates: Record<string, string> = {
  python3: `class Solution:
    def longestValidSubstring(self, s: str, forbidden: List[str]) -> int:
        forbidden_set = set(forbidden)
        n = len(s)
        ans = 0
        right = n - 1
        for left in range(n - 1, -1, -1):
            for i in range(left, min(left + 10, right + 1)):
                if s[left:i+1] in forbidden_set:
                    right = i - 1
                    break
            ans = max(ans, right - left + 1)
        return ans`,
  javascript: `/**
 * @param {string} s
 * @param {string[]} forbidden
 * @return {number}
 */
var longestValidSubstring = function(s, forbidden) {
    const forbiddenSet = new Set(forbidden);
    let ans = 0;
    let right = s.length - 1;
    for (let left = s.length - 1; left >= 0; left--) {
        for (let i = left; i <= Math.min(left + 10, right); i++) {
            if (forbiddenSet.has(s.substring(left, i + 1))) {
                right = i - 1;
                break;
            }
        }
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
};`,
  typescript: `function longestValidSubstring(s: string, forbidden: string[]): number {
    const forbiddenSet = new Set(forbidden);
    let ans = 0;
    let right = s.length - 1;
    for (let left = s.length - 1; left >= 0; left--) {
        for (let i = left; i <= Math.min(left + 10, right); i++) {
            if (forbiddenSet.has(s.substring(left, i + 1))) {
                right = i - 1;
                break;
            }
        }
        ans = Math.max(ans, right - left + 1);
    }
    return ans;
};`,
  java: `class Solution {
    public int longestValidSubstring(String s, List<String> forbidden) {
        Set<String> forbiddenSet = new HashSet<>(forbidden);
        int ans = 0;
        int right = s.length() - 1;
        for (int left = s.length() - 1; left >= 0; left--) {
            for (int i = left; i <= Math.min(left + 10, right); i++) {
                if (forbiddenSet.contains(s.substring(left, i + 1))) {
                    right = i - 1;
                    break;
                }
            }
            ans = Math.max(ans, right - left + 1);
        }
        return ans;
    }
}`,
  cpp: `class Solution {
public:
    int longestValidSubstring(string s, vector<string>& forbidden) {
        unordered_set<string> forbiddenSet(forbidden.begin(), forbidden.end());
        int ans = 0;
        int right = s.length() - 1;
        for (int left = s.length() - 1; left >= 0; left--) {
            for (int i = left; i <= min((int)left + 10, right); i++) {
                if (forbiddenSet.count(s.substr(left, i - left + 1))) {
                    right = i - 1;
                    break;
                }
            }
            ans = max(ans, right - left + 1);
        }
        return ans;
    }
};`,
  go: `func longestValidSubstring(s string, forbidden []string) int {
    forbiddenSet := make(map[string]bool)
    for _, item := range forbidden {
        forbiddenSet[item] = true
    }
    ans := 0
    right := len(s) - 1
    for left := len(s) - 1; left >= 0; left-- {
        for i := left; i <= min(left+10, right); i++ {
            if forbiddenSet[s[left:i+1]] {
                right = i - 1
                break
            }
        }
        if right-left+1 > ans {
            ans = right - left + 1
        }
    }
    return ans
}

func min(a, b int) int {
    if a < b { return a }
    return b
}`,
};

export default function WebIDEPage() {
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get('problemId');

  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedLanguage, setSelectedLanguage] = useState<string>("python3");
  const [code, setCode] = useState<string>(initialCodeTemplates["python3"]);
  const [activeRightTab, setActiveRightTab] = useState<"testcases" | "history">("testcases");
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionHistory[]>([]);

  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "> System initialized. Ready to execute code.",
    "> Selected language environment: Python 3.11 Runtime.",
  ]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/assessment/coding/problems');
        const data = await res.json();
        
        if (res.ok && data.success && data.problems && data.problems.length > 0) {
          let problem = problemIdParam ? data.problems.find((p: any) => p.id === problemIdParam) : data.problems[0];
          if (!problem) problem = data.problems[0];
          
          setCurrentProblem(problem);
          
          if (problem.starterCode && problem.starterCode[selectedLanguage]) {
            setCode(problem.starterCode[selectedLanguage]);
          }
          
          if (problem.testCases) {
            setTestCases(problem.testCases.map((tc: any, i: number) => ({
              id: i + 1,
              input: tc.input,
              expectedOutput: tc.expected,
              actualOutput: '-',
              status: 'pending',
              runtime: '-'
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch problems", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblem();
  }, [problemIdParam]);

  const handleLanguageChange = (langKey: string) => {
    setSelectedLanguage(langKey);
    if (currentProblem && currentProblem.starterCode && currentProblem.starterCode[langKey]) {
      setCode(currentProblem.starterCode[langKey]);
    } else {
      setCode(initialCodeTemplates[langKey] || "");
    }
    setConsoleLogs((prev) => [
      ...prev,
      `> Switched execution language environment to ${langKey.toUpperCase()}.`,
    ]);
  };

  const handleRunCode = async () => {
    if (!currentProblem) {
      setToastMessage('No coding challenge is currently available.');
      return;
    }
    setIsRunning(true);
    setConsoleLogs(prev => [...prev, `> Compiling & Executing ${selectedLanguage.toUpperCase()} solution...`]);
    try {
      const res = await fetch('/api/assessment/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: currentProblem?.id, language: selectedLanguage, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');
      const result = data.result;
      if (!result) throw new Error('Execution returned no result');

      // Update test cases with actual results
      setTestCases(result.results.map((r: any, i: number) => ({
        id: i + 1,
        input: r.input,
        expectedOutput: r.expected,
        actualOutput: r.actual,
        status: r.passed ? 'passed' : 'failed',
        runtime: `${r.runtimeMs}ms`,
      })));
      const passed = result.results.filter((r: any) => r.passed).length;
      setConsoleLogs(prev => [...prev, ...result.results.map((r: any, i: number) => `> Test Case ${i+1}... ${r.passed ? 'Passed' : 'Failed'} (${r.runtimeMs}ms)`)]);
      setConsoleLogs(prev => [...prev, `> Execution complete. ${passed}/${result.results.length} test cases passed.`]);
      setToastMessage(`► ${passed}/${result.results.length} Test Cases Passed (Runtime: ${result.runtimeMs}ms)`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `> ERROR: ${err.message}`]);
      setToastMessage(`❌ ${err.message}`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!currentProblem) {
      setToastMessage('No coding challenge is currently available.');
      return;
    }
    setIsRunning(true);
    setConsoleLogs(prev => [...prev, `> Submitting solution for evaluation...`]);
    try {
      const res = await fetch('/api/assessment/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: currentProblem?.id, language: selectedLanguage, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      const sub = data.submission;
      const newSub: SubmissionHistory = {
        id: Date.now(),
        time: 'Just now',
        language: selectedLanguage.toUpperCase(),
        status: sub.status === 'ACCEPTED' ? 'Accepted' : sub.status === 'TIME_LIMIT_EXCEEDED' ? 'Time Limit Exceeded' : 'Wrong Answer',
        score: `${sub.score}%`,
        runtime: `${sub.runtimeMs || 0}ms`,
        memory: '-',
      };
      setSubmissions(prev => [newSub, ...prev]);
      setActiveRightTab('history');
      setConsoleLogs(prev => [...prev, `> Submission: ${sub.status} | Score: ${sub.score}% | Tests: ${sub.passedTests}/${sub.totalTests}`]);
      setToastMessage(sub.status === 'ACCEPTED' ? '🎉 Solution Accepted!' : `⚠️ ${sub.status}: ${sub.passedTests}/${sub.totalTests} tests passed`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, `> ERROR: ${err.message}`]);
      setToastMessage(`❌ ${err.message}`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsRunning(false);
    }
  };

  const activeTestCase = testCases.find((tc) => tc.id === selectedTestCaseId) || testCases[0] || {
    id: 1,
    input: "Loading...",
    expectedOutput: "Loading...",
    actualOutput: "Loading...",
    status: "pending",
    runtime: "-"
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      {/* Floating Navigation Rail */}
      <CandidateSidebar />

      {/* Main Workspace Canvas */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-[#141418]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/ai/practice-hub"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
              title="Back to AI Practice Hub"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{currentProblem ? currentProblem.title : "Longest Valid Substring"}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-yellow/20 text-yellow font-mono font-bold uppercase">
                  {currentProblem ? currentProblem.difficulty : "Medium"}
                </span>
              </h1>
              <p className="text-[11px] text-text-muted">Sliding Window • String Optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">code</span>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-white text-xs font-bold font-mono focus:outline-none cursor-pointer"
              >
                <option value="python3" className="bg-[#141418] text-white">Python 3 (v3.11)</option>
                <option value="javascript" className="bg-[#141418] text-white">JavaScript (Node v20)</option>
                <option value="typescript" className="bg-[#141418] text-white">TypeScript (v5.4)</option>
                <option value="java" className="bg-[#141418] text-white">Java 21 (OpenJDK)</option>
                <option value="cpp" className="bg-[#141418] text-white">C++20 (GCC 13)</option>
                <option value="go" className="bg-[#141418] text-white">Go 1.22</option>
              </select>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl font-mono text-xs text-yellow">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>42:15</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>{isRunning ? "Running..." : "Run Code"}</span>
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isRunning}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                <span>Submit Solution</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3-Column Split Workspace */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-[#1C1C22] border border-primary/40 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* PANEL A: Problem Statement (30% Width) */}
          <section className="w-[30%] h-full border-r border-white/10 p-5 overflow-y-auto bg-[#101014] space-y-5 custom-scrollbar">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <h2 className="font-bold text-base text-white">Problem Description</h2>
            </div>

            <div className="space-y-3 text-xs text-text-muted leading-relaxed">
              {currentProblem?.description ? (
                <div className="whitespace-pre-wrap">{currentProblem.description}</div>
              ) : (
                <>
                  <p>
                    You are given a string <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono">s</code> and an array of strings <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono">forbidden</code>.
                  </p>
                  <p>
                    A string is called <strong className="text-white">valid</strong> if none of its substrings are present in <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono">forbidden</code>.
                  </p>
                  <p>
                    Return the length of the longest valid substring of the string <code className="px-1.5 py-0.5 rounded bg-white/10 text-primary font-mono">s</code>.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-4 pt-2">
              {currentProblem?.testCases ? (
                currentProblem.testCases.map((tc: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Example {idx + 1}</h4>
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs space-y-1.5 text-text-muted">
                      <p><span className="text-white font-bold">Input:</span> {tc.input}</p>
                      <p><span className="text-green font-bold">Output:</span> {tc.expected}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Example 1</h4>
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs space-y-1.5 text-text-muted">
                      <p><span className="text-white font-bold">Input:</span> s = &quot;cbaaaabc&quot;, forbidden = [&quot;aaa&quot;, &quot;cb&quot;]</p>
                      <p><span className="text-green font-bold">Output:</span> 4</p>
                      <p className="text-[11px] text-text-muted italic pt-1 border-t border-white/5">
                        Explanation: There are 11 valid substrings, the longest is &quot;aaab&quot;.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Example 2</h4>
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs space-y-1.5 text-text-muted">
                      <p><span className="text-white font-bold">Input:</span> s = &quot;leetcode&quot;, forbidden = [&quot;de&quot;, &quot;le&quot;, &quot;e&quot;]</p>
                      <p><span className="text-green font-bold">Output:</span> 4</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-text-muted flex justify-between font-mono">
              <span>Time Complexity: O(N * M)</span>
              <span>Memory: O(1)</span>
            </div>
          </section>

          {/* PANEL B: Code Editor (45% Width) */}
          <section className="w-[45%] h-full flex flex-col bg-[#08080A]">
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="text-primary font-bold">{selectedLanguage.toUpperCase()}</span>
                <span>/</span>
                <span>solution.{selectedLanguage === "python3" ? "py" : selectedLanguage === "javascript" ? "js" : selectedLanguage === "typescript" ? "ts" : selectedLanguage === "java" ? "java" : selectedLanguage === "cpp" ? "cpp" : "go"}</span>
              </div>
              <div className="flex items-center gap-3 text-text-muted">
                <button
                  onClick={() => setCode(initialCodeTemplates[selectedLanguage])}
                  className="hover:text-white transition-colors text-[11px] font-bold"
                  title="Reset Code Template"
                >
                  Reset Code
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-white">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-transparent resize-none focus:outline-none custom-scrollbar font-mono text-xs text-white leading-relaxed"
                spellCheck={false}
              />
            </div>
          </section>

          {/* PANEL C: Interactive Test Cases & Submission History (25% Width) */}
          <section className="w-[25%] h-full border-l border-white/10 flex flex-col bg-[#101014]">
            {/* Right Panel Tabs */}
            <div className="flex border-b border-white/10 bg-white/5">
              <button
                onClick={() => setActiveRightTab("testcases")}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeRightTab === "testcases"
                    ? "border-primary text-primary bg-white/5"
                    : "border-transparent text-text-muted hover:text-white"
                }`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setActiveRightTab("history")}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeRightTab === "history"
                    ? "border-primary text-primary bg-white/5"
                    : "border-transparent text-text-muted hover:text-white"
                }`}
              >
                History ({submissions.length})
              </button>
            </div>

            {/* Tab 1: Test Cases View */}
            {activeRightTab === "testcases" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                  {/* Case Pills */}
                  <div className="flex items-center gap-2">
                    {testCases.map((tc) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedTestCaseId(tc.id)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs font-mono transition-all flex items-center justify-center border ${
                          selectedTestCaseId === tc.id
                            ? "bg-primary text-white border-primary shadow-md"
                            : "bg-white/5 border-white/10 text-text-muted hover:text-white"
                        }`}
                      >
                        {tc.id}
                      </button>
                    ))}
                  </div>

                  {/* Input Detail */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase">Input</label>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-white whitespace-pre">
                        {activeTestCase.input}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase">Expected Output</label>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-white">
                        {activeTestCase.expectedOutput}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text-muted uppercase">Actual Output</label>
                      <div className="bg-green/10 p-3 rounded-xl border border-green/30 text-green font-bold">
                        {activeTestCase.actualOutput}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Console Execution Logs */}
                <div className="h-44 border-t border-white/10 p-3 bg-black/40 flex flex-col font-mono text-[11px]">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Output Console</span>
                    <button
                      onClick={() => setConsoleLogs([])}
                      className="text-text-muted hover:text-white transition-colors"
                      title="Clear Console"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar text-text-muted">
                    {consoleLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("Passed") ? "text-green" : log.includes("Running") ? "text-blue-400" : ""}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Submission History View */}
            {activeRightTab === "history" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green/20 text-green font-mono">
                        {sub.status} ({sub.score})
                      </span>
                      <span className="text-[10px] text-text-muted">{sub.time}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white font-bold">{sub.language}</span>
                      <span className="text-text-muted">{sub.runtime} • {sub.memory}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
