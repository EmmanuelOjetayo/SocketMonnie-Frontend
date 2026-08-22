import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockNotifications } from "@/mock/notifications";

/**
 * Get Notifications
 * GET /api/notifications
 * Response: { success, data: [...], unreadCount }
 */
export async function getNotifications() {
  if (USE_MOCK) {
    return mockDelay({
      success: true,
      notifications: mockNotifications,
      unreadCount: mockNotifications.length,
    });
  }

  return apiClient.get("/notifications");
}

/**
 * Mark Notification Read
 * PATCH /api/notifications/:id/read
 * Response: { success }
 */
export async function markNotificationRead(id) {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiClient.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  if (USE_MOCK) return mockDelay({ success: true });

  return apiClient.patch("/notifications/mark-all-read", {});
}