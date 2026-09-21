"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VideoReport = {
  videoId: string;
  videoUrl: string;
  durationSeconds: number;
  analysisStatus: string;
  transcript: string | null;
  metrics: {
    detectedLanguage: string | null;
    wordsPerMinute: number | null;
    audioQuality: string | null;
    lowConfidence: boolean | null;
  };
  error: string | null;
};

export default function VideoReview({ videoId }: { videoId: string }) {
  const [report, setReport] = useState<VideoReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/candidate/video-resume/status?videoId=${encodeURIComponent(videoId)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Video resume is unavailable for this application.");
        return body as VideoReport;
      })
      .then(setReport)
      .catch(cause => { if (cause.name !== "AbortError") setError(cause.message || "Unable to load video resume."); });
    return () => controller.abort();
  }, [videoId]);

  return <div className="mx-auto max-w-5xl text-white">
    <Link href="/employer/hiring-pipeline" className="text-sm font-semibold text-sky-300 hover:underline">← Back to hiring pipeline</Link>
    <div className="mt-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Candidate evidence</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Video resume review</h1><p className="mt-3 max-w-3xl leading-7 text-slate-300">Hear the candidate’s own explanation and review job related evidence in context. This recording and any automated report are supporting information; your hiring team makes the decision.</p></div>
    {error && <div role="alert" className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">{error}</div>}
    {!error && !report && <div role="status" className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Loading the authorized video and report…</div>}
    {report && <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101d30]" aria-label="Candidate video"><video className="aspect-video w-full bg-black" src={report.videoUrl} controls preload="metadata" playsInline /><div className="p-5 text-sm text-slate-300">Duration: {report.durationSeconds} seconds</div></section>
      <aside className="rounded-3xl border border-white/10 bg-[#101d30] p-6"><h2 className="text-xl font-bold">Report status</h2><p className="mt-3 text-slate-300">{report.analysisStatus === "COMPLETED" ? "Presentation report available" : report.analysisStatus === "PENDING" || report.analysisStatus === "PROCESSING" ? "Analysis is still in progress" : "Analysis is unavailable. Review the video directly."}</p>{report.analysisStatus === "COMPLETED" && <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3 border-b border-white/10 pb-3"><dt className="text-slate-400">Language detected</dt><dd>{report.metrics.detectedLanguage || "Not available"}</dd></div><div className="flex justify-between gap-3 border-b border-white/10 pb-3"><dt className="text-slate-400">Speech pace</dt><dd>{report.metrics.wordsPerMinute ? `${Math.round(report.metrics.wordsPerMinute)} words/min` : "Not available"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-400">Audio quality</dt><dd>{report.metrics.audioQuality || "Not available"}</dd></div></dl>}<p className="mt-6 text-sm leading-6 text-slate-400">Pace and recording quality are descriptive, not a ranking of ability. Language, equipment and accessibility needs can affect these measurements.</p></aside>
      <section className="rounded-3xl border border-white/10 bg-[#101d30] p-6 lg:col-span-2"><h2 className="text-xl font-bold">Transcript</h2>{report.transcript ? <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-200">{report.transcript}</p> : <p className="mt-4 text-slate-400">A transcript is not available. Watch the video to review the candidate’s words.</p>}{report.metrics.lowConfidence && <p className="mt-4 text-sm text-amber-200">The transcript may be less accurate than usual. Check the recording before drawing conclusions.</p>}</section>
    </div>}
  </div>;
}
