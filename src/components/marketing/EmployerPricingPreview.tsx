"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function EmployerPricingPreview() {
  const [data, setData] = useState<any>({ plans: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/employer-pricing", { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || "Unable to load pricing.");
        setData(body);
      })
      .catch(() => setData({ plans: [] }))
      .finally(() => setLoading(false));
  }, []);

  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  if (loading) return <div className="rounded-3xl border border-white/10 bg-white/[.04] p-10 text-center text-slate-400">Loading current employer plans…</div>;
  if (!data.plans.length) return <div className="rounded-3xl border border-white/10 bg-white/[.04] p-10 text-center text-slate-400">Employer plans are temporarily unavailable.</div>;

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {data.plans.map((plan: any) => (
          <article key={plan.id} className={`relative overflow-hidden rounded-[28px] border p-6 transition hover:-translate-y-1 ${plan.copilotIncluded ? "border-cyan-300/30 bg-[linear-gradient(145deg,#102b50,#17134a)]" : "border-white/10 bg-white/[.05]"}`}>
            {plan.badgeText ? <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black">{plan.badgeText}</span> : null}
            <h3 className="mt-4 text-2xl font-black">{plan.name}</h3>
            <p className="mt-2 min-h-12 text-sm text-slate-400">{plan.description}</p>
            <p className="mt-5 text-4xl font-black">{money(plan.price, plan.currency)}</p>
            <p className="mt-3 text-xs font-bold text-slate-300">{plan.jobPostsQuota} job post{plan.jobPostsQuota === 1 ? "" : "s"} · {plan.jobValidityDays} days per job</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {(plan.marketingBenefits || []).slice(0, 8).map((benefit: string) => <li key={benefit} className="flex gap-2"><span className="text-emerald-400">✓</span><span>{benefit}</span></li>)}
            </ul>
            <Link href="/register/employer" className="mt-6 inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950">Get started</Link>
          </article>
        ))}
      </div>

    </div>
  );
}
