import asyncHandler from "../../utils/asyncHandler.js";

import {
  createFinance,
  deleteFinance,
  getFinanceRecord,
  getFinanceRecords,
  getSummary,
  updateFinance
} from "./finance.service.js";

export const getFinanceRecordsController = asyncHandler(async (req, res) => {
  const records = await getFinanceRecords({
    societyId: req.params.societyId,
    type: req.query.type,
    category: req.query.category,
    search: req.query.search
  });

  return res.status(200).json({
    success: true,
    code: "FINANCE_RECORDS_FETCHED",
    message: "Finance records fetched successfully",
    data: {
      records
    }
  });
});

export const getFinanceRecordController = asyncHandler(async (req, res) => {
  const record = await getFinanceRecord({
    societyId: req.params.societyId,
    financeId: req.params.financeId
  });

  return res.status(200).json({
    success: true,
    code: "FINANCE_RECORD_FETCHED",
    message: "Finance record fetched successfully",
    data: {
      record
    }
  });
});

export const getFinanceSummaryController = asyncHandler(async (req, res) => {
  const summary = await getSummary({
    societyId: req.params.societyId
  });

  return res.status(200).json({
    success: true,
    code: "FINANCE_SUMMARY_FETCHED",
    message: "Finance summary fetched successfully",
    data: {
      summary
    }
  });
});

export const createFinanceController = asyncHandler(async (req, res) => {
  const record = await createFinance({
    societyId: req.params.societyId,
    userId: req.user.id,
    data: req.body
  });

  return res.status(201).json({
    success: true,
    code: "FINANCE_CREATED",
    message: "Finance record created successfully",
    data: {
      record
    }
  });
});

export const updateFinanceController = asyncHandler(async (req, res) => {
  const record = await updateFinance({
    societyId: req.params.societyId,
    financeId: req.params.financeId,
    data: req.body
  });

  return res.status(200).json({
    success: true,
    code: "FINANCE_UPDATED",
    message: "Finance record updated successfully",
    data: {
      record
    }
  });
});

export const deleteFinanceController = asyncHandler(async (req, res) => {
  await deleteFinance({
    societyId: req.params.societyId,
    financeId: req.params.financeId
  });

  return res.status(200).json({
    success: true,
    code: "FINANCE_DELETED",
    message: "Finance record deleted successfully"
  });
});
