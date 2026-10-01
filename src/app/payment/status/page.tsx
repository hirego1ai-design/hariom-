"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type PaymentPayload = {
  success: boolean;
  product?: string;
  status?: string;
  message?: string;
  transaction?: {
    provider?: string;
    amount?: number;
    currency?: string;
    status?: string;
  } | null;
  credits?: {
    jobPostsLeft?: number;
    resumeUnlocksLeft?: number;
    aiInterviewsLeft?: number;
  } | null;
  candidateCredits?: {
    balance: number;
    updatedAt?: string;
  } | null;
  package?: {
    name?: string;
    credits?: number;
    price?: number;
    currency?: string;
  } | null;
};

type PaymentState = "PENDING" | "SUCCESS" | "FAILED" | "REJECTED" | "CANCELLED" | "UNKNOWN";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("PENDING");
  const [paymentData, setPaymentData] = useState<PaymentPayload | null>(null);

  const orderId = searchParams.get("orderId") || "";
  const gatewayOrderId = searchParams.get("gatewayOrderId") || "";
  const txId = searchParams.get("txId") || "";
  const rawGateway = searchParams.get("gateway")?.toUpperCase();
  const cancelled = searchParams.get("cancelled") === "1";

  const displayGateway =
    paymentData?.transaction?.provider === "PAYU" || rawGateway === "PAYU"
      ? "PayU"
      : "Stripe";

  const isCandidateCredits = paymentData?.product === "CANDIDATE_CREDITS";

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let currentPollCount = 0;
    const MAX_POLLS = 12;

    async function checkStatus() {
      if (!mounted) return;

      if (!orderId && !gatewayOrderId && !txId) {
        setError("Payment reference is missing.");
        setPaymentState("REJECTED");
        setLoading(false);
        return;
      }

      if (currentPollCount >= MAX_POLLS) {
        setPaymentState("UNKNOWN");
        setLoading(false);
        return;
      }

      try {
        const query = new URLSearchParams();
        if (orderId) query.set("orderId", orderId);
        if (gatewayOrderId) query.set("gatewayOrderId", gatewayOrderId);
        if (txId) query.set("txId", txId);

        const response = await fetch(`/api/payments/status?${query.toString()}`, {
          cache: "no-store",
        });
        const data: PaymentPayload & { error?: string } = await response.json();

        if (!mounted) return;

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not verify payment status.");
        }

        const status = (data.status || "PENDING") as PaymentState;
        setPaymentData(data);
        setPaymentState(status);

        if (["SUCCESS", "FAILED", "REJECTED"].includes(status)) {
          setLoading(false);
          return;
        }

        if (cancelled && status === "PENDING") {
          setPaymentState("CANCELLED");
          setLoading(false);
          return;
        }
      } catch (cause) {
        if (mounted) {
          setError(cause instanceof Error ? cause.message : "Could not verify payment status.");
        }
      }

      currentPollCount += 1;
      if (mounted) {
        setPollCount(currentPollCount);
        timeoutId = setTimeout(checkStatus, 2500);
      }
    }

    void checkStatus();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [orderId, gatewayOrderId, txId, cancelled]);

  const retryHref = isCandidateCredits ? "/credits" : "/employer/subscriptions";
  const homeHref = isCandidateCredits ? "/candidate/dashboard" : "/employer/dashboard";

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-card p-8 bg-[#16161B] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#448AFF]/5 rounded-full blur-[100px]" />

        {error && paymentState !== "SUCCESS" && (
          <div className="relative z-10 mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        {paymentState === "PENDING" && (
          <div className="text-center space-y-6 relative z-10 py-6">
            <div className="w-20 h-20 rounded-full bg-[#448AFF]/10 border border-[#448AFF]/30 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-[#448AFF] animate-spin">
                progress_activity
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Verifying Payment…</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Confirming the transaction with {displayGateway}. Access is granted only after the verified server-side payment event is recorded.
              </p>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#448AFF] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (pollCount + 1) * 9)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Verification attempt {pollCount + 1}/12
            </p>
          </div>
        )}

        {paymentState === "SUCCESS" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                Payment Verified
              </span>
              <h2 className="text-2xl font-extrabold mt-3">
                {isCandidateCredits ? "Credits Added" : "Subscription Activated"}
              </h2>
              <p className="text-xs text-slate-300 mt-2">
                {isCandidateCredits
                  ? "Your HireGo candidate credit balance was updated only after verified payment confirmation."
                  : "Your purchased employer entitlement has been provisioned."}
              </p>
            </div>

            {isCandidateCredits && paymentData?.candidateCredits && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Current balance</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-400">
                  {paymentData.candidateCredits.balance} credits
                </p>
                {paymentData.package?.credits && (
                  <p className="mt-2 text-xs text-slate-400">
                    {paymentData.package.credits} credits purchased
                    {paymentData.package.name ? ` · ${paymentData.package.name}` : ""}
                  </p>
                )}
              </div>
            )}

            {!isCandidateCredits && paymentData?.credits && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Job Posts</p>
                  <p className="text-base font-extrabold mt-1 font-mono">{paymentData.credits.jobPostsLeft ?? "—"}</p>
                </div>
                <div className="p-2 border-x border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Unlocks</p>
                  <p className="text-base font-extrabold mt-1 font-mono">{paymentData.credits.resumeUnlocksLeft ?? "—"}</p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">AI Interviews</p>
                  <p className="text-base font-extrabold mt-1 font-mono">{paymentData.credits.aiInterviewsLeft ?? "—"}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isCandidateCredits && (
                <Link
                  href="/ai/mock-interview/setup"
                  className="w-full py-3.5 rounded-full bg-[#FF5252] text-white font-extrabold text-xs shadow-lg hover:bg-[#E53935] transition-all block"
                >
                  Start Mock Interview
                </Link>
              )}
              <Link
                href={homeHref}
                className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all block"
              >
                {isCandidateCredits ? "Go to Candidate Dashboard" : "Go to Employer Dashboard"}
              </Link>
            </div>
          </div>
        )}

        {(paymentState === "FAILED" || paymentState === "CANCELLED") && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <span className="material-symbols-outlined text-4xl">cancel</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">
                {paymentState === "CANCELLED" ? "Payment Cancelled" : "Payment Failed"}
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                No credits or subscription entitlement was granted from this attempt.
              </p>
            </div>
            <Link
              href={retryHref}
              className="w-full py-3.5 rounded-full bg-[#448AFF] text-white font-extrabold text-xs block"
            >
              Return to secure checkout
            </Link>
          </div>
        )}

        {paymentState === "REJECTED" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <span className="material-symbols-outlined text-4xl">security</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Verification Rejected</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Payment authenticity could not be verified. No entitlement was granted. If funds were debited, contact billing@hiregoai.com.
              </p>
            </div>
            <Link href={retryHref} className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs block">
              Return
            </Link>
          </div>
        )}

        {paymentState === "UNKNOWN" && (
          <div className="text-center space-y-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
              <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Confirmation Pending</h2>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                The gateway has not produced a verified terminal result yet. Do not pay again for the same order; reconciliation will continue.
              </p>
            </div>
            <Link href={homeHref} className="w-full py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs block">
              Continue to dashboard
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
