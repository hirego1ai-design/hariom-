import { prisma } from "@/lib/prisma";
import { requireMalwareScannerEnv } from "@/lib/env";
import { deleteObject, readPrivateObjectForSecurityScan } from "@/lib/storage";
import { assertSafeOutboundNetworkTarget, parseAllowedHosts } from "@/lib/security/outboundUrl";
import crypto from "crypto";

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

export const MIME_TO_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  "application/pdf": ["pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "image/png": ["png"],
  "image/jpeg": ["jpg"],
  "image/webp": ["webp"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "audio/webm": ["webm"],
};

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export function validateUploadFile(mimeType: string, sizeBytes: number, maxSize = MAX_UPLOAD_SIZE_BYTES): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) return { valid: false, error: "Unsupported file type." };
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { valid: false, error: "Uploaded file is empty or invalid." };
  if (sizeBytes > maxSize) return { valid: false, error: "File exceeds the maximum allowed size." };
  return { valid: true };
}

export function sanitizeAndGenerateObjectKey(originalFilename: string): string {
  const safeFilename = originalFilename.replace(/^.*[\\/]/, "").replace(/\.\./g, "");
  const extension = safeFilename.includes(".") ? `.${safeFilename.split(".").pop()}` : "";
  return `${crypto.randomUUID()}${extension}`;
}

export function detectUploadExtension(data: Buffer): string | null {
  const header = data.subarray(0, 32).toString("hex").toUpperCase();
  const ascii = data.subarray(0, 32).toString("ascii");
  if (ascii.startsWith("%PDF")) return "pdf";
  if (header.startsWith("89504E47")) return "png";
  if (header.startsWith("FFD8FF")) return "jpg";
  if (ascii.startsWith("RIFF") && ascii.substring(8, 12) === "WEBP") return "webp";
  if (ascii.includes("ftyp")) return "mp4";
  if (header.startsWith("1A45DFA3")) return "webm";
  if (header.startsWith("504B0304")) return "docx";
  return null;
}

export function assertDetectedTypeMatchesMime(mimeType: string, detectedExtension: string): void {
  const allowed = MIME_TO_EXTENSIONS[mimeType] || [];
  if (!allowed.includes(detectedExtension)) {
    throw new Error("File content does not match claimed MIME type.");
  }
}

export function assertNoActiveDocumentContent(data: Buffer, mimeType: string): void {
  if (mimeType === "application/pdf") {
    // PDF actions and embedded active content are not required by HireGo.
    // Reject them rather than attempting to safely execute/sanitize them.
    const text = data.toString("latin1");
    const activePdf = /\/(?:JavaScript|JS|Launch|OpenAction|AA|RichMedia|EmbeddedFile|XFA)\b/i;
    if (activePdf.test(text)) throw new Error("PDF contains active or embedded content and cannot be accepted.");
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // ZIP central-directory entry names are visible even when file bodies are
    // compressed. Reject macro/OLE/ActiveX style payload containers.
    const zipDirectory = data.toString("latin1");
    const riskyParts = [
      "vbaProject.bin",
      "word/embeddings/",
      "word/activeX/",
      "word/externalLinks/",
      "customUI/",
      "oleObject",
    ];
    if (riskyParts.some((token) => zipDirectory.toLowerCase().includes(token.toLowerCase()))) {
      throw new Error("Word document contains active, embedded, or externally linked content.");
    }
  }
}

export async function normalizeUploadForStorage(
  data: Buffer,
  mimeType: string,
  detectedExtension: string,
): Promise<{ data: Buffer; mimeType: string; extension: string }> {
  if (!mimeType.startsWith("image/")) return { data, mimeType, extension: detectedExtension };

  // Re-decode and re-encode raster images after malware scanning. This strips
  // metadata/trailing data and forces libvips to validate the image structure.
  // No SVG is accepted anywhere in this upload policy.
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  const probe = sharp(data, { failOn: "warning", limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true });
  const metadata = await probe.metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error("Image dimensions exceed the processing safety limit.");
  }
  if ((metadata.pages ?? 1) !== 1) throw new Error("Animated or multi-page images are not accepted.");

  const image = sharp(data, { failOn: "warning", limitInputPixels: MAX_IMAGE_PIXELS, sequentialRead: true }).rotate();
  if (mimeType === "image/jpeg") {
    return { data: await image.jpeg({ quality: 90, mozjpeg: true }).toBuffer(), mimeType, extension: "jpg" };
  }
  if (mimeType === "image/png") {
    return { data: await image.png({ compressionLevel: 9 }).toBuffer(), mimeType, extension: "png" };
  }
  if (mimeType === "image/webp") {
    return { data: await image.webp({ quality: 90 }).toBuffer(), mimeType, extension: "webp" };
  }
  throw new Error("Unsupported image type.");
}

export type UploadScanResult = { status: "CLEAN" | "INFECTED" | "ERROR"; detail?: string };

export async function scanUpload(fileId: string, data: Buffer): Promise<UploadScanResult> {
  let endpoint = process.env.MALWARE_SCANNER_URL?.trim();
  let token = process.env.MALWARE_SCANNER_TOKEN?.trim();
  if (process.env.NODE_ENV === "production") {
    try {
      const config = requireMalwareScannerEnv();
      endpoint = config.url;
      token = config.token;
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

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "X-HireGo-File-Id": fileId, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!res.ok) return { status: "ERROR", detail: `Scanner HTTP ${res.status}` };
    const body = await res.json().catch(() => null) as { clean?: unknown; infected?: unknown; detail?: unknown } | null;
    if (body?.clean === true && body?.infected !== true) return { status: "CLEAN", detail: typeof body.detail === "string" ? body.detail.slice(0, 500) : undefined };
    if (body?.infected === true) return { status: "INFECTED", detail: typeof body.detail === "string" ? body.detail.slice(0, 500) : "Malware detected." };
    return { status: "ERROR", detail: "Scanner returned an invalid response." };
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
