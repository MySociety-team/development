import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";

const allowedTypes = ["GENERAL", "EMERGENCY", "EVENT", "REMINDER", "UPDATE"];

const validateAnnouncementDate = (date) => {
  if (!date || Number.isNaN(new Date(date).getTime())) {
    throw new ApiError(400, "ANNOUNCEMENT_DATE_INVALID", "Announcement date is invalid");
  }

  const selectedDate = new Date(date);
  const today = new Date();

  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    throw new ApiError(400, "ANNOUNCEMENT_DATE_PAST", "Announcement date cannot be in the past");
  }
};

export const validateSocietyId = (societyId) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }
};

export const validateAnnouncementId = (announcementId) => {
  if (!mongoose.isValidObjectId(announcementId)) {
    throw new ApiError(400, "ANNOUNCEMENT_ID_INVALID", "Announcement ID is invalid");
  }
};

export const validateCreateAnnouncement = (data) => {
  const { title, description, type, date } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "ANNOUNCEMENT_TITLE_REQUIRED", "Announcement title is required");
  }

  if (title.trim().length > 150) {
    throw new ApiError(
      400,
      "ANNOUNCEMENT_TITLE_TOO_LONG",
      "Announcement title cannot exceed 150 characters"
    );
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    throw new ApiError(
      400,
      "ANNOUNCEMENT_DESCRIPTION_REQUIRED",
      "Announcement description is required"
    );
  }

  if (description.trim().length > 2000) {
    throw new ApiError(
      400,
      "ANNOUNCEMENT_DESCRIPTION_TOO_LONG",
      "Announcement description cannot exceed 2000 characters"
    );
  }

  if (type !== undefined && !allowedTypes.includes(type)) {
    throw new ApiError(400, "ANNOUNCEMENT_TYPE_INVALID", "Announcement type is invalid");
  }

  validateAnnouncementDate(date);

  return true;
};

export const validateUpdateAnnouncement = (data) => {
  if (data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      throw new ApiError(
        400,
        "ANNOUNCEMENT_TITLE_INVALID",
        "Announcement title must be a non-empty string"
      );
    }

    if (data.title.trim().length > 150) {
      throw new ApiError(
        400,
        "ANNOUNCEMENT_TITLE_TOO_LONG",
        "Announcement title cannot exceed 150 characters"
      );
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string" || !data.description.trim()) {
      throw new ApiError(
        400,
        "ANNOUNCEMENT_DESCRIPTION_INVALID",
        "Announcement description must be a non-empty string"
      );
    }

    if (data.description.trim().length > 2000) {
      throw new ApiError(
        400,
        "ANNOUNCEMENT_DESCRIPTION_TOO_LONG",
        "Announcement description cannot exceed 2000 characters"
      );
    }
  }

  if (data.type !== undefined) {
    if (!allowedTypes.includes(data.type)) {
      throw new ApiError(400, "ANNOUNCEMENT_TYPE_INVALID", "Announcement type is invalid");
    }
  }

  if (data.date !== undefined) {
    validateAnnouncementDate(data.date);
  }

  return true;
};
