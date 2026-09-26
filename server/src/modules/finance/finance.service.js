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

// =====================================================
// CREATE FINANCE RECORD
// =====================================================

export const createFinance = async ({ societyId, userId, data }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const errors = validateFinanceCreate(data);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "FINANCE_VALIDATION_ERROR", "Invalid finance data", errors);
  }

  const amount = Number(data.amount);

  // Prevent society balance from becoming negative.
  if (data.type === "EXPENSE") {
    const summary = await getFinanceSummary(societyId);

    const currentBalance = Number(summary.currentBalance || 0);

    if (currentBalance < amount) {
      throw new ApiError(
        400,
        "INSUFFICIENT_FUNDS",
        `Insufficient funds. Current balance is ₹${currentBalance.toFixed(
          2
        )}, but this expense is ₹${amount.toFixed(2)}.`
      );
    }
  }

  return createFinanceRecord({
    societyId,
    createdBy: userId,
    flatId: data.flatId || null,
    title: data.title,
    description: data.description || "",
    amount,
    type: data.type,
    category: data.category,
    date: data.date,
    paymentMethod: data.paymentMethod,
    documentUrl: data.documentUrl || null
  });
};

// =====================================================
// UPDATE FINANCE RECORD
// =====================================================

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

  // Finance records automatically created from maintenance
  // payments should not be manually edited.
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

  /*
   * Check the balance after applying the update.
   *
   * Example:
   *
   * Current balance = ₹10,000
   * Existing expense = ₹2,000
   * New expense = ₹5,000
   *
   * Result:
   * ₹10,000 - (-₹2,000) + (-₹5,000)
   * = ₹7,000
   */

  const resultingType = updateData.type || existingFinance.type;

  const resultingAmount =
    updateData.amount !== undefined ? updateData.amount : Number(existingFinance.amount);

  const summary = await getFinanceSummary(societyId);

  const currentBalance = Number(summary.currentBalance || 0);

  // Existing transaction's effect on balance.
  // Income = positive
  // Expense = negative
  const oldEffect =
    existingFinance.type === "EXPENSE"
      ? -Number(existingFinance.amount)
      : Number(existingFinance.amount);

  // New transaction's effect on balance.
  const newEffect = resultingType === "EXPENSE" ? -resultingAmount : resultingAmount;

  // Remove the old transaction effect and apply the new effect.
  const resultingBalance = currentBalance - oldEffect + newEffect;

  if (resultingBalance < 0) {
    throw new ApiError(
      400,
      "INSUFFICIENT_FUNDS",
      `Insufficient funds. This update would make the society balance negative (₹${resultingBalance.toFixed(
        2
      )}).`
    );
  }

  const finance = await updateFinanceRecord(financeId, societyId, updateData);

  if (!finance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  return finance;
};

// =====================================================
// DELETE FINANCE RECORD
// =====================================================

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

  // Maintenance-generated Finance records cannot be deleted manually.
  if (existingFinance.sourceType === "MAINTENANCE_PAYMENT") {
    throw new ApiError(
      400,
      "MAINTENANCE_FINANCE_PROTECTED",
      "Maintenance finance records cannot be deleted"
    );
  }

  /*
   * Deleting an expense increases the balance,
   * so it can always be deleted.
   *
   * Deleting an income decreases the balance.
   * Therefore, make sure the resulting balance
   * does not become negative.
   */
  if (existingFinance.type === "INCOME") {
    const summary = await getFinanceSummary(societyId);

    const currentBalance = Number(summary.currentBalance || 0);

    const resultingBalance = currentBalance - Number(existingFinance.amount);

    if (resultingBalance < 0) {
      throw new ApiError(
        400,
        "INSUFFICIENT_FUNDS",
        `This income cannot be deleted because it would make the society balance negative (₹${resultingBalance.toFixed(
          2
        )}).`
      );
    }
  }

  const finance = await deleteFinanceRecord(financeId, societyId);

  if (!finance) {
    throw new ApiError(404, "FINANCE_NOT_FOUND", "Finance record not found");
  }

  return finance;
};

// =====================================================
// GET FINANCE SUMMARY
// =====================================================

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

  // Only successful maintenance payments
  // should create Finance income.
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
