import apiClient from "../../../lib/apiClient.js";

/**
 * Fetch all complaints for a society
 */
export const getComplaints = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}/complaints`);
  return response.data.data.complaints;
};

/**
 * Create a new complaint in a society
 */
export const createComplaint = async (societyId, payload) => {
  const response = await apiClient.post(`/societies/${societyId}/complaints`, payload);
  return response.data.data.complaint;
};

/**
 * Update the status of a complaint with resolution or rejection note
 */
export const updateComplaintStatus = async (societyId, complaintId, statusOrPayload, maybeNote) => {
  const payload =
    typeof statusOrPayload === "object" && statusOrPayload !== null
      ? statusOrPayload
      : { status: statusOrPayload, resolutionNote: maybeNote || "" };

  const response = await apiClient.patch(
    `/societies/${societyId}/complaints/${complaintId}/status`,
    payload
  );
  return response.data.data.complaint;
};

/**
 * Delete a complaint
 */
export const deleteComplaint = async (societyId, complaintId) => {
  const response = await apiClient.delete(`/societies/${societyId}/complaints/${complaintId}`);
  return response.data;
};
