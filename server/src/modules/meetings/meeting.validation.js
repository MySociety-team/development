import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";

const allowedStatuses = ["UPCOMING", "COMPLETED", "CANCELLED"];

export const validateMeetingId = (meetingId) => {
  if (!mongoose.isValidObjectId(meetingId)) {
    throw new ApiError(400, "MEETING_ID_INVALID", "Meeting ID is invalid");
  }
};

export const validateCreateMeeting = (data) => {
  const { title, description, dateTime, venue, duration, topics } = data;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "MEETING_TITLE_REQUIRED", "Meeting title is required");
  }

  if (description !== undefined && typeof description !== "string") {
    throw new ApiError(400, "MEETING_DESCRIPTION_INVALID", "Meeting description must be a string");
  }

  if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
    throw new ApiError(400, "MEETING_DATETIME_INVALID", "Meeting date and time is invalid");
  }

  // Do not allow creating a meeting in the past
  if (new Date(dateTime) <= new Date()) {
    throw new ApiError(400, "MEETING_DATETIME_PAST", "Meeting date and time must be in the future");
  }

  if (!venue || typeof venue !== "string" || !venue.trim()) {
    throw new ApiError(400, "MEETING_VENUE_REQUIRED", "Meeting venue is required");
  }

  if (
    duration === undefined ||
    typeof duration !== "number" ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new ApiError(
      400,
      "MEETING_DURATION_INVALID",
      "Meeting duration must be greater than zero"
    );
  }

  if (topics !== undefined) {
    if (
      !Array.isArray(topics) ||
      topics.some((topic) => typeof topic !== "string" || !topic.trim())
    ) {
      throw new ApiError(
        400,
        "MEETING_TOPICS_INVALID",
        "Meeting topics must be an array of non-empty strings"
      );
    }
  }

  return true;
};

export const validateUpdateMeeting = (data) => {
  if (data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      throw new ApiError(400, "MEETING_TITLE_INVALID", "Meeting title must be a non-empty string");
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") {
      throw new ApiError(
        400,
        "MEETING_DESCRIPTION_INVALID",
        "Meeting description must be a string"
      );
    }
  }

  if (data.dateTime !== undefined) {
    if (Number.isNaN(new Date(data.dateTime).getTime())) {
      throw new ApiError(400, "MEETING_DATETIME_INVALID", "Meeting date and time is invalid");
    }

    if (new Date(data.dateTime) <= new Date()) {
      throw new ApiError(
        400,
        "MEETING_DATETIME_PAST",
        "Meeting date and time must be in the future"
      );
    }
  }

  if (data.venue !== undefined) {
    if (typeof data.venue !== "string" || !data.venue.trim()) {
      throw new ApiError(400, "MEETING_VENUE_INVALID", "Meeting venue must be a non-empty string");
    }
  }

  if (data.duration !== undefined) {
    if (
      typeof data.duration !== "number" ||
      !Number.isFinite(data.duration) ||
      data.duration <= 0
    ) {
      throw new ApiError(
        400,
        "MEETING_DURATION_INVALID",
        "Meeting duration must be greater than zero"
      );
    }
  }

  if (data.topics !== undefined) {
    if (
      !Array.isArray(data.topics) ||
      data.topics.some((topic) => typeof topic !== "string" || !topic.trim())
    ) {
      throw new ApiError(
        400,
        "MEETING_TOPICS_INVALID",
        "Meeting topics must be an array of non-empty strings"
      );
    }
  }

  if (data.status !== undefined) {
    if (!allowedStatuses.includes(data.status)) {
      throw new ApiError(400, "MEETING_STATUS_INVALID", "Meeting status is invalid");
    }
  }

  return true;
};
