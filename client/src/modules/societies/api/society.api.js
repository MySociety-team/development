import apiClient from "../../../lib/apiClient.js";

export const getMySocieties = async () => {
  const response = await apiClient.get("/societies/my-societies");
  return response.data.data.societies;
};

export const verifySocietyCode = async (joiningCode) => {
  const response = await apiClient.post("/societies/verify-code", {
    joiningCode
  });

  return response.data.data.society;
};

export const joinSociety = async (societyId, payload) => {
  const response = await apiClient.post(`/societies/${societyId}/join`, payload);
  return response.data.data.society;
};

export const createSociety = async (payload) => {
  const response = await apiClient.post("/societies", payload);
  return response.data.data.society;
};

export const getSociety = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}`);
  return response.data.data;
};

export const getSocietyMembers = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}/members`);
  return response.data.data.members;
};
