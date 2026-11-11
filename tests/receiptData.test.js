/**
 * Receipt engine — unit tests.
 * Run: node --test Tests/receiptData.test.js
 *
 * These cover the financial-integrity rules that the whole receipt
 * experience depends on:
 *  - a receipt NEVER reports success for an unconfirmed transaction
 *  - rows with no value are omitted (no empty fields on a receipt)
 *  - per-type formatting (deposit / withdrawal / minutes / membership /
 *    loan) produces the right rows
 *  - filenames are meaningful and filesystem-safe
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReceiptData,
  canonicalReceiptStatus,
  receiptDataFromDetails,
  receiptFilename,
  receiptShareText,
  resolveCategory,
  methodLabel,
  formatReceiptDate,
  RECEIPT_STATUS,
} from "../src/utils/receiptData.js";

/* ------------------------------------------------------------------ */
/* canonicalReceiptStatus                                              */
/* ------------------------------------------------------------------ */

test("a settled transaction is reported as successful", () => {
  assert.equal(canonicalReceiptStatus("completed"), RECEIPT_STATUS.SUCCESSFUL);
  assert.equal(canonicalReceiptStatus("approved"), RECEIPT_STATUS.SUCCESSFUL);
  assert.equal(canonicalReceiptStatus("successful"), RECEIPT_STATUS.SUCCESSFUL);
  assert.equal(canonicalReceiptStatus("paid"), RECEIPT_STATUS.SUCCESSFUL);
});

test("an unsettled transaction is reported as pending", () => {
  assert.equal(canonicalReceiptStatus("pending"), RECEIPT_STATUS.PENDING);
  assert.equal(canonicalReceiptStatus("pending_approval"), RECEIPT_STATUS.PENDING);
  assert.equal(canonicalReceiptStatus("processing"), RECEIPT_STATUS.PENDING);
});

test("a failed transaction is reported as failed", () => {
  assert.equal(canonicalReceiptStatus("failed"), RECEIPT_STATUS.FAILED);
  assert.equal(canonicalReceiptStatus("rejected"), RECEIPT_STATUS.FAILED);
  assert.equal(canonicalReceiptStatus("reversed"), RECEIPT_STATUS.FAILED);
});

test("an unknown status NEVER becomes successful", () => {
  assert.equal(canonicalReceiptStatus("something_new"), RECEIPT_STATUS.PENDING);
  assert.equal(canonicalReceiptStatus(undefined), RECEIPT_STATUS.PENDING);
  assert.equal(canonicalReceiptStatus(null), RECEIPT_STATUS.PENDING);
  assert.equal(canonicalReceiptStatus(""), RECEIPT_STATUS.PENDING);
});

/* ------------------------------------------------------------------ */
/* resolveCategory                                                     */
/* ------------------------------------------------------------------ */

test("category resolution works for unified list rows", () => {
  assert.equal(resolveCategory({ type: "savings", category: "deposit" }), "deposit");
  assert.equal(resolveCategory({ type: "savings", category: "withdrawal" }), "withdrawal");
  assert.equal(resolveCategory({ type: "minute", category: "minute_contribution" }), "minute_contribution");
  assert.equal(resolveCategory({ type: "membership", category: "membership_fee" }), "membership_fee");
  assert.equal(resolveCategory({ type: "loan", category: "loan_repayment" }), "loan_repayment");
});

test("category resolution works for payment-status receipts", () => {
  assert.equal(resolveCategory({ type: "deposit" }), "deposit");
  assert.equal(resolveCategory({ type: "withdrawal" }), "withdrawal");
  assert.equal(resolveCategory({ type: "minute_contribution" }), "minute_contribution");
  assert.equal(resolveCategory({ type: "membership_fee" }), "membership_fee");
  assert.equal(resolveCategory({ type: "loan_repayment" }), "loan_repayment");
});

test("an unknown category falls back to a generic payment", () => {
  assert.equal(resolveCategory({ type: "mystery" }), "payment");
  assert.equal(resolveCategory({}), "payment");
});

/* ------------------------------------------------------------------ */
/* buildReceiptData — deposits                                          */
/* ------------------------------------------------------------------ */

