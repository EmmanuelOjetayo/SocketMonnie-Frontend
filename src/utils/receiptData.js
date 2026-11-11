import { format } from "date-fns";
// Relative import (not the "@/" alias) so this module can be exercised
// directly by the node:test suite — same convention as the backend tests.
import { formatNaira } from "./format.js";

/**
 * THE receipt engine.
 *
 * One canonical receipt model, formatted per transaction type, consumed by:
 *   - the six payment success pages (via components/success/SuccessReceipt)
 *   - the transaction history list (pages/user/Transactions)
 *   - the transaction detail screen (pages/user/TransactionDetail)
 *   - the PDF exporter (utils/receiptPdf)
 *
 * Financial integrity rules baked into this module:
 *   1. A receipt NEVER invents a success. An unknown/unrecognised status
 *      falls back to "pending", never "successful".
 *   2. Rows with no value are omitted rather than rendered as "—", so a
 *      receipt never shows empty/irrelevant fields.
 *   3. Every value rendered here originates from a backend record (the
 *      payment-status endpoint or the unified transaction list); the
 *      formatter adds presentation only.
 */

export const RECEIPT_STATUS = {
  SUCCESSFUL: "successful",
  PENDING: "pending",
  FAILED: "failed",
};

/** Persistence status → canonical receipt status. */
const CANONICAL_STATUS = {
  completed: RECEIPT_STATUS.SUCCESSFUL,
  successful: RECEIPT_STATUS.SUCCESSFUL,
  success: RECEIPT_STATUS.SUCCESSFUL,
  approved: RECEIPT_STATUS.SUCCESSFUL,
  paid: RECEIPT_STATUS.SUCCESSFUL,
  settled: RECEIPT_STATUS.SUCCESSFUL,
  pending: RECEIPT_STATUS.PENDING,
  pending_approval: RECEIPT_STATUS.PENDING,
  processing: RECEIPT_STATUS.PENDING,
  checking: RECEIPT_STATUS.PENDING,
  failed: RECEIPT_STATUS.FAILED,
  rejected: RECEIPT_STATUS.FAILED,
  cancelled: RECEIPT_STATUS.FAILED,
  terminated: RECEIPT_STATUS.FAILED,
  reversed: RECEIPT_STATUS.FAILED,
};

/**
 * Canonical status for a receipt. Unknown values map to "pending" — the
 * green "Successful" receipt is only ever shown for an explicitly
 * confirmed transaction.
 */
export function canonicalReceiptStatus(status) {
  return CANONICAL_STATUS[String(status || "").toLowerCase()] || RECEIPT_STATUS.PENDING;
}

const TYPE_LABELS = {
  deposit: "Savings Deposit",
  withdrawal: "Withdrawal",
  minute_contribution: "SocketMinutes Contribution",
  membership_fee: "Membership Fee",
  loan_repayment: "Loan Repayment",
  loan_disbursement: "Loan Disbursement",
  payment: "Payment",
};

/** Group name (unified-list `type`) → concrete category. */
const GROUP_TO_CATEGORY = {
  savings: "deposit",
  minute: "minute_contribution",
  minutes: "minute_contribution",
  membership: "membership_fee",
  loan: "loan_repayment",
};

const CATEGORY_ALIASES = {
  deposit: "deposit",
  savings_deposit: "deposit",
  withdrawal: "withdrawal",
  savings_withdrawal: "withdrawal",
  minute_contribution: "minute_contribution",
  minutes_payment: "minute_contribution",
  membership_fee: "membership_fee",
  loan_repayment: "loan_repayment",
  loan_disbursement: "loan_disbursement",
};

/**
 * Work out the concrete transaction category from either record shape:
 *  - unified list row: { type: "savings", category: "deposit" }
 *  - payment-status receipt: { type: "minute_contribution" }
 */
export function resolveCategory(record) {
  const candidates = [record?.category, record?.type];

  for (const candidate of candidates) {
    const raw = String(candidate || "").toLowerCase();
    if (!raw) continue;
    if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];
    if (GROUP_TO_CATEGORY[raw]) return GROUP_TO_CATEGORY[raw];
  }

  return "payment";
}

const METHOD_LABELS = {
  flutterwave: "Flutterwave",
  bank_transfer: "Bank Transfer",
  banktransfer: "Bank Transfer",
  transfer: "Transfer",
  card: "Card",
  cash: "Cash",
  internal: "In-App Transfer",
  wallet: "Wallet",
};

