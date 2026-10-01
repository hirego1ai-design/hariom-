"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export type LiveProctoringClientPolicy = {
  enabled: boolean;
  trackTabSwitch: boolean;
  trackClipboard: boolean;
  trackContextMenu: boolean;
  policyVersion: string;
};

type ViolationType = "TAB_SWITCH" | "COPY_PASTE_DETECTED" | "BROWSER_UNFOCUSED";
type DeliveryStatus = "PENDING" | "DELIVERED" | "NOT_RECORDED";

type BrowserObservation = {
  id: string;
  label: string;
  timestamp: string;
  deliveryStatus: DeliveryStatus;
};

type PendingTelemetry = {
  id: string;
  violationType: ViolationType;
  label: string;
  timestamp: string;
  attempts: number;
  queuedAt: number;
};

const MAX_PENDING_EVENTS = 20;
const MAX_DELIVERY_ATTEMPTS = 3;
const MAX_PENDING_AGE_MS = 15 * 60 * 1000;
const RETRY_INTERVAL_MS = 3_000;

function pendingStorageKey(interviewId: string) {
  return `hirego:live-proctoring:${interviewId}:pending-v1`;
}

function readStoredPending(interviewId: string): PendingTelemetry[] {
  try {
    const raw = window.sessionStorage.getItem(pendingStorageKey(interviewId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - MAX_PENDING_AGE_MS;
    return parsed
      .filter((item): item is PendingTelemetry => {
        if (!item || typeof item !== "object") return false;
        const value = item as Record<string, unknown>;
        return (
          typeof value.id === "string" &&
          ["TAB_SWITCH", "COPY_PASTE_DETECTED", "BROWSER_UNFOCUSED"].includes(
            String(value.violationType),
          ) &&
          typeof value.label === "string" &&
          typeof value.timestamp === "string" &&
          typeof value.attempts === "number" &&
          Number.isInteger(value.attempts) &&
          value.attempts >= 1 &&
          value.attempts < MAX_DELIVERY_ATTEMPTS &&
          typeof value.queuedAt === "number" &&
          value.queuedAt >= cutoff
        );
      })
      .slice(-MAX_PENDING_EVENTS);
  } catch {
    return [];
  }
}

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
  const pendingRef = useRef<PendingTelemetry[]>([]);
  const flushingRef = useRef(false);

  const persistPending = useCallback(() => {
    try {
      const key = pendingStorageKey(interviewId);
      if (pendingRef.current.length === 0) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(
          key,
          JSON.stringify(pendingRef.current.slice(-MAX_PENDING_EVENTS)),
        );
      }
    } catch {
      // sessionStorage may be unavailable in hardened/private browser modes.
      // The in-memory bounded queue still remains active for this page session.
    }
  }, [interviewId]);

  const setObservationDelivery = useCallback(
    (id: string, deliveryStatus: DeliveryStatus) => {
      setObservations((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, deliveryStatus } : item,
        ),
      );
    },
    [],
  );

  const sendTelemetry = useCallback(
    async (
      item: Pick<PendingTelemetry, "id" | "violationType">,
    ): Promise<
      | { outcome: "DELIVERED" }
      | { outcome: "RETRY"; message: string }
      | { outcome: "TERMINAL"; message: string }
    > => {
      try {
        const response = await fetch("/api/proctoring/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            clientEventId: item.id,
            violationType: item.violationType,
          }),
        });
        if (response.ok) return { outcome: "DELIVERED" };

        const body = await response.json().catch(() => ({}));
        const message =
          typeof body.error === "string"
            ? body.error
            : "Telemetry could not be recorded.";
        if (response.status === 429 || response.status >= 500) {
          return { outcome: "RETRY", message };
        }
        return { outcome: "TERMINAL", message };
      } catch {
        return {
          outcome: "RETRY",
          message: "Network interrupted while recording browser observation.",
        };
      }
    },
    [interviewId],
  );

  const flushPending = useCallback(async () => {
    if (
      flushingRef.current ||
      !policy.enabled ||
      pendingRef.current.length === 0
    ) {
      return;
    }
    if (!navigator.onLine) {
      setDeliveryError(
        "A browser observation is pending delivery. It is not recorded server-side until delivery succeeds.",
      );
      return;
    }

    flushingRef.current = true;
    try {
      while (pendingRef.current.length > 0) {
        const item = pendingRef.current[0];
        if (Date.now() - item.queuedAt > MAX_PENDING_AGE_MS) {
          pendingRef.current.shift();
          persistPending();
          setObservationDelivery(item.id, "NOT_RECORDED");
          setDeliveryError(
            "A stale browser observation could not be delivered and is not recorded server-side.",
          );
          continue;
        }

        const result = await sendTelemetry(item);
        if (result.outcome === "DELIVERED") {
          pendingRef.current.shift();
          persistPending();
          setObservationDelivery(item.id, "DELIVERED");
          if (pendingRef.current.length === 0) setDeliveryError("");
          continue;
        }

        if (result.outcome === "TERMINAL") {
          pendingRef.current.shift();
          persistPending();
          setObservationDelivery(item.id, "NOT_RECORDED");
          setDeliveryError(
            `${result.message} This observation was not recorded server-side.`,
          );
          continue;
        }

        const attempts = item.attempts + 1;
        if (attempts >= MAX_DELIVERY_ATTEMPTS) {
          pendingRef.current.shift();
          persistPending();
          setObservationDelivery(item.id, "NOT_RECORDED");
          setDeliveryError(
            "Browser observation delivery failed after bounded retries and is not recorded server-side.",
          );
          continue;
        }

        pendingRef.current[0] = { ...item, attempts };
        persistPending();
        setObservationDelivery(item.id, "PENDING");
        setDeliveryError(
          "A browser observation is pending delivery. It is not recorded server-side until delivery succeeds.",
        );
        break;
      }
    } finally {
      flushingRef.current = false;
    }
  }, [
    persistPending,
    policy.enabled,
    sendTelemetry,
    setObservationDelivery,
  ]);

  const queueForRetry = useCallback(
    (item: PendingTelemetry) => {
      if (pendingRef.current.length >= MAX_PENDING_EVENTS) {
        const dropped = pendingRef.current.shift();
        if (dropped) setObservationDelivery(dropped.id, "NOT_RECORDED");
      }
      pendingRef.current.push(item);
      persistPending();
      setObservationDelivery(item.id, "PENDING");
      setDeliveryError(
        "A browser observation is pending delivery. It is not recorded server-side until delivery succeeds.",
      );
    },
    [persistPending, setObservationDelivery],
  );

  const report = useCallback(
    async (violationType: ViolationType, label: string) => {
      const id = crypto.randomUUID();
      const timestamp = new Date().toLocaleTimeString();
      const observation: BrowserObservation = {
        id,
        label,
        timestamp,
        deliveryStatus: "PENDING",
      };
      setObservations((previous) => {
        const next = [observation, ...previous].slice(0, 20);
        onViolationCountChange?.(next.length);
        return next;
      });

      const result = await sendTelemetry({ id, violationType });
      if (result.outcome === "DELIVERED") {
        setObservationDelivery(id, "DELIVERED");
        if (pendingRef.current.length === 0) setDeliveryError("");
        return;
      }
      if (result.outcome === "TERMINAL") {
        setObservationDelivery(id, "NOT_RECORDED");
        setDeliveryError(
          `${result.message} This observation was not recorded server-side.`,
        );
        return;
      }

      queueForRetry({
        id,
        violationType,
        label,
        timestamp,
        attempts: 1,
        queuedAt: Date.now(),
      });
    },
    [
      onViolationCountChange,
      queueForRetry,
      sendTelemetry,
      setObservationDelivery,
    ],
  );

  useEffect(() => {
    if (!policy.enabled) return;

    const restored = readStoredPending(interviewId);
    pendingRef.current = restored;
    if (restored.length > 0) {
      setObservations((previous) => {
        const known = new Set(previous.map((item) => item.id));
        const recovered = restored
          .filter((item) => !known.has(item.id))
          .map<BrowserObservation>((item) => ({
            id: item.id,
            label: item.label,
            timestamp: item.timestamp,
            deliveryStatus: "PENDING",
          }));
        const next = [...recovered, ...previous].slice(0, 20);
        onViolationCountChange?.(next.length);
        return next;
      });
      setDeliveryError(
        "Pending browser observations are being retried. They are not recorded server-side until delivery succeeds.",
      );
      void flushPending();
    }

    const retryTimer = window.setInterval(() => {
      void flushPending();
    }, RETRY_INTERVAL_MS);
    const onOnline = () => void flushPending();
    const onVisible = () => {
      if (!document.hidden) void flushPending();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [flushPending, interviewId, onViolationCountChange, policy.enabled]);

  useEffect(() => {
    if (!policy.enabled) return;

    const onVisibility = () => {
      if (policy.trackTabSwitch && document.hidden)
        void report("TAB_SWITCH", "Interview tab hidden");
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
    <aside
      className="rounded-2xl border border-white/10 bg-[#141418] p-4 text-white"
      aria-label="Interview browser monitoring"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">
            Browser monitoring active
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Policy {policy.policyVersion}. Browser events are advisory evidence
            and require human review.
          </p>
        </div>
        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">
          {observations.length} observed
        </span>
      </div>
      {deliveryError && (
        <p role="status" className="mt-3 text-xs text-amber-300">
          {deliveryError}
        </p>
      )}
      {observations.length > 0 && (
        <div className="mt-3 max-h-28 space-y-1 overflow-y-auto">
          {observations.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-3 text-[11px] text-text-muted"
            >
              <span>{item.label}</span>
              <span>
                {item.timestamp} ·{" "}
                {item.deliveryStatus === "DELIVERED"
                  ? "recorded"
                  : item.deliveryStatus === "PENDING"
                    ? "pending"
                    : "not recorded"}
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
