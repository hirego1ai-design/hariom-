const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ----------------------------------------------------
// CF-SERIES (CF1 - CF10) CREATION / UPGRADE
// ----------------------------------------------------

// CF01: Inbox & Messages (/messages/chat)
ensureDir(path.join(baseDir, 'messages', 'chat'));
fs.writeFileSync(
  path.join(baseDir, 'messages', 'chat', 'page.tsx'),
`"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CandidateChatPage() {
  const [messages, setMessages] = useState([
    { sender: "Recruiter (TechCorp)", text: "Hi Rahul! We loved your AI mock interview score. Are you free for a technical sync tomorrow at 3 PM?", time: "10:14 AM" },
    { sender: "You", text: "Hi! Yes, 3 PM works perfectly for me. Should I prepare any specific topics?", time: "10:18 AM" },
    { sender: "Recruiter (TechCorp)", text: "Mainly System Design and React performance optimization. See you then!", time: "10:20 AM" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "You", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-white">Candidate Messaging Hub (CF01)</h1>
          <p className="text-text-muted text-sm">Direct communications with hiring managers, recruiters, and AI interview assistants.</p>
        </div>
        <Link href="/messages" className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors">
          ← Back to Inbox
        </Link>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 h-[500px] flex flex-col justify-between p-6">
        <div className="space-y-4 overflow-y-auto pr-2">
          {messages.map((m, idx) => (
            <div key={idx} className={\`flex flex-col \${m.sender === "You" ? "items-end" : "items-start"}\`}>
              <span className="text-[10px] text-text-muted mb-1">{m.sender} • {m.time}</span>
              <div className={\`p-3.5 rounded-2xl text-xs max-w-md font-body-md \${
                m.sender === "You" ? "bg-primary text-white rounded-br-none" : "bg-white/10 text-text-primary rounded-bl-none border border-white/10"
              }\`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="pt-4 border-t border-white/10 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message to recruiter..."
            className="flex-1 h-11 rounded-full bg-[#1E1E1E] border border-white/10 px-5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50"
          />
          <button type="submit" className="px-6 h-11 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
`
);

