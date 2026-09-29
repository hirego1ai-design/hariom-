"use client";

import { useDeferredValue, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type SignupRecord = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

type SignupWindow = "" | "7" | "30" | "90";
const PAGE_SIZE = 25;

export default function AdminSignupsPage() {
  const [signups, setSignups] = useState<SignupRecord[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [windowDays, setWindowDays] = useState<SignupWindow>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, windowDays]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      search: deferredSearch,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (windowDays) params.set("windowDays", windowDays);

    fetch(`/api/admin/users?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load signups.");
        }
        setSignups(Array.isArray(payload.data) ? payload.data : []);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setSignups([]);
        setTotal(0);
        setError(reason instanceof Error ? reason.message : "Unable to load signups.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, windowDays, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const windowLabel =
    windowDays === "7"
      ? "Last 7 days"
      : windowDays === "30"
        ? "Last 30 days"
        : windowDays === "90"
          ? "Last 90 days"
          : "All time";

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="New Signups"
          subtitle="Candidate registrations, newest first, with an explicit signup window."
          onSearch={setSearch}
        />

        <main className="mx-auto max-w-6xl p-4 pt-24 sm:p-6 sm:pt-24">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141418]" aria-labelledby="candidate-signups-heading">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 id="candidate-signups-heading" className="font-bold">Candidate signups</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {loading
                    ? "Loading authoritative records…"
                    : total === 0
                      ? `No records in ${windowLabel.toLowerCase()}`
                      : `${windowLabel} · Showing ${from}–${to} of ${total}`}
                </p>
              </div>

              <label className="flex min-w-44 flex-col gap-1 text-[11px] text-slate-400">
                Signup window
                <select
                  value={windowDays}
                  onChange={(event) => setWindowDays(event.target.value as SignupWindow)}
                  className="rounded-xl border border-white/10 bg-[#1B1B20] px-3 py-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  <option value="">All time</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-slate-400" role="status" aria-live="polite">Loading candidate signups…</div>
            ) : error ? (
              <div className="p-8 text-sm text-red-300" role="alert">{error}</div>
            ) : signups.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">
                {deferredSearch || windowDays
                  ? "No candidate signups match the current search and signup window."
                  : "No persisted candidate signups found."}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {signups.map((signup) => (
                  <article key={signup.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{signup.name}</p>
                      <p className="truncate text-xs text-slate-400">{signup.email}</p>
                    </div>
                    <div className="text-left text-xs text-slate-400 sm:text-right">
                      <p className={signup.emailVerified ? "text-emerald-400" : "text-amber-300"}>
                        {signup.emailVerified ? "Verified" : "Pending verification"}
                      </p>
                      <p>Signed up {new Date(signup.createdAt).toLocaleString()}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && !error && total > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-400" aria-live="polite">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
