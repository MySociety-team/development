import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";
import Finance from "../../models/Finance.js";
import Flat from "../../models/Flat.js";
import getRazorpayClient from "../../config/razorpay.js";

import {
  createCollection,
  findCollectionById,
  findCollectionsBySociety,
  updateCollection,
  findPaymentsByCollection,
  findActiveMembersBySociety,
  findPaymentsByResident,
  findPaymentsByFlat,
  findPaymentById,
  findPaymentByCollectionAndResident,
  createPayment,
  findPendingRazorpayPayment,
  findPaymentByRazorpayOrderId,
  updatePayment
} from "./specialCollection.repository.js";

import {
  createCollectionSchema,
  updateCollectionSchema,
  offlinePaymentSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema
} from "./specialCollection.validation.js";

import {
  notifySpecialCollectionCreated,
  notifySpecialCollectionManualReminder
} from "./specialCollection.notification.js";

// =====================================================
// HELPERS
// =====================================================

const normalizeId = (id) => String(id);

const isSecretary = (role) => role === "SECRETARY";

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(
      400,
      `${fieldName.toUpperCase().replace(/ /g, "_")}_INVALID`,
      `${fieldName} is invalid`
    );
  }
};

const validateRequest = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = {};

    error.details.forEach((item) => {
      const field = item.path.join(".");

      details[field] = item.message;
    });

    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_VALIDATION_ERROR",
      "Invalid special collection data",
      details
    );
  }

  return value;
};

const ensureSecretary = (role) => {
  if (!isSecretary(role)) {
    throw new ApiError(
      403,
      "SPECIAL_COLLECTION_FORBIDDEN",
      "Only Secretary can manage special collections"
    );
  }
};

// =====================================================
// RAZORPAY PAYMENT METHOD
// =====================================================

const getStoredRazorpayPaymentMethod = (razorpayPayment) => {
  if (razorpayPayment?.method === "upi") {
    return "UPI";
  }

  return "RAZORPAY";
};

// =====================================================
// AUDIENCE VALIDATION
// =====================================================

const validateAudience = async ({
  societyId,
  audienceType,
  applicableFlatIds = [],
  applicableResidentIds = []
}) => {
  if (audienceType === "ALL_FLATS") {
    if (applicableFlatIds.length > 0 || applicableResidentIds.length > 0) {
      throw new ApiError(
        400,
        "AUDIENCE_DATA_INVALID",
        "ALL_FLATS should not contain selected flats or residents"
      );
    }

    return;
  }

  if (audienceType === "SELECTED_FLATS" && applicableFlatIds.length === 0) {
    throw new ApiError(400, "FLATS_REQUIRED", "At least one flat must be selected");
  }

  if (audienceType === "SELECTED_RESIDENTS" && applicableResidentIds.length === 0) {
    throw new ApiError(400, "RESIDENTS_REQUIRED", "At least one resident must be selected");
  }

  if (applicableFlatIds.length > 0) {
    const flats = await Flat.find({
      _id: {
        $in: applicableFlatIds
      },
      societyId
    })
      .select("_id")
      .lean();

    if (flats.length !== applicableFlatIds.length) {
      throw new ApiError(
        400,
        "FLAT_NOT_IN_SOCIETY",
        "One or more selected flats do not belong to this society"
      );
    }
  }

  if (applicableResidentIds.length > 0) {
    const SocietyMember = mongoose.model("SocietyMember");

    const residents = await SocietyMember.find({
      _id: {
        $in: applicableResidentIds
      },
      societyId,
      status: "ACTIVE"
    })
      .select("_id")
      .lean();

    if (residents.length !== applicableResidentIds.length) {
      throw new ApiError(
        400,
        "RESIDENT_NOT_IN_SOCIETY",
        "One or more selected residents do not belong to this society"
      );
    }
  }
};

// =====================================================
// SELECTION OPTIONS
// =====================================================

export const getSpecialCollectionSelectionOptions = async ({ societyId, role }) => {
  validateObjectId(societyId, "Society ID");

  ensureSecretary(role);

  const flats = await Flat.find({
    societyId
  })
    .select("_id flatNumber floor wing")
    .sort({
      flatNumber: 1
    })
    .lean();

  const SocietyMember = mongoose.model("SocietyMember");

  const residents = await SocietyMember.find({
    societyId,
    status: "ACTIVE",
    role: "RESIDENT"
  })
    .select("_id flatId userId")
    .populate("userId", "name email")
    .populate("flatId", "_id flatNumber floor wing")
    .lean();

  return {
    flats,
    residents
  };
};

// =====================================================
// RESIDENT ACCESS
// =====================================================

const ensureResidentCanAccessCollection = ({ collection, flatId, residentId }) => {
  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  /*
   * This function checks ONLY whether the resident
   * is part of the collection audience.
   *
   * It intentionally does not check collection status.
   */

  if (collection.audienceType === "ALL_FLATS") {
    return;
  }

  if (collection.audienceType === "SELECTED_FLATS") {
    const allowed = (collection.applicableFlatIds || []).some(
      (id) => normalizeId(id?._id || id) === normalizeId(flatId)
    );

    if (!allowed) {
      throw new ApiError(
        403,
        "SPECIAL_COLLECTION_NOT_APPLICABLE",
        "This collection is not applicable to your flat"
      );
    }

    return;
  }

  if (collection.audienceType === "SELECTED_RESIDENTS") {
    const allowed = (collection.applicableResidentIds || []).some(
      (id) => normalizeId(id?._id || id) === normalizeId(residentId)
    );

    if (!allowed) {
      throw new ApiError(
        403,
        "SPECIAL_COLLECTION_NOT_APPLICABLE",
        "This collection is not applicable to you"
      );
    }

    return;
  }
};

