import asyncHandler from "../../utils/asyncHandler.js";
import {
  clearAllNotifications,
  deleteNotification,
  getUnreadCount,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "./notification.service.js";

export const getNotificationsController = asyncHandler(async (req, res) => {
  const { societyId, unreadOnly, page, limit } = req.query;

  const result = await getUserNotifications({
    userId: req.user.id,
    societyId,
    unreadOnly,
    page,
    limit
  });

  return res.status(200).json({
    success: true,
    code: "NOTIFICATIONS_FETCHED",
    message: "Notifications fetched successfully",
    data: result
  });
});

export const getUnreadCountController = asyncHandler(async (req, res) => {
  const { societyId } = req.query;

  const result = await getUnreadCount({
    userId: req.user.id,
    societyId
  });

  return res.status(200).json({
    success: true,
    code: "UNREAD_COUNT_FETCHED",
    message: "Unread notifications count fetched successfully",
    data: result
  });
});

export const markAsReadController = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await markNotificationAsRead({
    notificationId,
    userId: req.user.id
  });

  return res.status(200).json({
    success: true,
    code: "NOTIFICATION_MARKED_READ",
    message: "Notification marked as read",
    data: {
      notification
    }
  });
});

export const markAllReadController = asyncHandler(async (req, res) => {
  const { societyId } = req.body;

  const result = await markAllNotificationsAsRead({
    userId: req.user.id,
    societyId
  });

  return res.status(200).json({
    success: true,
    code: "ALL_NOTIFICATIONS_MARKED_READ",
    message: "All notifications marked as read",
    data: result
  });
});

export const deleteNotificationController = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const result = await deleteNotification({
    notificationId,
    userId: req.user.id
  });

  return res.status(200).json({
    success: true,
    code: "NOTIFICATION_DELETED",
    message: result.message
  });
});

export const clearAllNotificationsController = asyncHandler(async (req, res) => {
  const { societyId } = req.query;

  const result = await clearAllNotifications({
    userId: req.user.id,
    societyId
  });

  return res.status(200).json({
    success: true,
    code: "NOTIFICATIONS_CLEARED",
    message: result.message,
    data: result
  });
});
