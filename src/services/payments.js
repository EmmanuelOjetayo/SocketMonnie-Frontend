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

/**
 * Read-only authoritative transaction status for success pages.
 *
 * The signed Flutterwave webhook alone settles payments. This endpoint only
 * reads the webhook-written record; it never verifies with the provider,
 * reconciles, or mutates financial state. Pending stays pending until the
 * webhook arrives. Never use browser redirect data as proof of payment.
 *
 * Response: { success, data: { found, reference, type, status, amount,
 *   method, transactionId, paidAt, monthsSettled } }
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

export async function getMinutesDue() { const res = await apiClient.get( "/payments/minutes/due" ); return res?.data || res; }

export async function initializeMinutesContribution() {
  const res = await apiClient.post(
    "/payments/minutes/initialize"
  );

  return res?.data || res;
}
