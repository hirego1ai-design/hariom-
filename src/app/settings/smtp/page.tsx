"use client";

import CandidateSidebar from "@/components/candidate/CandidateSidebar";
import React, { useEffect, useState } from "react";

type Provider = "SENDGRID" | "ZEPTOMAIL";
type Notice = { tone: "success" | "error"; message: string } | null;

type EmailDeliveryConfig = {
  primaryProvider: Provider;
  fallbackProvider: Provider;
  autoFailover: boolean;
  sendgridEnabled: boolean;
  zeptoMailEnabled: boolean;
  sendgridFromEmail: string;
  zeptoMailFromEmail: string;
  sendgridKeyConfigured: boolean;
  zeptoMailKeyConfigured: boolean;
};

type FormConfig = EmailDeliveryConfig & {
  sendgridApiKey: string;
  zeptoMailApiKey: string;
};

const initialConfig: FormConfig = {
  primaryProvider: "SENDGRID",
  fallbackProvider: "ZEPTOMAIL",
  autoFailover: true,
  sendgridEnabled: false,
  zeptoMailEnabled: false,
  sendgridFromEmail: "",
  zeptoMailFromEmail: "",
  sendgridKeyConfigured: false,
  zeptoMailKeyConfigured: false,
  sendgridApiKey: "",
  zeptoMailApiKey: "",
};

const providerInfo: Record<Provider, { name: string; apiKeyName: string }> = {
  SENDGRID: { name: "SendGrid", apiKeyName: "SendGrid API key" },
  ZEPTOMAIL: { name: "ZeptoMail", apiKeyName: "ZeptoMail API key" },
};