// =====================================================
// CREATE COLLECTION
// =====================================================

export const createSpecialCollection = async ({ societyId, userId, role, data }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(userId, "User ID");

  ensureSecretary(role);

  const validatedData = validateRequest(createCollectionSchema, data);

  if (new Date(validatedData.dueDate) < new Date(validatedData.startDate)) {
    throw new ApiError(400, "INVALID_COLLECTION_DATES", "Due date cannot be before start date");
  }

  await validateAudience({
    societyId,
    audienceType: validatedData.audienceType,
    applicableFlatIds: validatedData.applicableFlatIds,
    applicableResidentIds: validatedData.applicableResidentIds
  });

  const collection = await createCollection({
    societyId,
    createdBy: userId,
    ...validatedData
  });

  await notifySpecialCollectionCreated({
    societyId,
    collection,
    createdBy: userId
  });

  return collection;
};

// =====================================================
// GET COLLECTIONS
// =====================================================

export const getSpecialCollections = async ({
  societyId,
  role,
  flatId,
  residentId,
  status,
  category
}) => {
  validateObjectId(societyId, "Society ID");

  const collections = await findCollectionsBySociety(societyId, {
    status,
    category
  });

  if (isSecretary(role)) {
    return collections;
  }

  return collections.filter((collection) => {
    if (collection.status === "DRAFT") {
      return false;
    }

    if (collection.audienceType === "ALL_FLATS") {
      return true;
    }

    if (collection.audienceType === "SELECTED_FLATS") {
      return (collection.applicableFlatIds || []).some(
        (id) => normalizeId(id?._id || id) === normalizeId(flatId)
      );
    }

    if (collection.audienceType === "SELECTED_RESIDENTS") {
      return (collection.applicableResidentIds || []).some(
        (id) => normalizeId(id?._id || id) === normalizeId(residentId)
      );
    }

    return false;
  });
};

// =====================================================
// GET SINGLE COLLECTION
// =====================================================

export const getSpecialCollection = async ({
  societyId,
  collectionId,
  role,
  flatId,
  residentId
}) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  /*
   * Secretary can view every collection.
   */
  if (isSecretary(role)) {
    return collection;
  }

  /*
   * Residents cannot open draft collections.
   */
  if (collection.status === "DRAFT") {
    throw new ApiError(403, "SPECIAL_COLLECTION_NOT_AVAILABLE", "This collection is not available");
  }

  /*
   * IMPORTANT:
   *
   * Use the SAME access function used by the
   * resident payment/status APIs.
   *
   * This prevents the collection list and collection
   * detail APIs from having different audience rules.
   */
  ensureResidentCanAccessCollection({
    collection,
    flatId,
    residentId
  });

  return collection;
};

// =====================================================
// UPDATE COLLECTION
// =====================================================

export const updateSpecialCollection = async ({ societyId, collectionId, role, data }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status === "CLOSED" || collection.status === "CANCELLED") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_NOT_EDITABLE",
      "Closed or cancelled collections cannot be edited"
    );
  }

  const validatedData = validateRequest(updateCollectionSchema, data);

  const newStartDate = validatedData.startDate || collection.startDate;

  const newDueDate = validatedData.dueDate || collection.dueDate;

  if (new Date(newDueDate) < new Date(newStartDate)) {
    throw new ApiError(400, "INVALID_COLLECTION_DATES", "Due date cannot be before start date");
  }

  const payments = await findPaymentsByCollection(societyId, collectionId);

  const successfulPaymentExists = payments.some((payment) => payment.status === "SUCCESS");

  if (
    successfulPaymentExists &&
    validatedData.amount !== undefined &&
    Number(validatedData.amount) !== Number(collection.amount)
  ) {
    throw new ApiError(
      400,
      "AMOUNT_CHANGE_NOT_ALLOWED",
      "Amount cannot be changed after a successful payment"
    );
  }

  if (
    successfulPaymentExists &&
    validatedData.audienceType !== undefined &&
    validatedData.audienceType !== collection.audienceType
  ) {
    throw new ApiError(
      400,
      "AUDIENCE_CHANGE_NOT_ALLOWED",
      "Audience cannot be changed after a successful payment"
    );
  }

  if (
    successfulPaymentExists &&
    (validatedData.applicableFlatIds !== undefined ||
      validatedData.applicableResidentIds !== undefined)
  ) {
    throw new ApiError(
      400,
      "AUDIENCE_CHANGE_NOT_ALLOWED",
      "Audience cannot be changed after a successful payment"
    );
  }

  const audienceType = validatedData.audienceType || collection.audienceType;

  const applicableFlatIds =
    validatedData.applicableFlatIds !== undefined
      ? validatedData.applicableFlatIds
      : collection.applicableFlatIds || [];

  const applicableResidentIds =
    validatedData.applicableResidentIds !== undefined
      ? validatedData.applicableResidentIds
      : collection.applicableResidentIds || [];

  await validateAudience({
    societyId,
    audienceType,
    applicableFlatIds,
    applicableResidentIds
  });

  return updateCollection(societyId, collectionId, validatedData);
};

// =====================================================
// ACTIVATE COLLECTION
// =====================================================

