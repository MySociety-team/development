import express from "express";

import authenticate from "../../middleware/authentication.js";
import {
  clearAllNotificationsController,
  deleteNotificationController,
  getNotificationsController,
  getUnreadCountController,
  markAllReadController,
  markAsReadController
} from "./notification.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getNotificationsController);
router.get("/unread-count", getUnreadCountController);
router.patch("/mark-all-read", markAllReadController);
router.patch("/:notificationId/read", markAsReadController);
router.delete("/:notificationId", deleteNotificationController);
router.delete("/", clearAllNotificationsController);

export default router;
