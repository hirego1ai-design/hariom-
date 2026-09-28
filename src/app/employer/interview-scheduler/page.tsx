"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/employer/LayoutSystem";

type ScheduleOption = {
  applicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  nextRound: {
    id: string;
    name: string;
    sequence: number;
    interviewType: string;
    durationMins: number;
    hasRequiredInterviewer: boolean;
  } | null;
  unavailableReason: string | null;
};

type ScheduleOptionsResponse = {
  success: boolean;
  options?: ScheduleOption[];
  pagination?: { nextCursor: string | null; hasMore: boolean };
  error?: string;
};

type ScheduleResult = {
  interviewId: string;
  notifications?: {
    app?: { status?: string };
    email?: { status?: string };
    whatsapp?: { status?: string };
  };
};

function notificationLabel(status?: string) {
  if (!status) return "Not reported";
  return status.replaceAll("_", " ");
}

function EmployerInterviewSchedulerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedApplicationId = searchParams.get("applicationId") || searchParams.get("id") || "";
  const requestedRoundId = searchParams.get("roundId") || "";

  const [options, setOptions] = useState<ScheduleOption[]>([]);
  const [applicationId, setApplicationId] = useState(requestedApplicationId);
  const [optionQuery, setOptionQuery] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ScheduleResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [copilotAvailable, setCopilotAvailable] = useState(false);
  const [useCopilot, setUseCopilot] = useState(false);
  const scheduleRequestKey = useRef<string | null>(null);

  const loadOptions = useCallback(async (
    query: string,
    cursor: string | null,
    exactApplicationId: string | null,
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams({ limit: "50" });
    if (exactApplicationId) params.set("applicationId", exactApplicationId);
    else {
      const normalized = query.trim();
      if (normalized) params.set("q", normalized);
      if (cursor) params.set("cursor", cursor);
    }

    const response = await fetch(`/api/employer/interviews/schedule?${params.toString()}`, {
      cache: "no-store",
      signal,
    });
    const body = await response.json().catch(() => ({})) as ScheduleOptionsResponse;
    if (!response.ok || !body.success) {
      throw new Error(body.error || "Unable to load interview scheduling options.");
    }
    return {
      options: Array.isArray(body.options) ? body.options : [],
      nextCursor: body.pagination?.nextCursor ?? null,
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setOptionsLoading(true);
      setOptionsError("");
      const exactApplicationId = requestedApplicationId && !optionQuery.trim()
        ? requestedApplicationId
        : null;

      loadOptions(optionQuery, null, exactApplicationId, controller.signal)
        .then((page) => {
          setOptions(page.options);
          setNextCursor(page.nextCursor);
          if (exactApplicationId) setApplicationId(exactApplicationId);
          else if (applicationId && !page.options.some((option) => option.applicationId === applicationId)) {
            setApplicationId("");
          }
        })
        .catch((reason) => {
          if (reason instanceof DOMException && reason.name === "AbortError") return;
          setOptions([]);
          setNextCursor(null);
          setOptionsError(reason instanceof Error ? reason.message : "Unable to load interview scheduling options.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setOptionsLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [applicationId, loadOptions, optionQuery, requestedApplicationId]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/employer/copilot/capacity", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        const active = Boolean(response.ok && body.success && body.capacity?.active);
        setCopilotAvailable(active);
        setUseCopilot(active);
      })
      .catch(() => {
        if (!cancelled) {
          setCopilotAvailable(false);
          setUseCopilot(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.applicationId === applicationId) || null,
    [applicationId, options],
  );
  const selectedRound = selectedOption?.nextRound || null;
  const configuredType = selectedRound?.interviewType?.toUpperCase() || "";
  const requiresAddress = configuredType === "IN_PERSON" || configuredType === "OFFLINE";
  const requiresContact = requiresAddress || configuredType === "PHONE";
  const requestedRoundMismatch = Boolean(
    requestedRoundId && selectedRound && requestedRoundId !== selectedRound.id,
  );

  useEffect(() => {
    scheduleRequestKey.current = null;
    setSuccess(null);
    setError("");
    setAddress("");
    setContactNumber("");
  }, [applicationId]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setOptionsError("");
    try {
      const page = await loadOptions(optionQuery, nextCursor, null);
      setOptions((current) => {
        const seen = new Set(current.map((option) => option.applicationId));
        return [...current, ...page.options.filter((option) => !seen.has(option.applicationId))];
      });
      setNextCursor(page.nextCursor);
    } catch (reason) {
      setOptionsError(reason instanceof Error ? reason.message : "Unable to load more scheduling options.");
    } finally {
      setLoadingMore(false);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    if (!selectedOption || !selectedRound) {
      setError(selectedOption?.unavailableReason || "Select a candidate with a schedulable interview round.");
      return;
    }
    if (selectedOption.unavailableReason) {
      setError(selectedOption.unavailableReason);
      return;
    }
    if (requestedRoundMismatch) {
      setError("The requested round is no longer the next schedulable round. Use the current round shown below.");
      return;
    }
    if (!date || !time) {
      setError("Choose an interview date and time.");
      return;
    }
    if (requiresAddress && !address.trim()) {
      setError("Meeting address is required for this in-person round.");
      return;
    }
    if (requiresContact && !contactNumber.trim()) {
      setError("Contact number is required for this configured round.");
      return;
    }

    setSaving(true);
    scheduleRequestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/employer/interviews/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": scheduleRequestKey.current,
        },
        body: JSON.stringify({
          applicationId: selectedOption.applicationId,
          scheduledAt: new Date(`${date}T${time}`).toISOString(),
          roundId: selectedRound.id,
          address: requiresAddress ? address.trim() : undefined,
          contactNumber: requiresContact ? contactNumber.trim() : undefined,
          notifyEmail: email,
          notifyWhatsapp: whatsapp,
          copilotManaged: useCopilot,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "Unable to schedule interview");
      setSuccess(data as ScheduleResult);
      scheduleRequestKey.current = null;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to schedule interview");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-7">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">Interview operations</p>
          <h1 className="text-3xl font-bold text-text-primary">Schedule interview</h1>
          <p className="text-sm text-text-secondary mt-2">
            Select an eligible candidate. HireGo resolves the next configured round and enforces the job&apos;s interview workflow.
          </p>
        </div>

        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-5">
          <label className="block text-sm text-text-secondary">
            Find candidate or job
            <input
              value={optionQuery}
              onChange={(event) => setOptionQuery(event.target.value)}
              maxLength={100}
              className="mt-2 w-full input-pill h-11 px-4 text-text-primary"
              placeholder="Search candidate name or job title"
            />
          </label>

          <label className="block text-sm text-text-secondary">
            Candidate application
            <select
              value={applicationId}
              onChange={(event) => setApplicationId(event.target.value)}
              disabled={optionsLoading}
              className="mt-2 w-full input-pill min-h-11 px-4 text-text-primary"
            >
              <option value="">{optionsLoading ? "Loading eligible applications…" : "Select candidate"}</option>
              {options.map((option) => (
                <option
                  key={option.applicationId}
                  value={option.applicationId}
                  disabled={Boolean(option.unavailableReason)}
                >
                  {option.candidateName} · {option.jobTitle}
                  {option.unavailableReason ? ` · unavailable: ${option.unavailableReason}` : ""}
                </option>
              ))}
            </select>
          </label>

          {nextCursor && (
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="min-h-10 rounded-xl border border-outline px-4 text-xs font-bold text-text-primary disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more candidates"}
            </button>
          )}

          {optionsError && <p role="alert" className="text-sm text-red-300">{optionsError}</p>}

          {selectedOption && (
            <section className="rounded-2xl border border-outline bg-bg-elevated p-4 text-sm">
              <p className="font-bold text-text-primary">{selectedOption.candidateName}</p>
              <p className="mt-1 text-text-secondary">{selectedOption.jobTitle}</p>
              {selectedRound ? (
                <div className="mt-3">
                  <p className="font-bold text-text-primary">Next round: {selectedRound.name}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Round {selectedRound.sequence} · {selectedRound.interviewType.replaceAll("_", " ")} · {selectedRound.durationMins} minutes
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-amber-200">{selectedOption.unavailableReason || "No schedulable round is available."}</p>
              )}
              {selectedOption.unavailableReason?.includes("interviewer") && (
                <Link
                  href={`/employer/interview-round-builder?jobId=${encodeURIComponent(selectedOption.jobId)}`}
                  className="mt-3 inline-flex font-bold text-primary hover:underline"
                >
                  Configure interviewers
                </Link>
              )}
            </section>
          )}

          {requestedRoundMismatch && (
            <p role="alert" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
              The linked round is no longer current. HireGo will not schedule an out-of-sequence round.
            </p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm text-text-secondary">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-text-primary" />
            </label>
            <label className="block text-sm text-text-secondary">
              Time
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-text-primary" />
            </label>
          </div>

          {requiresAddress && (
            <label className="block text-sm text-text-secondary">
              Meeting address
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-text-primary" />
            </label>
          )}

          {requiresContact && (
            <label className="block text-sm text-text-secondary">
              Contact number
              <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="mt-2 w-full input-pill h-11 px-4 text-text-primary" />
            </label>
          )}

          {copilotAvailable && (
            <label className="flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 p-4 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={useCopilot}
                onChange={(e) => {
                  setUseCopilot(e.target.checked);
                  scheduleRequestKey.current = null;
                }}
                className="mt-0.5"
              />
              <span>
                <span className="block font-bold">Use HireGo Copilot for scheduling</span>
                <span className="mt-1 block text-xs text-text-secondary">
                  Copilot meters this scheduling action and requested workflow communications against the active plan.
                </span>
              </span>
            </label>
          )}

          <div className="space-y-3 text-sm text-text-secondary">
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Request email invite
            </label>
            <label className="flex gap-2 items-center">
              <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> Request WhatsApp invite
            </label>
          </div>

          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

          {success && (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-text-primary">
              <p className="font-bold">Interview scheduled.</p>
              <p className="mt-2 text-xs text-text-secondary">
                In-app: {notificationLabel(success.notifications?.app?.status)} · Email: {notificationLabel(success.notifications?.email?.status)} · WhatsApp: {notificationLabel(success.notifications?.whatsapp?.status)}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/employer/upcoming-interviews-list" className="font-bold text-primary hover:underline">
                  Open interviews
                </Link>
                <button
                  type="button"
                  onClick={() => router.push(`/employer/final-round-feedback?interviewId=${encodeURIComponent(success.interviewId)}`)}
                  className="font-bold text-primary hover:underline"
                >
                  Open feedback
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              disabled={saving || !selectedRound || Boolean(selectedOption?.unavailableReason)}
              className="btn-primary-red h-12 px-7 rounded-full text-white font-bold disabled:opacity-50"
            >
              {saving ? "Scheduling..." : "Schedule interview"}
            </button>
            <button type="button" onClick={() => router.back()} className="h-12 px-7 rounded-full border border-outline text-text-secondary">
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
