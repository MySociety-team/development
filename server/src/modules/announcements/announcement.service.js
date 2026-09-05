import {
  createAnnouncement as createAnnouncementRepository,
  deleteAnnouncement as deleteAnnouncementRepository,
  findAnnouncementById,
  findAnnouncementsBySociety,
  updateAnnouncement as updateAnnouncementRepository
} from "./announcement.repository.js";

import ApiError from "../../utils/apiError.js";

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

  return createAnnouncementRepository({
    societyId,
    createdBy: userId,
    ...announcementData
  });
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