test("a deposit receipt carries the backend amount, method, reference and date", () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "completed",
    amount: 50000,
    method: "flutterwave",
    reference: "DEP_123_abc",
    transactionId: "FLW-999",
    paidAt: "2026-11-11T15:45:00.000Z",
  });

  assert.equal(data.status, RECEIPT_STATUS.SUCCESSFUL);
  assert.equal(data.typeLabel, "Savings Deposit");
  assert.equal(data.amount, 50000);
  assert.equal(data.direction, "credit");
  assert.equal(data.reference, "DEP_123_abc");
  assert.equal(data.methodLabel, "Flutterwave");
  assert.ok(data.occurredAtLabel.includes("2026"));

  const labels = data.rows.map((r) => r.label);
  assert.ok(labels.includes("Transaction type"));
  assert.ok(labels.includes("Reference"));
  assert.ok(labels.includes("Payment method"));
  assert.ok(labels.includes("Status"));
  assert.ok(labels.includes("Amount"));
});

test("a pending deposit receipt is never green", () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "pending",
    amount: 50000,
    reference: "DEP_1",
  });

  assert.equal(data.status, RECEIPT_STATUS.PENDING);
  assert.equal(data.statusLabel, "Pending");
  const statusRow = data.rows.find((r) => r.label === "Status");
  assert.equal(statusRow.status, RECEIPT_STATUS.PENDING);
  assert.equal(statusRow.value, "Pending");
});

test("a withdrawal request is labelled pending approval", () => {
  const data = buildReceiptData({
    type: "withdrawal",
    status: "pending_approval",
    amount: 20000,
    fee: 100,
    reference: "WTH_REQ_1",
  });

  assert.equal(data.status, RECEIPT_STATUS.PENDING);
  assert.equal(data.statusLabel, "Pending Approval");
  assert.equal(data.direction, "debit");
});

/* ------------------------------------------------------------------ */
/* buildReceiptData — withdrawals                                      */
/* ------------------------------------------------------------------ */

test("a withdrawal receipt shows amount, fee and total deduction", () => {
  const data = buildReceiptData({
    type: "withdrawal",
    status: "completed",
    amount: 20000,
    fee: 100,
    reference: "WTH_2",
    destinationBank: {
      bankName: "GTBank",
      accountName: "Ada N",
      accountNumber: "0123456789",
    },
  });

  const rows = Object.fromEntries(data.rows.map((r) => [r.label, r.value]));

  assert.ok(rows["Amount withdrawn"].includes("20,000"));
  assert.ok(rows["Withdrawal fee"].includes("100"));
  assert.ok(rows["Total deduction"].includes("20,100"));
  assert.ok(rows["Destination account"].includes("0123456789"));
  assert.ok(rows["Destination account"].includes("GTBank"));
  assert.ok(rows["Account name"].includes("Ada N"));
});

test("a withdrawal without a fee omits the fee row", () => {
  const data = buildReceiptData({
    type: "withdrawal",
    status: "completed",
    amount: 20000,
    reference: "WTH_3",
  });

  const labels = data.rows.map((r) => r.label);
  assert.ok(!labels.includes("Withdrawal fee"));
  assert.ok(labels.includes("Total deduction"));
});

/* ------------------------------------------------------------------ */
/* buildReceiptData — per-type specifics                               */
/* ------------------------------------------------------------------ */

test("a minutes receipt reports the months settled", () => {
  const data = buildReceiptData({
    type: "minute_contribution",
    status: "completed",
    amount: 1500,
    monthsSettled: 3,
    reference: "MIN_1",
  });

  const rows = Object.fromEntries(data.rows.map((r) => [r.label, r.value]));
  assert.equal(data.typeLabel, "SocketMinutes Contribution");
  assert.equal(rows["Months settled"], "3");
});

test("a membership receipt is typed correctly", () => {
  const data = buildReceiptData({
    type: "membership_fee",
    status: "completed",
    amount: 1000,
    reference: "MEM_1",
  });

  assert.equal(data.typeLabel, "Membership Fee");
  assert.equal(data.amount, 1000);
});

