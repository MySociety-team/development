import mongoose from "mongoose";

import ApiError from "../../utils/ApiError.js";

import {
  createFinanceRecord,
  deleteFinanceRecord,
  findFinanceById,
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
