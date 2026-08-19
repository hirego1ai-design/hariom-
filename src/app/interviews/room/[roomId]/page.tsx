"use client";

import { useRouter, useParams } from "next/navigation";
import WebRTCInterviewRoom from "@/components/interview/WebRTCInterviewRoom";

export default function CandidateInterviewRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  return <main className="min-h-screen bg-[#09090B] p-4 md:p-8"><div className="max-w-7xl mx-auto h-[calc(100vh-64px)] min-h-[620px]"><div className="mb-3"><p className="text-xs text-indigo-300 font-bold uppercase tracking-[0.2em]">HireGo AI secure interview portal</p><h1 className="text-lg text-white font-bold">Candidate interview room</h1></div><WebRTCInterviewRoom roomId={params.roomId} candidateName="Candidate" interviewerName="HireGo AI Interview Panel" onComplete={() => router.push("/interviews")} /></div></main>;
}
