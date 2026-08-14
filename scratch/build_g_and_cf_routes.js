const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ----------------------------------------------------
// G-SERIES (G1 - G13) CREATION
// ----------------------------------------------------

// G01: Platform Settings Hub
ensureDir(path.join(baseDir, 'settings', 'hub'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'hub', 'page.tsx'),
`"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PlatformSettingsHubPage() {
  const [siteName, setSiteName] = useState("HireGo AI");
  const [supportEmail, setSupportEmail] = useState("support@hirego.ai");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Platform settings saved successfully!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Platform Settings Hub (G01)</h1>
        <p className="text-text-muted text-sm">Configure global application defaults, branding, and system-wide toggles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <form onSubmit={handleSave} className="md:col-span-2 glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Platform Brand Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-text-secondary block mb-1">System Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">System Maintenance Mode</p>
              <p className="text-[11px] text-text-muted">Pause public registrations and lock candidate login.</p>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                maintenanceMode ? "bg-red-500 text-white" : "bg-white/10 text-text-muted"
              }\`}
            >
              {maintenanceMode ? "ACTIVE (Maintenance)" : "OFF (Live)"}
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
          >
            Save Configuration
          </button>
        </form>

        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-sm text-white">Quick Settings Jump</h3>
          {[
            { label: "Security & Compliance (G02)", href: "/settings/security" },
            { label: "Domain & SSL Settings (G03)", href: "/settings/domain" },
            { label: "SMTP Email Setup (G04)", href: "/settings/smtp" },
            { label: "WhatsApp Gateway (G05)", href: "/settings/whatsapp" },
            { label: "Payment Config (G06)", href: "/settings/payment-gateway" },
            { label: "API Integrations (G07)", href: "/settings/integrations" },
            { label: "LLM Usage Monitor (G08)", href: "/settings/llm-usage" },
            { label: "System Audit Log (G09)", href: "/settings/audit-log" },
            { label: "AI Agent Manager (G10)", href: "/settings/ai-agents" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-text-secondary hover:text-white transition-colors"
            >
              → {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`
);

// G03: Domain & SSL Settings
ensureDir(path.join(baseDir, 'settings', 'domain'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'domain', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function DomainSslSettingsPage() {
  const [domain, setDomain] = useState("portal.hirego.ai");
  const [sslStatus, setSslStatus] = useState("Active (Let's Encrypt Wildcard)");
  const [toast, setToast] = useState<string | null>(null);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Domain DNS & SSL configuration updated!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Domain & SSL Settings (G03)</h1>
        <p className="text-text-muted text-sm">Manage custom domain routing, CNAME records, and SSL encryption certificates.</p>
      </div>

      <form onSubmit={handleUpdate} className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Primary Custom Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            SSL Certificate Status: <span className="text-green">{sslStatus}</span>
          </p>
          <p className="text-[11px] text-text-muted">Auto-renews in 64 days • TLS 1.3 Strict Security Enabled</p>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
        >
          Verify & Bind Domain
        </button>
      </form>
    </div>
  );
}
`
);

// G04: SMTP Email Configuration
ensureDir(path.join(baseDir, 'settings', 'smtp'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'smtp', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function SmtpConfigurationPage() {
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const testConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setToast("SMTP Test Email sent successfully!");
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">SMTP Email Configuration (G04)</h1>
        <p className="text-text-muted text-sm">Configure transactional email servers for OTPs, interview invites, and system alerts.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">SMTP Host</label>
          <input
            type="text"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Username</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            {isTesting ? "Testing Relay..." : "Send Test Email"}
          </button>
          <button
            onClick={() => {
              setToast("SMTP Settings Saved!");
              setTimeout(() => setToast(null), 3000);
            }}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
          >
            Save Gateway
          </button>
        </div>
      </div>
    </div>
  );
}
`
);

