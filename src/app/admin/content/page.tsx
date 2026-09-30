"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type ContentRow = {
  id: string;
  type: "BLOG" | "PRESS_RELEASE";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  updatedAt: string;
  revision: number;
  author?: { name: string; email: string };
};

const PAGE_SIZE = 25;

function statusClass(status: ContentRow["status"]) {
  if (status === "PUBLISHED") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  if (status === "SCHEDULED") return "border-sky-400/25 bg-sky-400/10 text-sky-200";
  if (status === "ARCHIVED") return "border-zinc-600 bg-zinc-800/60 text-zinc-300";
  return "border-amber-400/25 bg-amber-400/10 text-amber-200";
}

export default function AdminContentPage() {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (type) query.set("type", type);
      if (status) query.set("status", status);
      if (appliedSearch) query.set("search", appliedSearch);
      const response = await fetch(`/api/admin/content?${query.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load content.");
      setRows(Array.isArray(payload.content) ? payload.content : []);
      setTotal(typeof payload.total === "number" ? payload.total : 0);
    } catch (cause) {
      setRows([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : "Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, [page, type, status, appliedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  async function remove(row: ContentRow) {
    const action = row.status === "DRAFT" && !row.publishedAt ? "delete this draft" : "archive this content";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/content/${encodeURIComponent(row.id)}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      setError(payload.error || "Unable to update content.");
      return;
    }
    setNotice(payload.deleted ? "Draft deleted." : "Content archived.");
    await load();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader title="Content Management" subtitle="One production CMS for HireGo blogs and press releases." />
        <main className="mx-auto max-w-[1500px] space-y-6 p-4 pt-24 sm:p-6 lg:p-8 lg:pt-24">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Editorial CMS</p>
              <h1 className="mt-2 text-3xl font-semibold">Blog + Press Release</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Create, review, schedule, publish and archive both content types from one authoritative system.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/content/new?type=BLOG" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">
                <span className="material-symbols-outlined text-[18px]">article</span> New Blog
              </Link>
              <Link href="/admin/content/new?type=PRESS_RELEASE" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-sky-950">
                <span className="material-symbols-outlined text-[18px]">campaign</span> New Press Release
              </Link>
            </div>
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}

          <section className="rounded-2xl border border-white/10 bg-[#121215] p-4 sm:p-5" aria-label="Content filters">
            <form onSubmit={applySearch} className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_210px_210px_auto]">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Search
                <input value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} placeholder="Title, slug or content" className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-sky-400" />
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Type
                <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white">
                  <option value="">All types</option>
                  <option value="BLOG">Blog</option>
                  <option value="PRESS_RELEASE">Press Release</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Status
                <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white">
                  <option value="">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <button type="submit" className="min-h-11 self-end rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-bold hover:bg-white/10">Search</button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-zinc-500 sm:px-5">
              <span>{total.toLocaleString()} content item{total === 1 ? "" : "s"}</span>
              <span>Page {page} of {totalPages}</span>
            </div>
            {loading ? (
              <div role="status" className="p-8 text-sm text-zinc-500">Loading authoritative content…</div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-zinc-700">article</span>
                <h2 className="mt-3 text-lg font-semibold">No content found</h2>
                <p className="mt-2 text-sm text-zinc-500">Create the first blog or press release, or change the filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {rows.map((row) => (
                  <article key={row.id} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_180px_160px_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-300">{row.type === "BLOG" ? "Blog" : "Press Release"}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${statusClass(row.status)}`}>{row.status}</span>
                      </div>
                      <h2 className="mt-3 truncate text-base font-semibold">{row.title}</h2>
                      <p className="mt-1 truncate text-xs text-zinc-500">/{row.type === "BLOG" ? "blog" : "press-releases"}/{row.slug}</p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      <p className="font-semibold text-zinc-300">{row.author?.name || "Admin"}</p>
                      <p className="mt-1">{new Date(row.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {row.status === "SCHEDULED" && row.scheduledAt ? <>Scheduled<br /><span className="text-zinc-300">{new Date(row.scheduledAt).toLocaleString()}</span></> : row.publishedAt ? <>Published<br /><span className="text-zinc-300">{new Date(row.publishedAt).toLocaleDateString()}</span></> : "Not published"}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link href={`/admin/content/${row.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-xs font-bold hover:bg-white/5">Edit</Link>
                      <button type="button" onClick={() => void remove(row)} className="inline-flex min-h-10 items-center rounded-lg border border-red-500/20 px-3 text-xs font-bold text-red-200 hover:bg-red-500/10">
                        {row.status === "DRAFT" && !row.publishedAt ? "Delete" : "Archive"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <nav className="flex items-center justify-between" aria-label="Content pagination">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="min-h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold disabled:opacity-40">Next</button>
          </nav>
        </main>
      </div>
    </div>
  );
}
