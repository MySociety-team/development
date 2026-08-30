import apiClient from "../../../lib/apiClient.js";

export const getMeetings = async (societyId) => {
  const response = await apiClient.get(`/meetings/${societyId}`);

  return response.data.data.meetings;
};

export const getMeeting = async (societyId, meetingId) => {
  const response = await apiClient.get(`/meetings/${societyId}/${meetingId}`);

  return response.data.data.meeting;
};

export const createMeeting = async (societyId, meetingData) => {
  const response = await apiClient.post(`/meetings/${societyId}`, meetingData);

  return response.data.data.meeting;
};

export const updateMeeting = async (societyId, meetingId, meetingData) => {
  const response = await apiClient.put(`/meetings/${societyId}/${meetingId}`, meetingData);

  return response.data.data.meeting;
};

export const deleteMeeting = async (societyId, meetingId) => {
  const response = await apiClient.delete(`/meetings/${societyId}/${meetingId}`);

  return response.data;
};

export const updateMeetingAttendance = async (societyId, meetingId, attendance) => {
  const response = await apiClient.put(`/meetings/${societyId}/${meetingId}/attendance`, {
    attendance
  });

  return response.data.data.meeting;
};
