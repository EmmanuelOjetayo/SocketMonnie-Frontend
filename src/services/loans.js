import { apiClient } from "./apiClient";

/**
 * ## Get Loan Eligibility
 * GET /api/loans/eligibility?loanType=
 * Response: { success, eligibility: { isEligible, netSavings, maxLoanAmount, tierName, completedLoansCount, isConsistent, meetsSavingsThreshold } }
 */
export async function getLoanEligibility() {
  const res = await apiClient.get("/loans/eligibility");
  return res.eligibility;
}

/**
 * ## Get Active Loan
 * GET /api/loans/active
 * Response: { loan } or null if none
 */
export async function getActiveLoan() {
  const res = await apiClient.get("/loans/active");
  return res.loan;
}

/**
 * ## Get Loan by ID
 * GET /api/loans/:loanId
 * Response: { loan }
 */
export async function getLoanById(loanId) {
  const res = await apiClient.get(`/loans/${loanId}`);
  return res.loan;
}

/**
 * ## Get Loan History
 * GET /api/loans/history?page=&limit=&status=
 * Response: { data: [...], stats: { totalLoans, completed, active, defaulted }, pagination: { total, page, limit, totalPages } }
 */
export async function getLoanHistory({ page = 1, limit = 10, status = "" } = {}) {
  const query = new URLSearchParams({
    page,
    limit,
    ...(status && { status }),
  });

  const res = await apiClient.get(`/loans/history?${query}`);

  return {
    loans: res.data,
    stats: res.stats,
    pagination: res.pagination,
  };
}

/**
 * ## Get Repayment Schedule
 * GET /api/loans/:loanId/schedule
 * Response: { schedule: [...], nextDue: {...} }
 */
export async function getRepaymentSchedule(loanId) {
  const res = await apiClient.get(`/loans/${loanId}/schedule`);

  return {
    schedule: res.schedule,
    nextDue: res.nextDue,
  };
}

/**
 * ## Apply for Loan
 * POST /api/loans/apply
 * Body: { amount, durationMonths, loanType, disbursementMethod, purpose, guarantorReferralCodes }
 *   — 4 unique referral codes required (Backend LoanValidate.applyLoanSchema).
 * Response: { success, message, loan } — message confirms the application is
 * awaiting the 4 guarantors' confirmation.
 */
export async function applyForLoan(payload) {
  const res = await apiClient.post("/loans/apply", payload);

  return {
    message: res.message,
    loan: res.loan,
  };
}

/**
 * ## Withdraw Loan Application
 * POST /api/loans/:loanId/cancel
 * Body: { reason? } — only valid while the loan status is "waiting_guarantor".
 * Response: { success, message, loan }
 */
export async function replaceGuarantor(loanId, payload) {
  const res = await apiClient.post(`/loans/${loanId}/replace-guarantor`, payload);
  return { message: res.message, loan: res.loan };
}

export async function cancelLoanApplication(loanId, reason = "") {
  const res = await apiClient.post(`/loans/${loanId}/cancel`, { reason });
  return {
    message: res.message,
    loan: res.loan,
  };
}

/**
 * NOTE: Loan repayment is a two-step gateway flow served from
 * services/payments.js, not this module:
 *   1. POST /api/loans/repay/initialize  (initiateLoanRepayment — Flutterwave checkout payload)
 *   2. POST /api/loans/repay/verify      (verifyLoanRepayment — settles against webhook proof)
 * This module intentionally has no repay function; no POST /api/loans/repay
 * endpoint exists on the backend.
 */