test("a loan repayment receipt shows the outstanding balance when known", () => {
  const data = buildReceiptData(
    {
      type: "loan_repayment",
      status: "completed",
      amount: 18700,
      reference: "LRP_1",
    },
    { metadata: { remainingBalance: 81300 } }
  );

  const rows = Object.fromEntries(data.rows.map((r) => [r.label, r.value]));
  assert.equal(data.typeLabel, "Loan Repayment");
  assert.ok(rows["Outstanding balance"].includes("81,300"));
});

test("empty values never produce a receipt row", () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "completed",
    amount: 1000,
    reference: null,
    transactionId: null,
    method: null,
    paidAt: null,
  });

  const labels = data.rows.map((r) => r.label);
  assert.ok(!labels.includes("Reference"));
  assert.ok(!labels.includes("Transaction ID"));
  assert.ok(!labels.includes("Payment method"));
  assert.ok(!labels.includes("Date & time"));
});

/* ------------------------------------------------------------------ */
/* receiptDataFromDetails — legacy success-page shape                   */
/* ------------------------------------------------------------------ */

test("the legacy success-page shape maps onto the canonical model", () => {
  const data = receiptDataFromDetails({
    title: "Transfer Successful",
    amount: 50000,
    subtitle: "Added to your Savings Account",
    details: [
      { label: "Method", value: "BANK_TRANSFER" },
      { label: "Status", value: "Successful" },
      { label: "Date & Time", value: "11/11/2026, 3:45 PM" },
      { label: "Reference ID", value: "DEP_123_abc" },
    ],
    status: "successful",
  });

  assert.equal(data.status, RECEIPT_STATUS.SUCCESSFUL);
  assert.equal(data.amount, 50000);
  assert.equal(data.reference, "DEP_123_abc");

  const statusRow = data.rows.find((r) => r.label === "Status");
  assert.equal(statusRow.status, RECEIPT_STATUS.SUCCESSFUL);
});

test("not_found on a success page can never render as successful", () => {
  const data = receiptDataFromDetails({
    title: "Payment Not Confirmed",
    amount: 1000,
    details: [{ label: "Status", value: "Failed" }],
    status: "not_found",
  });

  assert.equal(data.status, RECEIPT_STATUS.FAILED);
  assert.notEqual(data.status, RECEIPT_STATUS.SUCCESSFUL);
});

test("processing on a success page renders as pending", () => {
  const data = receiptDataFromDetails({
    title: "Confirming Your Payment",
    amount: 1000,
    details: [],
    status: "processing",
  });

  assert.equal(data.status, RECEIPT_STATUS.PENDING);
});

/* ------------------------------------------------------------------ */
/* Filenames, sharing, labels                                          */
/* ------------------------------------------------------------------ */

test("receipt filenames are meaningful and filesystem-safe", () => {
  assert.equal(receiptFilename("DEP_123_abc"), "SocketMonnie-Receipt-DEP_123_abc.pdf");
  assert.equal(receiptFilename("LRP/12 34"), "SocketMonnie-Receipt-LRP-12-34.pdf");
  assert.equal(receiptFilename(null, "deposit"), "SocketMonnie-Receipt-deposit.pdf");
});

test("the share summary includes the amount, status and reference", () => {
  const data = buildReceiptData({
    type: "deposit",
    status: "completed",
    amount: 50000,
    reference: "DEP_1",
    paidAt: "2026-11-11T15:45:00.000Z",
  });

  const text = receiptShareText(data);
  assert.ok(text.includes("SocketMonnie Payment Receipt"));
  assert.ok(text.includes("50,000"));
  assert.ok(text.includes("Successful"));
  assert.ok(text.includes("DEP_1"));
});

test("payment channels get human labels", () => {
  assert.equal(methodLabel("flutterwave"), "Flutterwave");
  assert.equal(methodLabel("bank_transfer"), "Bank Transfer");
  assert.equal(methodLabel(null), null);
});

test("an invalid date is rejected rather than rendered", () => {
  assert.equal(formatReceiptDate("not-a-date"), null);
  assert.equal(formatReceiptDate(null), null);
});
