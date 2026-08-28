import apiClient from "../../../lib/apiClient.js";

export const register = async (payload) => {
  const response = await apiClient.post("/auth/register", payload);

  return response.data;
};

export const login = async (payload) => {
  const response = await apiClient.post("/auth/login", payload);

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");

  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post("/auth/logout");

  return response.data;
};
