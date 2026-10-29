"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, ShieldCheck, Users, Briefcase, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export type Plan = {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  validityMonths?: number;
  jobPostsQuota?: number;
  jobValidityDays?: number | null;
  resumeUnlocksQuota?: number;
  aiInterviewsQuota?: number;
  marketingBenefits?: string[];
  copilotIncluded?: boolean;
  copilotJobLimit?: number;
  isFeatured?: boolean;
  badgeText?: string | null;
  eligible?: boolean;
  eligibilityReason?: string | null;
  isArchived?: boolean;
};

// Full production-truthful published plans catalog from Supabase
const DEFAULT_PUBLISHED_PLANS: Plan[] = [
  {
    id: "plan-bootstrapped",
    name: "Free Trial",
    description: "First-time employers can experience HireGo with three job posts and comprehensive AI hiring tools.",
    price: 0,
    currency: "INR",
    validityMonths: 1,
    jobPostsQuota: 3,
    jobValidityDays: 7,
    resumeUnlocksQuota: 25,
    aiInterviewsQuota: 10,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: false,
    badgeText: "First-time users",
    marketingBenefits: [
      "3 active job posts included",
      "7-day listing duration per job",
      "25 verified candidate resume unlocks",
      "10 virtual AI candidate interviews",
      "AI Job Description generator",
      "Candidate-job match scoring",
      "Interactive applicant dashboard",
      "Built-in skills assessment suite",
      "Anti-cheating proctoring report",
    ],
    eligible: true,
    isArchived: false,
  },
  {
    id: "plan-hypergrowth",
    name: "Hire One",
    description: "A focused, budget-friendly package tailored for closing one immediate hiring requirement quickly.",
    price: 299,
    currency: "INR",
    validityMonths: 1,
    jobPostsQuota: 1,
    jobValidityDays: 7,
    resumeUnlocksQuota: 50,
    aiInterviewsQuota: 25,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: false,
    badgeText: "Best for 1 role",
    marketingBenefits: [
      "1 targeted active job post",
      "7-day job listing validity",
      "50 verified candidate resume unlocks",
      "25 virtual AI candidate interviews",
      "AI Job Description generation",
      "Candidate-job matching & ranking",
      "Skill assessments & analytics",
      "Virtual interview suite & scoring",
      "Proctoring evidence audit report",
    ],
    eligible: true,
    isArchived: false,
  },
  {
    id: "plan-unicorn",
    name: "Build Team",
    description: "For growing teams and enterprises hiring across multiple roles with advanced AI screening and team access.",
    price: 999,
    currency: "INR",
    validityMonths: 1,
    jobPostsQuota: 4,
    jobValidityDays: 7,
    resumeUnlocksQuota: 200,
    aiInterviewsQuota: 100,
    copilotIncluded: false,
    copilotJobLimit: 0,
    isFeatured: true,
    badgeText: "Most Popular",
    marketingBenefits: [
      "4 active job posts included",
      "7-day listing duration per job",
      "200 verified candidate resume unlocks",
      "100 virtual AI candidate interviews",
      "AI Job Description generation",
      "Advanced multi-skill candidate matching",
      "Full assessments & candidate analytics",
      "Virtual AI interview suite",
      "Comprehensive anti-cheating proctoring",
      "Multi-user team collaboration tools",
      "Priority verification & support",
    ],
    eligible: true,
    isArchived: false,
  },
];

