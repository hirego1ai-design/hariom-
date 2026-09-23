"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const connectedItems = [
  ["Managed Hiring Rules", "managed-hiring"],
  ["Security & Compliance", "security"],
  ["SMTP / Email Delivery", "smtp"],
  ["Payment Gateway", "payment-gateway"],
  ["LLM Usage", "llm-usage"],
  ["Audit Log", "audit-log"],
  ["Platform Analytics", "analytics"],
];

const unavailableItems = [
  "Domain & SSL provider control",
  "Third-party integrations registry",
  "AI agent registry mutations",
  "Legal-document publishing",
];

export default function PlatformSettingsHubPage() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const prefix = isAdmin ? "/admin/settings" : "/settings";

  return (
    <div className="min-h-screen bg-[#090A0F] text-white p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold">Platform Settings Hub</h1>
          <p className="mt-2 text-sm text-gray-400">
            Navigation to settings backed by authoritative server APIs. Browser-only global configuration controls have been removed.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {connectedItems.map(([label, slug]) => (
            <Link key={slug} href={`${prefix}/${slug}`} className="rounded-2xl border border-white/10 bg-[#12131A] p-5 text-sm font-bold hover:border-primary/50">
              {label}
            </Link>
          ))}
          <Link href="/admin/subscriptions" className="rounded-2xl border border-white/10 bg-[#12131A] p-5 text-sm font-bold hover:border-primary/50">
            Subscription Plans
          </Link>
        </section>

        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h2 className="text-sm font-bold text-amber-200">Not exposed without an authoritative API</h2>
          <ul className="mt-3 space-y-2 text-xs text-gray-400">
            {unavailableItems.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
