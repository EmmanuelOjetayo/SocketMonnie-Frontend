import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockSavingsSummary, mockSavingsHistory, mockMonthlyReport } from "@/mock/savings";

/**
 * ## Get Savings Summary
 * GET /api/savings/summary
 * Response: { success, summary: { totalSaved, monthlyTarget, monthlyContributed, growthRatePct, streakMonths }, history, monthlyReport }
 */
export async function getSavingsSummary() {
  if (USE_MOCK) return mockDelay({ success: true, summary: mockSavingsSummary });
  const res = await apiClient.get("/savings/summary");
  return res?.data || res;
}

/**
 * ## Get Savings History
 * GET /api/savings/history?page=&limit=
 * Response: { success, data: [...], pagination: { total, page, limit, totalPages } }
 */
export async function getSavingsHistory({ page = 1, limit = 20 } = {}) {
  if (USE_MOCK) return mockDelay({ success: true, items: mockSavingsHistory, total: mockSavingsHistory.length });
  return apiClient.get(`/savings/history?page=${page}&limit=${limit}`);
}

/**
 * ## Get Monthly Savings Report
 * GET /api/savings/report/monthly
 * Response: { success, months: [{ month, amount }] }
 */
// AFTER
export async function getMonthlySavingsReport() {
  if (USE_MOCK) return mockDelay({ success: true, months: mockMonthlyReport });
  return apiClient.get("/savings/report");
}

/**
 * ## Make Deposit
 * NOTE: aligned with the existing production flow used by the SavingsDeposit
 * page — a savings deposit is a payment settled through the gateway, so it
 * goes through POST /api/payments/deposit/initiate (Backend/PaymentRoutes).
 * The SavingsRoute has no legacy /deposit endpoint.
 * Body: { amount, method: "bank_transfer" | "card" | "wallet" }
 * Response: { success, data: { authorization_link / checkout payload, reference, ... } }
 */
export async function makeDeposit({ amount, method }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, transactionId: "tx_new", newBalance: mockSavingsSummary.totalSaved + Number(amount) });
  }
  return apiClient.post("/payments/deposit/initiate", { amount, method });
}

/**
 * ## Request Savings Withdrawal
 * NOTE: withdrawals are NOT released directly. Aligns with the production
 * withdrawal-approval flow — POST /api/savings/withdraw-request creates a
 * Pending Withdrawal reviewed by admin (WithdrawalApprovals page).
 * Body: { amount, bankDetails { accountNumber, accountName, bankName }, pin }
 */
export async function withdrawFromSavings({ amount, method, bankDetails, pin }) {
  if (USE_MOCK) {
    return mockDelay({
      success: true,
      data: {
        withdrawalId: "wth_mock",
        amount: amount,
        fee: 100,
        totalDeducted: amount + 100,
        newBalance: 50000 - (amount + 100),
        method: method,
        reference: "WTH-MOCK-001",
        date: new Date().toISOString(),
        destinationBank: { bankName: "Access Bank", accountName: "John Doe", accountNumber: "1234567890" }
      }
    });
  }
  const { accountNumber, accountName, bankName } = bankDetails || {};
  return apiClient.post("/savings/withdraw-request", { amount, pin, accountNumber, accountName, bankName });
}

export async function requestWithdrawal({ amount, accountNumber, accountName, bankName, pin }) {
  return apiClient.post("/savings/withdraw-request", { amount, accountNumber, accountName, bankName, pin });
}

export async function initializeMembershipFee() {
  const res = await apiClient.post("/savings/membership-fee/initialize");
  return res;
}

export async function verifyMembershipFee({ reference, tx_ref, transaction_id }) {
  const res = await apiClient.post("/savings/membership-fee/verify", { reference, tx_ref, transaction_id });
  return res;
}