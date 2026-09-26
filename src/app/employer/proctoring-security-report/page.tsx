"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";
import ProctoringReviewPanel from "@/components/proctoring/ProctoringReviewPanel";

function Content() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId") || "";

  return (
    <PageContainer>
      <div className="mx-auto max-w-5xl space-y-6 py-8">
        <div>
          <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">HireGo · Human review</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Proctoring Security Report</h1>
          <p className="mt-2 text-sm text-slate-400">Recorded browser-integrity evidence for human review.</p>
        </div>
        <ProctoringReviewPanel interviewId={interviewId} live={false} />
      </div>
    </PageContainer>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageContainer><div className="p-8 text-sm text-slate-400">Loading telemetry…</div></PageContainer>}>
      <Content />
    </Suspense>
  );
}
