import apiClient from "../../../lib/apiClient.js";

export const getFinanceRecords = async (societyId, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();

  const response = await apiClient.get(
    `/societies/${societyId}/finance${query ? `?${query}` : ""}`
  );

  return response.data.data.records;
};

export const getFinanceSummary = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}/finance/summary`);

  return response.data.data.summary;
};

export const getFinanceRecord = async (societyId, financeId) => {
  const response = await apiClient.get(`/societies/${societyId}/finance/${financeId}`);

  return response.data.data.record;
};

export const createFinanceRecord = async (societyId, financeData) => {
  const response = await apiClient.post(`/societies/${societyId}/finance`, financeData);

  return response.data.data.record;
};

export const updateFinanceRecord = async (societyId, financeId, financeData) => {
  const response = await apiClient.put(`/societies/${societyId}/finance/${financeId}`, financeData);

  return response.data.data.record;
};

export const deleteFinanceRecord = async (societyId, financeId) => {
  const response = await apiClient.delete(`/societies/${societyId}/finance/${financeId}`);

  return response.data;
};
