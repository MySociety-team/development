import asyncHandler from "../../utils/asyncHandler.js";

import {
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
} from "./maintenance.service.js";

/*
 * Secretary:
 * Create one maintenance bill.
 */
const createBill = asyncHandler(async (req, res) => {
  const { flatId, month, maintenanceAmount, dueDate, lateFee, adjustmentReason } = req.body;

  const bill = await createMaintenanceBill({
    societyId: req.params.societyId,
    userId: req.user.id,
    flatId,
    month,
    maintenanceAmount,
    dueDate,
    lateFee,
    adjustmentReason
  });

  res.status(201).json({
    success: true,
    message: "Maintenance bill created successfully",
    data: bill
  });
});

/*
 * Secretary:
 * Generate bills for all flats.
 */
const generateBills = asyncHandler(async (req, res) => {
  const { month, dueDate, defaultMaintenanceAmount, lateFee } = req.body;

  const bills = await generateMonthlyBills({
    societyId: req.params.societyId,
    userId: req.user.id,
    month,
    dueDate,
    defaultMaintenanceAmount,
    lateFee
  });

  res.status(201).json({
    success: true,
    message: "Monthly maintenance bills generated successfully",
    data: bills
  });
});

/*
 * Get one maintenance bill.
 */
const getBill = asyncHandler(async (req, res) => {
  const bill = await getMaintenanceBill({
    societyId: req.params.societyId,
    billId: req.params.billId
  });

  res.status(200).json({
    success: true,
    data: bill
  });
});

/*
 * Resident:
 * Get current/latest maintenance bill.
 */
const getCurrentBill = asyncHandler(async (req, res) => {
  const bill = await getCurrentMaintenanceBill({
    societyId: req.params.societyId,
    flatId: req.societyMember.flatId
  });

  res.status(200).json({
    success: true,
    data: bill
  });
});

/*
 * Resident:
 * Get complete maintenance history.
 */
const getHistory = asyncHandler(async (req, res) => {
  const bills = await getMaintenanceHistory({
    societyId: req.params.societyId,
    flatId: req.societyMember.flatId
  });

  res.status(200).json({
    success: true,
    data: bills
  });
});

/*
 * Secretary:
 * Update an unpaid bill.
 */
const updateBill = asyncHandler(async (req, res) => {
  const { maintenanceAmount, dueDate, lateFee, adjustmentReason } = req.body;

  const bill = await updateMaintenanceBill({
    societyId: req.params.societyId,
    billId: req.params.billId,
    maintenanceAmount,
    dueDate,
    lateFee,
    adjustmentReason
  });

  res.status(200).json({
    success: true,
    message: "Maintenance bill updated successfully",
    data: bill
  });
});

/*
 * Secretary:
 * Mark overdue bills.
 */
const markOverdue = asyncHandler(async (req, res) => {
  const result = await markOverdueBills({
    societyId: req.params.societyId,
    month: req.body.month
  });

  res.status(200).json({
    success: true,
    message: "Overdue bills updated successfully",
    data: result
  });
});

/*
 * Secretary:
 * Record cash / UPI / bank transfer payment.
 */
const recordOffline = asyncHandler(async (req, res) => {
  const { billId, amount, paymentMethod, paymentDate, transactionId } = req.body;

  const payment = await recordOfflinePayment({
    societyId: req.params.societyId,
    billId,
    amount,
    paymentMethod,
    paymentDate,
    transactionId
  });

  res.status(201).json({
    success: true,
    message: "Offline payment recorded successfully",
    data: payment
  });
});

/*
 * Resident:
 * Get payment history for their flat.
 */
const getMyPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await getPaymentHistory({
    societyId: req.params.societyId,
    flatId: req.societyMember.flatId
  });

  res.status(200).json({
    success: true,
    data: payments
  });
});

/*
 * Secretary:
 * Get all society payments.
 */
const getSocietyPayments = asyncHandler(async (req, res) => {
  const payments = await getSocietyPaymentHistory({
    societyId: req.params.societyId
  });

  res.status(200).json({
    success: true,
    data: payments
  });
});

/*
 * Secretary:
 * Get maintenance dashboard.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getMaintenanceDashboard({
    societyId: req.params.societyId,
    month: req.query.month
  });

  res.status(200).json({
    success: true,
    data: stats
  });
});

/*
 * Get one payment / receipt data.
 */
const getPaymentDetails = asyncHandler(async (req, res) => {
  const payment = await getPayment({
    societyId: req.params.societyId,
    paymentId: req.params.paymentId
  });

  res.status(200).json({
    success: true,
    data: payment
  });
});

export {
  createBill,
  generateBills,
  getBill,
  getCurrentBill,
  getHistory,
  updateBill,
  markOverdue,
  recordOffline,
  getMyPaymentHistory,
  getSocietyPayments,
  getDashboard,
  getPaymentDetails
};