/** Human label for a payment channel. */
export function methodLabel(method) {
  const raw = String(method || "").toLowerCase();
  if (!raw) return null;
  return METHOD_LABELS[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "11 November 2026 · 3:45 PM" */
export function formatReceiptDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "d MMMM yyyy '·' h:mm a");
}

/** "11 Nov 2026" */
export function formatReceiptDay(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "d MMM yyyy");
}

const STATUS_LABELS = {
  [RECEIPT_STATUS.SUCCESSFUL]: "Successful",
  [RECEIPT_STATUS.PENDING]: "Pending",
  [RECEIPT_STATUS.FAILED]: "Failed",
};

function statusLabelFor(status, rawStatus) {
  const raw = String(rawStatus || "").toLowerCase();
  if (status === RECEIPT_STATUS.PENDING && raw === "pending_approval") {
    return "Pending Approval";
  }
  if (status === RECEIPT_STATUS.PENDING && raw === "processing") {
    return "Processing";
  }
  return STATUS_LABELS[status];
}

const SUBTITLES = {
  deposit: "Credited to your savings account",
  withdrawal: "Savings withdrawal request",
  minute_contribution: "SocketMinutes contribution",
  membership_fee: "Membership fee payment",
  loan_repayment: "Loan repayment",
  loan_disbursement: "Loan disbursement",
  payment: "Payment",
};

const CURRENCY_NOTE = "Amounts are quoted in Nigerian Naira (₦).";

/**
 * Build the canonical receipt model from a backend record.
 *
 * @param {object} record  unified list row OR payment-status receipt
 * @param {object} [options]
 * @param {object} [options.metadata] extra verified metadata (e.g. months
 *        settled, remaining balance) merged under the record's own metadata
 * @param {string} [options.occurredAt] authoritative timestamp override
 * @returns {object} canonical receipt model
 */
