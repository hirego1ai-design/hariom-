import { prisma } from "@/lib/prisma";
import { requireMalwareScannerEnv } from "@/lib/env";

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
