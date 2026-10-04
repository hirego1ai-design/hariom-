import type { Metadata } from "next";
import { createSign } from "node:crypto";

export const PUBLIC_ORIGIN = "https://www.hiregoai.com";
export const PUBLIC_HOST = "www.hiregoai.com";

export type PublicIndexKind = "JOB" | "EDITORIAL" | "PAGE";
export type PublicIndexAction = "UPDATED" | "DELETED";

export type PublicJobForDiscovery = {
  id: string;
  title: string;
  department?: string | null;
  location: string;
  type: string;
  workMode: string;
  experienceLevel: string;
  numberOfOpenings: number;
  salaryRange?: string | null;
  description: string;
  requirements?: string[] | null;
  publishedAt: Date;
  expiresAt?: Date | null;
  updatedAt?: Date;
  company: {
    name: string;
    logoUrl?: string | null;
    website?: string | null;
    description?: string | null;
    location?: string | null;
  };
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function clampSeoDescription(value: string, max = 155) {
  const text = compact(value);
  if (text.length <= max) return text;
  const shortened = text.slice(0, Math.max(1, max - 3)).replace(/\s+\S*$/, "").trim();
  return `${shortened || text.slice(0, max - 3).trim()}...`;
}

export function publicUrl(path = "/") {
  const normalized = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_ORIGIN}${normalized}`;
}

export function normalizeHireGoCanonical(value: string | null | undefined, fallbackPath: string) {
  if (!value?.trim()) return publicUrl(fallbackPath);
  try {
    const url = new URL(value.trim());
    if (url.hostname !== "hiregoai.com" && url.hostname !== PUBLIC_HOST) return publicUrl(fallbackPath);
    url.protocol = "https:";
    url.hostname = PUBLIC_HOST;
    url.port = "";
    url.hash = "";
    return url.toString();
  } catch {
    return publicUrl(fallbackPath);
  }
}

export function buildPublicMetadata(input: {
  path: string;
  title: string;
  description: string;
  image?: string;
  index?: boolean;
}): Metadata {
  const url = publicUrl(input.path);
  const title = compact(input.title);
  const description = clampSeoDescription(input.description);
  const image = input.image || "/marketing/og/home.webp";
  const index = input.index !== false;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index, follow: index },
    openGraph: {
      type: "website",
      siteName: "HireGo AI",
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: `${title} — HireGo AI` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function buildJobSeoDescription(job: PublicJobForDiscovery) {
  const parts = [
    `${job.title} at ${job.company.name} in ${job.location}.`,
    `${job.type} · ${job.workMode} · ${job.experienceLevel}.`,
    job.salaryRange ? `Salary: ${job.salaryRange}.` : "",
    job.requirements?.length ? `Key requirements include ${job.requirements.slice(0, 3).join(", ")}.` : "",
    "View the full role and apply through HireGo AI.",
  ];
  return clampSeoDescription(parts.filter(Boolean).join(" "));
}

export function buildJobMetadata(job: PublicJobForDiscovery): Metadata {
  const path = `/jobs/${job.id}`;
  const title = `${job.title} — ${job.company.name} | HireGo AI`;
  const description = buildJobSeoDescription(job);
  const image = job.company.logoUrl || "/marketing/og/home.webp";
  return buildPublicMetadata({ path, title, description, image, index: true });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteAssetUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value, PUBLIC_ORIGIN).toString();
  } catch {
    return undefined;
  }
}

function employmentType(value: string) {
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("full") && normalized.includes("time")) return "FULL_TIME";
  if (normalized.includes("part") && normalized.includes("time")) return "PART_TIME";
  if (normalized.includes("contract")) return "CONTRACTOR";
  if (normalized.includes("temporary") || normalized.includes("temp")) return "TEMPORARY";
  if (normalized.includes("intern")) return "INTERN";
  if (normalized.includes("volunteer")) return "VOLUNTEER";
  if (normalized.includes("per diem")) return "PER_DIEM";
  return "OTHER";
}

export function buildJobPostingSchema(job: PublicJobForDiscovery) {
  const requirements = (job.requirements || []).filter(Boolean);
  const description = [
    `<p>${escapeHtml(job.description).replace(/\n/g, "<br>")}</p>`,
    requirements.length
      ? `<h2>Requirements</h2><ul>${requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "",
  ].join("");

  const hiringOrganization: Record<string, unknown> = {
    "@type": "Organization",
    name: job.company.name,
  };
  if (job.company.website) hiringOrganization.sameAs = job.company.website;
  const logo = absoluteAssetUrl(job.company.logoUrl);
  if (logo) hiringOrganization.logo = logo;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: job.company.name,
      value: job.id,
    },
    datePosted: job.publishedAt.toISOString(),
    employmentType: employmentType(job.type),
    hiringOrganization,
    url: publicUrl(`/jobs/${job.id}`),
  };

  if (job.expiresAt) schema.validThrough = job.expiresAt.toISOString();

  const meaningfulLocation = compact(job.location);
  if (meaningfulLocation && !/^remote$/i.test(meaningfulLocation)) {
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: meaningfulLocation,
      },
    };
  }
  if (job.workMode.toLowerCase() === "remote") {
    schema.jobLocationType = "TELECOMMUTE";
  }

  return schema;
}

