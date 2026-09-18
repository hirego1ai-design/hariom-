import assert from "node:assert/strict";
import test from "node:test";
import { receiptContentMatchesMime, receiptDownloadUrl, receiptNotes, rejectionStatus } from "../lib/invoiceReceiptState";

test("receipt metadata exposes only authenticated file routes", () => {
  const notes = JSON.stringify({ storedFileId: "file-id", bankTransferRef: "UTR-12345" });
  assert.equal(receiptDownloadUrl(notes), "/api/files/file-id");
  assert.equal(receiptNotes(notes).bankTransferRef, "UTR-12345");
  assert.equal(receiptDownloadUrl(JSON.stringify({ bankTransferReceiptUrl: "https://public.example/receipt.png" })), undefined);
  assert.equal(receiptDownloadUrl(JSON.stringify({ bankTransferReceiptUrl: "/api/files/../../secret" })), undefined);
});

test("rejected receipts return to overdue only after the due date", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");
  assert.equal(rejectionStatus("2026-09-11", now), "OVERDUE");
  assert.equal(rejectionStatus("2026-09-12", now), "UNPAID");
  assert.equal(rejectionStatus("2026-09-13", now), "UNPAID");
});

test("receipt content must match the declared PNG, JPEG, or PDF MIME", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const pdf = Buffer.from("%PDF-1.7\n", "ascii");
  assert.equal(receiptContentMatchesMime(png, "image/png"), true);
  assert.equal(receiptContentMatchesMime(jpeg, "image/jpeg"), true);
  assert.equal(receiptContentMatchesMime(pdf, "application/pdf"), true);
  assert.equal(receiptContentMatchesMime(Buffer.from("<script>"), "image/png"), false);
  assert.equal(receiptContentMatchesMime(png, "application/pdf"), false);
});
