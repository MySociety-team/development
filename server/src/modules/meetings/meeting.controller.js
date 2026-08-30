import asyncHandler from "../../utils/asyncHandler.js";

import {
  createMeeting,
  deleteMeeting,
  getMeeting,
  getMeetings,
  updateAttendance,
  updateMeeting
} from "./meeting.service.js";

export const getMeetingsController = asyncHandler(async (req, res) => {
  const meetings = await getMeetings({
    societyId: req.params.societyId
  });

  return res.status(200).json({
    success: true,
    code: "MEETINGS_FETCHED",
    message: "Meetings fetched successfully",
    data: {
      meetings
    }
  });
});

export const getMeetingController = asyncHandler(async (req, res) => {
  const meeting = await getMeeting({
    societyId: req.params.societyId,
    meetingId: req.params.meetingId
  });

  return res.status(200).json({
    success: true,
    code: "MEETING_FETCHED",
    message: "Meeting fetched successfully",
    data: {
      meeting
    }
  });
});

export const createMeetingController = asyncHandler(async (req, res) => {
  const meeting = await createMeeting({
    societyId: req.params.societyId,
    userId: req.user.id,
    meetingData: req.body
  });

  return res.status(201).json({
    success: true,
    code: "MEETING_CREATED",
    message: "Meeting created successfully",
    data: {
      meeting
    }
  });
});

export const updateMeetingController = asyncHandler(async (req, res) => {
  const meeting = await updateMeeting({
    societyId: req.params.societyId,
    meetingId: req.params.meetingId,
    meetingData: req.body
  });

  return res.status(200).json({
    success: true,
    code: "MEETING_UPDATED",
    message: "Meeting updated successfully",
    data: {
      meeting
    }
  });
});

export const deleteMeetingController = asyncHandler(async (req, res) => {
  await deleteMeeting({
    societyId: req.params.societyId,
    meetingId: req.params.meetingId
  });

  return res.status(200).json({
    success: true,
    code: "MEETING_DELETED",
    message: "Meeting deleted successfully"
  });
});

export const updateAttendanceController = asyncHandler(async (req, res) => {
  const meeting = await updateAttendance({
    societyId: req.params.societyId,
    meetingId: req.params.meetingId,
    attendance: req.body.attendance
  });

  return res.status(200).json({
    success: true,
    code: "MEETING_ATTENDANCE_UPDATED",
    message: "Meeting attendance updated successfully",
    data: {
      meeting
    }
  });
});
