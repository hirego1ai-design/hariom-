"use client";

import { useEffect, useState } from "react";
import EmployerSidebar from "@/components/employer/EmployerSidebar";

export default function EmployerCompanyProfileEditorPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [about, setAbout] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [hqLocation, setHqLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [canEditCompany, setCanEditCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/employer/company", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success || !data.company) {
          throw new Error(data.error || "Unable to load company profile.");
        }
        if (cancelled) return;
        setCompanyName(data.company.name || "");
        setIndustry(data.company.industry || "");
        setAbout(data.company.description || "");
        setCompanySize(data.company.size || "");
        setWebsite(data.company.website || "");
        setHqLocation(data.company.location || "");
        setCanEditCompany(Boolean(data.permissions?.canEditCompany));
      })
      .catch((error) => {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error instanceof Error ? error.message : "Unable to load company profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (saving) return;
    if (!canEditCompany) {
      setMessageType("error");
      setMessage("Your recruiter role has read-only access to company profile settings.");
      return;
    }
    if (companyName.trim().length < 2) {
      setMessageType("error");
      setMessage("Company name must contain at least 2 characters.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/employer/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          industry: industry.trim() || null,
          description: about.trim() || null,
          size: companySize.trim() || null,
          website: website.trim() || null,
          location: hqLocation.trim() || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save company profile.");
      }

      setCompanyName(data.company?.name || companyName.trim());
      setIndustry(data.company?.industry || "");
      setAbout(data.company?.description || "");
      setCompanySize(data.company?.size || "");
      setWebsite(data.company?.website || "");
      setHqLocation(data.company?.location || "");
      setMessageType("success");
      setMessage("Company profile saved.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Failed to save company profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0E0E0E] text-text-primary">
      <EmployerSidebar />

      <div className="ml-[100px] flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[116px]">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/10 bg-[#0E0E0E]/90 px-6 shadow-md backdrop-blur-xl lg:px-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">Company Profile Editor</h1>
            <p className="text-xs text-text-muted">Only persisted company profile fields are shown and saved.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving || !canEditCompany}
            className="btn-3d-red rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : canEditCompany ? "Save Profile" : "Read only"}
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 overflow-y-auto p-6 lg:p-10">
          {message && (
            <div
              role={messageType === "error" ? "alert" : "status"}
              className={`rounded-2xl border p-4 text-sm ${
                messageType === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {message}
            </div>
          )}

          {!loading && !canEditCompany && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
              Recruiter access is read-only. A company administrator can update these company-wide fields.
            </div>
          )}

          {loading ? (
            <div role="status" className="rounded-3xl border border-white/10 bg-[#141418] p-8 text-sm text-text-muted">
              Loading company profile…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="glass-card space-y-5 rounded-3xl border border-white/10 bg-[#141418] p-6 lg:col-span-2 lg:p-8">
                <h2 className="border-b border-white/10 pb-3 text-base font-bold text-white">Basic Information</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Company Name
                    <input
                      type="text"
                      value={companyName}
                      maxLength={160}
                      disabled={!canEditCompany}
                      onChange={(event) => setCompanyName(event.target.value)}
                      className="input-pill h-11 w-full px-4 text-xs normal-case tracking-normal text-white"
                      placeholder="Company legal or operating name"
                    />
                  </label>

                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Industry
                    <input
                      type="text"
                      value={industry}
                      maxLength={120}
                      disabled={!canEditCompany}
                      onChange={(event) => setIndustry(event.target.value)}
                      className="input-pill h-11 w-full px-4 text-xs normal-case tracking-normal text-white"
                      placeholder="Industry (optional)"
                    />
                  </label>
                </div>

                <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  About Company
                  <textarea
                    rows={5}
                    value={about}
                    maxLength={5000}
                    disabled={!canEditCompany}
                    onChange={(event) => setAbout(event.target.value)}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-normal normal-case tracking-normal text-white outline-none focus:border-primary"
                    placeholder="Mission, culture and company information (optional)"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Company Size
                    <input
                      type="text"
                      value={companySize}
                      maxLength={80}
                      disabled={!canEditCompany}
                      onChange={(event) => setCompanySize(event.target.value)}
                      className="input-pill h-11 w-full px-4 text-xs normal-case tracking-normal text-white"
                      placeholder="Company size (optional)"
                    />
                  </label>

                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                    Website URL
                    <input
                      type="url"
                      value={website}
                      maxLength={500}
                      disabled={!canEditCompany}
                      onChange={(event) => setWebsite(event.target.value)}
                      className="input-pill h-11 w-full px-4 text-xs normal-case tracking-normal text-white"
                      placeholder="https://company.example"
                    />
                  </label>
                </div>
              </section>

              <section className="glass-card h-fit space-y-4 rounded-3xl border border-white/10 bg-[#141418] p-6">
                <h2 className="border-b border-white/10 pb-3 text-base font-bold text-white">Location & Operations</h2>
                <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  HQ Location
                  <input
                    type="text"
                    value={hqLocation}
                    maxLength={200}
                    disabled={!canEditCompany}
                    onChange={(event) => setHqLocation(event.target.value)}
                    className="input-pill h-11 w-full px-4 text-xs normal-case tracking-normal text-white"
                    placeholder="Headquarters location (optional)"
                  />
                </label>
                <p className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-relaxed text-text-muted">
                  Benefits, tax identifiers and other attributes are not displayed here until they have authoritative persisted fields. This prevents unsaved UI selections from being presented as company facts.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
