"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Authoritative state from backend
  const [paymentState, setPaymentState] = useState<"PENDING" | "SUCCESS" | "FAILED" | "REJECTED" | "CANCELLED" | "UNKNOWN">("PENDING");
  const [paymentData, setPaymentData] = useState<{
    transaction: any;
    subscription: any;
    credits: any;
    message?: string;
  } | null>(null);

  const orderId = searchParams.get("orderId") || "";
  const gatewayOrderId = searchParams.get("gatewayOrderId") || "";
  const txId = searchParams.get("txId") || "";
  const gateway = searchParams.get("gateway") || "RAZORPAY";

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const queryParams = new URLSearchParams();
        if (orderId) queryParams.set("orderId", orderId);
        if (gatewayOrderId) queryParams.set("gatewayOrderId", gatewayOrderId);
        if (txId) queryParams.set("txId", txId);

        const res = await fetch(`/api/payments/status?${queryParams.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success) {
          const currentStatus = data.status || "PENDING";
          setPaymentState(currentStatus);
          setPaymentData(data);

          // If definitive state reached, stop polling
          if (currentStatus === "SUCCESS" || currentStatus === "FAILED" || currentStatus === "REJECTED") {
            setLoading(false);
            return;
          }
        } else {
          setError(data.error || "Failed to fetch authoritative payment status.");
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Network error fetching payment status");
      }

      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= 12) {
          // 12 polls * 2.5s = 30 seconds -> transition to UNKNOWN timeout state
          setPaymentState("UNKNOWN");
          setLoading(false);
        }
        return next;
      });
    }

    // Initial check
    checkStatus();

    // Poll every 2.5s if still pending
    const intervalId = setInterval(() => {
      if (paymentState === "PENDING" && pollCount < 12) {
        checkStatus();
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [orderId, gatewayOrderId, txId, pollCount, paymentState]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col items-center justify-center p-4 font-[family-name:var(--font-body)]">
      <div className="max-w-lg w-full glass-card p-8 bg-[#16161B] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#448AFF]/5 rounded-full blur-[100px]" />

        {/* 1. PENDING STATE */}
        {paymentState === "PENDING" && (
          <div className="text-center space-y-6 relative z-10 py-6">
            <div className="w-20 h-20 rounded-full bg-[#448AFF]/10 border border-[#448AFF]/30 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-[#448AFF] animate-spin">
                progress_activity
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-white">
                Verifying Payment...
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Securely confirming transaction with {gateway} and awaiting authoritative webhook receipt.
              </p>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#448AFF] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (pollCount + 1) * 9)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Attempt {pollCount + 1}/12 • Do not close or refresh this window
            </p>
          </div>
        )}

        {/* 2. SUCCESS STATE */}
        {paymentState === "SUCCESS" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Payment Verified
              </span>
              <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-white mt-3">
                Subscription Activated!
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Your credits and quota package have been provisioned in full.
              </p>
            </div>

            {/* Quota Balances Card */}
            {paymentData?.credits && (
              <div className="p-4 bg-white/3 rounded-2xl border border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Job Posts</p>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">
                    {paymentData.credits.jobPostsLeft}
                  </p>
                </div>
                <div className="p-2 border-x border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Unlocks</p>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">
                    {paymentData.credits.resumeUnlocksLeft}
                  </p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">AI Interviews</p>
                  <p className="text-base font-extrabold text-white mt-1 font-mono">
                    {paymentData.credits.aiInterviewsLeft}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/employer/dashboard"
                className="w-full py-3.5 rounded-full bg-[#FF5252] text-white font-extrabold text-xs shadow-lg hover:bg-[#E53935] transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Employer Dashboard</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                href="/employer/subscriptions"
                className="text-xs text-slate-400 hover:text-white py-2 transition-colors"
              >
                View Active Plans &amp; Invoices
              </Link>
            </div>
          </div>
        )}

        {/* 3. FAILED STATE */}
        {paymentState === "FAILED" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <span className="material-symbols-outlined text-4xl">cancel</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Payment Failed
              </span>
              <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-white mt-3">
                Transaction Declined
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                The payment attempt was declined or cancelled by the gateway. Zero credits were deducted and your subscription was not charged.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/employer/subscriptions"
                className="w-full py-3.5 rounded-full bg-[#448AFF] text-white font-extrabold text-xs shadow-lg hover:bg-[#2979FF] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Try Another Payment Method</span>
              </Link>
              <Link
                href="/employer/dashboard"
                className="text-xs text-slate-400 hover:text-white py-2 transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* 4. REJECTED STATE (Signature Tamper / Amount Mismatch) */}
        {paymentState === "REJECTED" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <span className="material-symbols-outlined text-4xl">security</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Security Check Failed
              </span>
              <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-white mt-3">
                Verification Rejected
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                The transaction signature could not be verified with the payment gateway. If funds were debited, contact billing@hirego.ai.
              </p>
            </div>

            <Link
              href="/employer/subscriptions"
              className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all block"
            >
              Return to Subscriptions
            </Link>
          </div>
        )}

        {/* 5. UNKNOWN / TIMEOUT STATE */}
        {paymentState === "UNKNOWN" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
              <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Reconciliation in Progress
              </span>
              <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-white mt-3">
                Confirmation Pending
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Gateway verification is taking longer than usual. Our system will automatically credit your account as soon as the gateway confirmation arrives. No duplicate charge will be made.
              </p>
            </div>

            <Link
              href="/employer/dashboard"
              className="w-full py-3.5 rounded-full bg-[#FF5252] text-white font-extrabold text-xs shadow-lg hover:bg-[#E53935] transition-all block"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center text-white">
          <span className="material-symbols-outlined animate-spin text-3xl text-[#448AFF]">progress_activity</span>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
