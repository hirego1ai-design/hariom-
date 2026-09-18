"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Restriction = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  reason: string;
  suspendedUntil: string | null;
  reviewedAt: string | null;
  appealNote: string | null;
  appealedAt: string | null;
};

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function AssessmentRestrictionsPage() {
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appealId, setAppealId] = useState<string | null>(null);
  const [appealNote, setAppealNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRestrictions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await readJson(await fetch("/api/candidate/recorded-assessment/restrictions", { cache: "no-store" }));
      setRestrictions(data.restrictions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load assessment access status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRestrictions(); }, [loadRestrictions]);

  async function submitAppeal(event: FormEvent) {
    event.preventDefault();
    if (!appealId) return;
    setSaving(true);
    setError("");
    try {
      await readJson(await fetch("/api/candidate/recorded-assessment/restrictions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ restrictionId: appealId, appealNote }),
      }));
      setAppealId(null);
      setAppealNote("");
      await loadRestrictions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit appeal.");
    } finally {
      setSaving(false);
    }
  }

  function cancelAppeal() {
    setAppealId(null);
    setAppealNote("");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Assessment access</h1>
      <p className="mt-2 text-sm text-gray-600">Review recorded-assessment restrictions and submit an appeal when one is active.</p>

      {error && <p role="alert" className="mt-4 rounded-lg border p-3">{error}</p>}
      {loading && <p className="mt-6">Loading access status…</p>}
      {!loading && restrictions.length === 0 && <p className="mt-6 rounded-xl border p-5">No recorded-assessment restrictions are associated with your account.</p>}

      {!loading && restrictions.length > 0 && (
        <div className="mt-6 space-y-4">
          {restrictions.map((restriction) => (
            <article key={restriction.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="font-semibold">{restriction.status === "ACTIVE" ? "Assessment access restricted" : "Previous assessment restriction"}</h2>
                <span className="text-sm">{restriction.status}</span>
              </div>
              <p className="mt-3">{restriction.reason}</p>
              {restriction.suspendedUntil && <p className="mt-2 text-sm"><strong>Until:</strong> {new Date(restriction.suspendedUntil).toLocaleString()}</p>}

              {restriction.appealedAt ? (
                <p className="mt-3 text-sm">Appeal submitted {new Date(restriction.appealedAt).toLocaleString()}.</p>
              ) : restriction.status === "ACTIVE" ? (
                <button type="button" className="mt-4 rounded-lg border px-4 py-2" onClick={() => setAppealId(restriction.id)}>Submit appeal</button>
              ) : null}

              {appealId === restriction.id && (
                <form className="mt-4" onSubmit={submitAppeal}>
                  <label className="block text-sm font-medium">
                    Appeal details
                    <textarea required minLength={20} maxLength={2000} value={appealNote} onChange={(event) => setAppealNote(event.target.value)} className="mt-1 min-h-32 w-full rounded-lg border p-3" />
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button disabled={saving} className="rounded-lg border px-4 py-2 disabled:opacity-50">{saving ? "Submitting…" : "Submit appeal"}</button>
                    <button type="button" disabled={saving} onClick={cancelAppeal} className="rounded-lg border px-4 py-2 disabled:opacity-50">Cancel</button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
