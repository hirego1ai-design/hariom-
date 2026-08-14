"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React from "react";
import VideoResumeModule from "@/components/candidate/VideoResumeModule";

export default function CandidateVideoResumePage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="font-display-xl text-headline-md text-text-primary mb-1">My Video Resume</h1>
        <p className="text-text-secondary text-xs">
          Record or upload your 2-minute pitch to increase employer response rates by up to 3x.
        </p>
      </div>

      <VideoResumeModule />
    </div>
    </div>
);
}