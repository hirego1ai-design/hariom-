"use client";

import React, { useCallback, useEffect, useState } from "react";

export interface ProctoringViolation {
  id: string;
  type: "Tab Switch" | "Copy-Paste Attempt" | "Right Click Blocked" | "Face Missing" | "Background Noise";
  timestamp: string;
  severity: "low" | "medium" | "high";
}

const telemetryTypeByViolation: Record<ProctoringViolation["type"], string> = {
  "Tab Switch": "TAB_SWITCH",
  "Copy-Paste Attempt": "COPY_PASTE_DETECTED",
  "Right Click Blocked": "BROWSER_UNFOCUSED",
  "Face Missing": "FACE_NOT_DETECTED",
  "Background Noise": "AUDIO_ANOMALY",
};

export default function ProctoringEngine({ interviewId, onViolationCountChange }: { interviewId?: string; onViolationCountChange?: (count: number) => void }) {
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [cheatingScore, setCheatingScore] = useState<number>(0);

  const addViolation = useCallback((type: ProctoringViolation["type"], severity: ProctoringViolation["severity"]) => {
    const newV: ProctoringViolation = {
      id: String(Date.now()),
      type,
      timestamp: new Date().toLocaleTimeString(),
      severity,
    };
    setViolations((prev) => {
      const updated = [newV, ...prev];
      if (onViolationCountChange) onViolationCountChange(updated.length);
      return updated;
    });

    const weight = severity === "high" ? 25 : severity === "medium" ? 15 : 5;
    setCheatingScore((prev) => Math.min(100, prev + weight));

    // Push the raw browser observation only. The server owns severity and
    // scoring; this UI must not be treated as an authoritative decision.
    if (interviewId) {
      fetch("/api/proctoring/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, violationType: telemetryTypeByViolation[type] }),
      }).catch(() => {});
    }
  }, [interviewId, onViolationCountChange]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("Tab Switch", "high");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("Copy-Paste Attempt", "medium");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("Right Click Blocked", "low");
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [addViolation]);

  return (
    <div className="w-full bg-[#141418] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">Live AI Proctoring Monitor</h4>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-text-muted">Advisory review score:</span>
          <span className={`px-2.5 py-0.5 rounded-full font-bold ${
            cheatingScore > 40 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green/20 text-green border border-green/30"
          }`}>
            {cheatingScore}% {cheatingScore > 40 ? "(Flagged)" : "(Clean)"}
          </span>
        </div>
      </div>

      {/* Violation Feed */}
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar font-mono text-xs">
        {violations.length === 0 ? (
          <p className="text-text-muted text-center py-4 italic">No proctoring violations recorded in current session.</p>
        ) : (
          violations.map((v) => (
            <div key={v.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${v.severity === "high" ? "bg-red-500" : "bg-yellow"}`} />
                <span className="text-white font-bold">{v.type}</span>
              </div>
              <span className="text-text-muted text-[11px]">{v.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
