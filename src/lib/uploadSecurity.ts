import { prisma } from "@/lib/prisma";
import { requireMalwareScannerEnv } from "@/lib/env";
import { deleteObject, readPrivateObjectForSecurityScan } from "@/lib/storage";
import crypto from "crypto";
import { assertSafeOutboundNetworkTarget, parseAllowedHosts } from "@/lib/security/outboundUrl";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
  "audio/webm",
]);

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export type StoredFileSafetyState = {
  scanStatus?: string | null;
  deletedAt?: Date | string | null;
};

export function isStoredFileSafeForProcessing(file: StoredFileSafetyState | null | undefined): boolean {
  return Boolean(file && file.scanStatus === "CLEAN" && !file.deletedAt);
}

export function validatePassiveDocumentContent(
  mimeType: string,
  data: Buffer,
): { valid: boolean; error?: string } {
  // Files are never trusted just because their extension/MIME is acceptable.
  // Reject common active-content containers before they reach parsers, OCR, or AI.
  const ascii = data.toString("latin1").toLowerCase();
  if (mimeType === "application/pdf") {
    const activePdfMarkers = ["/javascript", "/js", "/openaction", "/aa", "/launch", "/richmedia", "/embeddedfile", "/xfa"];
    if (activePdfMarkers.some((marker) => ascii.includes(marker))) {
      return { valid: false, error: "PDF contains active or embedded content that is not permitted." };
    }
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const activeDocxMarkers = ["vbaproject.bin", "word/embeddings/", "oleobject", "activex/", "word/externallinks/", "customui/"];
    if (activeDocxMarkers.some((marker) => ascii.includes(marker))) {
      return { valid: false, error: "Document contains active or embedded content that is not permitted." };
    }
  }
  return { valid: true };
}

export function validateUploadFile(mimeType: string, sizeBytes: number, maxSize = MAX_UPLOAD_SIZE_BYTES): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: "Unsupported file type." };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, error: "Uploaded file is empty or invalid." };
  }
  if (sizeBytes > maxSize) {
    return { valid: false, error: "File exceeds the maximum allowed size." };
  }
  return { valid: true };
}

export function sanitizeAndGenerateObjectKey(originalFilename: string): string {
  // Prevent path traversal and enforce safe characters by generating a UUID key
  const safeFilename = originalFilename.replace(/^.*[\\\/]/, "").replace(/\.\./g, "");
  const extension = safeFilename.includes(".") ? `.${safeFilename.split(".").pop()}` : "";
  return `${crypto.randomUUID()}${extension}`;
}


export type UploadScanResult = { status: "CLEAN" | "INFECTED" | "ERROR"; detail?: string };

export async function scanUpload(fileId: string, data: Buffer): Promise<UploadScanResult> {
  let endpoint = process.env.MALWARE_SCANNER_URL?.trim();
  let token = process.env.MALWARE_SCANNER_TOKEN?.trim();
  let username = process.env.MALWARE_SCANNER_USERNAME?.trim();
  let password = process.env.MALWARE_SCANNER_PASSWORD?.trim();

  if (process.env.NODE_ENV === "production") {
    try {
      const config = requireMalwareScannerEnv();
      endpoint = config.url;
      token = config.token;
      username = config.username;
      password = config.password;
      await assertSafeOutboundNetworkTarget(endpoint, {
        label: "MALWARE_SCANNER_URL",
        requireHttps: true,
        allowedHosts: parseAllowedHosts(process.env.MALWARE_SCANNER_ALLOWED_HOSTS),
      });
    } catch (error) {
      return { status: "ERROR", detail: error instanceof Error ? error.message : "Malware scanner is not configured safely." };
    }
  }

  if (!endpoint) return { status: "CLEAN", detail: "Development scan bypass." };

  const authorization = username && password
    ? `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`
    : token
      ? `Bearer ${token}`
      : undefined;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-HireGo-File-Id": fileId,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
      cache: "no-store",
    });

    const raw = await res.text();
    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }

    const detailFrom = (value: unknown): string | undefined =>
      typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : undefined;

    if (res.status === 406) {
      const object = body && typeof body === "object" ? body as Record<string, unknown> : null;
      return {
        status: "INFECTED",
        detail:
          detailFrom(object?.Description) ||
          detailFrom(object?.detail) ||
          detailFrom(object?.signature) ||
          detailFrom(raw) ||
          "Malware detected.",
      };
    }

    if (!res.ok) {
      return { status: "ERROR", detail: `Scanner HTTP ${res.status}${raw ? `: ${raw.slice(0, 300)}` : ""}` };
    }

    if (body && typeof body === "object" && !Array.isArray(body)) {
      const object = body as Record<string, unknown>;
      if (object.clean === true && object.infected !== true) {
        return { status: "CLEAN", detail: detailFrom(object.detail) };
      }
      if (object.infected === true) {
        return { status: "INFECTED", detail: detailFrom(object.detail) || "Malware detected." };
      }

      const status = typeof object.status === "string"
        ? object.status.toUpperCase()
        : typeof object.Status === "string"
          ? object.Status.toUpperCase()
          : "";
      if (status === "CLEAN" || status === "OK") {
        return { status: "CLEAN", detail: detailFrom(object.detail) || detailFrom(object.Description) };
      }
      if (status === "INFECTED" || status === "FOUND") {
        return {
          status: "INFECTED",
          detail:
            detailFrom(object.signature) ||
            detailFrom(object.detail) ||
            detailFrom(object.Description) ||
            "Malware detected.",
        };
      }
    }

    if (Array.isArray(body) && body.length > 0) {
      const entries = body.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"));
      const infected = entries.find((entry) => String(entry.Status || entry.status || "").toUpperCase() === "FOUND");
      if (infected) {
        return {
          status: "INFECTED",
          detail: detailFrom(infected.Description) || detailFrom(infected.detail) || "Malware detected.",
        };
      }
      if (entries.length === body.length && entries.every((entry) => ["OK", "CLEAN"].includes(String(entry.Status || entry.status || "").toUpperCase()))) {
        return { status: "CLEAN", detail: "ClamAV scan passed." };
      }
    }

    const normalized = raw.trim().toUpperCase();
    if (normalized === "OK" || normalized === "{OK 200}" || normalized === "OK 200") {
      return { status: "CLEAN", detail: "ClamAV scan passed." };
    }
    if (normalized.includes("FOUND")) {
      return { status: "INFECTED", detail: raw.slice(0, 500) || "Malware detected." };
    }

    return { status: "ERROR", detail: "Scanner returned an unrecognized response." };
  } catch (error) {
    return { status: "ERROR", detail: error instanceof Error ? error.message.slice(0, 500) : "Scanner request failed." };
  }
}


