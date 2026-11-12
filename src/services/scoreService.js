import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import {
  mockScoreSummary,
  mockScoreBreakdown,
  mockScoreHistory,
  mockScoreExplanation,
} from "@/mock/scores";

/**
 * SocketScore service — all endpoints are auth-protected and member-scoped:
 * the backend only ever operates on the signed-in member's own data.
 * GET /api/scores/me
 */
export async function getMyScore() {
  return apiClient.get("/scores/me");
}

/**
 * Totally updated CGPA-style summary:
 * cumulative (CGPA), current month (provisional), previous month, change,
 * current period, last calculation.
 * GET /api/scores/summary
 */
export async function getScoreSummary() {
  if (USE_MOCK) return mockDelay({ success: true, data: mockScoreSummary });
  return apiClient.get("/scores/summary");
}

/**
 * Six-component breakdown for the current scoring period.
 * GET /api/scores/breakdown
 */
export async function getScoreBreakdown() {
  if (USE_MOCK) return mockDelay({ success: true, data: mockScoreBreakdown });
  return apiClient.get("/scores/breakdown");
}

/**
 * Month-by-month history (monthly + cumulative, delta, status per month).
 * GET /api/scores/history?months=24
 */
export async function getScoreHistory({ months = 24 } = {}) {
  const query = new URLSearchParams({ months });
  return apiClient.get(`/scores/history?${query}`);
}

/**
 * Same history, newest-to-oldest canonical month list.
 * GET /api/scores/monthly-history?limit=24
 */
export async function getMonthlyHistory({ limit = 24 } = {}) {
  if (USE_MOCK) return mockDelay({ success: true, data: mockScoreHistory });
  const query = new URLSearchParams({ limit });
  return apiClient.get(`/scores/monthly-history?${query}`);
}

/**
 * Cumulative trend points for the chart.
 * GET /api/scores/trend?limit=24
 */
export async function getScoreTrend({ limit = 24 } = {}) {
  const query = new URLSearchParams({ limit });
  return apiClient.get(`/scores/trend?${query}`);
}

/**
 * Human-readable explanation + active configured weights.
 * GET /api/scores/explanation
 */
export async function getScoreExplanation() {
  if (USE_MOCK) return mockDelay({ success: true, data: mockScoreExplanation });
  return apiClient.get("/scores/explanation");
}

/**
 * Finalise a completed calendar month for the signed-in member.
 * POST /api/scores/monthly/finalize
 */
export async function finalizeMonthlyScore({ year, month }) {
  return apiClient.post("/scores/monthly/finalize", { year, month });
}