export const activateSpecialCollection = async ({ societyId, collectionId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status !== "DRAFT") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_NOT_DRAFT",
      "Only draft collections can be activated"
    );
  }

  if (new Date(collection.dueDate) < new Date()) {
    throw new ApiError(400, "COLLECTION_DUE_DATE_PASSED", "Collection due date has already passed");
  }

  return updateCollection(societyId, collectionId, {
    status: "ACTIVE"
  });
};

// =====================================================
// CLOSE COLLECTION
// =====================================================

export const closeSpecialCollection = async ({ societyId, collectionId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status === "CLOSED") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_ALREADY_CLOSED",
      "Special collection is already closed"
    );
  }

  if (collection.status === "CANCELLED") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_CANCELLED",
      "Cancelled collection cannot be closed"
    );
  }

  return updateCollection(societyId, collectionId, {
    status: "CLOSED"
  });
};

// =====================================================
// CANCEL COLLECTION
// =====================================================

export const cancelSpecialCollection = async ({ societyId, collectionId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status === "CLOSED") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_ALREADY_CLOSED",
      "Closed collection cannot be cancelled"
    );
  }

  if (collection.status === "CANCELLED") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_ALREADY_CANCELLED",
      "Special collection is already cancelled"
    );
  }

  return updateCollection(societyId, collectionId, {
    status: "CANCELLED"
  });
};

// =====================================================
// RESIDENT COLLECTION STATUS
// =====================================================

export const getResidentCollectionStatus = async ({
  societyId,
  collectionId,
  flatId,
  residentId
}) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  validateObjectId(flatId, "Flat ID");

  validateObjectId(residentId, "Resident ID");

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  ensureResidentCanAccessCollection({
    collection,
    flatId,
    residentId
  });

  const payment = await findPaymentByCollectionAndResident(societyId, collectionId, residentId);

  if (payment && payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED") {
    return {
      status: "PAID",
      payment
    };
  }

  const payments = await findPaymentsByResident(societyId, residentId);

  const collectionPayments = payments.filter(
    (item) => normalizeId(item.collectionId?._id || item.collectionId) === normalizeId(collectionId)
  );

  const pendingPayment = collectionPayments.find((item) => item.status === "PENDING");

  if (pendingPayment) {
    return {
      status: "PENDING",
      payment: pendingPayment
    };
  }

  const overdue = collection.dueDate && new Date(collection.dueDate) < new Date();

  return {
    status: overdue ? "OVERDUE" : "PENDING",
    payment: null
  };
};

// =====================================================
// FINANCE INTEGRATION
// =====================================================

const createFinanceIncomeForPayment = async ({ societyId, payment, collection, createdBy }) => {
  const existingFinance = await Finance.findOne({
    societyId,
    sourceType: "SPECIAL_COLLECTION_PAYMENT",
    sourcePaymentId: payment._id
  }).lean();

  if (existingFinance) {
    return existingFinance;
  }

  try {
    return await Finance.create({
      societyId,

      flatId: payment.flatId || null,

      title: `Special Collection - ${collection.title}`,

      description:
        collection.description || `Payment received for special collection: ${collection.title}`,

      amount: Number(payment.amount),

      type: "INCOME",

      category: `Special Collection - ${collection.category}`,

      date: payment.paymentDate || new Date(),

      paymentMethod: payment.paymentMethod,

      documentUrl: payment.receiptDocumentUrl || collection.documentUrl || null,

      createdBy,

      sourceType: "SPECIAL_COLLECTION_PAYMENT",

      sourcePaymentId: payment._id
    });
  } catch (error) {
    if (error?.code === 11000) {
      const concurrentFinance = await Finance.findOne({
        societyId,
        sourceType: "SPECIAL_COLLECTION_PAYMENT",
        sourcePaymentId: payment._id
      }).lean();

      if (concurrentFinance) {
        return concurrentFinance;
      }
    }

    throw error;
  }
};

// =====================================================
// RECORD OFFLINE PAYMENT
// =====================================================

export const recordOfflinePayment = async ({ societyId, userId, role, data }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(userId, "User ID");

  ensureSecretary(role);

  const validatedData = validateRequest(offlinePaymentSchema, data);

  const collection = await findCollectionById(societyId, validatedData.collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_NOT_ACTIVE",
      "Only active collections can receive payments"
    );
  }

  if (Number(validatedData.amount) !== Number(collection.amount)) {
    throw new ApiError(
      400,
      "PAYMENT_AMOUNT_INVALID",
      "Payment amount must match collection amount"
    );
  }

  const successfulPayment = await findPaymentByCollectionAndResident(
    societyId,
    validatedData.collectionId,
    validatedData.residentId
  );

  if (successfulPayment) {
    throw new ApiError(
      400,
      "PAYMENT_ALREADY_COMPLETED",
      "Payment has already been completed for this resident"
    );
  }

  const receiptNumber = `REC-${Date.now()}`;

  const payment = await createPayment({
    societyId,

    collectionId: validatedData.collectionId,

    flatId: validatedData.flatId,

    residentId: validatedData.residentId,

    amount: validatedData.amount,

    paymentMethod: validatedData.paymentMethod,

    paymentDate: validatedData.paymentDate,

    transactionId: validatedData.transactionId || null,

    status: "SUCCESS",

    receiptNumber,

    remarks: validatedData.remarks || "",

    receiptDocumentUrl: validatedData.receiptDocumentUrl || null
  });

  await createFinanceIncomeForPayment({
    societyId,
    payment,
    collection,
    createdBy: userId
  });

  return payment;
};

