export function receiptNotes(notes: string | null | undefined): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(notes || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {}
  return { notes: notes || "" };
}
export function rejectionStatus(dueDate: string, now = new Date()): "UNPAID" | "OVERDUE" {
  return dueDate.slice(0, 10) < now.toISOString().slice(0, 10) ? "OVERDUE" : "UNPAID";
}
export function receiptDownloadUrl(notes: string | null | undefined): string | undefined {
  const value = receiptNotes(notes);
  if (typeof value.storedFileId === "string") return `/api/files/${encodeURIComponent(value.storedFileId)}`;
  const url = value.bankTransferReceiptUrl;
  return typeof url === "string" && /^\/api\/files\/[a-zA-Z0-9-]+$/.test(url) ? url : undefined;
}

export function receiptContentMatchesMime(data: Buffer, mimeType: string): boolean {
  if (mimeType === "image/png") {
    return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (mimeType === "application/pdf") {
    return data.length >= 5 && data.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return false;
}
