import { apiClient } from "./apiClient";
import { mockDelay } from "./mockDelay";

/**
 * Payments & Bank Verification Service
 * Aligned with Backend PaymentRoutes mounted at /api/payments in app.js
 */

export async function getBanks() {
  try {
    return await apiClient.get("/payments/banks");
  } catch (error) {
    console.warn("API unavailable, returning mock bank list", error);
    await mockDelay(300);
    return {
      success: true,
      data: [
        { code: "011", name: "First Bank of Nigeria" },
        { code: "058", name: "GTBank" },
        { code: "033", name: "United Bank for Africa (UBA)" },
        { code: "057", name: "Zenith Bank" },
        { code: "044", name: "Access Bank" },
        { code: "035", name: "Wema Bank (ALAT)" },
        { code: "50515", name: "Moniepoint MFB" },
        { code: "090110", name: "VFD Microfinance Bank" },
        { code: "100004", name: "Opay (PayCom)" },
        { code: "100033", name: "Palmpay" },
      ],
    };
  }
}

export async function verifyBank(accountNumber, bankCode) {
  try {
    return await apiClient.post("/payments/verify-bank", { accountNumber, bankCode });
  } catch (error) {
    console.warn("API unavailable, returning mock verified account", error);
    await mockDelay(400);
    return {
      success: true,
      data: {
        accountNumber,
        accountName: "MEMBER DEMO ACCOUNT",
        bankCode,
      },
    };
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
 * Initiate a loan repayment via Paystack Popup.
 * Calls POST /api/loans/repay/initialize which returns the Paystack
 * checkout payload (publicKey, reference, amount in kobo, etc).
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

export async function paymentCallback(reference) {
  try {
    return await apiClient.get(`/payments/deposit/callback?reference=${reference}`, { auth: false });
  } catch (error) {
    console.warn("API unavailable, returning mock payment callback status", error);
    await mockDelay(300);
    return {
      success: true,
      status: "success",
      reference,
    };
  }
}