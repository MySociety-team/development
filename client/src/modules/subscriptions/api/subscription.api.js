import apiClient from "../../../lib/apiClient.js";

export const getMySubscription = async () => {
  const response = await apiClient.get("/subscriptions/my-subscription");
  return response.data.data;
};

export const createSubscriptionOrder = async () => {
  const response = await apiClient.post("/subscriptions/create-order");
  return response.data.data;
};

export const verifySubscriptionPayment = async (payload) => {
  const response = await apiClient.post("/subscriptions/verify-payment", payload);
  return response.data.data.subscription;
};
