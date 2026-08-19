"use client";

import { useRouter } from "next/navigation";
import WebRTCInterviewRoom from "@/components/interview/WebRTCInterviewRoom";
import { PageContainer } from "@/components/employer/LayoutSystem";

export default function EmployerLiveInterviewPage() {
  const router = useRouter();
  return <PageContainer><div className="h-[calc(100vh-96px)] min-h-[620px] flex flex-col gap-4">
    <div className="flex items-center justify-between"><div><p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">HireGo Managed Hiring · Interview Portal</p><h1 className="text-xl font-bold text-white">Final technical interview</h1></div><span className="text-xs text-text-secondary">Candidate: Alex Chen · Round 3</span></div>
    <div className="flex-1 min-h-0"><WebRTCInterviewRoom roomId="managed-hiring-final-round" roundTitle="Round 3: Technical & System Design" candidateName="Alex Chen" interviewerName="HireGo AI Panel" onComplete={(id) => router.push(`/employer/final-round-feedback${id ? `?interviewId=${encodeURIComponent(id)}` : ""}`)} /></div>
  </div></PageContainer>;
}
