import mongoose from "mongoose";

import ApiError from "../../utils/ApiError.js";

import {
  createFinanceRecord,
  deleteFinanceRecord,
  findFinanceById,
  findFinanceBySourcePaymentId,
  findFinanceRecordsBySociety,
  getFinanceSummary,
  updateFinanceRecord
} from "./finance.repository.js";

import { validateFinanceCreate, validateFinanceUpdate } from "./finance.validation.js";

export const getFinanceRecords = async ({ societyId, type, category, search }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  return findFinanceRecordsBySociety(societyId, {
    type,
    category,
    search
  });
};

export const getFinanceRecord = async ({ societyId, financeId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(financeId)) {
    throw new ApiError(400, "FINANCE_ID_INVALID", "Finance ID is invalid");
  }

  const finance = await findFinanceById(financeId, societyId);

  if (!finance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  return finance;
};

export const createFinance = async ({ societyId, userId, data }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const errors = validateFinanceCreate(data);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "FINANCE_VALIDATION_ERROR", "Invalid finance data", errors);
  }

  return createFinanceRecord({
    societyId,
    createdBy: userId,
    flatId: data.flatId || null,
    title: data.title,
    description: data.description || "",
    amount: Number(data.amount),
    type: data.type,
    category: data.category,
    date: data.date,
    paymentMethod: data.paymentMethod,
    documentUrl: data.documentUrl || null
  });
};

export const updateFinance = async ({ societyId, financeId, data }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(financeId)) {
    throw new ApiError(400, "FINANCE_ID_INVALID", "Finance ID is invalid");
  }
  const existingFinance = await findFinanceById(financeId, societyId);

  if (!existingFinance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  if (existingFinance.sourceType === "MAINTENANCE_PAYMENT") {
    throw new ApiError(
      400,
      "MAINTENANCE_FINANCE_PROTECTED",
      "Maintenance finance records cannot be edited"
    );
  }
  const errors = validateFinanceUpdate(data);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "FINANCE_VALIDATION_ERROR", "Invalid finance data", errors);
  }

  const updateData = { ...data };

  if (updateData.amount !== undefined) {
    updateData.amount = Number(updateData.amount);
  }

  const finance = await updateFinanceRecord(financeId, societyId, updateData);

  if (!finance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  return finance;
};

export const deleteFinance = async ({ societyId, financeId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  if (!mongoose.isValidObjectId(financeId)) {
    throw new ApiError(400, "FINANCE_ID_INVALID", "Finance ID is invalid");
  }

  const existingFinance = await findFinanceById(financeId, societyId);

  if (!existingFinance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  if (existingFinance.sourceType === "MAINTENANCE_PAYMENT") {
    throw new ApiError(
      400,
      "MAINTENANCE_FINANCE_PROTECTED",
      "Maintenance finance records cannot be deleted"
    );
  }

  const finance = await deleteFinanceRecord(financeId, societyId);

  if (!finance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  return finance;
};

export const getSummary = async ({ societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  return getFinanceSummary(societyId);
};

// =====================================================
// CREATE FINANCE INCOME FROM MAINTENANCE PAYMENT
// =====================================================

export const createMaintenanceIncome = async ({ societyId, payment, bill, userId }) => {
  if (!payment) {
    throw new ApiError(400, "MAINTENANCE_PAYMENT_REQUIRED", "Maintenance payment is required");
  }

  if (!bill) {
    throw new ApiError(400, "MAINTENANCE_BILL_REQUIRED", "Maintenance bill is required");
  }

  if (payment.status !== "SUCCESS") {
    throw new ApiError(
      400,
      "MAINTENANCE_PAYMENT_NOT_SUCCESS",
      "Only successful maintenance payments can create Finance income"
    );
  }

  // Check whether this MaintenancePayment has
  // already created a Finance record.
  const existingFinance = await findFinanceBySourcePaymentId(payment._id);

  if (existingFinance) {
    return existingFinance;
  }

  const month = bill.month || "Maintenance";

  try {
    return await createFinanceRecord({
      societyId,
      flatId: payment.flatId || null,
      title: `Maintenance Collection - ${month}`,
      description:
        payment.paymentMethod === "RAZORPAY"
          ? `Maintenance payment received via Razorpay for ${month}`
          : `Maintenance payment received via ${payment.paymentMethod} for ${month}`,
      amount: Number(payment.amount),
      type: "INCOME",
      category: "Maintenance",
      date: payment.paymentDate || new Date(),
      paymentMethod: payment.paymentMethod,
      documentUrl: null,
      createdBy: userId,
      sourceType: "MAINTENANCE_PAYMENT",
      sourcePaymentId: payment._id
    });
  } catch (error) {
    // If another request created the Finance record
    // at the same time, return that record instead
    // of creating a duplicate.
    if (error?.code === 11000) {
      const concurrentFinance = await findFinanceBySourcePaymentId(payment._id);

      if (concurrentFinance) {
        return concurrentFinance;
      }
    }

    throw error;
  }
};
