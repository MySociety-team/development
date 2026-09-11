import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";
import Flat from "../../models/Flat.js";

import {
  createBill,
  findPaymentById,
  createBills,
  findBillById,
  findBillByIdWithDetails,
  findBillByFlatAndMonth,
  findBillsBySocietyAndMonth,
  findCurrentBill,
  findBillsByFlat,
  updateBill,
  updateBillStatus,
  createPayment,
  findPaymentByBillId,
  findPaymentsByFlat,
  findPaymentsBySociety,
  getDashboardStats
} from "./maintenance.repository.js";

const calculateTotalAmount = (maintenanceAmount, lateFee = 0) => {
  return maintenanceAmount + lateFee;
};

const validateBillOwnership = async (billId, societyId) => {
  if (!mongoose.isValidObjectId(billId)) {
    throw new ApiError(400, "BILL_ID_INVALID", "Maintenance bill ID is invalid");
  }

  const bill = await findBillById(billId);

  if (!bill) {
    throw new ApiError(404, "MAINTENANCE_BILL_NOT_FOUND", "Maintenance bill not found");
  }

  if (bill.societyId.toString() !== societyId.toString()) {
    throw new ApiError(
      403,
      "MAINTENANCE_BILL_FORBIDDEN",
      "This bill does not belong to your society"
    );
  }

  return bill;
};

const createMaintenanceBill = async ({
  societyId,
  userId,
  flatId,
  month,
  maintenanceAmount,
  dueDate,
  lateFee = 0,
  adjustmentReason
}) => {
  const flat = await Flat.findOne({
    _id: flatId,
    societyId
  });

  if (!flat) {
    throw new ApiError(404, "FLAT_NOT_FOUND", "Flat not found in this society");
  }

  const existingBill = await findBillByFlatAndMonth(societyId, flatId, month);

  if (existingBill) {
    throw new ApiError(
      409,
      "MAINTENANCE_BILL_EXISTS",
      "A maintenance bill already exists for this flat and month"
    );
  }

  const totalAmount = calculateTotalAmount(maintenanceAmount, lateFee);

  return createBill({
    societyId,
    flatId,
    month,
    maintenanceAmount,
    dueDate,
    lateFee,
    totalAmount,
    status: "PENDING",
    adjustmentReason,
    createdBy: userId
  });
};

const generateMonthlyBills = async ({
  societyId,
  userId,
  month,
  dueDate,
  defaultMaintenanceAmount,
  lateFee = 0
}) => {
  const flats = await Flat.find({
    societyId
  }).sort({
    flatNumber: 1
  });

  if (!flats.length) {
    throw new ApiError(404, "NO_FLATS_FOUND", "No flats found in this society");
  }

  const existingBills = await findBillsBySocietyAndMonth(societyId, month);

  const existingFlatIds = new Set(existingBills.map((bill) => bill.flatId._id.toString()));

  const billsToCreate = flats
    .filter((flat) => !existingFlatIds.has(flat._id.toString()))
    .map((flat) => ({
      societyId,
      flatId: flat._id,
      month,
      maintenanceAmount: defaultMaintenanceAmount,
      dueDate,
      lateFee,
      totalAmount: calculateTotalAmount(defaultMaintenanceAmount, lateFee),
      status: "PENDING",
      createdBy: userId
    }));

  if (!billsToCreate.length) {
    throw new ApiError(
      409,
      "MONTHLY_BILLS_ALREADY_GENERATED",
      "Maintenance bills have already been generated for all flats for this month"
    );
  }

  return createBills(billsToCreate);
};

const getMaintenanceBill = async ({ societyId, billId }) => {
  await validateBillOwnership(billId, societyId);

  return findBillByIdWithDetails(billId);
};

const getCurrentMaintenanceBill = async ({ societyId, flatId }) => {
  const bill = await findCurrentBill(societyId, flatId);

  if (!bill) {
    throw new ApiError(404, "MAINTENANCE_BILL_NOT_FOUND", "No maintenance bill found");
  }

  return bill;
};

