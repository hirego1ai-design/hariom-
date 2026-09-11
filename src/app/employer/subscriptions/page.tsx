"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { razorpayCheckoutFields } from "@/lib/payments/subscriptionCredits";

export default function EmployerSubscriptionsStorePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [credits, setCredits] = useState<any | null>(null);
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<any>({
    mode: "AUTO",
    primaryGateway: "RAZORPAY",
    allowEmployerSelection: true,
    gatewaysStatus: {
      RAZORPAY: "HEALTHY",
      PAYU: "HEALTHY",
      PHONEPE: "HEALTHY",
    },
  });
  const [selectedGateway, setSelectedGateway] = useState<string>("RAZORPAY");

  // Promo Code state
  const [couponCode, setCouponCode] = useState("");
  const [promoDetails, setPromoDetails] = useState<any | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [subscriptionState, setSubscriptionState] = useState<any | null>(null);
  const [quotas, setQuotas] = useState<any | null>(null);

  async function fetchBillingData() {
    try {
      const res = await fetch("/api/employer/subscribe");
      const data = await res.json();
      
      if (data.success) {
        setPlans(data.plans || []);
        setCredits(data.credits || null);
        setActiveSub(data.activeSubscription || null);
        setActivePlan(data.activePlan || null);
        setSubscriptionState(data.subscriptionState || null);
        setQuotas(data.quotas || null);
      }
      if (data.success) {
        setServices(data.services || []);
      }
      if (data.success && data.gatewayConfig) {
        setGatewayConfig(data.gatewayConfig);
        setSelectedGateway(data.gatewayConfig.primaryGateway);
      }
    } catch (err) {
      console.error("Failed to fetch employer subscription info", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBillingData();
  }, []);

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !checkoutPlan) return;
    setPromoError(null);
    setPromoDetails(null);

    try {
      const res = await fetch(
        `/api/employer/promo/validate?code=${couponCode.toUpperCase()}&planId=${checkoutPlan.id}`
      );
      const data = await res.json();
      if (data.success) {
        setPromoDetails(data);
      } else {
        setPromoError(data.error || "Invalid coupon code");
      }
    } catch (err) {
      console.error(err);
      setPromoError("Failed to validate promo code");
    }
  };

  const handleSubscribe = async () => {
    if (!checkoutPlan) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          promoCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
          paymentMethod: gatewayConfig.allowEmployerSelection ? selectedGateway : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || "Failed to initiate payment gateway checkout");
      }

      const order = data.order;

      if (order.gateway === "RAZORPAY") {
        const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        if (!loaded) {
          throw new Error("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
        }

        const options = {
          ...razorpayCheckoutFields(order),
          name: "HireGo AI",
          description: `Subscription for ${checkoutPlan.name}`,
          handler: function (response: any) {
            router.push(`/payment/status?orderId=${order.orderId}&gatewayOrderId=${response.razorpay_payment_id || order.gatewayOrderId}&gateway=RAZORPAY`);
          },
          modal: {
            ondismiss: function () {
              router.push(`/payment/status?orderId=${order.orderId}&gateway=RAZORPAY&status=CANCELLED`);
            },
          },
          theme: { color: "#FF5252" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setCheckoutPlan(null);
      } else if (order.gateway === "PHONEPE") {
        if (order.checkoutUrl) {
          window.location.href = order.checkoutUrl;
        } else {
          router.push(`/payment/status?orderId=${order.orderId}&gatewayOrderId=${order.gatewayOrderId}&gateway=PHONEPE`);
        }
      } else if (order.gateway === "PAYU") {
        if (order.checkoutUrl && order.checkoutUrl.startsWith("http")) {
          window.location.href = order.checkoutUrl;
        } else {
          router.push(`/payment/status?orderId=${order.orderId}&gatewayOrderId=${order.gatewayOrderId}&gateway=PAYU`);
        }
      } else {
        throw new Error("This payment provider is not supported by this checkout screen.");
      }
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      alert("Checkout error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateTrial = async (trialPlan: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/employer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: trialPlan.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Congratulations! Your ${trialPlan.name} is now active.`);
        await fetchBillingData();
      } else {
        alert("Trial activation failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const trialPlan = plans.find(p => p.price === 0 && !p.isArchived);
  const paidPlans = plans.filter(p => p.price > 0 && !p.isArchived);

  return (
    <div className="max-w-6xl mx-auto py-6 font-[family-name:var(--font-body)]">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#448AFF] text-3xl">credit_score</span>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-white">
              Self-Service Subscription Hub
            </h1>
          </div>
          <p className="text-[#CBD5E1] text-sm max-w-xl">
            Choose a startup credit pack to self-service your hiring. Instantly unlock job slots, AI vetting filters, and video interview matches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/employer/revenue-and-billing-management"
            className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold flex items-center gap-2 text-white hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Revenue & Billing
          </Link>
          <button
            onClick={() => router.push("/employer/employer-subscription-and-plans")}
            className="btn-3d-blue px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 text-white shadow-[var(--shadow-btn-blue)] transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-[16px]">handshake</span>
            Managed Hiring (SLA Contracts)
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Active Quota Widget Grid */}
          <div className="glass-card p-6 bg-[#16161B] border border-white/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#448AFF]/5 rounded-full blur-[120px] -mr-40 -mt-40"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
              <div>
                <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider mb-1">Current Active Plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-[family-name:var(--font-display)] font-extrabold text-white">
                    {activePlan ? activePlan.name : "Free / Pay-As-You-Go"}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${
                    subscriptionState?.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                      : subscriptionState?.status === "EXPIRING"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                      : subscriptionState?.status === "EXPIRED"
                      ? "bg-red-500/15 text-red-400 border-red-500/20"
                      : "bg-white/5 text-[#94A3B8] border-white/10"
                  }`}>
                    {subscriptionState?.status || "INACTIVE"}
                  </span>
                </div>
                {activePlan && (
                  <p className="text-xs text-[#CBD5E1] mt-1 font-mono">
                    ₹{activePlan.price.toLocaleString("en-IN")} / {activePlan.validityMonths || 1} Month(s)
                  </p>
                )}
              </div>

              {activeSub && (
                <div className="text-right text-xs text-[#CBD5E1]">
                  <p className="text-[#94A3B8] mb-1">Subscription Expiry</p>
                  <p className="font-bold text-white font-mono">{new Date(activeSub.endDate).toLocaleDateString()}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    {subscriptionState?.daysRemaining ?? 0} Days Remaining
                  </p>
                </div>
              )}
            </div>

            {/* Configured Credit Balances */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="bg-white/3 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#94A3B8] text-[10px] font-semibold uppercase">Job Posts</span>
                  <span className="text-xs font-mono font-extrabold text-white">
                    {credits?.jobPostsLeft ?? 0} / {quotas?.jobPosts?.total ?? 10}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-red rounded-full"
                    style={{ width: `${Math.min(100, ((credits?.jobPostsLeft ?? 0) / (quotas?.jobPosts?.total || 10)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/3 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#94A3B8] text-[10px] font-semibold uppercase">Candidate Unlocks</span>
                  <span className="text-xs font-mono font-extrabold text-white">
                    {credits?.resumeUnlocksLeft ?? 0} / {quotas?.resumeUnlocks?.total ?? 100}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue rounded-full"
                    style={{ width: `${Math.min(100, ((credits?.resumeUnlocksLeft ?? 0) / (quotas?.resumeUnlocks?.total || 100)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white/3 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#94A3B8] text-[10px] font-semibold uppercase">AI Interviews</span>
                  <span className="text-xs font-mono font-extrabold text-white">
                    {credits?.aiInterviewsLeft ?? 0} / {quotas?.aiInterviews?.total ?? 40}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-purple rounded-full"
                    style={{ width: `${Math.min(100, ((credits?.aiInterviewsLeft ?? 0) / (quotas?.aiInterviews?.total || 40)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trial Promotion Banner */}
          {trialPlan && !activePlan && (
            <div className="glass-card rounded-2xl p-6 border border-amber-400/30 bg-[#1A140B] flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="bg-amber-400 text-black text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full mb-3 inline-block">
                  Trial Campaign
                </span>
                <h3 className="font-headline-md text-lg text-white mb-1">Configure Free Trial In 1-Click</h3>
                <p className="text-xs text-[#CBD5E1] max-w-xl">
                  {trialPlan.description} Experience automatic proctoring filters with zero deposit required.
                </p>
              </div>
              <button
                onClick={() => handleActivateTrial(trialPlan)}
                disabled={submitting}
                className="btn-primary-blue px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-lg whitespace-nowrap flex-shrink-0"
              >
                Activate Free Trial
              </button>
            </div>
          )}

          {/* Pricing Comparison Grid */}
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF5252]">storefront</span>
              Startup Subscriptions Store
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paidPlans.map((p) => {
                const isCurrent = activeSub?.planId === p.id;
                
                // Color tags based on startup tier names
                let accentColor = "from-[#448AFF] to-[#1565C0]"; // Blue default
                let textColor = "text-[#448AFF]";
                let borderColor = "border-white/10";
                
                if (p.name.toLowerCase().includes("bootstrap")) {
                  accentColor = "from-[#90A4AE] to-[#455A64]"; // Gray
                  textColor = "text-[#90A4AE]";
                } else if (p.name.toLowerCase().includes("growth") || p.name.toLowerCase().includes("hyper")) {
                  accentColor = "from-[#FF5252] to-[#D32F2F]"; // Red/Coral
                  textColor = "text-[#FF5252]";
                  borderColor = "border-[#FF5252]/30";
                } else if (p.name.toLowerCase().includes("unicorn")) {
                  accentColor = "from-[#8E24AA] to-[#5E35B1]"; // Purple/Gold
                  textColor = "text-purple-400";
                  borderColor = "border-purple-500/30";
                }

                return (
                  <div
                    key={p.id}
                    className={`glass-card p-6 bg-[#16161B] rounded-2xl flex flex-col justify-between border relative overflow-hidden transition-all duration-300 hover:scale-102 ${
                      isCurrent ? "border-[#4CAF50] ring-1 ring-[#4CAF50]" : borderColor
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 right-0 bg-[#4CAF50] text-[#1a1a1a] font-bold text-[9px] uppercase tracking-wider py-1 px-4 rounded-bl-xl z-20">
                        Current Active Plan
                      </div>
                    )}

                    <div className="relative z-10">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${textColor}`}>
                        {p.name}
                      </p>
                      <h4 className="text-3xl font-[family-name:var(--font-display)] font-extrabold text-white tracking-tight mb-4">
                        ₹{p.price}
                        <span className="text-xs text-[#94A3B8] font-normal font-sans"> / month</span>
                      </h4>
                      
                      <p className="text-xs text-[#CBD5E1] mb-6 leading-relaxed">
                        {p.description}
                      </p>

                      <hr className="border-white/5 my-4" />

                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Credits Included:</p>
                      <ul className="space-y-3 mb-6 text-xs text-[#CBD5E1]">
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                          {p.jobPostsQuota === 9999 ? "Unlimited" : `${p.jobPostsQuota}`} Job Post Slots
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                          {p.resumeUnlocksQuota === 9999 ? "Unlimited" : `${p.resumeUnlocksQuota}`} Vetted Profiles Unlocked
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                          {p.aiInterviewsQuota === 9999 ? "Unlimited" : `${p.aiInterviewsQuota}`} AI Video Screening Credits
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                          {p.applicationsQuota} Applications Limits
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutPlan(p);
                        setPromoDetails(null);
                        setCouponCode("");
                        setPromoError(null);
                      }}
                      disabled={isCurrent}
                      className={`w-full py-3 rounded-full text-xs font-extrabold tracking-wider transition-all relative z-10 ${
                        isCurrent
                          ? "bg-white/5 border border-[#4CAF50]/40 text-[#4CAF50] cursor-not-allowed"
                          : `bg-gradient-to-tr ${accentColor} text-white font-bold hover:shadow-lg hover:scale-102`
                      }`}
                    >
                      {isCurrent ? "Plan Active" : "Buy Credits Package"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Services Credits Costs Checklist */}
          <div className="glass-card bg-[#16161B] border border-white/10 rounded-2xl p-6">
            <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#40C4FF]">check_circle</span>
              AI Recruitment Services Catalog
            </h3>
            <p className="text-xs text-[#94A3B8] mb-6">
              Below is the list of modular AI recruiting agents and background check verification tools. Check costs and consume credits self-service.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(s => (
                <div key={s.serviceKey} className="p-4 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">{s.serviceName}</h4>
                    <p className="text-[10px] text-[#94A3B8] font-mono">Service Key: {s.serviceKey}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mb-1.5 border ${
                      s.billingType === "INCLUDED"
                        ? "bg-green/10 text-green border-green/20"
                        : s.billingType === "CREDIT_BASED"
                        ? "bg-[#448AFF]/15 text-[#448AFF] border-[#448AFF]/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {s.billingType.replace("_", " ")}
                    </span>
                    <p className="text-[11px] font-bold text-white">
                      {s.billingType === "INCLUDED" ? "Free (Included)" : `${s.creditCost} Credits`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Mock Payment Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#16161B] border border-white/10 rounded-3xl p-6 w-full max-w-md relative overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#448AFF]/5 rounded-full blur-[90px]"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                HireGo AI Secure Checkout
              </h3>
              <button
                onClick={() => setCheckoutPlan(null)}
                className="material-symbols-outlined text-[#94A3B8] hover:text-white transition-colors"
              >
                close
              </button>
            </div>

            {/* Dynamic Price Calculation Summary */}
            <div className="p-4 bg-white/3 rounded-2xl border border-white/5 mb-4 relative z-10">
              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Purchase Summary</p>
              
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span>Original Price ({checkoutPlan.name})</span>
                  <span>₹{checkoutPlan.price}</span>
                </div>
                
                {promoDetails && (
                  <div className="flex justify-between items-center text-green-400 font-medium">
                    <span>Discount Applied ({promoDetails.code})</span>
                    <span>- ₹{promoDetails.savings}</span>
                  </div>
                )}

                <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center font-bold text-sm text-white">
                  <span>Final Price</span>
                  <span className="text-lg text-[#FF5252]">₹{promoDetails ? promoDetails.finalPrice : checkoutPlan.price}</span>
                </div>
              </div>
            </div>

            {/* Promo Code Engine Input */}
            <div className="mb-6 relative z-10">
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                Apply Promotion Coupon / Referral Code
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#1A1A20] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#448AFF]"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors"
                >
                  Apply
                </button>
              </div>
              
              {promoError && (
                <p className="text-[10px] text-[#FF5252] mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  {promoError}
                </p>
              )}
              {promoDetails && (
                <p className="text-[10px] text-[#4CAF50] mt-1.5 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  Promo Code Applied! You saved ₹{promoDetails.savings}!
                </p>
              )}
            </div>

            {/* Payment Gateway Selection */}
            <div className="space-y-3 mb-6 relative z-10">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Payment Gateway
                </label>
                {!gatewayConfig.allowEmployerSelection && (
                  <span className="text-[9px] text-[#448AFF] bg-[#448AFF]/10 border border-[#448AFF]/20 px-2 py-0.5 rounded-full font-bold">
                    Auto-Selected: {gatewayConfig.primaryGateway}
                  </span>
                )}
              </div>

              {gatewayConfig.allowEmployerSelection ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["RAZORPAY", "PAYU", "PHONEPE"]
                    .filter((gw) => gatewayConfig.gatewaysStatus?.[gw] !== "DISABLED")
                    .map((gw) => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setSelectedGateway(gw)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                          selectedGateway === gw
                            ? "bg-[#448AFF]/15 border-[#448AFF] text-white shadow"
                            : "bg-white/3 border-white/5 text-[#CBD5E1] hover:bg-white/5"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {gw === "RAZORPAY" ? "payments" : gw === "PHONEPE" ? "qr_code" : "account_balance"}
                        </span>
                        <span className="font-mono text-[11px]">{gw}</span>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="p-3 bg-white/3 rounded-xl border border-white/5 text-xs text-slate-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#448AFF] text-[18px]">lock</span>
                  <span>Payment will be securely routed via <strong>{gatewayConfig.primaryGateway}</strong> per Admin policy.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 relative z-10">
              <button
                onClick={handleSubscribe}
                disabled={submitting}
                className="flex-1 btn-3d-blue py-3 rounded-full text-xs font-extrabold text-white shadow-[var(--shadow-btn-blue)] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Securing payment gateway...
                  </>
                ) : (
                  `Proceed to Secure Checkout`
                )}
              </button>
              <button
                onClick={() => setCheckoutPlan(null)}
                disabled={submitting}
                className="px-5 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#CBD5E1]"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-[10px] text-center text-[#94A3B8] mt-4 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-green-500">verified_user</span>
              100% Secure 256-Bit Encrypted Payment Flow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
