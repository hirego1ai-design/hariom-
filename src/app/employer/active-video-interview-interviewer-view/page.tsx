"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE33() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

      <div className="flex flex-col lg:flex-row gap-6">
        <section className="w-full lg:w-[68%] relative p-6 flex flex-col gap-6">
          <div className="flex-1 relative rounded-lg overflow-hidden glass-edge group">
            <img className="w-full h-full object-cover" data-alt="A professional young software engineer, male, early 30s, sitting in a modern, well-lit home office with acoustic panels in the background. He is wearing a dark grey polo shirt, looking directly into the webcam with a friendly, focused expression during a high-stakes video interview. The lighting is cinematic, highlighting his face against a slightly blurred tech-heavy background with soft blue accent lighting. The image style is sharp, professional, and consistent with a high-end enterprise AI platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDFdqrTKoa0gfoTRMsRN4niam6XMM6O9DmCoI5qh_SX5DC_VUhdyVJYF2wQYnv4AdwGcN25fxUNykf8joMrqXyNur6jb8rs8f0PVTaDbjzxwW-RQeieMlok-RYIgf5koBIXBdhm1coKIRXDUKEHTaeFaBEgMf_LrKCMg583clKy7deHVtVGsNQQK7Vj_NZzseI_iEZak9lAHm6gUbKjHlYbcExATmTVTv-HjHWH61FC9tLJXhYe17GydLOivjCl6BPHpodPwYdOsY" />
            <div className="absolute bottom-4 left-4 glass-card px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="font-body-md text-white font-medium">Candidate: Alex Chen</span>
            </div>
            <div className="absolute top-4 right-4 w-64 aspect-video rounded-lg overflow-hidden glass-edge shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform">
              <img className="w-full h-full object-cover" data-alt="A professional female interviewer in her 40s, wearing a modern navy blazer and a white shirt. She is in a minimalist corporate office with a large glass window behind her showing a subtle city bokeh. She has a composed, attentive expression, representing the interviewer view. The lighting is warm and authoritative, fitting the professional dark-mode UI aesthetic of HireGo AI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA49D0iIptFNYK8UmuEnLQKzM3ByO7hw5BrRPHANCR5eTQev0UiSfIhLw6ZOY0uVY8JvA_yLt_o-W6RBAYeySlgCKpxj2-wVjbOLSWcQk4HxO6VoTZ3dtBNJbr_5rYcGIizrDH72dPdiNyxviT9LHoLJ0Otfjf2Dhv1bvL1IS7tt_ZTVO1Ucz6hHzyej9b3Z9QOSmBwQzy-ml46pp4Fhe1XQkVl8s7MsEdogNwh7co2zeUD-DRmvVCJOfW3c_gBXDpGO0_bHsBqMA" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] font-label-md text-white">You (Interviewer)</div>
            </div>
          </div>
          <div className="h-[80px] w-full flex items-center justify-between px-6 glass-card rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white hover:text-primary transition-colors">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white">
                <span className="material-symbols-outlined">videocam</span>
              </button>
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white">
                <span className="material-symbols-outlined">present_to_all</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white">
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white relative">
                <span className="material-symbols-outlined">edit_note</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
              </button>
              <button className="w-[50px] h-[50px] rounded-full flex items-center justify-center button-3d-ghost text-white">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <button className="h-[50px] px-8 rounded-full button-3d-red font-headline-md text-white text-[14px] uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">call_end</span>
              End Interview
            </button>
          </div>
        </section>
        <aside className="w-full lg:w-[32%] p-6 flex flex-col gap-6 border-l border-white/5 bg-surface-container-low/30 backdrop-blur-sm overflow-y-auto custom-scrollbar">
          <button className="w-full btn-primary-red h-[50px] rounded-full font-bold flex items-center justify-center gap-2 mb-4">
            <span className="material-symbols-outlined">add</span>
            Post a Job
          </button>

          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20">
                <img className="w-full h-full object-cover" data-alt="Close-up professional headshot of Alex Chen, the candidate, for a profile summary card. Clear skin, gentle smile, modern tech aesthetic. Soft top-down lighting, deep dark background to match the platform's dark mode." src="https://lh3.googleusercontent.com/aida-public/AB6AXuASCUXJlic8CXsAkMNVffQKSmMu-Sfh2MDxGAmi53ERWUjVzyDjjRjYknuDzAJQOixAMTVN5pfDJn94gcUcNii5ZQHrfaDEkFsBAeOxtbWRjn4el0L3mmBVLboMmh5bUjP4iTkLUpxrVMLGnw4miTNlVNh0EawTVnna1JLhi2zeT0EAIZgnbgfMEdj1tFYgFkKoWPDrefPbtM5R4qLolY8gFV-rCUZH8k8fr8QfmoKb9ottIgaSYUdsMUnVb9FjKBJXCPujbCcgssw" />
              </div>
              <div>
                <h3 className="font-display-lg text-[20px] text-white">Alex Chen</h3>
                <p className="font-body-md text-text-secondary">Senior Frontend Engineer</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-md p-2 border border-white/5">
                <p className="text-[10px] uppercase text-text-secondary font-label-md">Experience</p>
                <p className="text-white font-medium">8 Years</p>
              </div>
              <div className="bg-white/5 rounded-md p-2 border border-white/5">
                <p className="text-[10px] uppercase text-text-secondary font-label-md">Match Score</p>
                <p className="text-secondary font-bold">94% AI Match</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-[16px] text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                  AI Suggestions
                </h4>
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">LIVE ANALYSIS</span>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary/5 border border-secondary/20 p-3 rounded-lg hover:bg-secondary/10 transition-colors cursor-pointer group">
                  <p className="font-body-md text-white text-[14px]">"Based on his mention of 'Distributed Systems', ask about his experience with Kafka in low-latency environments."</p>
                  <div className="mt-2 flex justify-end">
                    <span className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg opacity-60">
                  <p className="font-body-md text-white/70 text-[14px]">"Ask about a time he had to resolve a high-stakes technical debt conflict with product owners."</p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <h4 className="font-headline-md text-[16px] text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">sticky_note_2</span>
                Private Notes
              </h4>
              <div className="flex-1 relative">
                <textarea className="w-full h-full bg-[#1A1A1A] rounded-lg border border-white/10 p-4 font-body-md text-white focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-text-muted" placeholder="Type your observation here..."></textarea>
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-[11px] text-text-secondary font-data-md">Auto-saving...</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-auto">
            <button className="w-full h-[50px] rounded-full button-3d-blue text-white font-headline-md text-[14px] uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">save</span>
              Finalize Feedback
            </button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
