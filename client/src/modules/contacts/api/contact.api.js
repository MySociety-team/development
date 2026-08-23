import apiClient from "../../../lib/apiClient.js";

export const getContacts = async (societyId, search = "") => {
  const response = await apiClient.get(`/contacts/${societyId}`, {
    params: {
      search
    }
  });

  return response.data.data;
};

export const createContact = async (societyId, contactData) => {
  const response = await apiClient.post(`/contacts/${societyId}`, contactData);

  return response.data.data;
};

export const updateContact = async (societyId, contactId, contactData) => {
  const response = await apiClient.put(`/contacts/${societyId}/${contactId}`, contactData);

  return response.data.data;
};

export const deleteContact = async (societyId, contactId) => {
  const response = await apiClient.delete(`/contacts/${societyId}/${contactId}`);

  return response.data;
};
