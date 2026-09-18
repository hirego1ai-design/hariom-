import { prisma } from "@/lib/prisma";
import { requireMalwareScannerEnv } from "@/lib/env";
import { deleteObject, readPrivateObjectForSecurityScan } from "@/lib/storage";

export type UploadScanResult = { status: "CLEAN" | "INFECTED" | "ERROR"; detail?: string };

export async function scanUpload(fileId: string, data: Buffer): Promise<UploadScanResult> {
  let endpoint = process.env.MALWARE_SCANNER_URL?.trim();
  let token = process.env.MALWARE_SCANNER_TOKEN?.trim();
  if (process.env.NODE_ENV === "production") {
    try {
      const config = requireMalwareScannerEnv();
      endpoint = config.url;
      token = config.token;
    } catch (error) {
      return { status: "ERROR", detail: error instanceof Error ? error.message : "Malware scanner is not configured." };
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