// =====================================================
// MANUAL REMINDER
// =====================================================

export const sendSpecialCollectionReminder = async ({
  societyId,
  collectionId,
  userId,
  role,
  message
}) => {
  ensureSecretary(role);

  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_NOT_ACTIVE",
      "Reminder can only be sent for an active special collection"
    );
  }

  return notifySpecialCollectionManualReminder({
    societyId,
    collection,
    createdBy: userId,
    message
  });
};

// =====================================================
// REFUND / MANUAL CASH REFUND
// =====================================================

export const refundSpecialCollectionPayment = async ({
  societyId,
  userId,
  role,
  paymentId,
  data
}) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(userId, "User ID");

  validateObjectId(paymentId, "Payment ID");

  ensureSecretary(role);

  const payment = await findPaymentById(societyId, paymentId);

  if (!payment) {
    throw new ApiError(
      404,
      "SPECIAL_COLLECTION_PAYMENT_NOT_FOUND",
      "Special collection payment not found"
    );
  }

  if (payment.status !== "SUCCESS") {
    throw new ApiError(400, "PAYMENT_NOT_SUCCESSFUL", "Only successful payments can be refunded");
  }

  if (payment.refundStatus === "REFUNDED") {
    throw new ApiError(400, "PAYMENT_ALREADY_REFUNDED", "This payment has already been refunded");
  }

  const collection = await findCollectionById(
    societyId,
    payment.collectionId?._id || payment.collectionId
  );

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  if (collection.status !== "CANCELLED") {
    throw new ApiError(
      400,
      "REFUND_REQUIRES_CANCELLED_COLLECTION",
      "Payment can be refunded only after the collection is cancelled"
    );
  }

  const requestedRefundAmount =
    data?.refundAmount === undefined || data?.refundAmount === null || data?.refundAmount === ""
      ? Number(payment.amount)
      : Number(data.refundAmount);

  if (!Number.isFinite(requestedRefundAmount) || requestedRefundAmount <= 0) {
    throw new ApiError(400, "REFUND_AMOUNT_INVALID", "Refund amount must be greater than 0");
  }

  if (requestedRefundAmount > Number(payment.amount)) {
    throw new ApiError(
      400,
      "REFUND_AMOUNT_INVALID",
      "Refund amount cannot be greater than the payment amount"
    );
  }

  if (requestedRefundAmount !== Number(payment.amount)) {
    throw new ApiError(400, "PARTIAL_REFUND_NOT_SUPPORTED", "Only full refunds are supported");
  }

  const refundRemarks = typeof data?.refundRemarks === "string" ? data.refundRemarks.trim() : "";

  /*
   * IMPORTANT:
   *
   * Refunds are MANUAL CASH refunds.
   *
   * Do NOT call Razorpay refund API.
   * Do NOT create a Finance EXPENSE.
   *
   * This only records that the successful payment
   * was manually refunded.
   */

  const refundTransactionId = data?.refundTransactionId || null;

  const updatedPayment = await updatePayment(societyId, payment._id, {
    refundStatus: "REFUNDED",

    refundAmount: requestedRefundAmount,

    refundDate: new Date(),

    refundTransactionId,

    razorpayRefundId: null,

    refundRemarks
  });

  return updatedPayment;
};

// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

