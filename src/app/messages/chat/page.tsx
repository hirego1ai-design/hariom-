"use client";
import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import Link from "next/link";

export default function CandidateChatPage() {
  const [activeContact, setActiveContact] = useState("techcorp");
  const [messages, setMessages] = useState([
    { sender: "Recruiter (TechCorp)", text: "Hi Rahul! We loved your AI mock interview score (94%). Are you free for a technical sync tomorrow at 3 PM?", time: "10:14 AM" },
    { sender: "You", text: "Hi! Yes, 3 PM works perfectly for me. Should I prepare any specific system design or coding topics?", time: "10:18 AM" },
    { sender: "Recruiter (TechCorp)", text: "Mainly System Design, React 19 performance optimization, and WebSocket concurrency. Looking forward to speaking with you!", time: "10:20 AM" },
  ]);
  const [input, setInput] = useState("");

  const contacts = [
    { id: "techcorp", name: "Sarah Jenkins", role: "Tech Recruiter @ TechCorp", unread: 0, active: true, avatar: "SJ", company: "TechCorp" },
    { id: "apex", name: "Marcus Aurelius", role: "Engineering Lead @ Apex AI", unread: 2, active: true, avatar: "MA", company: "Apex AI" },
    { id: "sophia", name: "Sophia AI", role: "AI Recruiter & Proctor", unread: 0, active: true, avatar: "AI", company: "HireGo AI" },
    { id: "netflix", name: "Elena Rodriguez", role: "Talent Partner @ Netflix", unread: 0, active: false, avatar: "ER", company: "Netflix" },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      {/* Floating Vertical Navigation Rail */}
      <CandidateSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[116px] flex flex-col min-w-0 min-h-screen">
        
        {/* Header Bar */}
        <header
          className="fixed top-0 left-[116px] right-0 z-40 backdrop-blur-xl flex justify-between items-center px-gutter h-20 shadow-sm"
          style={{
            backgroundColor: "var(--bg-page)",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--primary-container-bg)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                  }}
                >
                  CF01 Module
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Real-Time Recruiter Messaging
                </span>
              </div>
              <h1
                className="text-headline-md font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
              >
                Candidate Messaging Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              style={{
                backgroundColor: "var(--surface-container-high)",
                border: "1px solid var(--outline)",
                color: "var(--text-primary)",
              }}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Messenger Layout Canvas */}
        <main className="flex-1 p-gutter pt-24 pb-12 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter h-[calc(100vh-140px)] min-h-[550px]">
            
            {/* Left Column: Inbox / Conversations List */}
            <div
              className="lg:col-span-4 rounded-2xl flex flex-col overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--outline)" }}
              >
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: "var(--primary)" }}>forum</span>
                  Active Conversations
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ backgroundColor: "var(--surface-container-high)", color: "var(--text-muted)" }}
                >
                  {contacts.length} Chats
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                {contacts.map((c) => {
                  const isSelected = activeContact === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveContact(c.id)}
                      className="w-full p-3 rounded-xl flex items-center justify-between text-left transition-all"
                      style={{
                        backgroundColor: isSelected ? "var(--primary-container-bg)" : "transparent",
                        border: isSelected ? "1px solid var(--primary)" : "1px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs relative"
                          style={{
                            backgroundColor: "var(--surface-container-high)",
                            border: "1px solid var(--outline)",
                            color: "var(--primary)",
                          }}
                        >
                          {c.avatar}
                          {c.active && (
                            <span
                              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                              style={{ backgroundColor: "var(--color-green)", borderColor: "var(--bg-card)" }}
                            />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                          <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{c.role}</p>
                        </div>
                      </div>

                      {c.unread > 0 && (
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Chat Window */}
            <div
              className="lg:col-span-8 rounded-2xl flex flex-col overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--outline)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              
              {/* Recruiter Header Bar */}
              <div
                className="p-4 flex justify-between items-center"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderBottom: "1px solid var(--outline)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dim))" }}
                  >
                    SJ
                  </div>
                  <div>
                    <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Sarah Jenkins</h4>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tech Recruiter @ TechCorp Global • Active Now</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/ai/mock-interview/active"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    style={{
                      backgroundColor: "var(--primary-container-bg)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">video_call</span>
                    Join Technical Room
                  </Link>
                </div>
              </div>

              {/* Messages Thread Body */}
              <div
                className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar"
                style={{ backgroundColor: "var(--surface-container-lowest)" }}
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === "You" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] mb-1 font-mono" style={{ color: "var(--text-muted)" }}>
                      {m.sender} • {m.time}
                    </span>
                    <div
                      className="p-4 rounded-2xl text-xs max-w-lg leading-relaxed shadow-sm"
                      style={
                        m.sender === "You"
                          ? {
                              background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                              color: "#ffffff",
                              borderBottomRightRadius: 0,
                            }
                          : {
                              backgroundColor: "var(--bg-card)",
                              color: "var(--text-primary)",
                              border: "1px solid var(--outline)",
                              borderBottomLeftRadius: 0,
                            }
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Chips */}
              <div
                className="px-6 py-2.5 flex items-center gap-2 overflow-x-auto"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderTop: "1px solid var(--outline)",
                }}
              >
                <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--text-muted)" }}>Quick Reply:</span>
                {[
                  "Yes, 3 PM IST works great!",
                  "Should I share my GitHub portfolio?",
                  "Can we reschedule to 4 PM?",
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(chip)}
                    className="px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--outline)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--outline)";
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Form Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-4 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--surface-container)",
                  borderTop: "1px solid var(--outline)",
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Write a response to Sarah Jenkins..."
                  className="flex-1 h-11 rounded-full px-5 text-xs outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--outline)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--outline)";
                  }}
                />
                <button
                  type="submit"
                  className="px-6 h-11 rounded-full text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
                    boxShadow: "var(--shadow-btn-red)",
                  }}
                >
                  <span>Send</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
