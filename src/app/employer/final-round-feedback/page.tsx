"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/employer/LayoutSystem";

const ratingOptions = ["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE", "STRONG_NO"] as const;
const scoreFields = [
  ["communication", "Communication"], ["technical", "Technical Proficiency"], ["cultureFit", "Culture Fit"], ["problemSolving", "Problem Solving"], ["enthusiasm", "Enthusiasm"],
] as const;

export default function FinalRoundFeedbackPage() {
  const [interviewId, setInterviewId] = useState("");
  useEffect(() => setInterviewId(new URLSearchParams(window.location.search).get("interviewId") || ""), []);
  const [rating, setRating] = useState<typeof ratingOptions[number] | "">("");
  const [scores, setScores] = useState<Record<string, number>>({ communication: 5, technical: 5, cultureFit: 5, problemSolving: 5, enthusiasm: 5 });
  const [strengths, setStrengths] = useState("");
  const [improvement, setImprovement] = useState("");
  const [recommendation, setRecommendation] = useState<"PROCEED" | "ON_HOLD" | "REJECT" | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setSuccess("");
    if (!interviewId) { setError("This feedback form is missing the interview ID. Open it from a specific interview."); return; }
    if (!rating || !recommendation) { setError("Select an overall rating and final recommendation."); return; }
    if (strengths.trim().length < 50 || improvement.trim().length < 50) { setError("Strengths and improvement notes must each be at least 50 characters."); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/employer/interviews/${encodeURIComponent(interviewId)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ overallRating: rating, ...scores, strengths, improvement, recommendation, redFlags: [] }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to submit feedback.");
      setSuccess(result.message); 
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to submit feedback."); }
    finally { setSaving(false); }
  }

  return <PageContainer><div className="max-w-4xl mx-auto py-8 px-4">
    <div className="mb-7"><p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview workflow · Final round</p><h1 className="font-display-lg text-3xl text-text-primary mb-2">Final Round Feedback</h1><p className="text-text-secondary text-sm">Complete the scorecard before moving the candidate to the next hiring decision.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <section className="glass-card rounded-xl p-5"><h2 className="text-white font-bold mb-4">Overall rating</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-2">{ratingOptions.map(option => <button type="button" key={option} onClick={() => setRating(option)} className={`rounded-lg border p-3 text-xs font-bold ${rating === option ? "bg-primary text-white border-primary" : "border-white/10 text-text-secondary hover:bg-white/5"}`}>{option.replaceAll("_", " ")}</button>)}</div></section>
      <section className="glass-card rounded-xl p-5"><h2 className="text-white font-bold mb-4">Competency scores</h2><div className="space-y-4">{scoreFields.map(([key, label]) => <label key={key} className="block text-sm text-text-secondary"> <span className="flex justify-between"><span>{label}</span><b className="text-primary">{scores[key]}</b></span><input className="w-full accent-red-500" type="range" min="1" max="10" value={scores[key]} onChange={e => setScores({ ...scores, [key]: Number(e.target.value) })} /></label>)}</div></section>
      <div className="grid md:grid-cols-2 gap-5"><label className="glass-card rounded-xl p-5 text-sm text-text-secondary">Key strengths<textarea className="mt-3 w-full h-36 rounded-lg bg-black/20 border border-white/10 p-3 text-white" minLength={50} value={strengths} onChange={e => setStrengths(e.target.value)} placeholder="At least 50 characters" /></label><label className="glass-card rounded-xl p-5 text-sm text-text-secondary">Areas to improve<textarea className="mt-3 w-full h-36 rounded-lg bg-black/20 border border-white/10 p-3 text-white" minLength={50} value={improvement} onChange={e => setImprovement(e.target.value)} placeholder="At least 50 characters" /></label></div>
      <section className="glass-card rounded-xl p-5"><h2 className="text-white font-bold mb-4">Final recommendation</h2><div className="flex flex-wrap gap-2">{(["PROCEED", "ON_HOLD", "REJECT"] as const).map(option => <button type="button" key={option} onClick={() => setRecommendation(option)} className={`rounded-lg border px-5 py-3 text-xs font-bold ${recommendation === option ? "bg-primary text-white border-primary" : "border-white/10 text-text-secondary hover:bg-white/5"}`}>{option.replace("_", " ")}</button>)}</div></section>
      {error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>}{success && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">{success}</p>}
      <div className="flex gap-3"><button disabled={saving} type="submit" className="btn-primary-red h-12 px-7 rounded-full text-white font-bold">{saving ? "Submitting..." : "Submit Final Feedback"}</button><Link href="/employer/upcoming-interviews-list" className="h-12 px-7 rounded-full border border-white/10 text-text-secondary flex items-center">Back to Interviews</Link></div>
    </form>
  </div></PageContainer>;
}
