import mongoose from "mongoose";

import Notification from "../../models/Notification.js";
import ApiError from "../../utils/apiError.js";

export const createNotification = async ({
  recipientId,
  societyId,
  type = "GENERAL",
  title,
  message,
  link = "",
  metadata = {}
}) => {
  if (!mongoose.isValidObjectId(recipientId)) {
    throw new ApiError(400, "RECIPIENT_ID_INVALID", "Recipient ID is invalid");
  }

  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!title || !title.trim()) {
    throw new ApiError(400, "TITLE_REQUIRED", "Notification title is required");
  }

  if (!message || !message.trim()) {
    throw new ApiError(400, "MESSAGE_REQUIRED", "Notification message is required");
  }

  const notification = await Notification.create({
    recipientId,
    societyId,
    type,
    title: title.trim(),
    message: message.trim(),
    link: link.trim(),
    metadata
  });

  return notification;
};

export const createBulkNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const validNotifications = notifications.filter(
    (item) =>
      item &&
      mongoose.isValidObjectId(item.recipientId) &&
      mongoose.isValidObjectId(item.societyId) &&
      item.title &&
      item.message
  );

  if (validNotifications.length === 0) {
    return [];
  }

  return Notification.insertMany(validNotifications, { ordered: false });
};

export const getUserNotifications = async ({
  userId,
  societyId = null,
  unreadOnly = false,
  page = 1,
  limit = 20
}) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const query = { recipientId: userId };

  if (societyId) {
    if (!mongoose.isValidObjectId(societyId)) {
      throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
    }
    query.societyId = societyId;
  }

  if (unreadOnly === true || unreadOnly === "true") {
    query.read = false;
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate("societyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({
      recipientId: userId,
      read: false,
      ...(societyId ? { societyId } : {})
    })
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit)
    },
    unreadCount
  };
};

export const getUnreadCount = async ({ userId, societyId = null }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const query = { recipientId: userId, read: false };

  if (societyId) {
    if (!mongoose.isValidObjectId(societyId)) {
      throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
    }
    query.societyId = societyId;
  }

  const unreadCount = await Notification.countDocuments(query);
  return { unreadCount };
};

export const markNotificationAsRead = async ({ notificationId, userId }) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, "NOTIFICATION_ID_INVALID", "Notification ID is invalid");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  return notification;
};

export const markAllNotificationsAsRead = async ({ userId, societyId = null }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const query = { recipientId: userId, read: false };
  if (societyId) {
    if (!mongoose.isValidObjectId(societyId)) {
      throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
    }
    query.societyId = societyId;
  }

  const result = await Notification.updateMany(query, {
    $set: { read: true, readAt: new Date() }
  });

  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async ({ notificationId, userId }) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(400, "NOTIFICATION_ID_INVALID", "Notification ID is invalid");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId: userId
  });

  if (!notification) {
    throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  return { message: "Notification deleted successfully" };
};

export const clearAllNotifications = async ({ userId, societyId = null }) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  const query = { recipientId: userId };
  if (societyId) {
    if (!mongoose.isValidObjectId(societyId)) {
      throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
    }
    query.societyId = societyId;
  }

  const result = await Notification.deleteMany(query);
  return { deletedCount: result.deletedCount, message: "Notifications cleared successfully" };
};
