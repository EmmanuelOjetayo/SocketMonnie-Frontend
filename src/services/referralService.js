import { apiClient } from "./apiClient";

/**
 * Get user's referral activity
 * GET /api/referrals/activity
 */
export async function getReferralActivity() {
  return apiClient.get("/referrals/activity");
}

/**
 * Get referral stats (total referred, points, etc.)
 * GET /api/referrals/stats
 */
export async function getReferralStats() {
  return apiClient.get("/referrals/stats");
}