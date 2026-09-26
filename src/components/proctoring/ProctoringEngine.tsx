"use client";

import React, { useCallback, useEffect, useState } from "react";

export interface ProctoringViolation {
  id: string;
  type: "Tab Switch" | "Copy-Paste Attempt" | "Browser Unfocused";
  timestamp: string;
  severity: "low" | "medium" | "high";
}

const telemetryTypeByViolation: Record<ProctoringViolation["type"], string> = {
  "Tab Switch": "TAB_SWITCH",
  "Copy-Paste Attempt": "COPY_PASTE_DETECTED",
  "Browser Unfocused": "BROWSER_UNFOCUSED",
};

export default function ProctoringEngine({
  interviewId,
  onViolationCountChange,
}: {
  interviewId?: string;
  onViolationCountChange?: (count: number) => void;
}) {
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [advisoryScore, setAdvisoryScore] = useState(0);

  const addViolation = useCallback((type: ProctoringViolation["type"], severity: ProctoringViolation["severity"]) => {
    const newViolation: ProctoringViolation = {
      id: `${Date.now()}-${type}`,
      type,
      timestamp: new Date().toLocaleTimeString(),
      severity,
    };
    setViolations((previous) => {
      const updated = [newViolation, ...previous];
      onViolationCountChange?.(updated.length);
      return updated;
    });

    const weight = severity === "high" ? 25 : severity === "medium" ? 15 : 5;
    setAdvisoryScore((previous) => Math.min(100, previous + weight));

    if (interviewId) {
      fetch("/api/proctoring/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, violationType: telemetryTypeByViolation[type] }),
      }).catch(() => undefined);
    }
  }, [interviewId, onViolationCountChange]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) addViolation("Tab Switch", "medium");
    };
    const handleCopyPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      addViolation("Copy-Paste Attempt", "medium");
    };
    const handleBlur = () => addViolation("Browser Unfocused", "low");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
      window.removeEventListener("blur", handleBlur);
    };
  }, [addViolation]);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141418] p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-white">Browser integrity evidence</p>
          <p className="text-[10px] text-text-muted">Client-reported and unverified; human review only.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-text-muted">
          Advisory {advisoryScore}/100
        </span>
      </div>
      {violations.length === 0 ? (
        <p className="text-xs text-text-muted">No browser-integrity events recorded in this session.</p>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-2">
          {violations.map((violation) => (
            <div key={violation.id} className="flex justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs">
              <span>{violation.type}</span>
              <span className="text-text-muted">{violation.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
