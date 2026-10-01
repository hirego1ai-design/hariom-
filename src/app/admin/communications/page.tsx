"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

type EmailProvider = "ZEPTOMAIL" | "SENDGRID";

type EventDef = {
  eventKey: string;
  label: string;
  category: string;
  audiences: string[];
  channels: string[];
  variables: string[];
};

type Template = {
  id: string;
  eventKey: string;
  channel: string;
  audience: string;
  name: string;
  locale: string;
  status: string;
  provider?: string;
  providerAlias?: string;
  version: number;
  enabled: boolean;
  updatedAt: string;
};

type Delivery = {
  id: string;
  eventKey: string;
  channel: string;
  status: string;
  provider?: string;
  attemptCount: number;
  maxAttempts: number;
  retryable: boolean;
  nextAttemptAt?: string | null;
  retryLeasedUntil?: string | null;
  replayExpiresAt?: string | null;
  lastErrorCode?: string | null;
  lastError?: string | null;
  createdAt: string;
};

const DELIVERY_PAGE_SIZE = 25;

function retryStateLabel(delivery: Delivery) {
  if (delivery.status === "PROCESSING" && delivery.retryLeasedUntil) {
    return `Retry in progress · lease until ${new Date(delivery.retryLeasedUntil).toLocaleTimeString()}`;
  }
  if (delivery.retryable && delivery.nextAttemptAt) {
    return `Retry scheduled · ${new Date(delivery.nextAttemptAt).toLocaleTimeString()}`;
  }
  if (delivery.status === "FAILED") {
    return delivery.lastErrorCode?.startsWith("AMBIGUOUS_")
      ? "Terminal · ambiguous outcome"
      : "Terminal · operator review";
  }
  return "—";
}

