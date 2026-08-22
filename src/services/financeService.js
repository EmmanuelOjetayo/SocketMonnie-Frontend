import { apiClient } from "./apiClient";

/**
 * Finance: Get overview statistics
 * GET /api/finance/overview
 */
export async function getFinanceOverview() {
  return apiClient.get("/finance/overview");
}

/**
 * Finance: Get all savings transactions (paginated)
 * GET /api/finance/savings?page=&limit=
 */
export async function getFinanceSavings({ page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page, limit });
  return apiClient.get(`/finance/savings?${query}`);
}

/**
 * Finance: Get all loan repayments (paginated)
 * GET /api/finance/repayments?page=&limit=
 */
export async function getFinanceRepayments({ page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page, limit });
  return apiClient.get(`/finance/repayments?${query}`);
}