export function buildReceiptData(record, options = {}) {
  const source = record || {};
  const metadata = { ...(source.metadata || {}), ...(options.metadata || {}) };

  const category = resolveCategory(source);
  const status = canonicalReceiptStatus(source.status);
  const amount = Number(source.amount || 0);
  const fee = Number(source.fee ?? metadata.fee ?? 0);
  const total = amount + (fee > 0 ? fee : 0);

  const isWithdrawal = category === "withdrawal";
  const direction = source.direction || (isWithdrawal ? "debit" : "credit");

  const method = source.method || metadata.method || null;
  const occurredAt = options.occurredAt || source.paidAt || source.date || source.createdAt || null;
  const reference = source.reference || null;
  const transactionId = source.transactionId || null;

  const monthsSettled =
    source.monthsSettled ?? metadata.monthsSettled ?? metadata.monthsCount ?? null;

  const balanceAfter =
    metadata.balanceAfter ?? metadata.newBalance ?? metadata.remainingBalance ?? null;

  const destination =
    source.destinationBank || metadata.destinationBank || metadata.destination || null;

  const rows = [];

  const push = (label, value, options2 = {}) => {
    if (value === null || value === undefined || value === "") return;
    rows.push({ label, value: String(value), ...options2 });
  };

  push("Transaction type", TYPE_LABELS[category] || "Payment");
  push("Reference", reference, { mono: true });
  push("Payment method", methodLabel(method));
  push("Status", statusLabelFor(status, source.status), { status });

  if (isWithdrawal) {
    const penaltyFee = Number(source.penaltyFee ?? metadata.penaltyFee ?? 0);
    const totalDeducted =
      source.totalDeducted ??
      metadata.totalDeducted ??
      amount + fee + penaltyFee;

    push("Amount withdrawn", formatNaira(amount, { decimals: 2 }));
    if (fee > 0) push("Withdrawal fee", formatNaira(fee, { decimals: 2 }));
    if (penaltyFee > 0) {
      push("Early withdrawal penalty", formatNaira(penaltyFee, { decimals: 2 }));
    }
    push("Total deduction", formatNaira(totalDeducted, { decimals: 2 }), {
      emphasis: true,
    });
    if (destination) {
      const accountNumber = destination.accountNumber || destination.account || null;
      const bankName = destination.bankName || destination.bank || null;
      if (accountNumber) {
        push("Destination account", `${accountNumber}${bankName ? ` · ${bankName}` : ""}`);
      }
      if (destination.accountName) push("Account name", destination.accountName);
    }
  } else {
    push("Amount", formatNaira(amount, { decimals: 2 }), { emphasis: true });
  }

  if (category === "minute_contribution" && monthsSettled != null) {
    push("Months settled", String(monthsSettled));
  }

  if (category === "loan_repayment" && balanceAfter != null) {
    push("Outstanding balance", formatNaira(Number(balanceAfter), { decimals: 2 }));
  }

  if (transactionId) push("Transaction ID", transactionId, { mono: true });

  const dateLabel = formatReceiptDate(occurredAt);
  if (dateLabel) push("Date & time", dateLabel);

  return {
    status,
    statusLabel: statusLabelFor(status, source.status),
    category,
    typeLabel: TYPE_LABELS[category] || "Payment",
    title: TYPE_LABELS[category] || "Payment",
    subtitle: SUBTITLES[category] || SUBTITLES.payment,
    amount,
    fee,
    total,
    direction,
    reference,
    transactionId,
    method,
    methodLabel: methodLabel(method),
    occurredAt,
    occurredAtLabel: dateLabel,
    monthsSettled,
    balanceAfter,
    destination,
    rows,
    note: CURRENCY_NOTE,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Filename for a receipt download.
 * "SocketMonnie-Receipt-DEP_1234_abc.pdf"
 */
export function receiptFilename(reference, fallback = "transaction") {
  const safe = String(reference || "")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `SocketMonnie-Receipt-${safe || fallback}.pdf`;
}

/**
 * Plain-text summary used by the native share sheet (and the clipboard
 * fallback when sharing is unavailable).
 */
export function receiptShareText(data) {
  if (!data) return "";
  const lines = [
    "SocketMonnie Payment Receipt",
    `${data.typeLabel} — ${formatNaira(data.amount, { decimals: 2 })}`,
    `Status: ${data.statusLabel}`,
  ];

  if (data.occurredAtLabel) lines.push(`Date: ${data.occurredAtLabel}`);
  if (data.reference) lines.push(`Reference: ${data.reference}`);

  return lines.join("\n");
}

/**
 * Build a canonical receipt from the legacy success-page prop shape
 * ({ title, amount, subtitle, details[], status }).
 *
 * The success pages already compute their detail rows from the backend
 * transaction, so those rows are carried through verbatim — this adapter
 * only normalises the status and extracts the reference/method/date for
 * the receipt header. It keeps every success page rendering the SAME
 * receipt component without rewriting their data-fetching logic.
 *
 * @param {object} input
 * @param {string} [input.title]
 * @param {number} [input.amount]
 * @param {string} [input.subtitle]
 * @param {Array<{label: string, value: any}>} [input.details]
 * @param {string} [input.status] successful | processing | pending | failed | not_found
 */
export function receiptDataFromDetails({
  title,
  amount,
  subtitle,
  details = [],
  status = "successful",
} = {}) {
  const rawStatus = String(status || "").toLowerCase();
  const canonical = canonicalReceiptStatus(
    rawStatus === "not_found" ? "failed" : rawStatus === "processing" ? "pending" : rawStatus
  );

  const find = (labels) =>
    details.find((row) =>
      labels.includes(String(row?.label || "").trim().toLowerCase())
    )?.value;

  const reference = find(["reference id", "reference", "reference number"]);
  const method = find(["method", "payment method", "channel"]);
  const occurredAtRaw = find(["date & time", "date and time", "date"]);

  const rows = details
    .filter((row) => row && row.value !== null && row.value !== undefined && row.value !== "")
    .map((row) => ({
      label: row.label,
      value: String(row.value),
      highlight: Boolean(row.highlight),
      mono: /reference|transaction id/i.test(String(row.label || "")),
    }))
    .map((row) =>
      /status/i.test(row.label)
        ? { ...row, value: statusLabelFor(canonical, rawStatus), status: canonical }
        : row
    );

  return {
    status: canonical,
    statusLabel: statusLabelFor(canonical, rawStatus),
    category: resolveCategory({ category: title, type: title }),
    typeLabel: title || "Payment",
    title: title || "Payment",
    subtitle: subtitle || "",
    amount: Number(amount || 0),
    fee: 0,
    total: Number(amount || 0),
    direction: "credit",
    reference: reference || null,
    transactionId: find(["transaction id"]) || null,
    method: method || null,
    methodLabel: methodLabel(method),
    occurredAt: null,
    occurredAtLabel: occurredAtRaw ? String(occurredAtRaw) : null,
    monthsSettled: null,
    balanceAfter: null,
    destination: null,
    rows,
    note: CURRENCY_NOTE,
    generatedAt: new Date().toISOString(),
  };
}
