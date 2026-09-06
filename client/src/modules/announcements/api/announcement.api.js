import apiClient from "../../../lib/apiClient.js";

export const getAnnouncements = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}/announcements`);

  return response.data.data;
};

export const getAnnouncement = async (societyId, announcementId) => {
  const response = await apiClient.get(`/societies/${societyId}/announcements/${announcementId}`);

  return response.data.data;
};

export const createAnnouncement = async (societyId, announcementData) => {
  const response = await apiClient.post(`/societies/${societyId}/announcements`, announcementData);

  return response.data.data;
};

export const updateAnnouncement = async (societyId, announcementId, announcementData) => {
  const response = await apiClient.put(
    `/societies/${societyId}/announcements/${announcementId}`,
    announcementData
  );

  return response.data.data;
};

export const deleteAnnouncement = async (societyId, announcementId) => {
  const response = await apiClient.delete(
    `/societies/${societyId}/announcements/${announcementId}`
  );

  return response.data;
};
