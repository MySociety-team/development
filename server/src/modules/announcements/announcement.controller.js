import asyncHandler from "../../utils/asyncHandler.js";

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement
} from "./announcement.service.js";

export const getAnnouncementsController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;

  const announcements = await getAnnouncements({
    societyId
  });

  return res.status(200).json({
    success: true,
    code: "ANNOUNCEMENTS_FETCHED",
    message: "Announcements fetched successfully",
    data: {
      announcements
    }
  });
});

export const getAnnouncementController = asyncHandler(async (req, res) => {
  const { societyId, announcementId } = req.params;

  const announcement = await getAnnouncement({
    societyId,
    announcementId
  });

  return res.status(200).json({
    success: true,
    code: "ANNOUNCEMENT_FETCHED",
    message: "Announcement fetched successfully",
    data: {
      announcement
    }
  });
});

export const createAnnouncementController = asyncHandler(async (req, res) => {
  const { societyId } = req.params;

  const announcement = await createAnnouncement({
    societyId,
    userId: req.user.id,
    announcementData: req.body
  });

  return res.status(201).json({
    success: true,
    code: "ANNOUNCEMENT_CREATED",
    message: "Announcement created successfully",
    data: {
      announcement
    }
  });
});

export const updateAnnouncementController = asyncHandler(async (req, res) => {
  const { societyId, announcementId } = req.params;

  const announcement = await updateAnnouncement({
    societyId,
    announcementId,
    announcementData: req.body
  });

  return res.status(200).json({
    success: true,
    code: "ANNOUNCEMENT_UPDATED",
    message: "Announcement updated successfully",
    data: {
      announcement
    }
  });
});

export const deleteAnnouncementController = asyncHandler(async (req, res) => {
  const { societyId, announcementId } = req.params;

  await deleteAnnouncement({
    societyId,
    announcementId
  });

  return res.status(200).json({
    success: true,
    code: "ANNOUNCEMENT_DELETED",
    message: "Announcement deleted successfully"
  });
});
