import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";
import SocietyMember from "../../models/SocietyMember.js";

import {
  createMeeting as createMeetingRepository,
  deleteMeeting as deleteMeetingRepository,
  findMeetingById,
  findMeetingsBySociety,
  updateMeeting as updateMeetingRepository,
  updateMeetingAttendance
} from "./meeting.repository.js";

import {
  validateCreateMeeting,
  validateMeetingId,
  validateUpdateMeeting
} from "./meeting.validation.js";

export const getMeetings = async ({ societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  return findMeetingsBySociety(societyId);
};

export const getMeeting = async ({ societyId, meetingId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  validateMeetingId(meetingId);

  const meeting = await findMeetingById(meetingId, societyId);

  if (!meeting) {
    throw new ApiError(404, "MEETING_NOT_FOUND", "Meeting not found");
  }

  return meeting;
};

export const createMeeting = async ({ societyId, userId, meetingData }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "USER_ID_INVALID", "User ID is invalid");
  }

  validateCreateMeeting(meetingData);

  return createMeetingRepository({
    societyId,
    createdBy: userId,
    ...meetingData
  });
};

export const updateMeeting = async ({ societyId, meetingId, meetingData }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  validateMeetingId(meetingId);
  validateUpdateMeeting(meetingData);

  const meeting = await updateMeetingRepository(meetingId, societyId, meetingData);

  if (!meeting) {
    throw new ApiError(404, "MEETING_NOT_FOUND", "Meeting not found");
  }

  return meeting;
};

export const deleteMeeting = async ({ societyId, meetingId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  validateMeetingId(meetingId);

  const meeting = await deleteMeetingRepository(meetingId, societyId);

  if (!meeting) {
    throw new ApiError(404, "MEETING_NOT_FOUND", "Meeting not found");
  }

  return meeting;
};

export const updateAttendance = async ({ societyId, meetingId, attendance }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  validateMeetingId(meetingId);

  if (!Array.isArray(attendance)) {
    throw new ApiError(400, "ATTENDANCE_INVALID", "Attendance must be an array");
  }

  const meeting = await findMeetingById(meetingId, societyId);

  if (!meeting) {
    throw new ApiError(404, "MEETING_NOT_FOUND", "Meeting not found");
  }

  if (meeting.status !== "COMPLETED") {
    throw new ApiError(
      400,
      "MEETING_NOT_COMPLETED",
      "Attendance can only be updated for completed meetings"
    );
  }

  const memberIds = attendance.map((record) => record.societyMemberId);

  const validMembers = await SocietyMember.find({
    _id: { $in: memberIds },
    societyId,
    status: "ACTIVE"
  }).select("_id");

  const validMemberIds = new Set(validMembers.map((member) => member._id.toString()));

  const hasInvalidMember = attendance.some(
    (record) => !validMemberIds.has(record.societyMemberId.toString())
  );

  if (hasInvalidMember) {
    throw new ApiError(
      400,
      "ATTENDANCE_MEMBER_INVALID",
      "Attendance contains a member who does not belong to this society"
    );
  }

  const invalidStatus = attendance.some((record) => !["PRESENT", "ABSENT"].includes(record.status));

  if (invalidStatus) {
    throw new ApiError(
      400,
      "ATTENDANCE_STATUS_INVALID",
      "Attendance status must be PRESENT or ABSENT"
    );
  }

  return updateMeetingAttendance(meetingId, societyId, attendance);
};
