"use client";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    fetch("/api/employer/subscribe")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDetails(data.activeSubscription);
        } else {
          setError(data.error || "Could not retrieve subscription details.");
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex text-text-primary">
      <CandidateSidebar />
      <div className="w-full min-h-screen p-8 pt-24 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-green-500 mb-4">Success!</h1>
        {loading && <p>Loading your receipt...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && details && (
          <div className="p-8 border border-white/10 rounded-lg max-w-lg w-full text-center bg-[#1E1E1E]">
            <h2 className="text-2xl mb-4">Your subscription is active</h2>
            <p className="text-gray-400">Plan ID: {details.planId}</p>
            <p className="text-gray-400 mb-6">Status: {details.status}</p>
            <button onClick={() => router.push("/dashboard")} className="px-6 py-2 bg-blue-600 rounded">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}