export const createSpecialCollectionPaymentOrder = async ({
  societyId,
  userId,
  role,
  flatId,
  residentId,
  data
}) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(userId, "User ID");

  validateObjectId(flatId, "Flat ID");

  validateObjectId(residentId, "Resident ID");

  /*
   * SECRETARY MUST NEVER CREATE AN ONLINE
   * SPECIAL COLLECTION PAYMENT.
   */
  if (isSecretary(role)) {
    throw new ApiError(
      403,
      "SPECIAL_COLLECTION_PAYMENT_FORBIDDEN",
      "Only residents can make online payments"
    );
  }

  const validatedData = validateRequest(createPaymentOrderSchema, data);

  const collection = await findCollectionById(societyId, validatedData.collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  ensureResidentCanAccessCollection({
    collection,
    flatId,
    residentId
  });

  if (collection.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "SPECIAL_COLLECTION_NOT_ACTIVE",
      "This special collection is not active"
    );
  }

  const successfulPayment = await findPaymentByCollectionAndResident(
    societyId,
    validatedData.collectionId,
    residentId
  );

  if (successfulPayment && successfulPayment.refundStatus !== "REFUNDED") {
    throw new ApiError(400, "PAYMENT_ALREADY_COMPLETED", "Payment has already been completed");
  }

  const razorpay = getRazorpayClient();

  const expectedAmount = Math.round(Number(collection.amount) * 100);

  const pendingPayment = await findPendingRazorpayPayment(
    societyId,
    validatedData.collectionId,
    residentId
  );

  if (pendingPayment?.razorpayOrderId) {
    try {
      const existingOrder = await razorpay.orders.fetch(pendingPayment.razorpayOrderId);

      console.log("EXISTING SPECIAL COLLECTION RAZORPAY ORDER:", {
        orderId: existingOrder.id,

        status: existingOrder.status,

        amount: existingOrder.amount,

        amountPaid: existingOrder.amount_paid,

        amountDue: existingOrder.amount_due
      });

      if (existingOrder.status === "created" && Number(existingOrder.amount) === expectedAmount) {
        return {
          paymentId: pendingPayment._id,

          orderId: existingOrder.id,

          amount: existingOrder.amount,

          currency: existingOrder.currency,

          key: process.env.RAZORPAY_KEY_ID
        };
      }

      if (existingOrder.status === "paid" && Number(existingOrder.amount) === expectedAmount) {
        console.log("EXISTING RAZORPAY ORDER IS ALREADY PAID. RECONCILING PAYMENT.");

        let razorpayPayments = [];

        try {
          const paymentResponse = await razorpay.orders.fetchPayments(existingOrder.id);

          razorpayPayments = paymentResponse?.items || [];
        } catch (paymentFetchError) {
          console.error(
            "FAILED TO FETCH PAYMENTS FOR PAID RAZORPAY ORDER:",
            paymentFetchError?.error || paymentFetchError?.message || paymentFetchError
          );
        }

        const capturedPayment = razorpayPayments.find(
          (payment) =>
            Number(payment.amount) === expectedAmount &&
            (payment.status === "captured" || payment.status === "authorized")
        );

        if (capturedPayment) {
          const receiptNumber = `REC-${Date.now()}`;

          const paymentMethod = getStoredRazorpayPaymentMethod(capturedPayment);

          const updatedPayment = await updatePayment(societyId, pendingPayment._id, {
            status: "SUCCESS",

            paymentMethod,

            receiptNumber,

            razorpayPaymentId: capturedPayment.id,

            transactionId: capturedPayment.id,

            paymentDate: capturedPayment.created_at
              ? new Date(capturedPayment.created_at * 1000)
              : new Date()
          });

          await createFinanceIncomeForPayment({
            societyId,

            payment: updatedPayment,

            collection,

            createdBy: userId
          });

          throw new ApiError(
            400,
            "PAYMENT_ALREADY_COMPLETED",
            "This Razorpay payment was already completed. Your payment status has been updated."
          );
        }

        throw new ApiError(
          400,
          "RAZORPAY_PAYMENT_REQUIRES_REVIEW",
          "The Razorpay order is marked as paid, but the payment details could not be verified automatically."
        );
      }

      console.log("EXISTING RAZORPAY ORDER CANNOT BE REUSED. CREATING A NEW ORDER.");
    } catch (error) {
      if (
        error?.code === "PAYMENT_ALREADY_COMPLETED" ||
        error?.code === "RAZORPAY_PAYMENT_REQUIRES_REVIEW"
      ) {
        throw error;
      }

      console.log(
        "COULD NOT FETCH EXISTING RAZORPAY ORDER. CREATING A NEW ORDER.",
        error?.error || error?.message || error
      );
    }

    const newOrder = await razorpay.orders.create({
      amount: expectedAmount,

      currency: "INR",

      receipt: `SC-${Date.now()}`,

      notes: {
        societyId: String(societyId),

        collectionId: String(validatedData.collectionId),

        residentId: String(residentId)
      }
    });

    const updatedPayment = await updatePayment(societyId, pendingPayment._id, {
      amount: Number(collection.amount),

      paymentDate: new Date(),

      razorpayOrderId: newOrder.id,

      status: "PENDING"
    });

    return {
      paymentId: updatedPayment._id,

      orderId: newOrder.id,

      amount: newOrder.amount,

      currency: newOrder.currency,

      key: process.env.RAZORPAY_KEY_ID
    };
  }

  const order = await razorpay.orders.create({
    amount: expectedAmount,

    currency: "INR",

    receipt: `SC-${Date.now()}`,

    notes: {
      societyId: String(societyId),

      collectionId: String(validatedData.collectionId),

      residentId: String(residentId)
    }
  });

  const payment = await createPayment({
    societyId,

    collectionId: validatedData.collectionId,

    flatId,

    residentId,

    amount: Number(collection.amount),

    paymentMethod: "RAZORPAY",

    paymentDate: new Date(),

    razorpayOrderId: order.id,

    status: "PENDING"
  });

  return {
    paymentId: payment._id,

    orderId: order.id,

    amount: order.amount,

    currency: order.currency,

    key: process.env.RAZORPAY_KEY_ID
  };
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