export async function persistScanResult(fileId: string, result: UploadScanResult) {
  return prisma.storedFile.update({ where: { id: fileId }, data: { scanStatus: result.status, scanCheckedAt: new Date(), scanDetail: result.detail } });
}


export async function rescanQuarantinedUploads(limit = 25) {
  const take = Math.max(1, Math.min(100, Math.trunc(limit)));
  const staleClaimBefore = new Date(Date.now() - 10 * 60_000);
  const files = await prisma.storedFile.findMany({
    where: { deletedAt: null, OR: [
      { scanStatus: { in: ["PENDING", "ERROR", "LEGACY_UNSCANNED"] } },
      { scanStatus: "SCANNING", scanCheckedAt: { lt: staleClaimBefore } },
    ] },
    orderBy: { createdAt: "asc" },
    take,
    select: { id: true, objectKey: true },
  });
  const results: Array<{ id: string; status: UploadScanResult["status"] }> = [];
  for (const file of files) {
    const claimed = await prisma.storedFile.updateMany({
      where: { id: file.id, deletedAt: null, OR: [
        { scanStatus: { in: ["PENDING", "ERROR", "LEGACY_UNSCANNED"] } },
        { scanStatus: "SCANNING", scanCheckedAt: { lt: staleClaimBefore } },
      ] },
      data: { scanStatus: "SCANNING", scanCheckedAt: new Date(), scanDetail: "Security scan in progress." },
    });
    if (claimed.count !== 1) continue;
    let result: UploadScanResult;
    try {
      const data = await readPrivateObjectForSecurityScan(file.objectKey);
      result = await scanUpload(file.id, data);
    } catch (error) {
      result = { status: "ERROR", detail: error instanceof Error ? error.message.slice(0, 500) : "Stored object could not be read for scanning." };
    }
    await persistScanResult(file.id, result);
    results.push({ id: file.id, status: result.status });
  }
  return { processed: results.length, results };
}


export async function purgeExpiredInfectedUploads(limit = 25, retentionDays = 30) {
  const take = Math.max(1, Math.min(100, Math.trunc(limit)));
  const days = Math.max(1, Math.min(365, Math.trunc(retentionDays)));
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const files = await prisma.storedFile.findMany({
    where: { deletedAt: null, scanStatus: "INFECTED", scanCheckedAt: { lt: cutoff } },
    orderBy: { scanCheckedAt: "asc" },
    take,
    select: { id: true, objectKey: true },
  });
  let purged = 0;
  for (const file of files) {
    const claimed = await prisma.storedFile.updateMany({
      where: { id: file.id, deletedAt: null, scanStatus: "INFECTED", scanCheckedAt: { lt: cutoff } },
      data: { scanStatus: "PURGING", scanDetail: "Malware quarantine retention expired; deleting private object." },
    });
    if (claimed.count !== 1) continue;
    try {
      await deleteObject(file.objectKey);
      await prisma.storedFile.update({
        where: { id: file.id },
        data: { deletedAt: new Date(), scanDetail: "Malware quarantine retention expired; private object deleted." },
      });
      purged += 1;
    } catch (error) {
      await prisma.storedFile.update({
        where: { id: file.id },
        data: { scanStatus: "INFECTED", scanDetail: error instanceof Error ? `Storage cleanup failed: ${error.message.slice(0, 450)}` : "Storage cleanup failed." },
      });
    }
  }
  return { purged, retentionDays: days };
}
