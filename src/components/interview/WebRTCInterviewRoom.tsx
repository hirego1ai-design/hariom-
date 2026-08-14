"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface WebRTCInterviewRoomProps {
  roundTitle?: string;
  candidateName?: string;
  interviewerName?: string;
  onComplete?: () => void;
}

export default function WebRTCInterviewRoom({
  roundTitle = "Technical Interview Round 1",
  candidateName = "Rahul Verma",
  interviewerName = "Sophia (AI Recruiter) & Panel",
  onComplete,
}: WebRTCInterviewRoomProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [activeTab, setActiveTab] = useState<"transcript" | "notes" | "ai_questions">("transcript");
  const [notes, setNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [liveTranscript, setLiveTranscript] = useState<string[]>([
    "Sophia: Welcome Rahul to Technical Round 1. Can you explain your experience with distributed systems?",
    "Rahul Verma: Thank you Sophia. I've designed microservices handling 50k RPS using Kafka and Redis.",
    "Sophia: Excellent. How do you handle eventual consistency in database replicas?",
  ]);

  const [aiSuggestedQuestions] = useState<string[]>([
    "How do you resolve split-brain scenarios in Raft consensus?",
    "What strategy do you use for DB partition key selection?",
    "Explain your approach to circuit breaking with Resilience4j.",
  ]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setLiveTranscript((prev) => [...prev, `${candidateName}: ${msg}`]);
    setChatMessage("");

    try {
      // Signal message
      fetch("/api/interviews/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: "live-session", action: "MESSAGE", text: msg }),
      }).catch(() => {});

      // Dispatch AI response
      const aiRes = await fetch("/api/agents/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "INTERVIEW_EVALUATION",
          prompt: `Evaluate candidate response: "${msg}" for ${roundTitle}.`,
        }),
      });

      const aiJson = await aiRes.json();
      if (aiJson.success) {
        let text = aiJson.result;
        try {
          const parsed = typeof text === "string" ? JSON.parse(text) : text;
          text = parsed.feedback || text;
        } catch {
          // Plain text
        }
        setLiveTranscript((prev) => [...prev, `Sophia (AI): ${text.slice(0, 120)}...`]);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0C] text-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Bar */}
      <div className="h-14 bg-[#141418] border-b border-white/10 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider text-red-400 font-mono">
            {isRecording ? "REC • 00:24:18" : "REC PAUSED"}
          </span>
          <span className="text-white/30">|</span>
          <h3 className="font-bold text-sm text-white">{roundTitle}</h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-green/20 text-green font-mono font-bold flex items-center gap-1.5 border border-green/30">
            <span className="w-2 h-2 rounded-full bg-green" /> HD 1080p • 60 FPS
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-muted font-mono border border-white/10">
            Latency: 18ms
          </span>
        </div>
      </div>

      {/* Split Video Room */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video View (70% Width) */}
        <div className="flex-1 p-4 flex flex-col gap-4 relative">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Remote Feed (AI Recruiter / Panel) */}
            <div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden flex flex-col items-center justify-center group shadow-lg">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 relative">
                <div className="w-full h-full rounded-full bg-[#1A1A22] flex items-center justify-center font-bold text-2xl text-primary">
                  AI
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
              </div>
              <span className="mt-3 font-bold text-sm text-white">{interviewerName}</span>
              <span className="text-xs text-text-muted">HireGo AI Evaluation Engine</span>

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono font-bold border border-white/10">
                Interviewer Audio Feed
              </div>
            </div>

            {/* Candidate Feed */}
            <div className="relative rounded-2xl bg-[#121216] border border-white/10 overflow-hidden flex flex-col items-center justify-center group shadow-lg">
              {isCamOn ? (
                <div className="w-full h-full bg-gradient-to-tr from-[#1A1A22] to-[#252530] flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-white/30">videocam</span>
                  <span className="mt-2 text-xs font-bold text-white/60">Candidate Live HD Stream</span>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl text-white">
                  RV
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono font-bold border border-white/10 flex items-center gap-2">
                <span>{candidateName}</span>
                {!isMicOn && <span className="text-red-400 text-[10px] uppercase font-bold">(Muted)</span>}
              </div>
            </div>
          </div>

          {/* WebRTC In-Call Controls Bar */}
          <div className="h-16 bg-[#141418] border border-white/10 rounded-2xl px-6 flex items-center justify-between shrink-0 shadow-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
                title="Toggle Mic"
              >
                <span className="material-symbols-outlined">{isMicOn ? "mic" : "mic_off"}</span>
              </button>

              <button
                onClick={() => setIsCamOn(!isCamOn)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isCamOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
                title="Toggle Camera"
              >
                <span className="material-symbols-outlined">{isCamOn ? "videocam" : "videocam_off"}</span>
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  isScreenSharing ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Share Screen"
              >
                <span className="material-symbols-outlined">present_to_all</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">call_end</span>
                <span>End Interview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Transcript & AI Suggested Questions (30% Width) */}
        <div className="w-[340px] h-full border-l border-white/10 bg-[#101014] flex flex-col">
          {/* Right Tabs */}
          <div className="flex border-b border-white/10 bg-white/5">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "transcript" ? "border-primary text-primary bg-white/5" : "border-transparent text-text-muted hover:text-white"
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab("ai_questions")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "ai_questions" ? "border-primary text-primary bg-white/5" : "border-transparent text-text-muted hover:text-white"
              }`}
            >
              AI Prompts
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "notes" ? "border-primary text-primary bg-white/5" : "border-transparent text-text-muted hover:text-white"
              }`}
            >
              Notes
            </button>
          </div>

          {/* Tab 1: Live Transcript */}
          {activeTab === "transcript" && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-xs">
                {liveTranscript.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-text-muted leading-relaxed">
                    {t}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex gap-2">
                <input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type candidate response..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-3 py-2 rounded-xl bg-primary text-white font-bold text-xs"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: AI Suggested Questions */}
          {activeTab === "ai_questions" && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">AI Real-Time Follow-Ups</h4>
              {aiSuggestedQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 space-y-2">
                  <p className="font-bold">{q}</p>
                  <button
                    onClick={() => setLiveTranscript((prev) => [...prev, `Sophia (AI): ${q}`])}
                    className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold hover:bg-purple-500/30 transition-colors"
                  >
                    + Ask Candidate
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Notes */}
          {activeTab === "notes" && (
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write confidential interview evaluation notes..."
                className="w-full flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none font-mono"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
