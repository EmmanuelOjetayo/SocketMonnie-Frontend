import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockTransactions } from "@/mock/transactions";

/**
 * ## Get Unified Transactions
 * GET /api/transactions?month=&year=&type=&search=&page=&limit=
 *
 * One history across savings, minutes, membership and loan payments.
 * `type`: "all" | "savings" | "minute" | "membership" | "loan"
 * `search`: free text matched against label / reference / transaction id
 * `limit`: default 50 (max 100 enforced server-side)
 *
 * Response: { success, transactions: [...], pagination: { total, page, limit, totalPages } }
 */
export async function getTransactions({
  month,
  year,
  type = "all",
  search,
  page = 1,
  limit = 50,
} = {}) {
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
  if (search) params.set("search", String(search));

  return apiClient.get(`/transactions?${params.toString()}`);
}

/**
 * ## Get a single transaction
 * GET /api/transactions/:id
 *
 * Backend-scoped lookup used by the transaction details screen, so a deep
 * link or a page refresh resolves the record from the server instead of
 * trusting navigation state. Returns 404 for records that are not the
 * requesting member's.
 *
 * Response: { success, transaction: { id, type, category, label, amount,
 *             fee, direction, status, reference, transactionId, method,
 *             date, metadata } }
 */
export async function getTransaction(id) {
  if (!id) throw new Error("Transaction id is required");

  if (USE_MOCK) {
    const found = mockTransactions.find((t) => t.id === id);
    if (!found) {
      const error = new Error("Transaction not found for this account.");
      error.status = 404;
      throw error;
    }
    return mockDelay({ success: true, transaction: found });
  }

  return apiClient.get(`/transactions/${id}`);
}
