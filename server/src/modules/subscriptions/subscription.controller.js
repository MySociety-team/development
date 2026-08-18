import asyncHandler from "../../utils/asyncHandler.js";

import {
  createSubscriptionOrder,
  getSubscriptionStatus,
  verifySubscriptionPayment
} from "./subscription.service.js";

export const getMySubscriptionController = asyncHandler(async (req, res) => {
  const subscription = await getSubscriptionStatus({
    userId: req.user.id
  });

  return res.status(200).json({
    success: true,
    code: "SUBSCRIPTION_FETCHED",
    message: "subscription status fetched successfully",
    data: subscription
  });
});

export const createSubscriptionOrderController = asyncHandler(async (req, res) => {
  const order = await createSubscriptionOrder({
    userId: req.user.id
  });

  return res.status(201).json({
    success: true,
    code: "SUBSCRIPTION_ORDER_CREATED",
    message: "subscription payment order created successfully",
    data: order
  });
});

export const verifySubscriptionPaymentController = asyncHandler(async (req, res) => {
  const subscription = await verifySubscriptionPayment({
    userId: req.user.id,
    payload: req.body
  });

  return res.status(200).json({
    success: true,
    code: "SUBSCRIPTION_ACTIVATED",
    message: "subscription activated successfully",
    data: {
      subscription
    }
  });
});
