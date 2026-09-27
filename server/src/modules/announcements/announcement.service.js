import {
  createAnnouncement as createAnnouncementRepository,
  deleteAnnouncement as deleteAnnouncementRepository,
  findAnnouncementById,
  findAnnouncementsBySociety,
  updateAnnouncement as updateAnnouncementRepository
} from "./announcement.repository.js";

import ApiError from "../../utils/apiError.js";

import SocietyMember from "../../models/SocietyMember.js";
import { createBulkNotifications } from "../notifications/notification.service.js";
import {
  validateAnnouncementId,
  validateCreateAnnouncement,
  validateSocietyId,
  validateUpdateAnnouncement
} from "./announcement.validation.js";

export const getAnnouncements = async ({ societyId }) => {
  validateSocietyId(societyId);

  return findAnnouncementsBySociety(societyId);
};

export const getAnnouncement = async ({ societyId, announcementId }) => {
  validateSocietyId(societyId);
  validateAnnouncementId(announcementId);

  const announcement = await findAnnouncementById(announcementId, societyId);

  if (!announcement) {
    throw new ApiError(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement not found");
  }

  return announcement;
};

export const createAnnouncement = async ({ societyId, userId, announcementData }) => {
  validateSocietyId(societyId);
  validateCreateAnnouncement(announcementData);

  const announcement = await createAnnouncementRepository({
    societyId,
    createdBy: userId,
    ...announcementData
  });

  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const snippet = announcement.content
        ? announcement.content.length > 120
          ? `${announcement.content.slice(0, 117)}...`
          : announcement.content
        : "A new announcement has been posted for the society.";

      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "ANNOUNCEMENT_CREATED",
        title: `Announcement: ${announcement.title}`,
        message: snippet,
        link: `/societies/${societyId}/announcements/${announcement._id}`,
        metadata: {
          announcementId: announcement._id
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of announcement:", err);
  }

  return announcement;
};

export const updateAnnouncement = async ({ societyId, announcementId, announcementData }) => {
  validateSocietyId(societyId);
  validateAnnouncementId(announcementId);
  validateUpdateAnnouncement(announcementData);

  const announcement = await updateAnnouncementRepository(
    announcementId,
    societyId,
    announcementData
  );

  if (!announcement) {
    throw new ApiError(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement not found");
  }

  return announcement;
};

export const deleteAnnouncement = async ({ societyId, announcementId }) => {
  validateSocietyId(societyId);
  validateAnnouncementId(announcementId);

  const announcement = await deleteAnnouncementRepository(announcementId, societyId);

  if (!announcement) {
    throw new ApiError(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement not found");
  }

  return announcement;
};
