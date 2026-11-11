/**
 * Receipt component — runtime render tests.
 * Run: node --test Tests/receiptRender.test.js
 *
 * These render the actual React components (through Vite's SSR pipeline,
 * so JSX + the "@/" alias resolve exactly as they do in the app) and assert
 * on the produced markup. They prove the receipt a member sees really
 * contains the right information — and never a fabricated success.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { buildReceiptData } from "../src/utils/receiptData.js";

let vite;

test.before(async () => {
  vite = await createServer({
    root: process.cwd(),
    logLevel: "error",
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
});

test.after(async () => {
  await vite?.close();
});

async function renderReceipt(data) {
  const { TransactionReceipt } = await vite.ssrLoadModule(
    "/src/components/receipt/TransactionReceipt.jsx"
  );
  return renderToStaticMarkup(React.createElement(TransactionReceipt, { data }));
}

test("a successful deposit receipt renders the brand, amount, type and details", async () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "completed",
    amount: 50000,
    method: "flutterwave",
    reference: "DEP_123_abc",
    transactionId: "FLW-998877",
    paidAt: "2026-11-11T15:45:00.000Z",
  });

  const html = await renderReceipt(data);

  assert.ok(html.includes("SocketMonnie"), "branding missing");
  assert.ok(html.includes("Payment Receipt"), "receipt title missing");
  assert.ok(html.includes("Successful"), "status missing");
  assert.ok(html.includes("50,000"), "amount missing");
  assert.ok(html.includes("Savings Deposit"), "type missing");
  assert.ok(html.includes("Transaction details"), "details heading missing");
  assert.ok(html.includes("DEP_123_abc"), "reference missing");
  assert.ok(html.includes("Flutterwave"), "payment method missing");
  assert.ok(html.includes("FLW-998877"), "transaction id missing");
});

test("a pending receipt renders PENDING, never a green success", async () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "pending",
    amount: 50000,
    reference: "DEP_1",
  });

  const html = await renderReceipt(data);

  assert.ok(html.includes("Pending"), "pending status missing");
  assert.ok(!html.includes("Successful"), "must not show a successful status");
  assert.ok(html.includes("text-emerald-600") === false || !html.includes("Successful"));
});

test("a failed receipt renders FAILED", async () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "failed",
    amount: 50000,
    reference: "DEP_1",
  });

  const html = await renderReceipt(data);
  assert.ok(html.includes("Failed"));
  assert.ok(!html.includes("Successful"));
});

test("a withdrawal receipt shows the fee and total deduction", async () => {
  const data = buildReceiptData({
    type: "withdrawal",
    status: "pending_approval",
    amount: 20000,
    fee: 100,
    reference: "WTH_REQ_1",
    destinationBank: {
      bankName: "GTBank",
      accountName: "Ada N",
      accountNumber: "0123456789",
    },
  });

  const html = await renderReceipt(data);

  assert.ok(html.includes("Amount withdrawn"));
  assert.ok(html.includes("Withdrawal fee"));
  assert.ok(html.includes("Total deduction"));
  assert.ok(html.includes("20,100"));
  assert.ok(html.includes("0123456789"));
  assert.ok(html.includes("Pending Approval"));
});

test("the success page receipt renders the same shared component", async () => {
  const { SuccessReceipt } = await vite.ssrLoadModule(
    "/src/components/success/SuccessReceipt.jsx"
  );

  const html = renderToStaticMarkup(
    React.createElement(SuccessReceipt, {
      title: "Transfer Successful",
      amount: 50000,
      subtitle: "Added to your Savings Account",
      details: [
        { label: "Method", value: "BANK_TRANSFER" },
        { label: "Status", value: "Successful" },
        { label: "Reference ID", value: "DEP_123_abc" },
      ],
      actions: [{ label: "Back to Savings", onClick: () => {} }],
      status: "successful",
    })
  );

  assert.ok(html.includes("SocketMonnie"));
  assert.ok(html.includes("Payment Receipt"));
  assert.ok(html.includes("Successful"));
  assert.ok(html.includes("50,000"));
  assert.ok(html.includes("DEP_123_abc"));
  assert.ok(html.includes("Back to Savings"));
});