// CF02: Notifications Center (/notifications)
ensureDir(path.join(baseDir, 'notifications'));
fs.writeFileSync(
  path.join(baseDir, 'notifications', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function NotificationsCenterPage() {
  const [items, setItems] = useState([
    { id: 1, title: "Interview Scheduled!", desc: "Senior Frontend Engineer round confirmed for tomorrow, 3:00 PM.", read: false, time: "10 mins ago" },
    { id: 2, title: "AI Resume Score Updated", desc: "Your resume score increased to 92/100 after adding GraphQL experience.", read: false, time: "2 hours ago" },
    { id: 3, title: "New Job Match: TechLead AI", desc: "Vanguard Systems posted a role matching 96% of your skills.", read: true, time: "1 day ago" },
  ]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-white">Notifications Center (CF02)</h1>
          <p className="text-text-muted text-sm">Real-time alerts for application status, interview schedules, and AI insights.</p>
        </div>
        <button onClick={markAllRead} className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors">
          Mark All Read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={\`glass-card p-4 rounded-2xl border transition-all flex items-center justify-between \${
            item.read ? "border-white/5 opacity-70" : "border-primary/40 bg-primary/5"
          }\`}>
            <div className="flex items-center gap-3">
              <span className={\`w-2.5 h-2.5 rounded-full \${item.read ? "bg-white/20" : "bg-primary animate-pulse"}\`} />
              <div>
                <h3 className="font-bold text-sm text-white">{item.title}</h3>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            </div>
            <span className="text-[11px] text-text-muted font-mono">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

// CF03: AI Career Prediction & Analytics (/ai/career-prediction)
ensureDir(path.join(baseDir, 'ai', 'career-prediction'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'career-prediction', 'page.tsx'),
`"use client";

import React from "react";

export default function CareerPredictionPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">AI Career Prediction & Salary Trajectory (CF03)</h1>
        <p className="text-text-muted text-sm">Predict your 3-year career path, target roles, and potential market compensation using AI benchmarking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Predicted 1-Year Title</p>
          <h3 className="font-bold text-2xl text-white">Lead Frontend Architect</h3>
          <p className="text-green text-xs font-bold">Probability: 89% match</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Estimated Salary Range</p>
          <h3 className="font-bold text-2xl text-gold-payment">₹28.5 LPA – ₹36.0 LPA</h3>
          <p className="text-green text-xs font-bold">+34% growth projection</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Top Target Companies</p>
          <h3 className="font-bold text-2xl text-primary">Stripe, Razorpay, Atlassian</h3>
          <p className="text-text-muted text-xs">High demand alignment</p>
        </div>
      </div>
    </div>
  );
}
`
);

// CF04: AI Resume Score & Optimizer (/ai/resume-score)
ensureDir(path.join(baseDir, 'ai', 'resume-score'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'resume-score', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function ResumeScorePage() {
  const [score, setScore] = useState(88);
  const [suggestions, setSuggestions] = useState([
    "Add quantitative metrics (e.g. 'Improved speed by 40%')",
    "Include System Design & Micro-frontends keywords",
    "Add 2 GitHub repository links to project section"
  ]);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">AI Resume Score & Optimization (CF04)</h1>
        <p className="text-text-muted text-sm">Instant ATS resume analysis and AI-driven recommendations to boost callback rates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center font-bold text-3xl text-white bg-primary/10">
            {score}/100
          </div>
          <h3 className="font-bold text-base text-white">ATS HireScore</h3>
          <p className="text-xs text-green font-bold">Top 5% of Candidates</p>
        </div>

        <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-base text-white">AI Enhancement Suggestions</h3>
          <ul className="space-y-2">
            {suggestions.map((item, idx) => (
              <li key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
`
);

// CF05: Skill Gap Analysis (/ai/skill-gap)
ensureDir(path.join(baseDir, 'ai', 'skill-gap'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'skill-gap', 'page.tsx'),
`"use client";

import React from "react";

export default function SkillGapPage() {
  const skills = [
    { name: "React 19 & Server Components", level: 95, target: 90, status: "Proficient ✓" },
    { name: "TypeScript Strict Mode", level: 92, target: 85, status: "Proficient ✓" },
    { name: "GraphQL & Relay", level: 60, target: 80, status: "Gap Identified ⚠️" },
    { name: "Docker & Kubernetes", level: 45, target: 70, status: "Gap Identified ⚠️" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">Skill Gap Analysis (CF05)</h1>
        <p className="text-text-muted text-sm">Compare your verified skill matrix against top enterprise job requirements.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        {skills.map((s) => (
          <div key={s.name} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-white">{s.name}</span>
              <span className={s.level >= s.target ? "text-green font-bold" : "text-yellow font-bold"}>{s.status}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-1000" style={{ width: \`\${s.level}%\` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

// CF06: AI Practice Hub (/ai/practice-hub)
ensureDir(path.join(baseDir, 'ai', 'practice-hub'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'practice-hub', 'page.tsx'),
`"use client";

import React from "react";
import Link from "next/link";

export default function PracticeHubPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">AI Interview Practice Hub (CF06)</h1>
        <p className="text-text-muted text-sm">Simulate live technical rounds, behavioral interviews, and coding assessments with AI feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-lg text-white">AI Mock Interview</h3>
          <p className="text-xs text-text-muted">Full 30-minute interactive audio/video interview session.</p>
          <Link href="/ai/mock-interview/active" className="block text-center py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all">
            Start Mock Interview →
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-lg text-white">Communication Coach</h3>
          <p className="text-xs text-text-muted">Analyze speech pace, clarity, filler words, and confidence.</p>
          <Link href="/ai/coach/active" className="block text-center py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
            Launch Coach →
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-lg text-white">Coding Test Arena</h3>
          <p className="text-xs text-text-muted">Solve DSA challenges in real-time proctored web IDE.</p>
          <Link href="/assessment/coding/ide" className="block text-center py-2.5 rounded-full bg-green text-black text-xs font-bold hover:bg-green/90 transition-all">
            Enter IDE →
          </Link>
        </div>
      </div>
    </div>
  );
}
`
);

// CF07: Active Mock Interview (/ai/mock-interview/active)
ensureDir(path.join(baseDir, 'ai', 'mock-interview', 'active'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'mock-interview', 'active', 'page.tsx'),
`"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ActiveMockInterviewPage() {
  const [inCall, setInCall] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);

  const questions = [
    "Explain how React 19 Server Components improve client-side bundle size.",
    "How do you approach optimizing high-throughput WebSocket streams?",
    "Describe a complex architecture challenge you solved recently."
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-white">Active AI Mock Interview (CF07)</h1>
          <p className="text-text-muted text-sm">Live AI Avatar Interrogator • Session Recording Active</p>
        </div>
        <Link href="/ai/practice-hub" className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
          End Session
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter h-[500px]">
        <div className="md:col-span-2 glass-card rounded-2xl border border-white/10 bg-black flex flex-col justify-between p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            REC 00:14:22
          </div>

          <div className="my-auto text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[48px]">smart_toy</span>
            </div>
            <h3 className="font-bold text-lg text-white">AI Interviewer Avatar</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto italic font-display-md">
              "{questions[questionIndex]}"
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setQuestionIndex((prev) => (prev + 1) % questions.length)}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold transition-all shadow-lg"
            >
              Submit Answer & Next Question →
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <h3 className="font-bold text-sm text-white">Real-Time AI Telemetry</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-text-muted block mb-1">Speech Pace</span>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-green w-[85%]" />
              </div>
              <span className="text-[10px] text-green font-bold">142 WPM (Optimal)</span>
            </div>

            <div>
              <span className="text-text-muted block mb-1">Eye Contact & Eye Tracking</span>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-primary w-[92%]" />
              </div>
              <span className="text-[10px] text-primary font-bold">92% Centered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`
);

// CF08: Communication Coach Active (/ai/coach/active)
ensureDir(path.join(baseDir, 'ai', 'coach', 'active'));
fs.writeFileSync(
  path.join(baseDir, 'ai', 'coach', 'active', 'page.tsx'),
`"use client";

