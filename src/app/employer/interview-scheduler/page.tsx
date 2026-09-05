"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

function EmployerInterviewSchedulerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicationId, setApplicationId] = useState("");
  const [mode, setMode] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [round, setRound] = useState("TECHNICAL");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const appVal = searchParams.get("applicationId") || searchParams.get("id") || "";
    if (appVal) {
      setApplicationId(appVal);
    }
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    if (!applicationId || !date || !time) {
      setError("Application ID, date, and time are required.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/employer/interviews/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          scheduledAt: new Date(`${date}T${time}`).toISOString(),
          durationMins: 60,
          mode,
          round,
          address: mode === "OFFLINE" ? address : undefined,
          contactNumber: mode === "OFFLINE" ? contactNumber : undefined,
          notifyEmail: email,
          notifyWhatsapp: whatsapp,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to schedule interview");
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to schedule interview");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-7">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
          <h1 className="text-3xl font-bold text-white">Schedule interview</h1>
          <p className="text-sm text-text-secondary mt-2">
            Create a real interview record, send notifications, and provide online or offline joining details.
          </p>
        </div>
        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-5">
          <label className="block text-sm text-text-secondary">
            Application ID
            <input
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="mt-2 w-full input-pill h-11 px-4 text-white"
              placeholder="Select from candidate tracker"
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm text-text-secondary">
              Round
              <select value={round} onChange={(e) => setRound(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-white">
                <option value="HR_SCREENING">HR screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="OPERATIONS">Operations / Leadership</option>
                <option value="SYSTEM_DESIGN">System design</option>
                <option value="FINAL">Final employer</option>
              </select>
            </label>
            <label className="block text-sm text-text-secondary">
              Mode
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="mt-2 w-full input-pill h-11 px-4 text-white">
                <option value="ONLINE">Online · HireGo portal</option>
                <option value="OFFLINE">Offline · In person</option>
              </select>
            </label>
            <label className="block text-sm text-text-secondary">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-white" />
            </label>
            <label className="block text-sm text-text-secondary">
              Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-white" />
            </label>
          </div>
          {mode === "OFFLINE" && (
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block text-sm text-text-secondary">
                Meeting address
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-white" />
              </label>
              <label className="block text-sm text-text-secondary">
                HireGo contact number
                <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-white" />
              </label>
            </div>
          )}
          <div className="space-y-3 text-sm text-text-secondary">
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Send email invite
            </label>
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> Send WhatsApp invite if provider is configured
            </label>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {success && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              Interview scheduled. ID: {success.interviewId}.{" "}
              <button
                type="button"
                onClick={() => router.push(`/employer/final-round-feedback?interviewId=${success.interviewId}`)}
                className="underline ml-2"
              >
                Open feedback when complete
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button disabled={saving} className="btn-primary-red h-12 px-7 rounded-full text-white font-bold">
              {saving ? "Scheduling..." : "Schedule interview"}
            </button>
            <button type="button" onClick={() => router.back()} className="h-12 px-7 rounded-full border border-white/10 text-text-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default function EmployerInterviewSchedulerPage() {
  return (
    <Suspense fallback={<PageContainer><div className="max-w-3xl mx-auto py-8 px-4 text-slate-400">Loading scheduler...</div></PageContainer>}>
      <EmployerInterviewSchedulerContent />
    </Suspense>
  );
}