export function buildIndexNowPayload(urls: string[], key: string, keyLocation: string) {
  const unique = [...new Set(urls)];
  for (const value of unique) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== PUBLIC_HOST) {
      throw new Error("IndexNow URL must use the canonical HireGo host.");
    }
  }
  return {
    host: PUBLIC_HOST,
    key,
    keyLocation,
    urlList: unique,
  };
}

function indexNowConfig() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return null;
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    throw new Error("INDEXNOW_KEY must be 8-128 letters, numbers, or hyphens.");
  }
  const keyLocation = process.env.INDEXNOW_KEY_LOCATION?.trim() || publicUrl("/indexnow-key.txt");
  const parsed = new URL(keyLocation);
  if (parsed.protocol !== "https:" || parsed.hostname !== PUBLIC_HOST) {
    throw new Error("INDEXNOW_KEY_LOCATION must use the canonical HireGo host.");
  }
  return { key, keyLocation };
}

async function submitIndexNow(url: string) {
  const config = indexNowConfig();
  if (!config) return { skipped: true as const, reason: "INDEXNOW_KEY not configured" };

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(buildIndexNowPayload([url], config.key, config.keyLocation)),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow submission failed with HTTP ${response.status}.`);
  }
  return { skipped: false as const, status: response.status };
}

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let googleTokenCache: { accessToken: string; expiresAt: number } | null = null;

function parseGoogleServiceAccount(): GoogleServiceAccount | null {
  const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Google Indexing service account configuration is invalid.");
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.client_email !== "string" || typeof record.private_key !== "string") {
    throw new Error("Google Indexing service account requires client_email and private_key.");
  }
  return {
    client_email: record.client_email,
    private_key: record.private_key,
    token_uri: typeof record.token_uri === "string" ? record.token_uri : undefined,
  };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function googleIndexingAccessToken(account: GoogleServiceAccount) {
  if (googleTokenCache && googleTokenCache.expiresAt > Date.now() + 60_000) {
    return googleTokenCache.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key).toString("base64url")}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== "string") {
    throw new Error(`Google OAuth token request failed with HTTP ${response.status}.`);
  }

  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  googleTokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(300, expiresIn - 60) * 1000,
  };
  return payload.access_token;
}

async function submitGoogleJobIndex(url: string, action: PublicIndexAction) {
  const account = parseGoogleServiceAccount();
  if (!account) {
    return { skipped: true as const, reason: "GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON not configured" };
  }

  const token = await googleIndexingAccessToken(account);
  const response = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      type: action === "DELETED" ? "URL_DELETED" : "URL_UPDATED",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google Indexing API submission failed with HTTP ${response.status}.`);
  }
  return { skipped: false as const, status: response.status };
}

export async function notifyPublicIndexing(input: {
  kind: PublicIndexKind;
  action: PublicIndexAction;
  path: string;
}) {
  const url = publicUrl(input.path);
  const indexNow = submitIndexNow(url);
  const google = input.kind === "JOB"
    ? submitGoogleJobIndex(url, input.action)
    : Promise.resolve({ skipped: true as const, reason: "Google Indexing API is reserved for eligible job pages" });
  const [indexNowResult, googleResult] = await Promise.all([indexNow, google]);
  return { url, indexNow: indexNowResult, google: googleResult };
}