export default function CommunicationsPage() {
  const [events, setEvents] = useState<EventDef[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateTotal, setTemplateTotal] = useState(0);
  const [templatesTruncated, setTemplatesTruncated] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState("");

  const [eventKey, setEventKey] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [audience, setAudience] = useState("CANDIDATE");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [parameterOrder, setParameterOrder] = useState("");
  const [emailProvider, setEmailProvider] = useState<EmailProvider>("ZEPTOMAIL");

  const [toggleTarget, setToggleTarget] = useState<{ template: Template; nextEnabled: boolean } | null>(null);
  const [toggleReason, setToggleReason] = useState("");
  const [toggleSaving, setToggleSaving] = useState(false);

  const [testRecipient, setTestRecipient] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testSending, setTestSending] = useState(false);

  const deliveryTotalPages = Math.max(1, Math.ceil(deliveryTotal / DELIVERY_PAGE_SIZE));

  async function load(page = deliveryPage) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(DELIVERY_PAGE_SIZE),
      });
      if (deliveryStatus) q.set("status", deliveryStatus);
      if (deliveryChannel) q.set("channel", deliveryChannel);

      const [templateResponse, deliveryResponse] = await Promise.all([
        fetch("/api/admin/communications/templates", { cache: "no-store" }),
        fetch(`/api/admin/communications/deliveries?${q.toString()}`, { cache: "no-store" }),
      ]);
      const [templatePayload, deliveryPayload] = await Promise.all([
        templateResponse.json().catch(() => ({})),
        deliveryResponse.json().catch(() => ({})),
      ]);

      if (!templateResponse.ok || !templatePayload.success) {
        throw new Error(templatePayload.error || "Unable to load communication templates.");
      }
      if (!deliveryResponse.ok || !deliveryPayload.success) {
        throw new Error(deliveryPayload.error || "Unable to load communication deliveries.");
      }

      setEvents(Array.isArray(templatePayload.events) ? templatePayload.events : []);
      setTemplates(Array.isArray(templatePayload.templates) ? templatePayload.templates : []);
      setTemplateTotal(typeof templatePayload.total === "number" ? templatePayload.total : 0);
      setTemplatesTruncated(Boolean(templatePayload.truncated));
      setDeliveries(Array.isArray(deliveryPayload.deliveries) ? deliveryPayload.deliveries : []);
      setDeliveryTotal(typeof deliveryPayload.total === "number" ? deliveryPayload.total : 0);

      if (!eventKey && templatePayload.events?.[0]) {
        setEventKey(templatePayload.events[0].eventKey);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load communications.");
      setDeliveries([]);
      setDeliveryTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1);
    // Initial authoritative load only. Filters are applied deliberately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadConfiguredEmailProvider = async () => {
      try {
        const response = await fetch("/api/admin/email-delivery/config", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        const primaryProvider = payload?.config?.primaryProvider;
        if (response.ok && payload?.success && (primaryProvider === "ZEPTOMAIL" || primaryProvider === "SENDGRID")) {
          setEmailProvider(primaryProvider);
        }
      } catch {
        // Keep the production default (ZeptoMail) if the config panel is temporarily unavailable.
      }
    };
    void loadConfiguredEmailProvider();
  }, []);

  const def = useMemo(
    () => events.find((event) => event.eventKey === eventKey),
    [events, eventKey],
  );

  useEffect(() => {
    if (def && !def.channels.includes(channel)) setChannel(def.channels[0] || "EMAIL");
    if (def && !def.audiences.includes(audience)) setAudience(def.audiences[0] || "CANDIDATE");
  }, [def, channel, audience]);

  useEffect(() => {
    if (!def) {
      setTestVariables({});
      return;
    }
    setTestVariables((current) =>
      Object.fromEntries(def.variables.map((variable) => [variable, current[variable] || ""])),
    );
  }, [def]);

  async function applyToggle() {
    if (!toggleTarget || toggleSaving || toggleReason.trim().length < 3) return;
    setToggleSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/communications/templates/${encodeURIComponent(toggleTarget.template.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: toggleTarget.nextEnabled,
            reason: toggleReason.trim(),
            expectedUpdatedAt: toggleTarget.template.updatedAt,
          }),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to update template.");
      }

      setNotice(
        toggleTarget.nextEnabled
          ? `${toggleTarget.template.name} activated for production delivery.`
          : `${toggleTarget.template.name} deactivated.`,
      );
      setToggleTarget(null);
      setToggleReason("");
      await load(deliveryPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update template.");
    } finally {
      setToggleSaving(false);
    }
  }

  async function create() {
    if (creating) return;
    setError("");
    setNotice("");

    const mapping = parameterOrder.split(",").map((value) => value.trim()).filter(Boolean);
    if (channel === "WHATSAPP") {
      const invalid = mapping.filter((value) => !def?.variables.includes(value));
      const duplicate = mapping.filter((value, index) => mapping.indexOf(value) !== index);
      if (invalid.length) {
        setError(`Unknown Meta parameters: ${[...new Set(invalid)].join(", ")}`);
        return;
      }
      if (duplicate.length) {
        setError(`Duplicate Meta parameters: ${[...new Set(duplicate)].join(", ")}`);
        return;
      }
    }

    setCreating(true);
    try {
      const provider = channel === "WHATSAPP" ? "META" : emailProvider;
      const response = await fetch("/api/admin/communications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventKey,
          channel,
          audience,
          name,
          locale: "en",
          provider,
          providerAlias: alias || undefined,
          subject: channel === "EMAIL" ? subject || undefined : undefined,
          body,
          providerParameterOrder: channel === "WHATSAPP" ? mapping : undefined,
          enabled: false,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to create template.");
      }

      setName("");
      setAlias("");
      setBody("");
      setSubject("");
      setParameterOrder("");
      setNotice("Template draft saved. Activate it separately after provider mapping review.");
      await load(deliveryPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create template.");
    } finally {
      setCreating(false);
    }
  }

  async function sendTestCommunication() {
    if (!def || testSending || !testRecipient.trim()) return;

    const missing = def.variables.filter((variable) => !testVariables[variable]?.trim());
    if (missing.length) {
      setError(`Enter test values for: ${missing.join(", ")}`);
      return;
    }

    setTestSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/communications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventKey,
          channel,
          audience,
          recipient: testRecipient.trim(),
          variables: Object.fromEntries(
            def.variables.map((variable) => [variable, testVariables[variable]?.trim() || ""]),
          ),
          locale: "en",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Test communication was not accepted by the provider.");
      }

      setNotice(
        `Test communication accepted by ${payload.delivery?.provider || "the configured provider"}. Delivery/read confirmation is tracked separately.`,
      );
      setDeliveryPage(1);
      await load(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send test communication.");
    } finally {
      setTestSending(false);
    }
  }

  async function applyDeliveryFilters() {
    setDeliveryPage(1);
    await load(1);
  }

  async function changeDeliveryPage(nextPage: number) {
    setDeliveryPage(nextPage);
    await load(nextPage);
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Communications"
          subtitle="Transactional WhatsApp/email templates and persisted delivery evidence."
        />

        <main className="mx-auto max-w-[1600px] space-y-6 p-4 pt-24 sm:p-6 lg:p-8 lg:pt-24">
          {loading && (
            <div role="status" aria-live="polite" className="text-sm text-zinc-500">
              Loading communication operations…
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-red-200">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
              {notice}
            </div>
          )}

          <header>
            <h1 className="text-3xl font-semibold">Communication Center</h1>
            <p className="mt-2 text-zinc-400">
              Create drafts, deliberately activate one template version per event/channel/audience, and inspect delivery state.
            </p>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Communication summary">
            {[
              ["Events", events.length],
              ["Templates", templateTotal],
              ["Active in loaded catalogue", templates.filter((template) => template.enabled).length],
              ["Channels", "WhatsApp + Email"],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-sm text-zinc-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold">{value}</div>
              </div>
            ))}
          </section>

          {templatesTruncated && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              Showing the 250 most recently updated templates out of {templateTotal}. Historical versions remain persisted.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 xl:col-span-3" aria-labelledby="template-catalogue-heading">
              <div className="border-b border-zinc-800 p-5">
                <h2 id="template-catalogue-heading" className="font-semibold">Template catalogue</h2>
              </div>
              <div className="divide-y divide-zinc-900">
                {templates.length ? templates.map((template) => (
                  <article key={template.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{template.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {template.eventKey} · {template.audience} · v{template.version}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{template.channel}</span>
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{template.provider || "No provider"}</span>
                      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">{template.status}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setToggleReason("");
                          setToggleTarget({ template, nextEnabled: !template.enabled });
                        }}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          template.enabled
                            ? "border-red-500/30 text-red-300"
                            : "border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {template.enabled ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="p-10 text-center text-zinc-500">No templates yet. Create the first controlled draft.</div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 xl:col-span-2" aria-labelledby="create-template-heading">
              <h2 id="create-template-heading" className="mb-5 font-semibold">Create template draft</h2>
              <div className="space-y-4">
                <label className="block text-sm">
                  Business event
                  <select value={eventKey} onChange={(event) => setEventKey(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                    {events.map((event) => <option key={event.eventKey} value={event.eventKey}>{event.category} — {event.label}</option>)}
                  </select>
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    Channel
                    <select value={channel} onChange={(event) => setChannel(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                      {(def?.channels || ["WHATSAPP", "EMAIL"]).map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm">
                    Audience
                    <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                      {(def?.audiences || ["CANDIDATE"]).map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                </div>

                <label className="block text-sm">
                  Template name
                  <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" />
                </label>

                {channel === "EMAIL" && (
                  <label className="block text-sm">
                    Email template mode
                    <select
                      value={emailProvider}
                      onChange={(event) => setEmailProvider(event.target.value as EmailProvider)}
                      className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3"
                    >
                      <option value="ZEPTOMAIL">Zoho / ZeptoMail stored template</option>
                      <option value="SENDGRID">Provider-neutral email body</option>
                    </select>
                    <span className="mt-1 block text-xs text-zinc-500">
                      Delivery order is controlled globally by Email Delivery settings (Zoho / ZeptoMail primary, SendGrid fallback). This choice controls stored-template mapping, not provider routing.
                    </span>
                  </label>
                )}

                {(channel === "WHATSAPP" || emailProvider === "ZEPTOMAIL") && (
                  <label className="block text-sm">
                    {channel === "WHATSAPP" ? "Meta template name" : "Zoho / ZeptoMail template alias"}
                    <input value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={512} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" />
                  </label>
                )}

                {channel === "EMAIL" && (
                  <label className="block text-sm">
                    Email subject
                    <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" />
                  </label>
                )}

                {channel === "WHATSAPP" && (
                  <label className="block text-sm">
                    Meta body parameter order
                    <input value={parameterOrder} onChange={(event) => setParameterOrder(event.target.value)} placeholder="candidate_name, company_name, job_title" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" />
                    <span className="mt-1 block text-xs text-zinc-500">Comma-separated variable names in the exact order configured in Meta.</span>
                  </label>
                )}

                <label className="block text-sm">
                  Template body
                  <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} maxLength={20000} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3" />
                </label>

                <div className="text-xs text-zinc-500">
                  Allowed variables: {(def?.variables || []).map((variable) => `{{${variable}}}`).join(", ") || "None"}
                </div>

                <button
                  type="button"
                  onClick={() => void create()}
                  disabled={creating || !eventKey || !name.trim() || !body.trim() || (channel === "WHATSAPP" && !parameterOrder.trim())}
                  className="w-full rounded-xl bg-white p-3 font-medium text-black disabled:opacity-40"
                >
                  {creating ? "Saving draft…" : "Save draft"}
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5" aria-labelledby="communication-test-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="communication-test-heading" className="font-semibold">Safe test communication</h2>
                <p className="mt-1 max-w-3xl text-xs text-zinc-500">
                  Uses the selected event/channel/audience above and the currently active template. In production, the recipient must be on COMMUNICATION_TEST_RECIPIENT_ALLOWLIST.
                </p>
              </div>
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-200">
                Provider acceptance ≠ delivered/read
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="text-sm">
                Test recipient
                <input
                  value={testRecipient}
                  onChange={(event) => setTestRecipient(event.target.value)}
                  maxLength={320}
                  placeholder={channel === "EMAIL" ? "allowed-test@example.com" : "+91… or provider recipient id"}
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3"
                />
              </label>
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-xs text-zinc-400">
                <p><strong className="text-zinc-200">Event:</strong> {def?.label || "Select an event"}</p>
                <p className="mt-1"><strong className="text-zinc-200">Channel:</strong> {channel}</p>
                <p className="mt-1"><strong className="text-zinc-200">Audience:</strong> {audience}</p>
              </div>
            </div>

            {def && def.variables.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {def.variables.map((variable) => (
                  <label key={variable} className="text-xs text-zinc-400">
                    {variable}
                    <input
                      value={testVariables[variable] || ""}
                      onChange={(event) =>
                        setTestVariables((current) => ({ ...current, [variable]: event.target.value }))
                      }
                      maxLength={500}
                      className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-sm text-white"
                    />
                  </label>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => void sendTestCommunication()}
              disabled={
                testSending ||
                !def ||
                !testRecipient.trim() ||
                def.variables.some((variable) => !testVariables[variable]?.trim())
              }
              className="mt-5 rounded-xl border border-white/15 bg-white px-5 py-3 text-xs font-bold text-black disabled:opacity-40"
            >
              {testSending ? "Sending test…" : "Send allowlisted test"}
            </button>
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950" aria-labelledby="delivery-operations-heading">
            <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="delivery-operations-heading" className="font-semibold">Delivery operations</h2>
                <p className="mt-1 text-xs text-zinc-500">{deliveryTotal} matching delivery record{deliveryTotal === 1 ? "" : "s"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select aria-label="Delivery status" value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
                  <option value="">All statuses</option>
                  {["PENDING", "PROCESSING", "ACCEPTED", "DELIVERED", "READ", "FAILED"].map((value) => <option key={value}>{value}</option>)}
                </select>
                <select aria-label="Delivery channel" value={deliveryChannel} onChange={(event) => setDeliveryChannel(event.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
                  <option value="">All channels</option>
                  <option>EMAIL</option>
                  <option>WHATSAPP</option>
                </select>
                <button type="button" onClick={() => void applyDeliveryFilters()} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">
                  Apply filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="p-4 text-left">Event</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Provider</th>
                    <th>Attempts</th>
                    <th>Retry state</th>
                    <th>Last error</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.length ? deliveries.map((delivery) => (
                    <tr key={delivery.id} className="border-t border-zinc-900 align-top">
                      <td className="p-4">{delivery.eventKey}</td>
                      <td className="pt-4 text-center">{delivery.channel}</td>
                      <td className="pt-4 text-center">{delivery.status}</td>
                      <td className="pt-4 text-center">{delivery.provider || "Not assigned"}</td>
                      <td className="pt-4 text-center">{delivery.attemptCount}/{delivery.maxAttempts}</td>
                      <td className="max-w-[240px] px-3 pt-4 text-center text-xs text-zinc-400">
                        {retryStateLabel(delivery)}
                      </td>
                      <td className="max-w-[300px] px-3 pt-4 text-xs text-zinc-400" title={delivery.lastError || undefined}>
                        {delivery.lastErrorCode || "—"}
                      </td>
                      <td className="pt-4 text-center text-zinc-500">{new Date(delivery.createdAt).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8} className="p-10 text-center text-zinc-500">No delivery operations match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {deliveryTotal > DELIVERY_PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-zinc-800 p-4">
                <button
                  type="button"
                  disabled={deliveryPage <= 1 || loading}
                  onClick={() => void changeDeliveryPage(Math.max(1, deliveryPage - 1))}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500">Page {deliveryPage} of {deliveryTotalPages}</span>
                <button
                  type="button"
                  disabled={deliveryPage >= deliveryTotalPages || loading}
                  onClick={() => void changeDeliveryPage(Math.min(deliveryTotalPages, deliveryPage + 1))}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {toggleTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="template-toggle-title" className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
            <h2 id="template-toggle-title" className="text-lg font-semibold">
              {toggleTarget.nextEnabled ? "Activate" : "Deactivate"} {toggleTarget.template.name}?
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {toggleTarget.nextEnabled
                ? "This version can be used for production transactional delivery and supersedes the currently active version for the same event/channel/audience."
                : "This version will stop being selected for new transactional deliveries."}
            </p>
            <label className="mt-5 block text-sm text-zinc-300">
              Change reason
              <textarea
                value={toggleReason}
                onChange={(event) => setToggleReason(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Why is this template state changing?"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={toggleSaving} onClick={() => { setToggleTarget(null); setToggleReason(""); }} className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-bold disabled:opacity-40">
                Cancel
              </button>
              <button
                type="button"
                disabled={toggleSaving || toggleReason.trim().length < 3}
                onClick={() => void applyToggle()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${
                  toggleTarget.nextEnabled ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {toggleSaving ? "Saving…" : toggleTarget.nextEnabled ? "Activate template" : "Deactivate template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
