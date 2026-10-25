import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminIntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="API & Integrations"
          subtitle="Only authoritative integration controls and evidence are exposed here."
        />
        <main className="mx-auto max-w-5xl space-y-6 p-4 pt-24 sm:p-6 sm:pt-24">
          <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
            <h1 className="text-xl font-bold text-white">No general integrations registry is connected</h1>
            <p className="mt-3 text-sm text-text-secondary">
              HireGo does not currently expose an authoritative registry for ATS, Slack, calendar, or meeting-provider connection state. This screen therefore does not show simulated connected/disconnected badges or browser-only controls.
            </p>
            <p className="mt-3 text-xs text-text-muted">
              Configure supported production integrations through their dedicated audited controls below. Any future third-party connector must add server-side persistence, authorization, credential handling, and audit evidence before appearing as connected here.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2" aria-label="Authoritative integration controls">
            <Link href="/admin/settings/ai-provider-credentials" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <h2 className="font-bold text-white">AI / LLM provider credentials</h2>
              <p className="mt-2 text-xs text-text-muted">Encrypted Gemini, OpenAI, DeepSeek, Kimi, Qwen, Groq, and self-hosted API keys, key rotation and live connection tests.</p>
            </Link>
            <Link href="/admin/settings/smtp" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <h2 className="font-bold text-white">Transactional email</h2>
              <p className="mt-2 text-xs text-text-muted">SendGrid and ZeptoMail routing, write-only credentials, and allowlisted provider tests.</p>
            </Link>
            <Link href="/admin/settings/whatsapp" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <h2 className="font-bold text-white">WhatsApp</h2>
              <p className="mt-2 text-xs text-text-muted">Server-managed Meta webhook and messaging configuration evidence.</p>
            </Link>
            <Link href="/admin/payment-gateways" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <h2 className="font-bold text-white">Payment providers</h2>
              <p className="mt-2 text-xs text-text-muted">Stripe and PayU routing policy with versioned, audited controls.</p>
            </Link>
            <Link href="/admin/communications" className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <h2 className="font-bold text-white">Communication templates</h2>
              <p className="mt-2 text-xs text-text-muted">Transactional template activation and persisted delivery evidence.</p>
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
