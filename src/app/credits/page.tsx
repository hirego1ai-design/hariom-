"use client";

import { useCallback, useEffect, useState } from "react";
import CandidateSidebar from "@/components/candidate/CandidateSidebar";

type Service = { serviceKey: string; name: string; description: string | null; creditCost: number };
type Ledger = { id: string; type: string; amount: number; balanceAfter: number; serviceKey: string | null; reference: string | null; createdAt: string };
type CreditPackage = { id: string; code: string; name: string; description: string | null; credits: number; price: number; currency: string; sortOrder: number };
type CheckoutOrder = {
  orderId: string;
  gateway: "STRIPE" | "PAYU";
  packageName: string;
  credits: number;
  checkoutUrl: string;
  checkoutParams?: Record<string, unknown>;
};

function submitPayU(url: string, params: Record<string, unknown>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function CandidateCreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [requesting, setRequesting] = useState("");
  const [purchasing, setPurchasing] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [returnTo, setReturnTo] = useState<"mock-interview" | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/candidate/credits", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load candidate credits.");
      setBalance(data.wallet.balance);
      setServices(data.services || []);
      setPackages(data.packages || []);
      setPurchaseStatus(data.purchaseStatus || "PAYMENT_CONFIGURATION_UNAVAILABLE");
      setLedger(data.ledger || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load candidate credits.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const requestedReturn = search.get("returnTo") === "mock-interview" ? "mock-interview" : null;
    setReturnTo(requestedReturn);
    const orderId = search.get("paymentOrderId");
    if (!orderId) return;
    if (search.get("cancelled") === "1") {
      setError("Payment was cancelled. No credits were added.");
      window.history.replaceState({}, "", "/credits");
      return;
    }

    let stopped = false;
    let timer: number | undefined;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const response = await fetch(`/api/candidate/credits/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Could not verify payment.");
        if (data.status === "SUCCESS") {
          setSuccessNotice(`Payment verified. ${data.order.credits} credits are now available in your wallet.`);
          setError("");
          await load();
          if (requestedReturn === "mock-interview") {
            window.location.assign("/ai/mock-interview/setup");
            return;
          }
          window.history.replaceState({}, "", "/credits");
          return;
        }
        if (data.status === "FAILED") {
          setError("Payment failed. No credits were added.");
          window.history.replaceState({}, "", "/credits");
          return;
        }
        if (!stopped && attempts < 12) {
          timer = window.setTimeout(() => void poll(), 2000);
        } else if (!stopped) {
          setSuccessNotice("Payment is still awaiting verified gateway confirmation. Your wallet will update only after confirmation.");
        }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : "Could not verify payment.");
      }
    };
    void poll();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [load]);

  const buyCredits = async (pkg: CreditPackage) => {
    setPurchasing(pkg.id);
    setError("");
    setSuccessNotice("");
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/candidate/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod: "AUTO",
          ...(returnTo === "mock-interview" ? { returnTo } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not create secure checkout.");
      const order = data.order as CheckoutOrder;
      if (!order.checkoutUrl) throw new Error("Payment provider did not return a checkout destination.");
      if (order.gateway === "PAYU") {
        if (!order.checkoutParams) throw new Error("PayU checkout parameters are missing.");
        submitPayU(order.checkoutUrl, order.checkoutParams);
        return;
      }
      window.location.assign(order.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start payment.");
      setPurchasing("");
    }
  };

  const requestService = async (service: Service) => {
    setRequesting(service.serviceKey);
    setError("");
    setSuccessNotice("");
    try {
      const response = await fetch(`/api/candidate/services/${encodeURIComponent(service.serviceKey)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not request this service.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request this service.");
    } finally {
      setRequesting("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <CandidateSidebar />
      <main className="flex-1 ml-0 md:ml-[116px] max-w-5xl p-6 lg:p-10">
        <header className="mb-8">
          <p className="text-primary text-xs font-bold uppercase tracking-wider">Candidate account</p>
          <h1 className="mt-2 text-3xl font-extrabold">Career Credits</h1>
          <p className="mt-3 max-w-3xl text-sm text-text-secondary">
            Credits are separate from employer credits. They can be used for AI Mock Interviews and career services; they cannot buy an artificial score, badge, or job outcome.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {successNotice && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {successNotice}
          </div>
        )}

        <section className="mb-10 grid gap-5 sm:grid-cols-2">
          <div className="glass-card rounded-3xl border border-white/10 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Available wallet balance</p>
            <p className="mt-4 text-4xl font-extrabold">
              {balance === null ? "…" : balance} <span className="text-sm font-semibold text-text-secondary">credits</span>
            </p>
            <p className="mt-3 text-xs text-text-muted">1 credit = ₹1.00 INR</p>
          </div>

          <div className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Live Voice Practice</p>
              <p className="mt-2 text-sm text-white/80 font-medium">Ready for real-time interview practice with Sara.</p>
            </div>
            <a
              href="/ai/mock-interview/setup"
              className="mt-4 inline-flex items-center justify-center rounded-xl btn-3d-red px-5 py-3 text-xs font-bold text-white text-center"
            >
              Start Live Interview
            </a>
          </div>
        </section>

        {packages.length > 0 && (
          <section className="mb-10" aria-label="Buy candidate credits">
            <h2 className="text-lg font-bold">Buy credits</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Choose a credit pack and pay securely. Your credits will appear after payment is confirmed.
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <article key={pkg.id} className="glass-card rounded-3xl border border-white/10 p-6">
                  <h3 className="font-bold">{pkg.name}</h3>
                  {pkg.description && <p className="mt-2 text-sm text-text-secondary">{pkg.description}</p>}
                  <p className="mt-5 text-3xl font-extrabold">
                    {pkg.credits} <span className="text-sm font-semibold text-text-secondary">credits</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {pkg.currency.toUpperCase()} {pkg.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => void buyCredits(pkg)}
                    disabled={purchasing !== ""}
                    className="mt-5 w-full rounded-xl btn-3d-red px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {purchasing === pkg.id ? "Opening secure checkout…" : "Buy securely"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-bold">Credit history</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            {ledger.length === 0 ? (
              <p className="p-5 text-sm text-text-secondary">No credit activity yet.</p>
            ) : (
              ledger.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-white/10 p-4 last:border-0">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <span>{entry.reference || entry.type}</span>
                    </p>
                    <p className="text-xs text-text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={entry.amount < 0 ? "text-red-300 font-bold" : "text-green font-bold"}>
                      {entry.amount > 0 ? "+" : ""}{entry.amount}
                    </p>
                    <p className="text-xs text-text-muted">Balance {entry.balanceAfter}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
