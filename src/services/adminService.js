import { apiClient } from "./apiClient";

// ============================================================================
// MEMBERS & KYC ADMINISTRATION
// ============================================================================

/**
 * Admin: Fetch paginated members list with optional search and status filter
 * GET /api/admin/members
 */
export async function getMembers({ status = "", search = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  return apiClient.get(`/admin/members?${params.toString()}`);
}

/**
 * Admin: Fetch full detailed profile for a single member
 * GET /api/admin/members/:memberId
 */
export async function getMemberById(memberId) {
  return apiClient.get(`/admin/members/${memberId}`);
}

/**
 * Admin: Suspend a member account
 * PATCH /api/admin/members/:memberId/suspend
 */
export async function suspendMember(memberId, reason = "") {
  return apiClient.patch(`/admin/members/${memberId}/suspend`, { reason });
}

/**
 * Admin: Reactivate a suspended member account
 * PATCH /api/admin/members/:memberId/activate
 */
export async function activateMember(memberId) {
  return apiClient.patch(`/admin/members/${memberId}/activate`);
}

/**
 * Admin: Approve member KYC verification
 * PATCH /api/admin/members/:memberId/kyc/approve
 */
export async function approveKYC(memberId) {
  return apiClient.patch(`/admin/members/${memberId}/kyc/approve`);
}

/**
 * Admin: Reject member KYC verification with reason
 * PATCH /api/admin/members/:memberId/kyc/reject
 */
export async function rejectKYC(memberId, reason) {
  return apiClient.patch(`/admin/members/${memberId}/kyc/reject`, { reason });
}


// ============================================================================
// LOANS ADMINISTRATION
// ============================================================================

/**
 * Admin: Fetch paginated loan applications with search and status filter
 * GET /api/admin/loans
 */
export async function getAdminLoans({ status = "", search = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  return apiClient.get(`/admin/loans?${params.toString()}`);
}

/**
 * Admin: Fetch single loan details including installments, user profile, and payout status
 * GET /api/admin/loans/:loanId
 */
export async function getLoanById(loanId) {
  return apiClient.get(`/admin/loans/${loanId}`);
}

/**
 * Admin: Approve a loan application
 * PATCH /api/admin/loans/:loanId/approve
 */
export async function approveLoan(loanId) {
  return apiClient.patch(`/admin/loans/${loanId}/approve`);
}

/**
 * Admin: Reject a loan application with reason
 * PATCH /api/admin/loans/:loanId/reject
 */
export async function rejectLoan(loanId, reason) {
  return apiClient.patch(`/admin/loans/${loanId}/reject`, { reason });
}

export async function getPendingWithdrawals({ page = 1, limit = 20 } = {}) {
  return apiClient.get(`/admin/withdrawals/pending?page=${page}&limit=${limit}`);
}

export async function approveWithdrawal(withdrawalId) {
  return apiClient.post(`/admin/withdrawals/${withdrawalId}/approve`);
}

export async function rejectWithdrawal(withdrawalId, reason) {
  return apiClient.post(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
}


// ============================================================================
// REPORTS & AUDIT STATEMENT EXPORTS
// ============================================================================

/**
 * Admin: Fetch report overview data and list entries
 * GET /api/admin/reports
 */
export async function getAdminReports({ type = "overview", month, year } = {}) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (month) params.append("month", month);
  if (year) params.append("year", year);

  return apiClient.get(`/admin/reports?${params.toString()}`);
}

/**
 * Admin: Download PDF report statement
 * GET /api/admin/reports/pdf
 */
export async function downloadReportPdf({ type = "overview", month, year } = {}) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (month) params.append("month", month);
  if (year) params.append("year", year);

  return apiClient.get(`/admin/reports/pdf?${params.toString()}`, {
    responseType: "blob",
  });
}

/**
 * Admin: Download Excel (.xlsx) report statement
 * GET /api/admin/reports/excel
 */
export async function downloadReportExcel({ type = "overview", month, year } = {}) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (month) params.append("month", month);
  if (year) params.append("year", year);

  return apiClient.get(`/admin/reports/excel?${params.toString()}`, {
    responseType: "blob",
  });
}


// ============================================================================
// SYSTEM SETTINGS & CONFIGURATION
// ============================================================================

/**
 * Admin: Get system-wide operational configurations
 * GET /api/admin/settings
 */
export async function getSystemSettings() {
  return apiClient.get("/admin/settings");
}

/**
 * Admin: Update system parameters (interest rates, limits, penalties)
 * PUT /api/admin/settings
 */
export async function updateSystemSettings(settingsData) {
  return apiClient.put("/admin/settings", settingsData);
}