export default function SmtpConfigurationPage({ embedded = false }: { embedded?: boolean }) {
  const [config, setConfig] = useState<FormConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testingProvider, setTestingProvider] = useState<Provider | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfiguration = async () => {
      try {
        const response = await fetch("/api/admin/email-delivery/config");
        if (!response.ok) throw new Error("Could not load email delivery settings.");
        const result = (await response.json()) as { config?: EmailDeliveryConfig };
        if (isMounted && result.config) setConfig({ ...initialConfig, ...result.config });
      } catch (error) {
        if (isMounted) {
          setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not load email delivery settings." });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadConfiguration();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateConfig = <K extends keyof FormConfig>(key: K, value: FormConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const selectProvider = (field: "primaryProvider" | "fallbackProvider", provider: Provider) => {
    setConfig((current) => {
      if (field === "primaryProvider") {
        return { ...current, primaryProvider: provider, fallbackProvider: current.fallbackProvider === provider ? current.primaryProvider : current.fallbackProvider };
      }
      return { ...current, fallbackProvider: provider, primaryProvider: current.primaryProvider === provider ? current.fallbackProvider : current.primaryProvider };
    });
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/email-delivery/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryProvider: config.primaryProvider,
          fallbackProvider: config.fallbackProvider,
          autoFailover: config.autoFailover,
          sendgridEnabled: config.sendgridEnabled,
          zeptoMailEnabled: config.zeptoMailEnabled,
          sendgridFromEmail: config.sendgridFromEmail,
          zeptoMailFromEmail: config.zeptoMailFromEmail,
          ...(config.sendgridApiKey ? { sendgridApiKey: config.sendgridApiKey } : {}),
          ...(config.zeptoMailApiKey ? { zeptoMailApiKey: config.zeptoMailApiKey } : {}),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not save email delivery settings.");

      setConfig((current) => ({
        ...current,
        sendgridApiKey: "",
        zeptoMailApiKey: "",
        sendgridKeyConfigured: current.sendgridKeyConfigured || Boolean(current.sendgridApiKey),
        zeptoMailKeyConfigured: current.zeptoMailKeyConfigured || Boolean(current.zeptoMailApiKey),
      }));
      setNotice({ tone: "success", message: result.message || "Email delivery configuration saved." });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not save email delivery settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async (provider: Provider) => {
    if (!testEmail.trim()) {
      setNotice({ tone: "error", message: "Enter a recipient email address before sending a test." });
      return;
    }

    setTestingProvider(provider);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/email-delivery/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail.trim(), provider }),
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(result.message || `Could not send a ${providerInfo[provider].name} test email.`);
      setNotice({ tone: "success", message: result.message || `Test email sent through ${providerInfo[provider].name}.` });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Could not send test email." });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary">
      {!embedded && <CandidateSidebar />}
      <main className={`mx-auto min-h-screen max-w-container-max space-y-6 ${embedded ? "" : "p-gutter"}`}>
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <span className="material-symbols-outlined text-[17px]">mail</span>
              Transactional email
            </div>
            <h1 className="font-display-lg text-display-lg text-white">Email delivery configuration</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">Configure SendGrid and ZeptoMail for OTPs, password resets, invitations, and system notifications.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            <span className="material-symbols-outlined text-[17px]">shield_lock</span>
            Saved API keys are never shown
          </div>
        </header>

        {notice && (
          <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" : "border-red-400/25 bg-red-500/10 text-red-100"}`} role="status">
            <span className="material-symbols-outlined text-[18px]">{notice.tone === "success" ? "check_circle" : "error"}</span>
            <span>{notice.message}</span>
          </div>
        )}

        <section className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6" aria-labelledby="routing-heading">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-primary/15 p-2 text-primary"><span className="material-symbols-outlined">alt_route</span></div>
            <div>
              <h2 id="routing-heading" className="text-base font-bold text-white">Delivery routing</h2>
              <p className="mt-1 text-xs text-text-muted">Select which provider delivers first and which one is held in reserve.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["primaryProvider", "fallbackProvider"] as const).map((field) => (
              <label key={field} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-secondary">{field === "primaryProvider" ? "Primary provider" : "Fallback provider"}</span>
                <select value={config[field]} onChange={(event) => selectProvider(field, event.target.value as Provider)} disabled={isLoading} className="h-11 w-full rounded-lg border border-white/10 bg-[#1E1E1E] px-3 text-sm font-semibold text-white outline-none focus:border-primary disabled:opacity-50">
                  <option value="SENDGRID">SendGrid</option>
                  <option value="ZEPTOMAIL">ZeptoMail</option>
                </select>
              </label>
            ))}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-secondary">Automatic failover</span>
              <button type="button" role="switch" aria-checked={config.autoFailover} onClick={() => updateConfig("autoFailover", !config.autoFailover)} disabled={isLoading} className={`flex h-11 w-full items-center justify-between rounded-lg px-3 text-xs font-bold transition ${config.autoFailover ? "bg-primary/15 text-primary" : "bg-white/5 text-text-muted"}`}>
                {config.autoFailover ? "Enabled" : "Disabled"}
                <span className={`relative h-6 w-11 rounded-full transition ${config.autoFailover ? "bg-primary" : "bg-white/20"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${config.autoFailover ? "translate-x-6" : "translate-x-1"}`} /></span>
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2" aria-label="Email providers">
          {(["SENDGRID", "ZEPTOMAIL"] as Provider[]).map((provider) => {
            const isSendGrid = provider === "SENDGRID";
            const enabledKey = isSendGrid ? "sendgridEnabled" : "zeptoMailEnabled";
            const senderKey = isSendGrid ? "sendgridFromEmail" : "zeptoMailFromEmail";
            const apiKey = isSendGrid ? "sendgridApiKey" : "zeptoMailApiKey";
            const keyConfigured = isSendGrid ? config.sendgridKeyConfigured : config.zeptoMailKeyConfigured;
            const isEnabled = config[enabledKey];
            const providerName = providerInfo[provider].name;

            return (
              <article key={provider} className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{providerName}</h2>
                      {config.primaryProvider === provider && <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Primary</span>}
                      {config.fallbackProvider === provider && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">Fallback</span>}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-muted">{isSendGrid ? "Use SendGrid as a scalable transactional email provider." : "Use ZeptoMail as an independently configured delivery fallback."}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={isEnabled} onClick={() => updateConfig(enabledKey, !isEnabled)} disabled={isLoading} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${isEnabled ? "bg-primary" : "bg-white/15"}`}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    <span className="sr-only">{isEnabled ? `Disable ${providerName}` : `Enable ${providerName}`}</span>
                  </button>
                </div>

                <div className={`space-y-4 ${isEnabled ? "" : "pointer-events-none opacity-45"}`}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-text-secondary">Verified sender address</span>
                    <input type="email" value={config[senderKey]} onChange={(event) => updateConfig(senderKey, event.target.value)} placeholder="notifications@yourdomain.com" autoComplete="email" disabled={isLoading} className="h-11 w-full rounded-xl border border-white/10 bg-[#1E1E1E] px-3 text-sm text-white outline-none placeholder:text-text-muted focus:border-primary disabled:opacity-50" />
                    <span className="mt-1.5 block text-[11px] text-text-muted">Use an address verified with {providerName}.</span>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-text-secondary">{providerInfo[provider].apiKeyName}</span>
                    <input type="password" value={config[apiKey]} onChange={(event) => updateConfig(apiKey, event.target.value)} placeholder={keyConfigured ? "Saved securely — enter a new key to replace it" : "Enter API key"} autoComplete="new-password" spellCheck={false} disabled={isLoading} className="h-11 w-full rounded-xl border border-white/10 bg-[#1E1E1E] px-3 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-xs placeholder:text-text-muted focus:border-primary disabled:opacity-50" />
                    <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-muted"><span className="material-symbols-outlined text-[14px]">visibility_off</span>{keyConfigured ? "A key is configured. Its value cannot be viewed or recovered." : "No API key is configured yet."}</span>
                  </label>
                </div>
              </article>
            );
          })}
        </section>

        <section className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6" aria-labelledby="test-heading">
          <div className="mb-5"><h2 id="test-heading" className="text-base font-bold text-white">Test email delivery</h2><p className="mt-1 text-xs text-text-muted">Send a live test to confirm each provider&apos;s current configuration.</p></div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="admin@yourdomain.com" autoComplete="email" disabled={isLoading} className="h-11 min-w-0 rounded-xl border border-white/10 bg-[#1E1E1E] px-3 text-sm text-white outline-none placeholder:text-text-muted focus:border-primary disabled:opacity-50" />
            {(["SENDGRID", "ZEPTOMAIL"] as Provider[]).map((provider) => (
              <button key={provider} type="button" onClick={() => sendTestEmail(provider)} disabled={isLoading || testingProvider !== null || !config[provider === "SENDGRID" ? "sendgridEnabled" : "zeptoMailEnabled"]} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                <span className={`material-symbols-outlined text-[17px] ${testingProvider === provider ? "animate-spin" : ""}`}>{testingProvider === provider ? "progress_activity" : "send"}</span>
                {testingProvider === provider ? "Sending…" : `Test ${providerInfo[provider].name}`}
              </button>
            ))}
          </div>
        </section>

        <footer className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-muted">API keys are write-only and should be rotated through this screen when needed.</p>
          <button type="button" onClick={saveConfiguration} disabled={isLoading || isSaving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-white shadow-lg transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60">
            <span className={`material-symbols-outlined text-[17px] ${isSaving ? "animate-spin" : ""}`}>{isSaving ? "progress_activity" : "save"}</span>
            {isSaving ? "Saving…" : "Save email configuration"}
          </button>
        </footer>
      </main>
    </div>
  );
}