export const verifySpecialCollectionPayment = async ({
  societyId,
  userId,
  role,
  flatId,
  residentId,
  data
}) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(userId, "User ID");

  validateObjectId(flatId, "Flat ID");

  validateObjectId(residentId, "Resident ID");

  /*
   * SECRETARY MUST NEVER VERIFY/COMPLETE
   * AN ONLINE SPECIAL COLLECTION PAYMENT.
   */
  if (isSecretary(role)) {
    throw new ApiError(
      403,
      "SPECIAL_COLLECTION_PAYMENT_FORBIDDEN",
      "Only residents can verify online payments"
    );
  }

  const validatedData = validateRequest(verifyPaymentSchema, data);

  const collection = await findCollectionById(societyId, validatedData.collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  /*
   * Make sure the resident is actually part
   * of this collection before verifying payment.
   */
  ensureResidentCanAccessCollection({
    collection,
    flatId,
    residentId
  });

  const paymentRecord = await findPaymentByRazorpayOrderId(
    societyId,
    validatedData.razorpay_order_id
  );

  if (!paymentRecord) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment record not found");
  }

  if (normalizeId(paymentRecord.collectionId) !== normalizeId(validatedData.collectionId)) {
    throw new ApiError(
      400,
      "PAYMENT_COLLECTION_MISMATCH",
      "Payment does not belong to this collection"
    );
  }

  if (normalizeId(paymentRecord.residentId) !== normalizeId(residentId)) {
    throw new ApiError(
      403,
      "PAYMENT_RESIDENT_MISMATCH",
      "Payment does not belong to this resident"
    );
  }

  if (paymentRecord.paymentMethod !== "RAZORPAY") {
    throw new ApiError(400, "PAYMENT_METHOD_INVALID", "Payment record is not a Razorpay payment");
  }

  if (paymentRecord.status === "SUCCESS") {
    return paymentRecord;
  }

  const crypto = await import("crypto");

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${validatedData.razorpay_order_id}|${validatedData.razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== validatedData.razorpay_signature) {
    await updatePayment(societyId, paymentRecord._id, {
      status: "FAILED",

      razorpayPaymentId: validatedData.razorpay_payment_id
    });

    throw new ApiError(400, "RAZORPAY_SIGNATURE_INVALID", "Razorpay payment signature is invalid");
  }

  const razorpay = getRazorpayClient();

  let paymentMethod = "RAZORPAY";

  try {
    const razorpayPayment = await razorpay.payments.fetch(validatedData.razorpay_payment_id);

    console.log("RAZORPAY PAYMENT DETAILS:", {
      id: razorpayPayment?.id,

      method: razorpayPayment?.method,

      status: razorpayPayment?.status
    });

    paymentMethod = getStoredRazorpayPaymentMethod(razorpayPayment);
  } catch (error) {
    console.error(
      "FAILED TO FETCH RAZORPAY PAYMENT METHOD:",
      error?.error || error?.message || error
    );
  }

  const receiptNumber = `REC-${Date.now()}`;

  const updatedPayment = await updatePayment(societyId, paymentRecord._id, {
    status: "SUCCESS",

    paymentMethod,

    receiptNumber,

    razorpayPaymentId: validatedData.razorpay_payment_id,

    transactionId: validatedData.razorpay_payment_id,

    paymentDate: new Date()
  });

  await createFinanceIncomeForPayment({
    societyId,

    payment: updatedPayment,

    collection,

    createdBy: userId
  });

  return updatedPayment;
};

// =====================================================
// MY PAYMENTS
// =====================================================

export const getMySpecialCollectionPayments = async ({ societyId, residentId }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(residentId, "Resident ID");

  return findPaymentsByResident(societyId, residentId);
};

// =====================================================
// FLAT PAYMENTS
// =====================================================

