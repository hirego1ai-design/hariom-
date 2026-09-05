"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import WebRTCInterviewRoom from "@/components/interview/WebRTCInterviewRoom";
import { PageContainer } from "@/components/employer/LayoutSystem";

function EmployerLiveInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "managed-hiring-final-round";

  const [loading, setLoading] = useState(true);
  const [interviewDetails, setInterviewDetails] = useState<any>(null);

  useEffect(() => {
    if (!searchParams.get("interviewId")) {
      setLoading(false);
      return;
    }

    fetch(`/api/employer/interviews/${searchParams.get("interviewId")}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load interview room details.");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setInterviewDetails(data.interview);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <PageContainer>
        <div className="h-[calc(100vh-96px)] min-h-[620px] flex items-center justify-center text-slate-400">
          Loading secure interview room...
        </div>
      </PageContainer>
    );
  }

  const roomId = interviewDetails?.id || interviewId;
  const roundTitle = interviewDetails?.round || "Final technical interview";
  const candidateName = interviewDetails?.candidateName || "Candidate";
  const jobTitle = interviewDetails?.jobTitle || "Round 3";

  return (
    <PageContainer>
      <div className="h-[calc(100vh-96px)] min-h-[620px] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
              HireGo Managed Hiring · Interview Portal
            </p>
            <h1 className="text-xl font-bold text-white">{roundTitle}</h1>
          </div>
          <span className="text-xs text-text-secondary">
            Candidate: {candidateName} · {jobTitle}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <WebRTCInterviewRoom
            roomId={roomId}
            roundTitle={roundTitle}
            candidateName={candidateName}
            interviewerName="HireGo AI Panel"
            onComplete={(id) =>
              router.push(`/employer/final-round-feedback${id ? `?interviewId=${encodeURIComponent(id)}` : ""}`)
            }
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default function EmployerLiveInterviewPage() {
  return (
    <Suspense fallback={<PageContainer><div className="h-[calc(100vh-96px)] min-h-[620px] flex items-center justify-center text-slate-400">Loading...</div></PageContainer>}>
      <EmployerLiveInterviewContent />
    </Suspense>
  );
}