const getMaintenanceHistory = async ({ societyId, flatId }) => {
  return findBillsByFlat(societyId, flatId);
};

const updateMaintenanceBill = async ({
  societyId,
  billId,
  maintenanceAmount,
  dueDate,
  lateFee,
  adjustmentReason
}) => {
  const bill = await validateBillOwnership(billId, societyId);

  if (bill.status === "PAID") {
    throw new ApiError(
      400,
      "PAID_BILL_CANNOT_BE_EDITED",
      "A paid maintenance bill cannot be edited"
    );
  }

  const updates = {};

  if (maintenanceAmount !== undefined) {
    updates.maintenanceAmount = maintenanceAmount;
  }

  if (dueDate !== undefined) {
    updates.dueDate = dueDate;
  }

  if (lateFee !== undefined) {
    updates.lateFee = lateFee;
  }

  if (maintenanceAmount !== undefined || lateFee !== undefined) {
    updates.totalAmount = calculateTotalAmount(
      maintenanceAmount !== undefined ? maintenanceAmount : bill.maintenanceAmount,
      lateFee !== undefined ? lateFee : bill.lateFee
    );
  }

  if (adjustmentReason !== undefined) {
    updates.adjustmentReason = adjustmentReason;
  }

  return updateBill(billId, updates);
};

const markOverdueBills = async ({ societyId, month }) => {
  const bills = await findBillsBySocietyAndMonth(societyId, month);

  const now = new Date();
  const overdueBills = [];

  for (const bill of bills) {
    if (bill.status !== "PAID" && new Date(bill.dueDate) < now) {
      await updateBillStatus(bill._id, "OVERDUE");

      overdueBills.push(bill._id);
    }
  }

  return {
    updatedCount: overdueBills.length,
    billIds: overdueBills
  };
};

const recordOfflinePayment = async ({
  societyId,
  billId,
  amount,
  paymentMethod,
  paymentDate,
  transactionId
}) => {
  const bill = await validateBillOwnership(billId, societyId);

  if (bill.status === "PAID") {
    throw new ApiError(409, "BILL_ALREADY_PAID", "This maintenance bill has already been paid");
  }

  if (amount !== bill.totalAmount) {
    throw new ApiError(
      400,
      "PAYMENT_AMOUNT_MISMATCH",
      `Payment amount must be ₹${bill.totalAmount}`
    );
  }

  const existingPayment = await findPaymentByBillId(billId);

  if (existingPayment && existingPayment.status === "SUCCESS") {
    throw new ApiError(
      409,
      "PAYMENT_ALREADY_RECORDED",
      "Payment has already been recorded for this bill"
    );
  }

  const receiptNumber = `REC-${Date.now()}`;

  const payment = await createPayment({
    societyId,
    flatId: bill.flatId,
    billId: bill._id,
    amount,
    paymentMethod,
    paymentDate,
    transactionId,
    status: "SUCCESS",
    receiptNumber
  });

  await updateBillStatus(bill._id, "PAID");

  return payment;
};

const getPaymentHistory = async ({ societyId, flatId }) => {
  return findPaymentsByFlat(societyId, flatId);
};

const getSocietyPaymentHistory = async ({ societyId }) => {
  return findPaymentsBySociety(societyId);
};

const getMaintenanceDashboard = async ({ societyId, month }) => {
  return getDashboardStats(societyId, month);
};

const getPayment = async ({ societyId, paymentId }) => {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw new ApiError(400, "PAYMENT_ID_INVALID", "Payment ID is invalid");
  }

  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (payment.societyId.toString() !== societyId.toString()) {
    throw new ApiError(403, "PAYMENT_FORBIDDEN", "This payment does not belong to your society");
  }

  return payment;
};

export {
  createMaintenanceBill,
  generateMonthlyBills,
  getMaintenanceBill,
  getCurrentMaintenanceBill,
  getMaintenanceHistory,
  updateMaintenanceBill,
  markOverdueBills,
  recordOfflinePayment,
  getPaymentHistory,
  getSocietyPaymentHistory,
  getMaintenanceDashboard,
  getPayment
};