import React from "react";
import Link from "next/link";

export default function CommunicationCoachPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-display-lg text-white">AI Communication Coach (CF08)</h1>
          <p className="text-text-muted text-sm">Real-time speech feedback and filler word detector.</p>
        </div>
        <Link href="/ai/practice-hub" className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors">
          Exit Coach
        </Link>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="font-bold text-base text-white">Live Microphone Analysis</h3>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <span className="text-xs text-green font-bold animate-pulse">● Listening... Speaking detected</span>
          <span className="text-xs text-text-muted font-mono">Filler Words: 0 detected</span>
        </div>
      </div>
    </div>
  );
}
`
);

// CF09: Gamification Leaderboard (/leaderboard)
ensureDir(path.join(baseDir, 'leaderboard'));
fs.writeFileSync(
  path.join(baseDir, 'leaderboard', 'page.tsx'),
`"use client";

import React from "react";

export default function LeaderboardPage() {
  const leaders = [
    { rank: 1, name: "Aarav Sharma", score: 98, badge: "Grandmaster 🏆" },
    { rank: 2, name: "Priya Patel", score: 96, badge: "Expert ⭐️" },
    { rank: 3, name: "Rahul Verma", score: 94, badge: "Master 🚀" },
    { rank: 4, name: "Ananya Roy", score: 91, badge: "Pro ⚡" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">Platform Gamification Leaderboard (CF09)</h1>
        <p className="text-text-muted text-sm">Top candidates ranked by verified HireScore, interview badges, and coding challenge streaks.</p>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs text-text-secondary">
          <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
            <tr>
              <th className="p-4">Rank</th>
              <th className="p-4">Candidate</th>
              <th className="p-4">HireScore</th>
              <th className="p-4">Badge Title</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaders.map((l) => (
              <tr key={l.rank} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">#{l.rank}</td>
                <td className="p-4 font-bold text-white">{l.name}</td>
                <td className="p-4 font-bold text-green">{l.score}/100</td>
                <td className="p-4 text-gold-payment font-bold">{l.badge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`
);

// CF10: Referral Program Dashboard (/referrals)
ensureDir(path.join(baseDir, 'referrals'));
fs.writeFileSync(
  path.join(baseDir, 'referrals', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function ReferralProgramPage() {
  const [refLink] = useState("https://hirego.ai/ref/rahul-v");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">Referral Program Dashboard (CF10)</h1>
        <p className="text-text-muted text-sm">Invite fellow developers and recruiters to earn cash rewards and free AI interview tokens.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Referrals</p>
          <h3 className="font-bold text-3xl text-white">12 Users</h3>
          <p className="text-green text-xs font-bold">8 Hired / Active</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Referral Rewards Earned</p>
          <h3 className="font-bold text-3xl text-gold-payment">₹24,000</h3>
          <p className="text-xs text-text-muted">Paid out via UPI</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-sm text-white">Your Personal Referral Link</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={refLink}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-xs font-bold shrink-0 transition-all"
            >
              {copied ? "Copied! ✓" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
`
);

console.log('Successfully created all CF-series (CF1-CF10) dynamic pages!');
