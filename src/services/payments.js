import { apiClient } from "./apiClient";

/**
 * Payments & Bank Verification Service
 * Aligned with Backend PaymentRoutes mounted at /api/payments in app.js
 */

export async function getBanks() {
  return apiClient.get("/payments/banks");
}

/**
 * Verify a customer's bank account ownership name before enabling a
 * withdrawal destination (POST /api/payments/verify-bank).
 * NOTE: failures must propagate — previously this swallowed API errors and
 * returned a fabricated "MEMBER DEMO ACCOUNT" success, which would let an
 * unverified account pass as verified. Never fabricate a verification result.
 */
export async function verifyBank(accountNumber, bankCode) {
  console.info(
    `[BANK] FE → verify-bank | bankCode: ${bankCode ?? "undefined"} | accountNumber: ${accountNumber ? `present(len=${String(accountNumber).length})` : "missing"}`
  );
  try {
    const res = await apiClient.post("/payments/verify-bank", { accountNumber, bankCode });
    console.info(
      `[BANK] FE ✔ verify-bank | accountName: ${res?.data?.accountName || "—"} | bankCode: ${res?.data?.bankCode || "—"}`
    );
    return res;
  } catch (err) {
    console.error(
      `[BANK] FE ✗ verify-bank | status: ${err?.status || "—"} | message: ${err?.message || String(err).slice(0, 300)}`
    );
    throw err;
  }
}


export async function initiateDeposit(amount, method) {
  return apiClient.post("/payments/deposit/initiate", {
    amount,
    method,
  });
}
// services/payments.js

export async function verifyDeposit(data) {
  return apiClient.post(
    "/payments/deposit/verify",
    data
  );
}

/**
 * Authoritative transaction status for success pages.
 *
 * The backend is the source of truth: this endpoint reads the webhook/callback
 * settled records and, while a payment is still pending, triggers one
 * idempotent provider reconciliation (same handlers the webhook uses) so a
 * missed webhook settles server-side and the page converges on the real
 * outcome. Never use location.state or a browser redirect as proof of payment.
 *
 * Response: { success, data: { found, reference, type, status, amount,
 *   method, transactionId, paidAt, monthsSettled, reconciled } }
 * status: "successful" | "pending" | "failed"
 */
export async function getPaymentStatus(reference) {
  return apiClient.get(`/payments/status/${encodeURIComponent(reference)}`);
}
/**
 * Initiate a loan repayment via Flutterwave Window Checkout.
 * Calls POST /api/loans/repay/initialize which returns the Flutterwave
 * checkout payload (publicKey, reference/tx_ref, amount in NGN, customer, etc).
 */
export async function initiateLoanRepayment({ loanId, paymentAmount }) {
  try {
    return await apiClient.post("/loans/repay/initialize", {
      loanId,
      paymentAmount,
    });
  }catch (error) {
  console.error("Loan repayment initialization failed");

  console.error(error.response?.status);
  console.error(error.response?.data);
  console.error(error.message);

  throw error;
}}

export async function verifyLoanRepayment({
  loanId,
  reference,
  transactionId,
  tx_ref, // backward-compat field name during rollout
}) {
  return await apiClient.post("/loans/repay/verify", {
    loanId,
    reference,
    transactionId,
    tx_ref: reference, // backward-compat field name during rollout
  });
}

/**
 * Legacy gateway-callback checker (GET /api/payments/deposit/callback).
 * NOTE: this endpoint is an informational convenience only — the source of
 * truth for settlement remains POST /api/payments/deposit/verify, which the
 * DepositSuccess page calls. Failures must propagate; previously this
 * swallowed errors and fabricated status:"success", which falsely reports a
 * payment as successful without any backend proof.
 */
export async function paymentCallback(reference) {
  return apiClient.get(`/payments/deposit/callback?reference=${reference}`);
}

export async function getMinutesDue() { const res = await apiClient.get( "/payments/minutes/due" ); return res?.data || res; }

export async function initializeMinutesContribution() {
  const res = await apiClient.post(
    "/payments/minutes/initialize"
  );

  return res?.data || res;
}

/**
 * Verify monthly SocketMinutes contribution.
 *
 * POST /api/payment/minutes/verify
 *
 * Body:
 * {
 *   reference
 * }
 */
export async function verifyMinutesContribution({
  reference,
  tx_ref,
  transaction_id,
}) {
  const res = await apiClient.post(
    "/payments/minutes/verify",
    {
      reference,
      tx_ref,
      transaction_id,
    }
  );

  return res?.data || res;
}