// G05: WhatsApp API Configuration
ensureDir(path.join(baseDir, 'settings', 'whatsapp'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'whatsapp', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function WhatsappApiConfigPage() {
  const [phoneNumberId, setPhoneNumberId] = useState("109823471092");
  const [accessToken, setAccessToken] = useState("EAAGz...w0192");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">WhatsApp Business API Setup (G05)</h1>
        <p className="text-text-muted text-sm">Integrate Meta Cloud API for instant WhatsApp interview notifications & candidate nudges.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Phone Number ID</label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Permanent Access Token</label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <button
          onClick={() => {
            setToast("WhatsApp Business API connected successfully!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-green text-black font-bold text-xs hover:bg-green/90 shadow-lg transition-all"
        >
          Connect WhatsApp API
        </button>
      </div>
    </div>
  );
}
`
);

// G06: Payment Gateway Configuration
ensureDir(path.join(baseDir, 'settings', 'payment-gateway'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'payment-gateway', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function PaymentGatewayConfigPage() {
  const [razorpayKey, setRazorpayKey] = useState("rzp_live_8910239102");
  const [stripeKey, setStripeKey] = useState("pk_live_51M01923091");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Payment Gateways Configuration (G06)</h1>
        <p className="text-text-muted text-sm">Manage Razorpay, Stripe, and Bank Transfer checkout webhooks.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-xl">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Razorpay Live Key ID</label>
          <input
            type="text"
            value={razorpayKey}
            onChange={(e) => setRazorpayKey(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Stripe Publishable Key</label>
          <input
            type="text"
            value={stripeKey}
            onChange={(e) => setStripeKey(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white font-mono"
          />
        </div>

        <button
          onClick={() => {
            setToast("Payment credentials updated!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-gold-payment text-black font-bold text-xs hover:bg-gold-payment/90 shadow-lg transition-all"
        >
          Save Gateway Keys
        </button>
      </div>
    </div>
  );
}
`
);

// G07: API & Integrations Hub
ensureDir(path.join(baseDir, 'settings', 'integrations'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'integrations', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function ApiIntegrationsHubPage() {
  const [integrations, setIntegrations] = useState([
    { name: "Greenhouse ATS", connected: true, category: "HRIS / ATS" },
    { name: "Lever Recruiting", connected: true, category: "HRIS / ATS" },
    { name: "Slack Notifications", connected: true, category: "Chat Ops" },
    { name: "Google Calendar", connected: false, category: "Scheduling" },
    { name: "Zoom Video Meetings", connected: true, category: "Video Interviews" },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const toggleIntegration = (name: string) => {
    setIntegrations((prev) =>
      prev.map((item) => (item.name === name ? { ...item, connected: !item.connected } : item))
    );
    setToast(\`Integration '\${name}' status updated!\`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">API & Integrations Hub (G07)</h1>
        <p className="text-text-muted text-sm">Connect third-party ATS platforms, communication channels, and calendar syncs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {integrations.map((item) => (
          <div key={item.name} className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-text-muted">{item.category}</span>
              <h3 className="font-bold text-base text-white mt-2">{item.name}</h3>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className={\`text-xs font-bold \${item.connected ? "text-green" : "text-text-muted"}\`}>
                {item.connected ? "Connected ✓" : "Disconnected"}
              </span>
              <button
                onClick={() => toggleIntegration(item.name)}
                className={\`px-3 py-1 rounded-full text-xs font-bold transition-all \${
                  item.connected ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-primary text-white hover:bg-primary-light"
                }\`}
              >
                {item.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

// G08: LLM Cost & Usage Monitor
ensureDir(path.join(baseDir, 'settings', 'llm-usage'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'llm-usage', 'page.tsx'),
`"use client";

import React from "react";

export default function LlmUsageMonitorPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">LLM Cost & Token Usage Monitor (G08)</h1>
        <p className="text-text-muted text-sm">Track real-time token consumption across OpenAI, Anthropic Claude, and Local Llama models.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total Monthly Token Usage</p>
          <h3 className="font-bold text-3xl text-white mt-1">142.8 M Tokens</h3>
          <p className="text-green text-xs mt-2 font-bold">+18% vs last month</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Total AI API Spend</p>
          <h3 className="font-bold text-3xl text-gold-payment mt-1">₹4,20,000</h3>
          <p className="text-text-muted text-xs mt-2 font-bold">Budget cap: ₹6,00,000</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Avg Response Latency</p>
          <h3 className="font-bold text-3xl text-green mt-1">320 ms</h3>
          <p className="text-green text-xs mt-2 font-bold">Fast response rate</p>
        </div>
      </div>
    </div>
  );
}
`
);

// G09: System Audit Log
ensureDir(path.join(baseDir, 'settings', 'audit-log'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'audit-log', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function SystemAuditLogPage() {
  const [filter, setFilter] = useState("ALL");

  const logs = [
    { id: "LOG-01", time: "16:10:04", user: "admin@hirego.ai", action: "UPDATE_SYSTEM_SETTINGS", detail: "Modified SMTP Host" },
    { id: "LOG-02", time: "15:44:12", user: "compliance@hirego.ai", action: "VERIFY_CANDIDATE", detail: "Verified candidate CND-901" },
    { id: "LOG-03", time: "14:20:55", user: "support@hirego.ai", action: "SUSPEND_USER", detail: "Suspended company Vanguard Systems" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">System Audit Log (G09)</h1>
        <p className="text-text-muted text-sm">Immutable audit trail of all administrative actions, data edits, and security events.</p>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Audit Entries ({logs.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-secondary">
            <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Account</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-text-muted">{log.time}</td>
                  <td className="p-4 text-white font-bold">{log.user}</td>
                  <td className="p-4 text-primary font-bold">{log.action}</td>
                  <td className="p-4 text-text-secondary">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`
);

// G10: AI Agent Manager
ensureDir(path.join(baseDir, 'settings', 'ai-agents'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'ai-agents', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function AiAgentManagerPage() {
  const [agents, setAgents] = useState([
    { name: "Resume HireScore Evaluator", status: "Active", model: "GPT-4o", tasks: 12400 },
    { name: "Mock Interview Copilot", status: "Active", model: "Claude 3.5 Sonnet", tasks: 8200 },
    { name: "Code Execution Security Judge", status: "Active", model: "Local CodeLlama", tasks: 3400 },
    { name: "Communication Coach Analyzer", status: "Active", model: "Whisper + GPT-4o", tasks: 6100 },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const toggleAgent = (name: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.name === name ? { ...a, status: a.status === "Active" ? "Paused" : "Active" } : a))
    );
    setToast(\`AI Agent '\${name}' state toggled!\`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">AI Agent Manager (G10)</h1>
        <p className="text-text-muted text-sm">Monitor and control autonomous AI background agents operating across candidate & employer workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {agents.map((a) => (
          <div key={a.name} className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">{a.model}</span>
              <h3 className="font-bold text-base text-white mt-1">{a.name}</h3>
              <p className="text-xs text-text-muted mt-0.5">{a.tasks.toLocaleString()} tasks completed today</p>
            </div>
            <button
              onClick={() => toggleAgent(a.name)}
              className={\`px-4 py-2 rounded-full text-xs font-bold transition-all \${
                a.status === "Active" ? "bg-green/20 text-green" : "bg-yellow/20 text-yellow"
              }\`}
            >
              {a.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

// G11: Plan Management
ensureDir(path.join(baseDir, 'settings', 'plan-management'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'plan-management', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function PlanManagementPage() {
  const [plans, setPlans] = useState([
    { name: "Starter Tier", price: "₹14,999/mo", jobs: 5, seats: 2 },
    { name: "Pro Tier", price: "₹49,999/mo", jobs: 25, seats: 10 },
    { name: "Enterprise Tier", price: "Custom (₹12L/yr)", jobs: "Unlimited", seats: "Unlimited" },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Plan & Pricing Tier Management (G11)</h1>
        <p className="text-text-muted text-sm">Configure subscription plans, job posting quotas, and candidate candidate search limits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {plans.map((p) => (
          <div key={p.name} className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold text-lg text-white">{p.name}</h3>
            <p className="text-2xl font-bold text-gold-payment">{p.price}</p>
            <div className="space-y-1 text-xs text-text-muted">
              <p>Job Quota: {p.jobs}</p>
              <p>Recruiter Seats: {p.seats}</p>
            </div>
            <button
              onClick={() => {
                setToast(\`Configured tier: \${p.name}\`);
                setTimeout(() => setToast(null), 3000);
              }}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors"
            >
              Edit Tier Limits
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
`
);

// G12: Platform Analytics Hub
ensureDir(path.join(baseDir, 'settings', 'analytics'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'analytics', 'page.tsx'),
`"use client";

import React from "react";

export default function PlatformAnalyticsHubPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      <div>
        <h1 className="font-display-lg text-display-lg text-white">Platform Analytics Hub (G12)</h1>
        <p className="text-text-muted text-sm">Deep-dive analytics across user signups, application volume, interview pass rates, and subscription retention.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Candidate Signups</p>
          <h3 className="font-bold text-3xl text-white mt-1">48,420</h3>
          <p className="text-green text-xs mt-2 font-bold">+12.4% MoM</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Applications Submitted</p>
          <h3 className="font-bold text-3xl text-primary mt-1">182,900</h3>
          <p className="text-secondary text-xs mt-2 font-bold">+24% MoM</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Interviews Completed</p>
          <h3 className="font-bold text-3xl text-white mt-1">14,210</h3>
          <p className="text-green text-xs mt-2 font-bold">88.2% completion rate</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10">
          <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Paid Conversion Rate</p>
          <h3 className="font-bold text-3xl text-gold-payment mt-1">2.61%</h3>
          <p className="text-green text-xs mt-2 font-bold">Target &gt; 2.5% met</p>
        </div>
      </div>
    </div>
  );
}
`
);

// G13: Terms of Service & Privacy Policy Editor
ensureDir(path.join(baseDir, 'settings', 'terms-privacy'));
fs.writeFileSync(
  path.join(baseDir, 'settings', 'terms-privacy', 'page.tsx'),
`"use client";

import React, { useState } from "react";

export default function TermsPrivacyPage() {
  const [terms, setTerms] = useState("Welcome to HireGo AI. By accessing our platform, you agree to our AI evaluation and data processing terms.");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary p-gutter max-w-container-max mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-display-lg text-display-lg text-white">Terms of Service & Privacy Policy Editor (G13)</h1>
        <p className="text-text-muted text-sm">Update platform legal agreements, GDPR compliance policies, and AI candidate consent disclosures.</p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 max-w-2xl">
        <label className="text-xs text-text-secondary block mb-1">Terms of Service Markdown Document</label>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={8}
          className="w-full rounded-xl bg-[#1E1E1E] border border-white/10 p-4 text-xs text-white font-mono leading-relaxed"
        />

        <button
          onClick={() => {
            setToast("Legal documents published successfully!");
            setTimeout(() => setToast(null), 3000);
          }}
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-light text-white text-xs font-bold shadow-lg transition-all"
        >
          Publish Legal Document
        </button>
      </div>
    </div>
  );
}
`
);

console.log('Successfully created all G-series (G1-G13) dynamic pages!');
