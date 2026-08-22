import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";

/**
 * Submit Complaint / Support Ticket
 * POST /api/complaints
 * Body: { subject, message, category }
 * Response: { success, ticketId }
 */
export async function submitComplaint(payload) {
  if (USE_MOCK) return mockDelay({ success: true, ticketId: "tk_" + Date.now() });
  return apiClient.post("/complaints", payload);
}

/**
 * Get My Tickets
 * GET /api/complaints/mine
 * Response: { success, items: [{ id, subject, status, createdAt }] }
 */
export async function getMyComplaints() {
  if (USE_MOCK) return mockDelay({ success: true, items: [] });
  return apiClient.get("/complaints/mine");
}