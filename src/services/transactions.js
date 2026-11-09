import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockTransactions } from "@/mock/transactions";

/**
 * ## Get Unified Transactions
 * GET /api/transactions?month=&year=&type=&page=&limit=
 *
 * One history across savings, minutes, membership and loan payments.
 * `type`: "all" | "savings" | "minute" | "membership" | "loan"
 * `limit`: default 50 (max 100 enforced server-side)
 *
 * Response: { success, transactions: [...], pagination: { total, page, limit, totalPages } }
 */
export async function getTransactions({ month, year, type = "all", page = 1, limit = 50 } = {}) {
  if (USE_MOCK) {
    return mockDelay({
      success: true,
      transactions: mockTransactions,
      pagination: { total: mockTransactions.length, page: 1, limit, totalPages: 1 },
    });
  }

  const params = new URLSearchParams({ type, page: String(page), limit: String(limit) });
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));

  return apiClient.get(`/transactions?${params.toString()}`);
}
