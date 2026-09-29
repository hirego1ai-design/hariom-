"use client";

import { useDeferredValue, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type EmployerRecord = {
  id: string;
  designation: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    role: "EMPLOYER";
  } | null;
  company: {
    id: string;
    name: string;
    industry: string | null;
    location: string | null;
    createdAt: string;
  };
};

const PAGE_SIZE = 25;

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<EmployerRecord[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      search: deferredSearch,
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    fetch(`/api/admin/employers?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Unable to load employers.");
        }
        setEmployers(Array.isArray(payload.data) ? payload.data : []);
        setTotal(typeof payload.total === "number" ? payload.total : 0);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setEmployers([]);
        setTotal(0);
        setError(reason instanceof Error ? reason.message : "Unable to load employers.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Employers & Companies"
          subtitle="Persisted employer-owner profiles and their companies."
          onSearch={setSearch}
        />

        <main className="mx-auto max-w-6xl p-4 pt-24 sm:p-6 sm:pt-24">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141418]" aria-labelledby="employer-profiles-heading">
            <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 id="employer-profiles-heading" className="font-bold">Employer-owner profiles</h1>
                <p className="mt-1 text-xs text-slate-400">
                  {loading ? "Loading authoritative records…" : total === 0 ? "No matching records" : `Showing ${from}–${to} of ${total}`}
                </p>
              </div>
              {deferredSearch && (
                <span className="max-w-full truncate rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                  Search: {deferredSearch}
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-sm text-slate-400" role="status" aria-live="polite">Loading employer profiles…</div>
            ) : error ? (
              <div className="p-8 text-sm text-red-300" role="alert">{error}</div>
            ) : employers.length === 0 ? (
              <div className="p-8 text-sm text-slate-400">
                {deferredSearch ? "No employer-owner profiles match this search." : "No persisted employer-owner profiles found."}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {employers.map((employer) => (
                  <article key={employer.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{employer.company.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {employer.user?.name || "Employer name unavailable"} · {employer.user?.email || "Email unavailable"}
                      </p>
                      {employer.designation && <p className="mt-1 text-[11px] text-slate-500">{employer.designation}</p>}
                    </div>
                    <div className="text-left text-xs text-slate-400 sm:text-right">
                      <p>{employer.company.industry || "Industry not set"}</p>
                      <p>{employer.company.location || "Location not set"}</p>
                      <p className={employer.user?.emailVerified ? "mt-1 text-emerald-400" : "mt-1 text-amber-300"}>
                        {employer.user?.emailVerified ? "Email verified" : "Email unverified"}
                      </p>
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
