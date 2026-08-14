"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to authoritative Employer Subscriptions Store
    router.replace("/employer/subscriptions");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-4">
      <span className="material-symbols-outlined animate-spin text-3xl text-[#448AFF]">progress_activity</span>
      <p className="text-xs text-slate-400 mt-2 font-mono">Redirecting to Secure Subscriptions Hub...</p>
    </div>
  );
}