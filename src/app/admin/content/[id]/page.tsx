"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import RichContentEditor from "@/components/admin/RichContentEditor";

type ContentType = "BLOG" | "PRESS_RELEASE";
type ContentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type FormState = {
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  featuredImageFileId: string;
  featuredImageAlt: string;
  ogImageFileId: string;
  category: string;
  tags: string;
  dateline: string;
  mediaContactName: string;
  mediaContactEmail: string;
  mediaContactPhone: string;
  companyBoilerplate: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  scheduledAt: string;
};

const initialForm: FormState = {
  type: "BLOG",
  title: "",
  slug: "",
  excerpt: "",
  contentHtml: "<p><br></p>",
  featuredImageFileId: "",
  featuredImageAlt: "",
  ogImageFileId: "",
  category: "",
  tags: "",
  dateline: "",
  mediaContactName: "",
  mediaContactEmail: "",
  mediaContactPhone: "",
  companyBoilerplate: "",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  scheduledAt: "",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function imageLabel(file: File) {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function AdminContentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = params.id;
  const isNew = requestedId === "new";
  const requestedType = searchParams.get("type") === "PRESS_RELEASE" ? "PRESS_RELEASE" : "BLOG";

  const [recordId, setRecordId] = useState(isNew ? "" : requestedId);
  const [form, setForm] = useState<FormState>(() => ({ ...initialForm, type: requestedType }));
  const [status, setStatus] = useState<ContentStatus>("DRAFT");
  const [revision, setRevision] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [assetUploading, setAssetUploading] = useState<"featured" | "og" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publicPath = form.type === "BLOG" ? `/blog/${form.slug || "slug"}` : `/press-releases/${form.slug || "slug"}`;

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setNotice("");
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm((current) => ({ ...current, type: requestedType }));
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/content/${encodeURIComponent(requestedId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load content.");
        return payload.content;
      })
      .then((content) => {
        if (cancelled) return;
        setRecordId(content.id);
        setStatus(content.status);
        setRevision(content.revision);
        setPublishedAt(content.publishedAt || null);
        setForm({
          type: content.type,
          title: content.title || "",
          slug: content.slug || "",
          excerpt: content.excerpt || "",
          contentHtml: content.contentHtml || "<p><br></p>",
          featuredImageFileId: content.featuredImageFileId || "",
          featuredImageAlt: content.featuredImageAlt || "",
          ogImageFileId: content.ogImageFileId || "",
          category: content.category || "",
          tags: Array.isArray(content.tags) ? content.tags.join(", ") : "",
          dateline: content.dateline || "",
          mediaContactName: content.mediaContactName || "",
          mediaContactEmail: content.mediaContactEmail || "",
          mediaContactPhone: content.mediaContactPhone || "",
          companyBoilerplate: content.companyBoilerplate || "",
          seoTitle: content.seoTitle || "",
          seoDescription: content.seoDescription || "",
          canonicalUrl: content.canonicalUrl || "",
          scheduledAt: toLocalDateTime(content.scheduledAt),
        });
        setSlugTouched(true);
        setDirty(false);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load content."))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isNew, requestedId, requestedType]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const payloadFor = useCallback((targetStatus: ContentStatus) => ({
    type: form.type,
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim() || null,
    contentHtml: form.contentHtml,
    featuredImageFileId: form.featuredImageFileId || null,
    featuredImageAlt: form.featuredImageAlt.trim() || null,
    ogImageFileId: form.ogImageFileId || null,
    category: form.category.trim() || null,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    dateline: form.dateline.trim() || null,
    mediaContactName: form.mediaContactName.trim() || null,
    mediaContactEmail: form.mediaContactEmail.trim() || null,
    mediaContactPhone: form.mediaContactPhone.trim() || null,
    companyBoilerplate: form.companyBoilerplate.trim() || null,
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    canonicalUrl: form.canonicalUrl.trim() || null,
    status: targetStatus,
    scheduledAt: targetStatus === "SCHEDULED" && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    ...(revision ? { expectedRevision: revision } : {}),
  }), [form, revision]);

  const save = useCallback(async (targetStatus: ContentStatus, quiet = false) => {
    if (saving) return;
    setError("");
    if (!quiet) setNotice("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setSaving(true);
    try {
      const path = recordId ? `/api/admin/content/${encodeURIComponent(recordId)}` : "/api/admin/content";
      const response = await fetch(path, {
        method: recordId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFor(targetStatus)),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to save content.");

      const content = payload.content;
      setRecordId(content.id);
      setStatus(content.status);
      setRevision(content.revision);
      setPublishedAt(content.publishedAt || null);
      setForm((current) => ({ ...current, scheduledAt: toLocalDateTime(content.scheduledAt) }));
      setDirty(false);
      if (!quiet) {
        setNotice(
          content.status === "PUBLISHED"
            ? `${content.type === "BLOG" ? "Blog" : "Press release"} published.`
            : content.status === "SCHEDULED"
              ? "Publication scheduled."
              : content.status === "ARCHIVED"
                ? "Content archived."
                : "Draft saved.",
        );
      }
      if (!recordId) router.replace(`/admin/content/${content.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save content.");
    } finally {
      setSaving(false);
    }
  }, [form.slug, form.title, payloadFor, recordId, router, saving]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (!recordId || !dirty || status !== "DRAFT" || saving) return;
    autosaveTimer.current = setTimeout(() => {
      void save("DRAFT", true);
    }, 5000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, recordId, save, saving, status]);

  async function uploadAsset(event: ChangeEvent<HTMLInputElement>, target: "featured" | "og") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Choose a JPEG, PNG, or WebP image up to 10 MB.");
      return;
    }

    setAssetUploading(target);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("category", "content-media");
      const response = await fetch("/api/upload", { method: "POST", body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.file?.id) throw new Error(payload.error || "Image upload failed.");
      if (target === "featured") {
        setForm((current) => ({
          ...current,
          featuredImageFileId: payload.file.id,
          featuredImageAlt: current.featuredImageAlt || imageLabel(file),
        }));
      } else {
        setForm((current) => ({ ...current, ogImageFileId: payload.file.id }));
      }
      setDirty(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setAssetUploading(null);
    }
  }

  const previewDoc = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
body{font-family:Inter,Arial,sans-serif;background:#fff;color:#152033;margin:0;padding:40px;line-height:1.75}main{max-width:820px;margin:auto}h1{font-size:42px;line-height:1.12;margin:0 0 16px}h2{font-size:30px;margin-top:1.6em}h3{font-size:24px;margin-top:1.5em}h4{font-size:19px;margin-top:1.4em}p{margin:0 0 1.1em}img{max-width:100%;height:auto;border-radius:16px}figure{margin:28px 0}figcaption{text-align:center;color:#667085;font-size:13px}blockquote{border-left:4px solid #1687d9;padding-left:18px;color:#475467}a{color:#1269b0}.meta{color:#667085;font-size:14px;margin-bottom:30px}.lead{font-size:19px;color:#475467;margin:0 0 30px}pre{overflow:auto;background:#f4f4f5;padding:16px;border-radius:12px}
</style></head><body><main><div class="meta">${form.type === "BLOG" ? "BLOG" : "PRESS RELEASE"} · PREVIEW</div><h1>${form.title.replace(/</g,"&lt;").replace(/>/g,"&gt;") || "Untitled"}</h1>${form.excerpt ? `<p class="lead">${form.excerpt.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>` : ""}${form.contentHtml}</main></body></html>`, [form]);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0C] text-white"><AdminSidebar /><div className="md:pl-[116px]"><AdminHeader title="Content Management" subtitle="Loading editor…" /><main className="p-8 pt-28 text-sm text-zinc-500">Loading authoritative content…</main></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader title={recordId ? "Edit Content" : "Create Content"} subtitle="Admin-managed editorial publishing with secure media and server-side sanitization." />
        <main className="mx-auto max-w-[1600px] space-y-6 p-4 pt-24 sm:p-6 lg:p-8 lg:pt-24">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => router.push("/admin/content")} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-bold">
                <span className="material-symbols-outlined text-[17px]">arrow_back</span> Content
              </button>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">{form.type === "BLOG" ? "Blog" : "Press Release"}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-300">{status}</span>
              {dirty && <span className="text-xs text-amber-300">Unsaved changes</span>}
              {!dirty && recordId && <span className="text-xs text-zinc-600">Saved · revision {revision}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowPreview((value) => !value)} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold hover:bg-white/5">{showPreview ? "Hide Preview" : "Preview"}</button>
              <button type="button" disabled={saving} onClick={() => void save("DRAFT")} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold disabled:opacity-50">Save Draft</button>
              <button type="button" disabled={saving || !form.scheduledAt} onClick={() => void save("SCHEDULED")} className="min-h-11 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-bold text-sky-200 disabled:opacity-40">Schedule</button>
              <button type="button" disabled={saving} onClick={() => void save("PUBLISHED")} className="min-h-11 rounded-xl bg-sky-400 px-4 text-sm font-extrabold text-sky-950 disabled:opacity-50">
                {saving ? "Saving…" : form.type === "BLOG" ? "Publish Blog" : "Publish Press Release"}
              </button>
            </div>
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
          {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}

          <div className={showPreview ? "grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,.8fr)]" : ""}>
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Content type
                    <select value={form.type} onChange={(e) => setField("type", e.target.value as ContentType)} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white">
                      <option value="BLOG">Blog</option>
                      <option value="PRESS_RELEASE">Press Release</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Publish later
                    <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setField("scheduledAt", e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" />
                  </label>
                </div>
                <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Title
                  <input
                    value={form.title}
                    maxLength={180}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((current) => ({ ...current, title, ...(!slugTouched ? { slug: slugify(title) } : {}) }));
                      setDirty(true);
                    }}
                    placeholder={form.type === "BLOG" ? "Article title" : "Press release headline"}
                    className="min-h-14 rounded-xl border border-white/10 bg-[#0d0d10] px-4 text-xl font-semibold normal-case tracking-normal text-white outline-none focus:border-sky-400"
                  />
                </label>
                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.4fr)]">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Slug
                    <input
                      value={form.slug}
                      maxLength={180}
                      onChange={(e) => { setSlugTouched(true); setField("slug", slugify(e.target.value)); }}
                      className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white"
                    />
                    <span className="truncate text-[11px] font-normal normal-case tracking-normal text-zinc-600">hiregoai.com{publicPath}</span>
                  </label>
                  {form.type === "BLOG" ? (
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Category
                      <input value={form.category} maxLength={80} onChange={(e) => setField("category", e.target.value)} placeholder="Hiring, Careers…" className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" />
                    </label>
                  ) : (
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Dateline
                      <input value={form.dateline} maxLength={160} onChange={(e) => setField("dateline", e.target.value)} placeholder="NEW DELHI, India —" className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" />
                    </label>
                  )}
                </div>
                <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Excerpt
                  <textarea value={form.excerpt} maxLength={400} rows={3} onChange={(e) => setField("excerpt", e.target.value)} placeholder="Short summary shown on listing pages and social previews." className="rounded-xl border border-white/10 bg-[#0d0d10] p-3 text-sm font-normal normal-case leading-6 tracking-normal text-white" />
                </label>
                <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Tags
                  <input value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="AI hiring, recruitment, candidate experience" className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" />
                  <span className="text-[11px] font-normal normal-case tracking-normal text-zinc-600">Comma-separated, maximum 12 tags.</span>
                </label>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Rich Editor</h2>
                    <p className="text-xs text-zinc-500">Formatting is sanitized server-side before persistence and publication.</p>
                  </div>
                  {status === "DRAFT" && recordId && <span className="text-xs text-zinc-600">Autosaves after 5 seconds</span>}
                </div>
                <RichContentEditor value={form.contentHtml} onChange={(html) => setField("contentHtml", html)} disabled={saving} />
              </section>

              {form.type === "PRESS_RELEASE" && (
                <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                  <h2 className="text-lg font-semibold">Press release details</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Media contact name<input value={form.mediaContactName} maxLength={120} onChange={(e) => setField("mediaContactName", e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" /></label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Media contact email<input type="email" value={form.mediaContactEmail} maxLength={254} onChange={(e) => setField("mediaContactEmail", e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" /></label>
                    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Media contact phone<input value={form.mediaContactPhone} maxLength={40} onChange={(e) => setField("mediaContactPhone", e.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" /></label>
                  </div>
                  <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Company boilerplate
                    <textarea value={form.companyBoilerplate} maxLength={3000} rows={5} onChange={(e) => setField("companyBoilerplate", e.target.value)} placeholder="About HireGo AI…" className="rounded-xl border border-white/10 bg-[#0d0d10] p-3 text-sm font-normal normal-case leading-6 tracking-normal text-white" />
                  </label>
                </section>
              )}

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <h2 className="text-lg font-semibold">Media</h2>
                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-[#0d0d10] p-4">
                    <p className="text-sm font-semibold">Featured image</p>
                    {form.featuredImageFileId ? <img src={`/api/content/media/${form.featuredImageFileId}`} alt={form.featuredImageAlt || ""} className="mt-3 aspect-[16/9] w-full rounded-lg object-cover" /> : <div className="mt-3 grid aspect-[16/9] place-items-center rounded-lg border border-dashed border-white/10 text-xs text-zinc-600">No featured image</div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-white/10 px-3 text-xs font-bold hover:bg-white/5">
                        {assetUploading === "featured" ? "Uploading…" : "Upload image"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={Boolean(assetUploading)} onChange={(e) => void uploadAsset(e, "featured")} />
                      </label>
                      {form.featuredImageFileId && <button type="button" onClick={() => setField("featuredImageFileId", "")} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs text-zinc-300">Remove</button>}
                    </div>
                    <input value={form.featuredImageAlt} maxLength={180} onChange={(e) => setField("featuredImageAlt", e.target.value)} placeholder="Featured image alt text" className="mt-3 min-h-10 w-full rounded-lg border border-white/10 bg-[#111116] px-3 text-xs text-white" />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0d0d10] p-4">
                    <p className="text-sm font-semibold">Open Graph image</p>
                    {form.ogImageFileId ? <img src={`/api/content/media/${form.ogImageFileId}`} alt="" className="mt-3 aspect-[1.91/1] w-full rounded-lg object-cover" /> : <div className="mt-3 grid aspect-[1.91/1] place-items-center rounded-lg border border-dashed border-white/10 text-xs text-zinc-600">Uses featured image when empty</div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-white/10 px-3 text-xs font-bold hover:bg-white/5">
                        {assetUploading === "og" ? "Uploading…" : "Upload OG image"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={Boolean(assetUploading)} onChange={(e) => void uploadAsset(e, "og")} />
                      </label>
                      {form.ogImageFileId && <button type="button" onClick={() => setField("ogImageFileId", "")} className="min-h-10 rounded-lg border border-white/10 px-3 text-xs text-zinc-300">Remove</button>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#121215] p-5 sm:p-6">
                <h2 className="text-lg font-semibold">SEO & discovery</h2>
                <div className="mt-5 grid gap-5">
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">SEO title<input value={form.seoTitle} maxLength={120} onChange={(e) => setField("seoTitle", e.target.value)} placeholder={form.title || "Defaults to content title"} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" /></label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Meta description<textarea value={form.seoDescription} maxLength={220} rows={3} onChange={(e) => setField("seoDescription", e.target.value)} placeholder={form.excerpt || "Defaults to excerpt"} className="rounded-xl border border-white/10 bg-[#0d0d10] p-3 text-sm font-normal normal-case leading-6 tracking-normal text-white" /></label>
                  <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Canonical URL<input value={form.canonicalUrl} maxLength={500} onChange={(e) => setField("canonicalUrl", e.target.value)} placeholder={`https://hiregoai.com${publicPath}`} className="min-h-11 rounded-xl border border-white/10 bg-[#0d0d10] px-3 text-sm font-normal normal-case tracking-normal text-white" /></label>
                </div>
                <div className="mt-5 rounded-xl border border-white/10 bg-white p-4 text-slate-900">
                  <p className="truncate text-sm text-emerald-700">hiregoai.com{publicPath}</p>
                  <p className="mt-1 text-xl text-blue-800">{form.seoTitle || form.title || "Untitled content"}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{form.seoDescription || form.excerpt || "Add a concise description for search and social discovery."}</p>
                </div>
              </section>

              {recordId && (status === "PUBLISHED" || status === "SCHEDULED" || publishedAt) && (
                <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <h2 className="text-sm font-bold text-red-100">Archive content</h2>
                  <p className="mt-2 text-xs leading-5 text-red-200/70">Archiving removes it from public listings while preserving the record and audit history.</p>
                  <button type="button" disabled={saving} onClick={() => void save("ARCHIVED")} className="mt-4 min-h-10 rounded-lg border border-red-500/30 px-3 text-xs font-bold text-red-200">Archive</button>
                </section>
              )}
            </div>

            {showPreview && (
              <aside className="2xl:sticky 2xl:top-24 2xl:self-start">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Safe preview</span>
                    <span className="text-[10px] text-zinc-600">Scripts disabled</span>
                  </div>
                  <iframe title="Content preview" sandbox="" srcDoc={previewDoc} className="h-[76vh] w-full bg-white" />
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
