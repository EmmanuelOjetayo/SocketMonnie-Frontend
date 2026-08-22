import { apiClient } from "./apiClient";

/**
 * Get my socket score
 * GET /api/scores/me
 */
export async function getMyScore() {
  return apiClient.get("/scores/me");
}

/**
 * Get socket score breakdown
 * GET /api/scores/breakdown
 */
export async function getScoreBreakdown() {
  return apiClient.get("/scores/breakdown");
}

/**
 * Get score history (last N months)
 * GET /api/scores/history?months=6
 */
export async function getScoreHistory({ months = 6 } = {}) {
  const query = new URLSearchParams({ months });
  return apiClient.get(`/scores/history?${query}`);
}