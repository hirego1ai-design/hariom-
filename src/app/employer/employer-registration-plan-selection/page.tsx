"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

async function readJsonResponse(response: Response) {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`The server returned an empty response (${response.status}).`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
}

export default function EmployerPlanSelectionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/employer/subscribe");
        const data = await readJsonResponse(res);
        if (!res.ok || !data.success) throw new Error(data.error || "Unable to load plans.");
        setPlans(data.plans || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load plans.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await readJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Subscription failed.");
      if (data.success) {
        router.push("/employer/employer-registration-document-verification?model=subscription");
      } else {
        alert("Subscription failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Subscription failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const activePlans = plans.filter(p => !p.isArchived);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      
      <div className="max-w-6xl mx-auto py-4 px-4 overflow-hidden ml-[116px] lg:ml-auto w-full">
        {/* Registration Progress Stepper */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div className="w-10 h-0.5 bg-emerald-500"></div>
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div className="w-10 h-0.5 bg-emerald-500"></div>
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div className="w-10 h-0.5 bg-primary"></div>
            <div className="w-8 h-8 rounded-full bg-primary text-white border-2 border-primary flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div className="w-10 h-0.5 bg-white/10"></div>
            <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs">
              5
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display-xl text-headline-md mb-1 font-bold">
            Select your hiring power.
          </h1>
          <p className="text-[#CBD5E1] max-w-xl mx-auto font-body-md text-xs">
            Scale your hiring with dynamic SaaS plans. Start with our free trial or select an enterprise packages pack to begin screening.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center max-w-xl mx-auto">
            <span className="material-symbols-outlined text-amber-400 text-4xl">cloud_off</span>
            <h2 className="text-lg font-bold text-white mt-3">Plans could not be loaded</h2>
            <p className="text-sm text-[#CBD5E1] mt-2">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="btn-3d-blue mt-5 px-6 h-10 rounded-xl text-xs font-bold text-white">Try again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {activePlans.map(p => {
              let accentColor = "border-white/10";
              let badge = null;

              if (p.price === 0) {
                badge = "TRIAL CAMPAIGN";
                accentColor = "border-amber-500/30";
              } else if (p.name.toLowerCase().includes("hyper")) {
                badge = "MOST POPULAR";
                accentColor = "border-[#FF5252]/40 bg-surface-container-high ring-2 ring-[#FF5252]/20";
              }

              return (
                <div key={p.id} className={`glass-card p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden ${accentColor}`}>
                  {badge && (
                    <div className="absolute top-0 right-0 bg-primary px-3 py-0.5 rounded-bl-xl text-[9px] font-extrabold text-white uppercase tracking-wider">
                      {badge}
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-label-md text-[#94A3B8] uppercase tracking-widest">
                      {p.price === 0 ? "Entry Pack" : "Scaling Fast"}
                    </span>
                    <h3 className="font-headline-md text-lg text-white font-bold mt-1">{p.name}</h3>
                    
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                      <span className="font-display-lg text-display-md text-white font-bold">₹{p.price}</span>
                      <span className="text-[#94A3B8] text-xs"> / month</span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] mb-6">{p.description}</p>

                    <ul className="space-y-3 mb-6 text-xs text-[#CBD5E1]">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                        <span>{p.jobPostsQuota === 9999 ? "Unlimited" : p.jobPostsQuota} Active Job Postings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                        <span>{p.resumeUnlocksQuota === 9999 ? "Unlimited" : p.resumeUnlocksQuota} Profile Unlocks</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                        <span>{p.aiInterviewsQuota === 9999 ? "Unlimited" : p.aiInterviewsQuota} Interview Screenings</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(p.id)}
                    disabled={submitting}
                    className="btn-3d-blue w-full h-11 rounded-xl text-xs font-bold text-white uppercase tracking-wide"
                  >
                    {submitting ? "Selecting..." : p.price === 0 ? "Activate Free Trial" : "Buy Plan & Continue"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
