import apiClient from "../../../lib/apiClient.js";

export const getSpecialCollections = async (societyId, params = {}) => {
  const response = await apiClient.get(`/societies/${societyId}/special-collections`, { params });

  return response.data.data;
};

export const getSpecialCollection = async (societyId, collectionId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/${collectionId}`
  );

  return response.data.data;
};

export const getSpecialCollectionSelectionOptions = async (societyId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/selection-options`
  );

  return response.data.data;
};

export const createSpecialCollection = async (societyId, collectionData) => {
  const response = await apiClient.post(
    `/societies/${societyId}/special-collections`,
    collectionData
  );

  return response.data.data;
};

export const updateSpecialCollection = async (societyId, collectionId, collectionData) => {
  const response = await apiClient.put(
    `/societies/${societyId}/special-collections/${collectionId}`,
    collectionData
  );

  return response.data.data;
};

export const activateSpecialCollection = async (societyId, collectionId) => {
  const response = await apiClient.patch(
    `/societies/${societyId}/special-collections/${collectionId}/activate`
  );

  return response.data.data;
};

export const closeSpecialCollection = async (societyId, collectionId) => {
  const response = await apiClient.patch(
    `/societies/${societyId}/special-collections/${collectionId}/close`
  );

  return response.data.data;
};

export const cancelSpecialCollection = async (societyId, collectionId) => {
  const response = await apiClient.patch(
    `/societies/${societyId}/special-collections/${collectionId}/cancel`
  );

  return response.data.data;
};

export const getResidentCollectionStatus = async (societyId, collectionId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/${collectionId}/status`
  );

  return response.data.data;
};

export const createSpecialCollectionPaymentOrder = async (societyId, collectionId) => {
  const response = await apiClient.post(
    `/societies/${societyId}/special-collections/payments/order`,
    { collectionId }
  );

  return response.data.data;
};

export const verifySpecialCollectionPayment = async (societyId, collectionId, paymentData) => {
  const response = await apiClient.post(
    `/societies/${societyId}/special-collections/payments/verify`,
    {
      collectionId,
      ...paymentData
    }
  );

  return response.data.data;
};

export const recordOfflinePayment = async (societyId, paymentData) => {
  const response = await apiClient.post(
    `/societies/${societyId}/special-collections/payments/offline`,
    paymentData
  );

  return response.data.data;
};

export const getMySpecialCollectionPayments = async (societyId) => {
  const response = await apiClient.get(`/societies/${societyId}/special-collections/my-payments`);

  return response.data.data;
};

export const getFlatSpecialCollectionPayments = async (societyId, flatId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/flats/${flatId}/payments`
  );

  return response.data.data;
};

export const getSpecialCollectionPayments = async (societyId, collectionId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/${collectionId}/payments`
  );

  return response.data.data;
};

export const getSpecialCollectionSummary = async (societyId, collectionId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/${collectionId}/summary`
  );

  return response.data.data;
};

export const getSpecialCollectionPayment = async (societyId, paymentId) => {
  const response = await apiClient.get(
    `/societies/${societyId}/special-collections/payments/${paymentId}`
  );

  return response.data.data;
};

export const refundSpecialCollectionPayment = async (societyId, paymentId, refundData = {}) => {
  const response = await apiClient.post(
    `/societies/${societyId}/special-collections/payments/${paymentId}/refund`,
    refundData
  );

  return response.data.data;
};
