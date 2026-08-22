import { apiClient } from "./apiClient";

/**
 * Support: Get all tickets (complaints)
 * GET /api/support/tickets?status=&page=&limit=
 */
export async function getSupportTickets({ status = "", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page, limit });
  if (status) query.append("status", status);
  return apiClient.get(`/support/tickets?${query}`);
}

/**
 * Support: Update ticket status
 * PATCH /api/support/tickets/:ticketId/status
 */
export async function updateTicketStatus(ticketId, status) {
  return apiClient.patch(`/support/tickets/${ticketId}/status`, { status });
}

/**
 * Support: Get referral verifications
 * GET /api/support/referrals?status=&page=&limit=
 */
export async function getReferralVerifications({ status = "", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams({ page, limit });
  if (status) query.append("status", status);
  return apiClient.get(`/support/referrals?${query}`);
}