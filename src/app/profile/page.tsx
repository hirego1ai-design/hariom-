"use client";

import React, { useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"about" | "experience" | "education" | "skills" | "certs">("about");

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex text-white font-sans">
      <CandidateSidebar />

      {/* Main Workspace */}
      <div className="flex-1 ml-[116px] min-h-screen relative overflow-hidden flex flex-col">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Custom Header Bar */}
        <header className="sticky top-0 z-40 h-[64px] backdrop-blur-xl border-b border-white/10 px-8 flex items-center justify-between bg-[#0A0A0C]/80">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white">HireGo AI</h1>
            <span className="text-xs text-white/40">/</span>
            <span className="text-xs text-white/60">Candidate Profile</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-gray-400 hover:text-white cursor-pointer transition-colors">notifications</span>
            <span className="material-symbols-outlined text-gray-400 hover:text-white cursor-pointer transition-colors">settings</span>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
              Proctor Active
            </span>
          </div>
        </header>

        {/* Main Scrollable Profile Container */}
        <main className="flex-1 overflow-y-auto p-8 max-w-6xl w-full mx-auto space-y-8 z-10 relative">
          
          {/* Profile Header Card */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center md:items-end gap-6 shadow-xl relative overflow-hidden bg-white/5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-white/10">
                <img
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Marcus Holloway Portrait"
                />
              </div>
              <button className="absolute -bottom-2 -right-2 bg-white/10 border border-white/20 p-2 rounded-full text-[#FF5252] hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <h2 className="text-2xl font-bold text-white">Marcus Holloway</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-400 justify-center md:justify-start">
                <span>Lead Systems Architect</span>
                <div className="flex items-center gap-1 justify-center md:justify-start text-xs">
                  <span className="material-symbols-outlined text-sm text-[#FF5252]">location_on</span>
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Profile Completion</span>
                <span className="text-[#FF5252] font-semibold">72%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5252] w-[72%] transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-white/10 overflow-x-auto pb-1 no-scrollbar">
            {(["about", "experience", "education", "skills", "certs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 capitalize transition-colors ${
                  activeTab === tab
                    ? "border-[#FF5252] text-[#FF5252]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Details Content Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {activeTab === "about" && (
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-white">Professional Summary</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Seasoned Systems Architect with over 10 years of experience in designing and implementing high-availability distributed systems. Expert in cloud-native technologies, microservices orchestration, and AI-driven infrastructure optimization. Proven track record of leading cross-functional teams to deliver scalable enterprise solutions that drive business growth.
                  </p>
                </div>
              )}

              {activeTab === "experience" && (
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white">Professional Experience</h3>
                  <div className="border-l-2 border-white/10 ml-4 pl-6 space-y-6 relative">
                    <div className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#FF5252] border-2 border-[#0A0A0C]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">Principal Systems Architect</h4>
                          <p className="text-xs text-[#FF5252]">Cyberdyne Systems • Full-time</p>
                        </div>
                        <span className="text-xs text-gray-400">2020 — Present</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-2">
                        • Lead the transition of legacy monolithic architecture to a serverless microservices framework, reducing operational costs by 35%.
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white/20 border-2 border-[#0A0A0C]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white">Senior Cloud Engineer</h4>
                          <p className="text-xs text-[#FF5252]">Nexus Dynamics</p>
                        </div>
                        <span className="text-xs text-gray-400">2016 — 2020</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-2">
                        Built and managed Kubernetes clusters for high-traffic financial applications. Integrated CI/CD pipelines with zero-downtime deployment strategies.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "education" && (
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-white">Education History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="font-bold text-sm text-white">M.S. Computer Science</h4>
                      <p className="text-xs text-gray-400">Stanford University</p>
                      <p className="text-xs text-[#FF5252] mt-1">2014 — 2016</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h4 className="font-bold text-sm text-white">B.S. Software Engineering</h4>
                      <p className="text-xs text-gray-400">UC Berkeley</p>
                      <p className="text-xs text-[#FF5252] mt-1">2010 — 2014</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-white">Core Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Rust", "Go", "Kubernetes", "Terraform", "TypeScript", "Next.js"].map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "certs" && (
                <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                  <h3 className="text-lg font-bold text-white">Certifications</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div>
                        <h4 className="text-sm font-bold text-white">AWS Certified Solutions Architect</h4>
                        <p className="text-xs text-gray-400">Amazon Web Services</p>
                      </div>
                      <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                        VERIFIED
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div>
                        <h4 className="text-sm font-bold text-white">Google Cloud Professional</h4>
                        <p className="text-xs text-gray-400">Google</p>
                      </div>
                      <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Resume Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white">94</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <div className="w-full bg-[#FF5252] text-white py-2 text-center text-xs font-semibold rounded-xl hover:bg-[#FF5252]/90 cursor-pointer transition-colors">
                  Optimize Resume
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}