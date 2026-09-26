"use client";

import React, { useCallback, useEffect, useState } from "react";

export type LiveProctoringClientPolicy = {
  enabled: boolean;
  trackTabSwitch: boolean;
  trackClipboard: boolean;
  trackContextMenu: boolean;
  policyVersion: string;
};

type BrowserObservation = {
  id: string;
  label: string;
  timestamp: string;
};

export default function ProctoringEngine({
  interviewId,
  policy,
  onViolationCountChange,
}: {
  interviewId: string;
  policy: LiveProctoringClientPolicy;
  onViolationCountChange?: (count: number) => void;
}) {
  const [observations, setObservations] = useState<BrowserObservation[]>([]);
  const [deliveryError, setDeliveryError] = useState("");

  const report = useCallback(async (violationType: "TAB_SWITCH" | "COPY_PASTE_DETECTED" | "BROWSER_UNFOCUSED", label: string) => {
    const observation = { id: crypto.randomUUID(), label, timestamp: new Date().toLocaleTimeString() };
    setObservations((previous) => {
      const next = [observation, ...previous].slice(0, 20);
      onViolationCountChange?.(next.length);
      return next;
    });
    try {
      const response = await fetch("/api/proctoring/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, violationType }),
      });
      if (!response.ok && response.status !== 429) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Telemetry could not be recorded.");
      }
      setDeliveryError("");
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : "Telemetry could not be recorded.");
    }
  }, [interviewId, onViolationCountChange]);

  useEffect(() => {
    if (!policy.enabled) return;

    const onVisibility = () => {
      if (policy.trackTabSwitch && document.hidden) void report("TAB_SWITCH", "Interview tab hidden");
    };
    const onClipboard = (event: ClipboardEvent) => {
      if (!policy.trackClipboard) return;
      event.preventDefault();
      void report("COPY_PASTE_DETECTED", "Copy or paste blocked");
    };
    const onContextMenu = (event: MouseEvent) => {
      if (!policy.trackContextMenu) return;
      event.preventDefault();
      void report("BROWSER_UNFOCUSED", "Context menu blocked");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("copy", onClipboard);
    window.addEventListener("paste", onClipboard);
    window.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("copy", onClipboard);
      window.removeEventListener("paste", onClipboard);
      window.removeEventListener("contextmenu", onContextMenu);
    };
  }, [policy, report]);

  if (!policy.enabled) return null;

  return (
    <aside className="rounded-2xl border border-white/10 bg-[#141418] p-4 text-white" aria-label="Interview browser monitoring">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">Browser monitoring active</p>
          <p className="mt-1 text-[11px] text-text-muted">Policy {policy.policyVersion}. Browser events are advisory evidence and require human review.</p>
        </div>
        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">{observations.length} observed</span>
      </div>
      {deliveryError && <p role="status" className="mt-3 text-xs text-amber-300">{deliveryError}</p>}
      {observations.length > 0 && (
        <div className="mt-3 max-h-28 space-y-1 overflow-y-auto">
          {observations.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-[11px] text-text-muted">
              <span>{item.label}</span><span>{item.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