export const getFlatSpecialCollectionPayments = async ({ societyId, flatId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(flatId, "Flat ID");

  ensureSecretary(role);

  return findPaymentsByFlat(societyId, flatId);
};

// =====================================================
// BUILD COLLECTION TRACKING TARGETS
// =====================================================

const getCollectionTrackingTargets = async ({ societyId, collection }) => {
  const members = await findActiveMembersBySociety(societyId);

  const membersByFlat = new Map();

  for (const member of members) {
    const flatId = member.flatId?._id || member.flatId;

    if (!flatId) {
      continue;
    }

    const key = normalizeId(flatId);

    if (!membersByFlat.has(key)) {
      membersByFlat.set(key, member);
    }
  }

  if (collection.audienceType === "ALL_FLATS") {
    const flats = await Flat.find({
      societyId
    })
      .select("_id flatNumber floor wing")
      .lean();

    return flats.map((flat) => {
      const flatKey = normalizeId(flat._id);

      return {
        key: `flat:${flatKey}`,

        flat,

        member: membersByFlat.get(flatKey) || null
      };
    });
  }

  if (collection.audienceType === "SELECTED_FLATS") {
    const selectedFlatIds = collection.applicableFlatIds || [];

    const targets = [];

    const selectedKeys = new Set();

    for (const flat of selectedFlatIds) {
      const flatId = flat?._id || flat;

      const flatKey = normalizeId(flatId);

      if (selectedKeys.has(flatKey)) {
        continue;
      }

      selectedKeys.add(flatKey);

      let flatData = flat;

      if (!flat?.flatNumber) {
        const foundFlat = await Flat.findOne({
          _id: flatId,
          societyId
        })
          .select("_id flatNumber floor wing")
          .lean();

        if (foundFlat) {
          flatData = foundFlat;
        }
      }

      targets.push({
        key: `flat:${flatKey}`,

        flat: flatData,

        member: membersByFlat.get(flatKey) || null
      });
    }

    return targets;
  }

  if (collection.audienceType === "SELECTED_RESIDENTS") {
    const selectedResidentIds = new Set(
      (collection.applicableResidentIds || []).map((id) => normalizeId(id?._id || id))
    );

    return members
      .filter((member) => selectedResidentIds.has(normalizeId(member._id)))
      .map((member) => ({
        key: `resident:${normalizeId(member._id)}`,

        member,

        flat: member.flatId || null
      }));
  }

  return [];
};

// =====================================================
// COLLECTION PAYMENTS / TRACKING
// =====================================================

export const getSpecialCollectionPayments = async ({ societyId, collectionId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  const payments = await findPaymentsByCollection(societyId, collectionId);

  const actualPayments = payments.map((payment) => ({
    _id: payment._id,

    residentId: payment.residentId,

    flatId: payment.flatId,

    amount: Number(payment.amount || 0),

    paymentMethod: payment.paymentMethod || null,

    status: payment.status,

    paymentDate: payment.paymentDate || null,

    receiptNumber: payment.receiptNumber || null,

    transactionId: payment.transactionId || null,

    refundStatus: payment.refundStatus || "NONE",

    refundAmount: Number(payment.refundAmount || 0),

    refundDate: payment.refundDate || null,

    refundTransactionId: payment.refundTransactionId || null,

    razorpayRefundId: payment.razorpayRefundId || null,

    refundRemarks: payment.refundRemarks || ""
  }));

  if (collection.status === "CANCELLED" || collection.status === "CLOSED") {
    return actualPayments;
  }

  const targets = await getCollectionTrackingTargets({
    societyId,
    collection
  });

  const latestPaymentMap = new Map();

  for (const payment of payments) {
    let key = null;

    if (collection.audienceType === "SELECTED_RESIDENTS") {
      const residentId = payment.residentId?._id || payment.residentId;

      if (residentId) {
        key = `resident:${normalizeId(residentId)}`;
      }
    } else {
      const flatId = payment.flatId?._id || payment.flatId;

      if (flatId) {
        key = `flat:${normalizeId(flatId)}`;
      }
    }

    if (!key) {
      continue;
    }

    const existing = latestPaymentMap.get(key);

    if (!existing) {
      latestPaymentMap.set(key, payment);

      continue;
    }

    const existingDate = new Date(existing.createdAt || existing.paymentDate || 0);

    const currentDate = new Date(payment.createdAt || payment.paymentDate || 0);

    if (currentDate > existingDate) {
      latestPaymentMap.set(key, payment);
    }
  }

  const today = new Date();

  const currentRecords = targets.map((target) => {
    const payment = latestPaymentMap.get(target.key);

    if (payment && payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED") {
      return {
        _id: payment._id,

        residentId: payment.residentId || target.member || null,

        flatId: payment.flatId || target.flat || null,

        amount: Number(payment.amount || collection.amount || 0),

        paymentMethod: payment.paymentMethod || null,

        status: "SUCCESS",

        paymentDate: payment.paymentDate || null,

        receiptNumber: payment.receiptNumber || null,

        transactionId: payment.transactionId || null,

        refundStatus: payment.refundStatus || "NONE",

        refundAmount: Number(payment.refundAmount || 0),

        refundDate: payment.refundDate || null,

        refundTransactionId: payment.refundTransactionId || null,

        razorpayRefundId: payment.razorpayRefundId || null,

        refundRemarks: payment.refundRemarks || ""
      };
    }

    if (payment && payment.status === "SUCCESS" && payment.refundStatus === "REFUNDED") {
      let status = "PENDING";

      if (collection.dueDate && new Date(collection.dueDate) < today) {
        status = "OVERDUE";
      }

      return {
        _id: `pending-${target.key}`,

        residentId: target.member || payment.residentId || null,

        flatId: target.flat || payment.flatId || null,

        amount: Number(collection.amount || 0),

        paymentMethod: null,

        status,

        paymentDate: null,

        receiptNumber: null,

        transactionId: null,

        refundStatus: "NONE",

        refundAmount: 0,

        refundDate: null,

        refundTransactionId: null,

        razorpayRefundId: null,

        refundRemarks: ""
      };
    }

    if (payment && payment.status === "PENDING") {
      let status = "PENDING";

      if (collection.dueDate && new Date(collection.dueDate) < today) {
        status = "OVERDUE";
      }

      return {
        _id: payment._id,

        residentId: payment.residentId || target.member || null,

        flatId: payment.flatId || target.flat || null,

        amount: Number(payment.amount || collection.amount || 0),

        paymentMethod: payment.paymentMethod || null,

        status,

        paymentDate: payment.paymentDate || null,

        receiptNumber: payment.receiptNumber || null,

        transactionId: payment.transactionId || null,

        refundStatus: payment.refundStatus || "NONE",

        refundAmount: Number(payment.refundAmount || 0),

        refundDate: payment.refundDate || null,

        refundTransactionId: payment.refundTransactionId || null,

        razorpayRefundId: payment.razorpayRefundId || null,

        refundRemarks: payment.refundRemarks || ""
      };
    }

    if (payment && payment.status === "FAILED") {
      return {
        _id: payment._id,

        residentId: payment.residentId || target.member || null,

        flatId: payment.flatId || target.flat || null,

        amount: Number(payment.amount || collection.amount || 0),

        paymentMethod: payment.paymentMethod || null,

        status: "FAILED",

        paymentDate: payment.paymentDate || null,

        receiptNumber: payment.receiptNumber || null,

        transactionId: payment.transactionId || null,

        refundStatus: payment.refundStatus || "NONE",

        refundAmount: Number(payment.refundAmount || 0),

        refundDate: payment.refundDate || null,

        refundTransactionId: payment.refundTransactionId || null,

        razorpayRefundId: payment.razorpayRefundId || null,

        refundRemarks: payment.refundRemarks || ""
      };
    }

    let status = "PENDING";

    if (collection.dueDate && new Date(collection.dueDate) < today) {
      status = "OVERDUE";
    }

    return {
      _id: `pending-${target.key}`,

      residentId: target.member || null,

      flatId: target.flat || target.member?.flatId || null,

      amount: Number(collection.amount || 0),

      paymentMethod: null,

      status,

      paymentDate: null,

      receiptNumber: null,

      transactionId: null,

      refundStatus: "NONE",

      refundAmount: 0,

      refundDate: null,

      refundTransactionId: null,

      razorpayRefundId: null,

      refundRemarks: ""
    };
  });

  const currentPaymentIds = new Set(
    currentRecords
      .filter((record) => !String(record._id).startsWith("pending-"))
      .map((record) => normalizeId(record._id))
  );

  const historicalRecords = actualPayments.filter(
    (payment) => !currentPaymentIds.has(normalizeId(payment._id))
  );

  return [...currentRecords, ...historicalRecords];
};

// =====================================================
// COLLECTION SUMMARY
// =====================================================

export const getSpecialCollectionSummary = async ({ societyId, collectionId, role }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  ensureSecretary(role);

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  const trackingRecords = await getSpecialCollectionPayments({
    societyId,
    collectionId,
    role
  });

  let applicableCount = 0;

  if (collection.audienceType === "ALL_FLATS") {
    applicableCount = await Flat.countDocuments({
      societyId
    });
  }

  if (collection.audienceType === "SELECTED_FLATS") {
    applicableCount = new Set(
      (collection.applicableFlatIds || []).map((id) => normalizeId(id?._id || id))
    ).size;
  }

  if (collection.audienceType === "SELECTED_RESIDENTS") {
    applicableCount = new Set(
      (collection.applicableResidentIds || []).map((id) => normalizeId(id?._id || id))
    ).size;
  }

  const collectionAmount = Number(collection.amount || 0);

  const expectedAmount = collectionAmount * applicableCount;

  let currentRecords = trackingRecords;

  if (collection.status !== "CLOSED" && collection.status !== "CANCELLED") {
    const targets = await getCollectionTrackingTargets({
      societyId,
      collection
    });

    currentRecords = trackingRecords.slice(0, targets.length);
  }

  const successfulPayments = currentRecords.filter(
    (payment) => payment.status === "SUCCESS" && payment.refundStatus !== "REFUNDED"
  );

  const pendingPayments = currentRecords.filter((payment) => payment.status === "PENDING");

  const overduePayments = currentRecords.filter((payment) => payment.status === "OVERDUE");

  const failedPayments = currentRecords.filter((payment) => payment.status === "FAILED");

  const refundedPayments = trackingRecords.filter(
    (payment) => payment.status === "SUCCESS" && payment.refundStatus === "REFUNDED"
  );

  const paidCount = successfulPayments.length;

  const pendingCount = pendingPayments.length;

  const overdueCount = overduePayments.length;

  const failedCount = failedPayments.length;

  const refundedCount = refundedPayments.length;

  const collectedAmount = successfulPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const pendingAmount = collectionAmount * pendingCount;

  const overdueAmount = collectionAmount * overdueCount;

  const refundedAmount = refundedPayments.reduce(
    (total, payment) => total + Number(payment.refundAmount || 0),
    0
  );

  const progressPercentage =
    expectedAmount > 0
      ? Math.min(100, Number(((collectedAmount / expectedAmount) * 100).toFixed(2)))
      : 0;

  return {
    collectionId: collection._id,

    title: collection.title,

    status: collection.status,

    audienceType: collection.audienceType,

    amount: collectionAmount,

    applicableCount,

    expectedAmount,

    collectedAmount,

    pendingAmount,

    overdueAmount,

    refundedAmount,

    paidCount,

    pendingCount,

    overdueCount,

    failedCount,

    refundedCount,

    progressPercentage,

    totalRecords: trackingRecords.length
  };
};

// =====================================================
// SINGLE PAYMENT
// =====================================================

export const getSpecialCollectionPayment = async ({ societyId, paymentId, role, residentId }) => {
  validateObjectId(societyId, "Society ID");

  validateObjectId(paymentId, "Payment ID");

  validateObjectId(residentId, "Resident ID");

  const payment = await findPaymentById(societyId, paymentId);

  if (!payment) {
    throw new ApiError(
      404,
      "SPECIAL_COLLECTION_PAYMENT_NOT_FOUND",
      "Special collection payment not found"
    );
  }

  if (isSecretary(role)) {
    return payment;
  }

  if (normalizeId(payment.residentId?._id || payment.residentId) !== normalizeId(residentId)) {
    throw new ApiError(
      403,
      "SPECIAL_COLLECTION_PAYMENT_FORBIDDEN",
      "You can only view your own payment"
    );
  }

  return payment;
};

// =====================================================
// SPECIAL COLLECTION REPORT - CSV
// =====================================================

export const getSpecialCollectionReport = async ({ societyId, collectionId, role }) => {
  ensureSecretary(role);

  validateObjectId(societyId, "Society ID");

  validateObjectId(collectionId, "Collection ID");

  const collection = await findCollectionById(societyId, collectionId);

  if (!collection) {
    throw new ApiError(404, "SPECIAL_COLLECTION_NOT_FOUND", "Special collection not found");
  }

  const payments = await findPaymentsByCollection(societyId, collectionId);

  const rows = [
    [
      "Collection",
      "Resident",
      "Flat",
      "Amount",
      "Payment Date",
      "Payment Method",
      "Transaction ID",
      "Status"
    ]
  ];

  payments.forEach((payment) => {
    rows.push([
      collection.title,

      payment.residentId?.userId?.name || payment.residentId?.name || "",

      payment.flatId?.flatNumber || "",

      payment.amount || 0,

      payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : "",

      payment.paymentMethod || "",

      payment.transactionId || "",

      payment.status || ""
    ]);
  });

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return {
    fileName: `${collection.title.replace(/[^a-z0-9]/gi, "_")}_report.csv`,

    csv
  };
};
