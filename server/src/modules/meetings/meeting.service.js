import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";
import SocietyMember from "../../models/SocietyMember.js";
import { createBulkNotifications } from "../notifications/notification.service.js";

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

const formatMeetingDate = (date) => {
  try {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return date;
  }
};

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

  const meeting = await createMeetingRepository({
    societyId,
    createdBy: userId,
    ...meetingData
  });

  // Notify all active society members about the newly scheduled meeting
  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const dateText = formatMeetingDate(meeting.dateTime);
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "MEETING_SCHEDULED",
        title: "New Meeting Scheduled",
        message: `"${meeting.title}" on ${dateText} at ${meeting.venue}`,
        link: `/societies/${societyId}/meetings/${meeting._id}`,
        metadata: {
          meetingId: meeting._id
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of scheduled meeting:", err);
  }

  return meeting;
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

  // Notify members about the meeting update
  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const isCancelled = meeting.status === "CANCELLED";
      const dateText = formatMeetingDate(meeting.dateTime);
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: isCancelled ? "MEETING_CANCELLED" : "MEETING_UPDATED",
        title: isCancelled ? "Meeting Cancelled" : "Meeting Details Updated",
        message: isCancelled
          ? `The meeting "${meeting.title}" scheduled for ${dateText} has been cancelled.`
          : `The meeting "${meeting.title}" on ${dateText} has been updated.`,
        link: `/societies/${societyId}/meetings/${meeting._id}`,
        metadata: {
          meetingId: meeting._id,
          status: meeting.status
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of meeting update:", err);
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

  // Notify members about meeting cancellation
  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "MEETING_CANCELLED",
        title: "Meeting Cancelled",
        message: `The meeting "${meeting.title}" has been cancelled.`,
        link: `/societies/${societyId}/meetings`,
        metadata: {
          meetingId: meeting._id
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of meeting deletion:", err);
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
