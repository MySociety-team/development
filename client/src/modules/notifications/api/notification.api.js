import apiClient from "../../../lib/apiClient.js";

/**
 * Fetch notifications for current user with optional filtering
 */
export const getNotifications = async ({
  societyId = null,
  unreadOnly = false,
  page = 1,
  limit = 20
} = {}) => {
  const params = { page, limit };
  if (societyId) {
    params.societyId = societyId;
  }
  if (unreadOnly) {
    params.unreadOnly = true;
  }

  const response = await apiClient.get("/notifications", { params });
  return response.data.data;
};

/**
 * Fetch unread notification count
 */
export const getUnreadCount = async ({ societyId = null } = {}) => {
  const params = {};
  if (societyId) {
    params.societyId = societyId;
  }

  const response = await apiClient.get("/notifications/unread-count", { params });
  return response.data.data.unreadCount;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data.data.notification;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (societyId = null) => {
  const response = await apiClient.patch("/notifications/mark-all-read", {
    societyId
  });
  return response.data.data;
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (societyId = null) => {
  const params = {};
  if (societyId) {
    params.societyId = societyId;
  }

  const response = await apiClient.delete("/notifications", { params });
  return response.data.data;
};
