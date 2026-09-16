import apiClient from "../../../lib/apiClient.js";


// =====================================================
// RESIDENT APIs
// =====================================================

// Current maintenance bill
export const getCurrentMaintenanceBill = async (
  societyId
) => {

  const response =
    await apiClient.get(
      `/societies/${societyId}/current`
    );

  return response.data.data;
};


// Maintenance bill history
export const getMaintenanceHistory = async (
  societyId
) => {

  const response =
    await apiClient.get(
      `/societies/${societyId}/history`
    );

  return response.data.data;
};


// Logged-in resident payment history
export const getMyPaymentHistory = async (
  societyId
) => {

  const response =
    await apiClient.get(
      `/societies/${societyId}/my-payments`
    );

  return response.data.data;
};


// =====================================================
// SOCIETY TRANSPARENCY
// =====================================================

// Resident can view society-level maintenance summary
export const getMaintenanceTransparency =
  async (
    societyId,
    month
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/transparency`,
        {
          params: {
            month
          }
        }
      );

    return response.data.data;
  };


// =====================================================
// RAZORPAY
// =====================================================

// Create Razorpay maintenance order
export const createMaintenancePaymentOrder =
  async (
    societyId,
    billId
  ) => {

    const response =
      await apiClient.post(
        `/societies/${societyId}/payment-order`,
        {
          billId
        }
      );

    return response.data.data;
  };


// Verify Razorpay payment
export const verifyMaintenancePayment =
  async (
    societyId,
    payload
  ) => {

    const response =
      await apiClient.post(
        `/societies/${societyId}/verify-payment`,
        payload
      );

    return response.data.data;
  };


// =====================================================
// SECRETARY APIs
// =====================================================

// Dashboard statistics
export const getMaintenanceDashboard =
  async (
    societyId,
    month
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/dashboard`,
        {
          params: {
            month
          }
        }
      );

    return response.data.data;
  };


// Get society bills for month
export const getSocietyBills =
  async (
    societyId,
    month
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/bills/month`,
        {
          params: {
            month
          }
        }
      );

    return response.data.data;
  };


// Create one maintenance bill
export const createMaintenanceBill =
  async (
    societyId,
    billData
  ) => {

    const response =
      await apiClient.post(
        `/societies/${societyId}/bills`,
        billData
      );

    return response.data.data;
  };


// Generate monthly bills
export const generateMonthlyBills =
  async (
    societyId,
    billData
  ) => {

    const response =
      await apiClient.post(
        `/societies/${societyId}/bills/generate`,
        billData
      );

    return response.data.data;
  };


// Get particular bill
export const getMaintenanceBill =
  async (
    societyId,
    billId
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/bills/${billId}`
      );

    return response.data.data;
  };


// Update unpaid bill
export const updateMaintenanceBill =
  async (
    societyId,
    billId,
    billData
  ) => {

    const response =
      await apiClient.patch(
        `/societies/${societyId}/bills/${billId}`,
        billData
      );

    return response.data.data;
  };


// Mark overdue bills
export const markMaintenanceBillsOverdue =
  async (
    societyId,
    month
  ) => {

    const response =
      await apiClient.patch(
        `/societies/${societyId}/bills/overdue`,
        {
          month
        }
      );

    return response.data.data;
  };


// Record offline payment
export const recordOfflineMaintenancePayment =
  async (
    societyId,
    paymentData
  ) => {

    const response =
      await apiClient.post(
        `/societies/${societyId}/payments/offline`,
        paymentData
      );

    return response.data.data;
  };


// =====================================================
// IMPORTANT:
// Society payment history accepts MONTH
// =====================================================

export const getSocietyPaymentHistory =
  async (
    societyId,
    month
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/payments`,
        {
          params: {
            month
          }
        }
      );

    return response.data.data;
  };


// =====================================================
// PARTICULAR PAYMENT
// =====================================================

export const getMaintenancePayment =
  async (
    societyId,
    paymentId
  ) => {

    const response =
      await apiClient.get(
        `/societies/${societyId}/payments/${paymentId}`
      );

    return response.data.data;
  };