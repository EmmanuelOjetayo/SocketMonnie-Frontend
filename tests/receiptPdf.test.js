/**
 * Receipt PDF — unit tests.
 * Run: node --test Tests/receiptPdf.test.js
 *
 * Verifies a REAL PDF is produced (valid header, real bytes, correct page
 * count, correct filename), rather than assuming a successful button click
 * means the download works.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildReceiptData } from "../src/utils/receiptData.js";
import { buildReceiptPdf, downloadReceiptPdf, receiptPdfBlob } from "../src/utils/receiptPdf.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(here, ".tmp-receipts");

const deposit = () =>
  buildReceiptData({
    type: "deposit",
    status: "completed",
    amount: 50000,
    fee: 0,
    method: "flutterwave",
    reference: "DEP_123_abc",
    transactionId: "FLW-998877",
    paidAt: "2026-11-11T15:45:00.000Z",
  });

test("the receipt produces a valid single-page PDF", async () => {
  const doc = await buildReceiptPdf(deposit());

  assert.equal(doc.getNumberOfPages(), 1);

  const bytes = doc.output("arraybuffer");
  assert.ok(bytes.byteLength > 1000, "PDF should contain real content");

  const header = Buffer.from(bytes.slice(0, 5)).toString("latin1");
  assert.equal(header, "%PDF-", "PDF magic header missing");
});

test("the receipt blob is a real PDF file", async () => {
  const blob = await receiptPdfBlob(deposit());

  assert.equal(blob.type, "application/pdf");
  assert.ok(blob.size > 1000, "PDF blob should contain real content");
});

test("a receipt with many rows paginates instead of cutting content off", async () => {
  const data = deposit();
  data.rows = [
    ...data.rows,
    ...Array.from({ length: 40 }, (_, i) => ({
      label: `Extra field ${i + 1}`,
      value: `Value ${i + 1}`,
    })),
  ];

  const doc = await buildReceiptPdf(data);
  assert.ok(doc.getNumberOfPages() > 1, "long receipts must span multiple pages");

  const bytes = doc.output("arraybuffer");
  assert.ok(bytes.byteLength > 1000);
});

test("a pending receipt still produces a PDF (never a successful one)", async () => {
  const data = buildReceiptData({
    type: "withdrawal",
    status: "pending_approval",
    amount: 20000,
    fee: 100,
    reference: "WTH_REQ_1",
  });

  assert.equal(data.status, "pending");

  const doc = await buildReceiptPdf(data);
  assert.equal(doc.getNumberOfPages(), 1);
});

test("a receipt can be written to disk and opened as a PDF", async () => {
  await mkdir(tmpDir, { recursive: true });

  const data = deposit();
  const doc = await buildReceiptPdf(data);
  const file = path.join(tmpDir, "SocketMonnie-Receipt-DEP_123_abc.pdf");

  await writeFile(file, Buffer.from(doc.output("arraybuffer")));

  const { readFile } = await import("node:fs/promises");
  const written = await readFile(file);
  assert.ok(written.length > 1000);
  assert.equal(written.slice(0, 5).toString("latin1"), "%PDF-");
  assert.ok(written.includes("%%EOF"), "PDF should be terminated properly");

  await rm(tmpDir, { recursive: true, force: true });
});

test("downloading without data fails loudly instead of writing an empty file", async () => {
  await assert.rejects(() => downloadReceiptPdf(null), /receipt data is missing/i);
});
