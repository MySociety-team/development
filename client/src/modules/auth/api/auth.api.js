import apiClient from "../../../lib/apiClient.js";

export const registerUser = async (payload) => {
  const response = await apiClient.post("/auth/register", payload);

  return response.data.data;
};

export const loginUser = async (payload) => {
  const response = await apiClient.post("/auth/login", payload);

  return response.data.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");

  return response.data.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post("/auth/logout");

  return response.data;
};