export default function EmployerPlanSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") || "plan-unicorn";

  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PUBLISHED_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Attempt to load dynamic pricing from backend subscription service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch("/api/employer/subscribe", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        clearTimeout(timeoutId);
        if (!response.ok) return; // Fallback to DEFAULT_PUBLISHED_PLANS handles anonymous or onboarding users
        const payload = await response.json();
        if (payload?.success && Array.isArray(payload.plans) && payload.plans.length > 0) {
          const activePlans = payload.plans.filter((plan: Plan) => !plan.isArchived);
          if (activePlans.length > 0) {
            setPlans(activePlans);
          }
        }
      })
      .catch((reason) => {
        // Keep resilient published fallback, log diagnostic if needed
        if (reason?.name !== "AbortError") {
          console.warn("[PlanSelection] Using published plans catalog fallback.");
        }
      })
      .finally(() => setLoading(false));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const money = (amount: number, currency: string) =>
    amount === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  const choosePlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hirego_selected_onboarding_plan", planId);
      } catch {
        /* storage safeguard */
      }
    }
  };

  const proceedToVerification = () => {
    const selected = plans.find((p) => p.id === selectedPlanId) || plans[0];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hirego_selected_onboarding_plan", selected.id);
      } catch {
        /* storage safeguard */
      }
    }
    router.push(`/employer/employer-registration-document-verification?model=subscription&plan=${encodeURIComponent(selected.id)}`);
  };

  const activeSelectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Current Subscription Catalog
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            Choose Your Hiring Subscription Plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            Select the subscription plan that aligns with your company&apos;s current hiring volume.
          </p>
          <p className="mx-auto mt-2 max-w-3xl text-xs text-text-muted">
            Prices and quotas below come from the subscription service. This onboarding step does not activate a plan or bypass payment; purchase and activation occur through the protected subscription checkout after onboarding.
          </p>
        </div>

        {error && (
          <div role="alert" className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const isFeatured = plan.isFeatured || plan.id === "plan-unicorn";

            return (
              <div
                key={plan.id}
                onClick={() => choosePlan(plan.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/[0.08] shadow-xl shadow-primary/10 ring-2 ring-primary"
                    : isFeatured
                    ? "border-primary/40 bg-[#141418] hover:border-primary/70 hover:bg-[#18181f]"
                    : "border-white/10 bg-[#121215] hover:border-white/25 hover:bg-[#16161a]"
                }`}
              >
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2">
                  {plan.badgeText ? (
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        isFeatured
                          ? "bg-primary text-white"
                          : "border border-white/15 bg-white/5 text-text-secondary"
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                  ) : <span />}

                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-white/20 bg-transparent text-transparent"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                </div>

                {/* Plan Title & Price */}
                <div className="mt-5">
                  <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                  {plan.description && (
                    <p className="mt-2 min-h-[36px] text-xs leading-relaxed text-text-secondary">
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-baseline gap-1.5 border-b border-white/10 pb-5">
                    <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                      {money(plan.price, plan.currency || "INR")}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs font-medium text-text-muted">
                        / {plan.validityMonths ? `${plan.validityMonths} mo` : "month"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Quotas Highlights */}
                <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Briefcase className="h-3.5 w-3.5 text-primary" />
                      <span>Job Posts</span>
                    </div>
                    <div className="font-bold text-white">
                      {typeof plan.jobPostsQuota === "number" ? `${plan.jobPostsQuota} active` : "Custom"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      <span>Resumes</span>
                    </div>
                    <div className="font-bold text-white">
                      {typeof plan.resumeUnlocksQuota === "number" ? `${plan.resumeUnlocksQuota} unlocks` : "Standard"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>AI Interviews</span>
                    </div>
                    <div className="font-bold text-white">
                      {typeof plan.aiInterviewsQuota === "number" ? `${plan.aiInterviewsQuota} virtual` : "Included"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Duration</span>
                    </div>
                    <div className="font-bold text-white">
                      {typeof plan.jobValidityDays === "number" ? `${plan.jobValidityDays} days/job` : "30 days"}
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">What&apos;s Included:</p>
                  <ul className="mt-3 space-y-2.5 text-xs text-text-secondary">
                    {(plan.marketingBenefits || []).map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-tight text-white/90">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select Plan Button on Card */}
                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      choosePlan(plan.id);
                    }}
                    className={`w-full rounded-xl py-2.5 px-4 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? "✓ Plan Selected" : "Select This Plan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Action & Continuation Bar */}
        <div className="mt-12 rounded-2xl border border-white/15 bg-gradient-to-r from-[#141418] via-[#17171d] to-[#141418] p-6 shadow-2xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Currently Selected:</span>
                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                  {activeSelectedPlan.name}
                </span>
                <span className="text-sm font-bold text-white">
                  ({money(activeSelectedPlan.price, activeSelectedPlan.currency || "INR")})
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                You can review or activate this plan in your dashboard after completing business document verification.
              </p>
            </div>

            <button
              type="button"
              onClick={proceedToVerification}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              <span>Continue to Verification</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
