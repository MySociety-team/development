import { createHmac, timingSafeEqual } from "node:crypto";

import getRazorpayClient from "../../config/razorpay.js";
import Subscription, { PLAN_NAME, SUBSCRIPTION_STATUS } from "../../models/Subscription.js";
import ApiError from "../../utils/apiError.js";

import {
  SOCIETY_CREATOR_DURATION_DAYS,
  SOCIETY_CREATOR_PRICE_PAISE,
  SUBSCRIPTION_CURRENCY
} from "./subscription.constants.js";

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const serializeSubscription = (subscription) => {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription._id.toString(),
    plan: subscription.plan,
    amountPaise: subscription.amountPaise,
    status: subscription.status,
    societyId: subscription.societyId?.toString() ?? null,
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    razorpayOrderId: subscription.razorpayOrderId ?? null,
    razorpayPaymentId: subscription.razorpayPaymentId ?? null
  };
};

const expireOldSubscriptions = async (userId) => {
  await Subscription.updateMany(
    {
      purchasedBy: userId,
      plan: PLAN_NAME.SOCIETY_CREATOR,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: {
        $lte: new Date()
      }
    },
    {
      $set: {
        status: SUBSCRIPTION_STATUS.EXPIRED
      }
    }
  );
};

const findActiveCreationSubscription = async (userId) => {
  const now = new Date();

  return Subscription.findOne({
    purchasedBy: userId,
    plan: PLAN_NAME.SOCIETY_CREATOR,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    startsAt: {
      $lte: now
    },
    expiresAt: {
      $gt: now
    }
  }).sort({
    expiresAt: 1
  });
};

export const getSubscriptionStatus = async ({ userId }) => {
  await expireOldSubscriptions(userId);

  const [activeSubscription, latestSubscription] = await Promise.all([
    findActiveCreationSubscription(userId),
    Subscription.findOne({
      purchasedBy: userId,
      plan: PLAN_NAME.SOCIETY_CREATOR
    }).sort({
      createdAt: -1
    })
  ]);

  return {
    plan: {
      name: PLAN_NAME.SOCIETY_CREATOR,
      amountPaise: SOCIETY_CREATOR_PRICE_PAISE,
      currency: SUBSCRIPTION_CURRENCY,
      durationDays: SOCIETY_CREATOR_DURATION_DAYS
    },
    hasActiveSubscription: Boolean(activeSubscription),
    canCreateSociety: Boolean(activeSubscription),
    subscription: serializeSubscription(activeSubscription ?? latestSubscription)
  };
};

export const createSubscriptionOrder = async ({ userId }) => {
  await expireOldSubscriptions(userId);

  const activeSubscription = await findActiveCreationSubscription(userId);

  if (activeSubscription) {
    throw new ApiError(
      409,
      "ACTIVE_CREATION_SUBSCRIPTION_EXISTS",
      "You already have an active society creator subscription"
    );
  }

  const razorpay = getRazorpayClient();

  const receipt = `soc_${userId.slice(-8)}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: SOCIETY_CREATOR_PRICE_PAISE,
    currency: SUBSCRIPTION_CURRENCY,
    receipt,
    notes: {
      purpose: "SOCIETY_CREATOR",
      userId
    }
  });

  const now = new Date();

  await Subscription.create({
    purchasedBy: userId,
    societyId: null,
    plan: PLAN_NAME.SOCIETY_CREATOR,
    amountPaise: SOCIETY_CREATOR_PRICE_PAISE,
    status: SUBSCRIPTION_STATUS.CREATED,
    razorpayOrderId: order.id,
    startsAt: now,
    expiresAt: addDays(now, SOCIETY_CREATOR_DURATION_DAYS)
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency
    },
    plan: {
      name: PLAN_NAME.SOCIETY_CREATOR,
      amountPaise: SOCIETY_CREATOR_PRICE_PAISE,
      durationDays: SOCIETY_CREATOR_DURATION_DAYS
    }
  };
};

const signaturesMatch = ({ expected, received }) => {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const verifySubscriptionPayment = async ({ userId, payload }) => {
  const razorpayOrderId = payload?.razorpay_order_id;
  const razorpayPaymentId = payload?.razorpay_payment_id;
  const razorpaySignature = payload?.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(
      400,
      "PAYMENT_VERIFICATION_DATA_REQUIRED",
      "Payment order id, payment id and signature are required"
    );
  }

  const subscription = await Subscription.findOne({
    purchasedBy: userId,
    plan: PLAN_NAME.SOCIETY_CREATOR,
    razorpayOrderId
  }).sort({
    createdAt: -1
  });

  if (!subscription) {
    throw new ApiError(
      404,
      "SUBSCRIPTION_ORDER_NOT_FOUND",
      "The subscription order could not be found"
    );
  }

  if (
    subscription.status === SUBSCRIPTION_STATUS.ACTIVE &&
    subscription.razorpayPaymentId === razorpayPaymentId
  ) {
    return serializeSubscription(subscription);
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.CREATED) {
    throw new ApiError(
      409,
      "SUBSCRIPTION_ORDER_NOT_PAYABLE",
      "This subscription order can no longer be activated"
    );
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new ApiError(
      500,
      "RAZORPAY_NOT_CONFIGURED",
      "Razorpay payment verification is not configured"
    );
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${subscription.razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (
    !signaturesMatch({
      expected: expectedSignature,
      received: razorpaySignature
    })
  ) {
    throw new ApiError(400, "RAZORPAY_SIGNATURE_INVALID", "Payment signature verification failed");
  }

  const now = new Date();

  subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
  subscription.razorpayPaymentId = razorpayPaymentId;
  subscription.startsAt = now;
  subscription.expiresAt = addDays(now, SOCIETY_CREATOR_DURATION_DAYS);

  await subscription.save();

  return serializeSubscription(subscription);
};
