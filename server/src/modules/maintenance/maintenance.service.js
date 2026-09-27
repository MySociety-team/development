import crypto from "crypto";
import Flat from "../../models/Flat.js";
import MaintenanceBill from "../../models/MaintenanceBill.js";
import Society from "../../models/Society.js";
import SocietyMember from "../../models/SocietyMember.js";
import getRazorpayClient from "../../config/razorpay.js";
import { createBulkNotifications } from "../notifications/notification.service.js";
import { createMaintenanceIncome } from "../finance/finance.service.js";
import ApiError from "../../utils/apiError.js";
import {
  createBill,
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
  findPaymentById,
  findPaymentByBillId,
  findPaymentsByBillId,
  findPendingRazorpayPaymentsByBillId,
  findPaymentByRazorpayOrderId,
  findPaymentsByFlat,
  findPaymentsBySociety,
  updatePayment,
  getDashboardStats,
  getTransparencyStats,
  findMaintenanceRates,
  findMaintenanceRate,
  upsertMaintenanceRate,
  getMaintenanceRateMap
} from "./maintenance.repository.js";

// =====================================================
// CONSTANTS
// =====================================================

const VALID_FLAT_TYPES = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"];

// =====================================================
// HELPERS
// =====================================================

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  return String(value);
};

const isSecretary = (role) => {
  return role === "SECRETARY";
};

const getBillTotal = (maintenanceAmount, lateFee = 0, status = "PENDING") => {
  const maintenance = Number(maintenanceAmount || 0);

  const fee = status === "OVERDUE" ? Number(lateFee || 0) : 0;

  return maintenance + fee;
};

// =====================================================
// CREATE MAINTENANCE BILL
// =====================================================

const createMaintenanceBill = async ({
  societyId,
  createdBy,
  flatId,
  month,
  maintenanceAmount,
  dueDate,
  lateFee = 0,
  adjustmentReason = ""
}) => {
  const flat = await Flat.findOne({
    _id: flatId,
    societyId
  }).lean();

  if (!flat) {
    throw new ApiError(
      404,
      "FLAT_NOT_FOUND",
      "Flat does not belong to this society or does not exist"
    );
  }

  const existingBill = await findBillByFlatAndMonth(societyId, flatId, month);

  if (existingBill) {
    throw new ApiError(
      409,
      "MAINTENANCE_BILL_EXISTS",
      `Maintenance bill already exists for flat ${flat.flatNumber} for ${month}`
    );
  }

  const amount = Number(maintenanceAmount);

  const fee = Number(lateFee || 0);

  const bill = await createBill({
    societyId,
    flatId,
    month,
    maintenanceAmount: amount,
    dueDate,
    lateFee: fee,

    // Late fee is NOT included
    // until bill becomes overdue.
    totalAmount: getBillTotal(amount, fee, "PENDING"),

    status: "PENDING",

    adjustmentReason: adjustmentReason || "",

    createdBy
  });

  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      flatId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "MAINTENANCE_BILL_GENERATED",
        title: "Maintenance Bill Generated",
        message: `Your maintenance bill of ₹${bill.totalAmount} for ${bill.month} is now available.`,
        link: `/societies/${societyId}/maintenance`,
        metadata: {
          billId: bill._id,
          month: bill.month,
          amount: bill.totalAmount
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify members of maintenance bill:", err);
  }

  return bill;
};

// =====================================================
// GENERATE MONTHLY BILLS
// =====================================================
//
// Amount is based on:
//
// Flat.flatType
//       ↓
// MaintenanceRate
//       ↓
// maintenanceAmount
//
// Only occupied flats are billed.
//
// Existing bills are skipped.
// Existing bills are never modified.
//

const generateMonthlyBills = async ({ societyId, createdBy, month, dueDate, lateFee = 0 }) => {
  // 1. Verify society exists
  const society = await Society.findById(societyId).select("_id name numberOfFlats").lean();
  if (!society) {
    throw new ApiError(404, "SOCIETY_NOT_FOUND", "The requested society does not exist");
  }

  // 2. Check total flats in the society
  const totalFlatsCount = await Flat.countDocuments({ societyId });
  if (totalFlatsCount === 0) {
    throw new ApiError(
      400,
      "NO_FLATS_FOUND",
      "No flats have been added to this society yet. Please add flats or approve resident join requests before generating bills."
    );
  }

  // 3. Check occupied flats in the society
  const flats = await Flat.find({
    societyId,
    isOccupied: true
  })
    .select("_id flatNumber flatType isOccupied")
    .sort({
      flatNumber: 1
    })
    .lean();

  if (!flats.length) {
    throw new ApiError(
      400,
      "NO_OCCUPIED_FLATS",
      `None of the ${totalFlatsCount} flat(s) in this society are marked as occupied. Maintenance bills can only be generated for occupied flats.`
    );
  }

  // ---------------------------------------------------
  // Validate flat types
  // ---------------------------------------------------

  const invalidFlatTypes = [
    ...new Set(
      flats.map((flat) => flat.flatType).filter((flatType) => !VALID_FLAT_TYPES.includes(flatType))
    )
  ];

  if (invalidFlatTypes.length) {
    throw new ApiError(
      400,
      "INVALID_FLAT_TYPES",
      `Invalid flat type(s) found in society flats: ${invalidFlatTypes.join(", ")}`
    );
  }

  // ---------------------------------------------------
  // Load configured rates
  // ---------------------------------------------------

  const rateMap = await getMaintenanceRateMap(societyId);

  // ---------------------------------------------------
  // Check missing rates BEFORE
  // creating any bill.
  // ---------------------------------------------------

  const requiredFlatTypes = [...new Set(flats.map((flat) => flat.flatType))];

  const missingFlatTypes = requiredFlatTypes.filter((flatType) => rateMap[flatType] === undefined);

  if (missingFlatTypes.length) {
    throw new ApiError(
      400,
      "MAINTENANCE_RATES_NOT_CONFIGURED",
      `Maintenance rates have not been configured for flat type(s): ${missingFlatTypes.join(", ")}. Please configure rates in Maintenance Rates settings first.`
    );
  }

  // ---------------------------------------------------
  // Find existing bills
  // ---------------------------------------------------

  const existingBills = await findBillsBySocietyAndMonth(societyId, month);

  const existingFlatIds = new Set(
    existingBills.map((bill) => normalizeId(bill.flatId?._id || bill.flatId))
  );

  // ---------------------------------------------------
  // Build new bills
  // ---------------------------------------------------

  const billsToCreate = [];

  for (const flat of flats) {
    const flatId = normalizeId(flat._id);

    // Duplicate prevention
    if (existingFlatIds.has(flatId)) {
      continue;
    }

    const amount = Number(rateMap[flat.flatType]);

    const fee = Number(lateFee || 0);

    billsToCreate.push({
      societyId,
      flatId: flat._id,
      month,

      maintenanceAmount: amount,

      dueDate,

      lateFee: fee,

      // Not overdue yet.
      totalAmount: amount,

      status: "PENDING",

      adjustmentReason: "",

      createdBy
    });
  }

  // ---------------------------------------------------
  // No new bills - all already generated
  // ---------------------------------------------------

  if (!billsToCreate.length) {
    throw new ApiError(
      400,
      "BILLS_ALREADY_GENERATED",
      `All ${flats.length} occupied flat(s) already have maintenance bills generated for ${month}.`
    );
  }

  // ---------------------------------------------------
  // Create bills
  // ---------------------------------------------------

  let createdBills;

  try {
    createdBills = await createBills(billsToCreate);
  } catch (error) {
    // If duplicate bills were
    // created concurrently, return
    // a clean application error.
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        "DUPLICATE_BILLS",
        "Some maintenance bills already exist for this month. Please refresh and try again."
      );
    }

    throw error;
  }

  try {
    if (createdBills && createdBills.length > 0) {
      const billedFlatIds = createdBills.map((b) => b.flatId);
      const activeMembers = await SocietyMember.find({
        societyId,
        flatId: { $in: billedFlatIds },
        status: "ACTIVE"
      }).select("userId flatId");

      if (activeMembers.length > 0) {
        const billMapByFlat = new Map();
        for (const b of createdBills) {
          billMapByFlat.set(normalizeId(b.flatId), b);
        }

        const notifications = [];
        for (const member of activeMembers) {
          const billForFlat = billMapByFlat.get(normalizeId(member.flatId));
          if (billForFlat) {
            notifications.push({
              recipientId: member.userId,
              societyId,
              type: "MAINTENANCE_BILL_GENERATED",
              title: "Maintenance Bill Generated",
              message: `Your maintenance bill of ₹${billForFlat.totalAmount} for ${month} has been generated.`,
              link: `/societies/${societyId}/maintenance`,
              metadata: {
                billId: billForFlat._id,
                month,
                amount: billForFlat.totalAmount
              }
            });
          }
        }

        if (notifications.length > 0) {
          await createBulkNotifications(notifications);
        }
      }
    }
  } catch (err) {
    console.error("Failed to notify residents of monthly maintenance bills:", err);
  }

  return {
    month,
    createdCount: createdBills.length,
    skippedCount: existingBills.length,
    bills: createdBills
  };
};

// =====================================================
// GET MAINTENANCE BILL
// =====================================================
//
// Secretary:
//   Can view any bill in society.
//
// Resident:
//   Can view only their own flat's bill.
//

const getMaintenanceBill = async ({ societyId, billId, flatId, role }) => {
  const bill = await findBillByIdWithDetails(societyId, billId);

  if (!bill) {
    throw new Error("Maintenance bill not found");
  }

  // Secretary can access
  // any bill in society.
  if (isSecretary(role)) {
    return bill;
  }

  // Resident must have a flat.
  if (!flatId) {
    throw new Error("Flat information is required");
  }

  const billFlatId = normalizeId(bill.flatId?._id || bill.flatId);

  if (billFlatId !== normalizeId(flatId)) {
    throw new Error("You are not authorized to view this bill");
  }

  return bill;
};

// =====================================================
// UPDATE MAINTENANCE BILL
// =====================================================
//
// Paid bills cannot be edited.
//
// Editing requires an adjustment reason.
//
// Late fee is stored separately and is
// only included in total when bill is OVERDUE.
//

const updateMaintenanceBill = async ({
  societyId,
  billId,
  maintenanceAmount,
  dueDate,
  lateFee,
  adjustmentReason
}) => {
  const bill = await findBillById(societyId, billId);

  if (!bill) {
    throw new Error("Maintenance bill not found");
  }

  if (bill.status === "PAID") {
    throw new Error("Paid maintenance bills cannot be edited");
  }

  if (!adjustmentReason || !adjustmentReason.trim()) {
    throw new Error("Adjustment reason is required when editing a maintenance bill");
  }

  const updates = {
    adjustmentReason: adjustmentReason.trim()
  };

  if (maintenanceAmount !== undefined) {
    updates.maintenanceAmount = Number(maintenanceAmount);
  }

  if (dueDate !== undefined) {
    updates.dueDate = dueDate;
  }

  if (lateFee !== undefined) {
    updates.lateFee = Number(lateFee);
  }

  // Recalculate total.
  //
  // PENDING:
  // maintenance only
  //
  // OVERDUE:
  // maintenance + late fee

  const newMaintenanceAmount =
    updates.maintenanceAmount !== undefined
      ? updates.maintenanceAmount
      : Number(bill.maintenanceAmount || 0);

  const newLateFee = updates.lateFee !== undefined ? updates.lateFee : Number(bill.lateFee || 0);

  updates.totalAmount = getBillTotal(newMaintenanceAmount, newLateFee, bill.status);

  return updateBill(societyId, billId, updates);
};

// =====================================================
// MARK BILLS OVERDUE
// =====================================================
//
// Only PENDING bills whose due date
// has passed are changed.
//
// Late fee is added when status
// becomes OVERDUE.
//

const markOverdueBills = async ({ societyId, month }) => {
  const now = new Date();

  const bills = await MaintenanceBill.find({
    societyId,
    month,
    status: "PENDING",
    dueDate: {
      $lt: now
    }
  })
    .select("_id flatId maintenanceAmount lateFee")
    .lean();

  let updatedCount = 0;
  const overdueBills = [];

  for (const bill of bills) {
    const maintenanceAmount = Number(bill.maintenanceAmount || 0);

    const lateFee = Number(bill.lateFee || 0);

    const totalAmount = maintenanceAmount + lateFee;

    const updated = await updateBillStatus(societyId, bill._id, "OVERDUE", totalAmount);

    if (updated) {
      updatedCount += 1;
      overdueBills.push({ ...bill, totalAmount });
    }
  }

  try {
    if (overdueBills.length > 0) {
      const overdueFlatIds = overdueBills.map((b) => b.flatId).filter(Boolean);
      const activeMembers = await SocietyMember.find({
        societyId,
        flatId: { $in: overdueFlatIds },
        status: "ACTIVE"
      }).select("userId flatId");

      if (activeMembers.length > 0) {
        const billMapByFlat = new Map();
        for (const b of overdueBills) {
          billMapByFlat.set(normalizeId(b.flatId), b);
        }

        const notifications = [];
        for (const member of activeMembers) {
          const b = billMapByFlat.get(normalizeId(member.flatId));
          if (b) {
            notifications.push({
              recipientId: member.userId,
              societyId,
              type: "MAINTENANCE_OVERDUE",
              title: "Maintenance Bill Overdue",
              message: `Your maintenance bill for ${month} is overdue (₹${b.totalAmount} including late fee).`,
              link: `/societies/${societyId}/maintenance`,
              metadata: {
                billId: b._id,
                month,
                amount: b.totalAmount
              }
            });
          }
        }

        if (notifications.length > 0) {
          await createBulkNotifications(notifications);
        }
      }
    }
  } catch (err) {
    console.error("Failed to notify members of overdue maintenance bills:", err);
  }

  return {
    month,
    updatedCount
  };
};

// =====================================================
// GET SOCIETY BILLS
// =====================================================

const getSocietyBills = async ({ societyId, month }) => {
  if (!month) {
    throw new Error("Month is required");
  }

  return findBillsBySocietyAndMonth(societyId, month);
};

// =====================================================
// GET CURRENT BILL
// =====================================================

const getCurrentMaintenanceBill = async ({ societyId, flatId }) => {
  if (!flatId) {
    throw new Error("Flat information is required");
  }

  const bill = await findCurrentBill(societyId, flatId);

  return bill;
};

// =====================================================
// GET MAINTENANCE HISTORY
// =====================================================

const getMaintenanceHistory = async ({ societyId, flatId }) => {
  if (!flatId) {
    throw new Error("Flat information is required");
  }

  return findBillsByFlat(societyId, flatId);
};

// =====================================================
// GET MAINTENANCE DASHBOARD
// =====================================================

const getMaintenanceDashboard = async ({ societyId, month }) => {
  if (!month) {
    throw new Error("Month is required");
  }

  const stats = await getDashboardStats(societyId, month);

  const bills = await findBillsBySocietyAndMonth(societyId, month);

  return {
    month,
    stats,
    bills
  };
};

// =====================================================
// GET SOCIETY PAYMENT HISTORY
// =====================================================

const getSocietyPaymentHistory = async ({ societyId, month }) => {
  return findPaymentsBySociety(societyId, month);
};

// =====================================================
// GET MY PAYMENT HISTORY
// =====================================================

const getPaymentHistory = async ({ societyId, flatId }) => {
  if (!flatId) {
    throw new Error("Flat information is required");
  }

  return findPaymentsByFlat(societyId, flatId);
};

// =====================================================
// GET PAYMENT
// =====================================================
//
// Secretary:
//   Any payment in society.
//
// Resident:
//   Only payment belonging to
//   their own flat.
//

const getPayment = async ({ societyId, paymentId, flatId, role }) => {
  const payment = await findPaymentById(societyId, paymentId);

  if (!payment) {
    throw new Error("Maintenance payment not found");
  }

  if (isSecretary(role)) {
    return payment;
  }

  if (!flatId) {
    throw new Error("Flat information is required");
  }

  const paymentFlatId = normalizeId(payment.flatId?._id || payment.flatId);

  if (paymentFlatId !== normalizeId(flatId)) {
    throw new Error("You are not authorized to view this payment");
  }

  return payment;
};

// =====================================================
// RECORD OFFLINE PAYMENT
// =====================================================
const recordOfflinePayment = async ({
  societyId,
  billId,
  amount,
  paymentMethod,
  paymentDate,
  transactionId,
  userId
}) => {
  const bill = await findBillById(societyId, billId);

  if (!bill) {
    throw new Error("Maintenance bill not found");
  }

  // -------------------------------------------------
  // Bill must not already be paid
  // -------------------------------------------------

  if (bill.status === "PAID") {
    throw new Error("This maintenance bill is already paid");
  }

  // -------------------------------------------------
  // Validate payment amount
  // -------------------------------------------------

  const paymentAmount = Number(amount);

  const billAmount = Number(bill.totalAmount || 0);

  if (!Number.isFinite(paymentAmount) || paymentAmount !== billAmount) {
    throw new Error(`Payment amount must be exactly ${billAmount}`);
  }

  // -------------------------------------------------
  // Check for ANY successful payment
  // for this bill
  // -------------------------------------------------

  const existingPayments = await findPaymentsByBillId(societyId, billId);

  const successfulPayment = existingPayments.find((payment) => payment.status === "SUCCESS");

  if (successfulPayment) {
    throw new Error("This maintenance bill already has a successful payment");
  }

  // -------------------------------------------------
  // Create receipt
  // -------------------------------------------------

  const receiptNumber = `REC-${Date.now()}`;

  // -------------------------------------------------
  // Create offline payment
  // -------------------------------------------------

  const payment = await createPayment({
    societyId,
    flatId: bill.flatId,
    billId,
    amount: paymentAmount,
    paymentMethod,
    paymentDate: paymentDate || new Date(),
    transactionId: transactionId || undefined,
    status: "SUCCESS",
    receiptNumber
  });

  // -------------------------------------------------
  // Mark bill as PAID
  // -------------------------------------------------

  await updateBillStatus(societyId, billId, "PAID", billAmount);

  // Automatically create Finance income
  // after successful maintenance payment.
  await createMaintenanceIncome({
    societyId,
    payment,
    bill,
    userId
  });

  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      flatId: bill.flatId,
      status: "ACTIVE"
    }).select("userId");

    if (activeMembers.length > 0) {
      const notifications = activeMembers.map((member) => ({
        recipientId: member.userId,
        societyId,
        type: "MAINTENANCE_PAYMENT_SUCCESS",
        title: "Maintenance Payment Recorded",
        message: `Offline payment of ₹${paymentAmount} for ${bill.month} has been recorded (Receipt #${receiptNumber}).`,
        link: `/societies/${societyId}/maintenance`,
        metadata: {
          billId,
          receiptNumber,
          amount: paymentAmount
        }
      }));

      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to notify resident of offline payment:", err);
  }

  return payment;
};
// =====================================================
// GET TRANSPARENCY
// =====================================================

const getMaintenanceTransparency = async ({ societyId, month }) => {
  if (!month) {
    throw new Error("Month is required");
  }

  const flats = await getTransparencyStats(societyId, month);

  return {
    month,
    flats
  };
};

// =====================================================
// MAINTENANCE RATES
// =====================================================

// -----------------------------------------------------
// GET ALL RATES
// -----------------------------------------------------

const getMaintenanceRates = async ({ societyId }) => {
  return findMaintenanceRates(societyId);
};

// -----------------------------------------------------
// GET ONE RATE
// -----------------------------------------------------

const getMaintenanceRate = async ({ societyId, flatType }) => {
  if (!VALID_FLAT_TYPES.includes(flatType)) {
    throw new Error("Invalid flat type");
  }

  return findMaintenanceRate(societyId, flatType);
};

// -----------------------------------------------------
// UPDATE RATE
// -----------------------------------------------------
//
// This affects ONLY future bills.
//
// Existing MaintenanceBill documents
// keep their existing maintenanceAmount.
//

const updateMaintenanceRate = async ({ societyId, flatType, amount }) => {
  if (!VALID_FLAT_TYPES.includes(flatType)) {
    throw new Error("Invalid flat type");
  }

  const rateAmount = Number(amount);

  if (!Number.isFinite(rateAmount) || rateAmount < 0) {
    throw new Error("Maintenance amount must be a valid non-negative number");
  }

  return upsertMaintenanceRate(societyId, flatType, rateAmount);
};
// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================
//
// Flow:
//
// Resident
//    ↓
// Select unpaid bill
//    ↓
// Backend checks bill
//    ↓
// Check existing pending Razorpay order
//    ↓
// Reuse existing order OR create new order
//    ↓
// Save PENDING payment
//    ↓
// Return Razorpay order details
//

const createMaintenancePaymentOrder = async ({ societyId, billId, flatId, role, userId }) => {
  const bill = await findBillById(societyId, billId);

  if (!bill) {
    throw new Error("Maintenance bill not found");
  }

  // -------------------------------------------------
  // Resident can pay only their own flat's bill
  // -------------------------------------------------

  if (!isSecretary(role)) {
    if (!flatId) {
      throw new Error("Flat information is required");
    }

    if (normalizeId(bill.flatId) !== normalizeId(flatId)) {
      throw new Error("You are not authorized to pay this bill");
    }
  }

  // -------------------------------------------------
  // Already paid
  // -------------------------------------------------

  if (bill.status === "PAID") {
    throw new Error("This maintenance bill is already paid");
  }

  const amount = Number(bill.totalAmount || 0);

  if (amount <= 0) {
    throw new Error("Maintenance bill amount must be greater than zero");
  }

  // -------------------------------------------------
  // Check existing pending Razorpay payments
  // -------------------------------------------------

  const pendingPayments = await findPendingRazorpayPaymentsByBillId(societyId, billId);

  const razorpay = getRazorpayClient();

  // -------------------------------------------------
  // Try to reuse an existing Razorpay order
  // -------------------------------------------------

  for (const payment of pendingPayments) {
    if (!payment.razorpayOrderId) {
      continue;
    }

    try {
      const existingOrder = await razorpay.orders.fetch(payment.razorpayOrderId);

      // Razorpay order is still usable.
      if (existingOrder && existingOrder.status === "created") {
        return {
          orderId: existingOrder.id,

          amount: existingOrder.amount,

          currency: existingOrder.currency,

          billId: bill._id,

          paymentId: payment._id,

          keyId: process.env.RAZORPAY_KEY_ID
        };
      }

      // Order is no longer usable.
      await updatePayment(societyId, payment._id, {
        status: "FAILED"
      });
    } catch (error) {
      console.error("Failed to fetch existing Razorpay order:", error?.message);

      // Keep checking other pending
      // records instead of failing
      // the entire payment request.
    }
  }

  // -------------------------------------------------
  // Create new Razorpay order
  // -------------------------------------------------

  const receipt = `maintenance_${billId}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),

    currency: "INR",

    receipt,

    notes: {
      societyId: normalizeId(societyId),

      billId: normalizeId(billId),

      flatId: normalizeId(bill.flatId),

      userId: normalizeId(userId)
    }
  });

  // -------------------------------------------------
  // Save pending payment
  // -------------------------------------------------

  let payment;

  try {
    payment = await createPayment({
      societyId,
      flatId: bill.flatId,
      billId: bill._id,

      amount,

      paymentMethod: "RAZORPAY",

      paymentDate: new Date(),

      razorpayOrderId: order.id,

      status: "PENDING"
    });
  } catch (error) {
    // Another request may have created
    // a pending Razorpay payment at the
    // same time.
    if (error?.code === 11000) {
      const concurrentPayment = await findPaymentByBillId(societyId, billId);

      if (
        concurrentPayment &&
        concurrentPayment.status === "PENDING" &&
        concurrentPayment.paymentMethod === "RAZORPAY"
      ) {
        return {
          orderId: concurrentPayment.razorpayOrderId,

          amount: Math.round(Number(concurrentPayment.amount) * 100),

          currency: "INR",

          billId: bill._id,

          paymentId: concurrentPayment._id,

          keyId: process.env.RAZORPAY_KEY_ID
        };
      }
    }

    throw error;
  }

  return {
    orderId: order.id,

    amount: order.amount,

    currency: order.currency,

    billId: bill._id,

    paymentId: payment._id,

    keyId: process.env.RAZORPAY_KEY_ID
  };
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================
//
// Razorpay sends:
//
// razorpay_order_id
// razorpay_payment_id
// razorpay_signature
//
// Backend verifies:
//
// HMAC_SHA256(
//   order_id + "|" + payment_id,
//   RAZORPAY_KEY_SECRET
// )
//

const verifyMaintenancePayment = async ({
  societyId,
  billId,
  flatId,
  role,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  userId
}) => {
  const bill = await findBillById(societyId, billId);

  if (!bill) {
    throw new Error("Maintenance bill not found");
  }

  // -------------------------------------------------
  // Resident can verify only own bill
  // -------------------------------------------------

  if (!isSecretary(role)) {
    if (!flatId) {
      throw new Error("Flat information is required");
    }

    if (normalizeId(bill.flatId) !== normalizeId(flatId)) {
      throw new Error("You are not authorized to verify this payment");
    }
  }

  // -------------------------------------------------
  // Already paid
  // -------------------------------------------------

  if (bill.status === "PAID") {
    throw new Error("This maintenance bill is already paid");
  }

  // -------------------------------------------------
  // Find payment record
  // -------------------------------------------------

  const payment = await findPaymentByRazorpayOrderId(societyId, razorpayOrderId);

  if (!payment) {
    throw new Error("Razorpay payment record not found");
  }

  // -------------------------------------------------
  // Make sure payment belongs
  // to the requested bill
  // -------------------------------------------------

  if (normalizeId(payment.billId) !== normalizeId(billId)) {
    throw new Error("Payment does not belong to this maintenance bill");
  }

  // -------------------------------------------------
  // Make sure payment is Razorpay
  // -------------------------------------------------

  if (payment.paymentMethod !== "RAZORPAY") {
    throw new Error("Invalid payment method");
  }

  // -------------------------------------------------
  // If already successful
  // -------------------------------------------------

  if (payment.status === "SUCCESS") {
    return payment;
  }

  // -------------------------------------------------
  // Verify Razorpay signature
  // -------------------------------------------------

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET must be configured");
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const generatedSignatureBuffer = Buffer.from(generatedSignature, "utf8");

  const receivedSignatureBuffer = Buffer.from(razorpaySignature, "utf8");

  const signaturesMatch =
    generatedSignatureBuffer.length === receivedSignatureBuffer.length &&
    crypto.timingSafeEqual(generatedSignatureBuffer, receivedSignatureBuffer);

  // -------------------------------------------------
  // Invalid signature
  // -------------------------------------------------

  if (!signaturesMatch) {
    await updatePayment(societyId, payment._id, {
      status: "FAILED"
    });

    throw new Error("Razorpay payment signature verification failed");
  }

  // -------------------------------------------------
  // Successful payment
  // -------------------------------------------------

  const receiptNumber = `REC-${Date.now()}`;

  const updatedPayment = await updatePayment(societyId, payment._id, {
    status: "SUCCESS",

    razorpayPaymentId: razorpayPaymentId,

    receiptNumber,

    paymentDate: new Date()
  });

  // -------------------------------------------------
  // Mark other pending Razorpay
  // attempts for same bill as FAILED
  // -------------------------------------------------

  const otherPendingPayments = await findPendingRazorpayPaymentsByBillId(societyId, billId);

  for (const pendingPayment of otherPendingPayments) {
    if (normalizeId(pendingPayment._id) === normalizeId(payment._id)) {
      continue;
    }

    await updatePayment(societyId, pendingPayment._id, {
      status: "FAILED"
    });
  }

  // -------------------------------------------------
  // Mark bill as PAID
  // -------------------------------------------------

  await updateBillStatus(societyId, billId, "PAID", Number(bill.totalAmount || 0));

  // Automatically create Finance income
  // after successful Razorpay payment.
  await createMaintenanceIncome({
    societyId,
    payment: updatedPayment,
    bill,
    userId
  });

  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      flatId: bill.flatId,
      status: "ACTIVE"
    }).select("userId");

    const notifications = activeMembers.map((member) => ({
      recipientId: member.userId,
      societyId,
      type: "MAINTENANCE_PAYMENT_SUCCESS",
      title: "Payment Successful",
      message: `Your payment of ₹${bill.totalAmount} for ${bill.month} maintenance was successful (Receipt #${receiptNumber}).`,
      link: `/societies/${societyId}/maintenance`,
      metadata: {
        billId,
        paymentId: updatedPayment._id,
        receiptNumber,
        amount: bill.totalAmount
      }
    }));

    const society = await Society.findById(societyId).select("secretary");
    if (society?.secretary) {
      const flat = await Flat.findById(bill.flatId).select("wing flatNumber");
      const flatLabel = flat ? `Flat ${flat.wing}-${flat.flatNumber}` : "Flat";
      notifications.push({
        recipientId: society.secretary,
        societyId,
        type: "MAINTENANCE_PAYMENT_SUCCESS",
        title: "Maintenance Payment Received",
        message: `Payment of ₹${bill.totalAmount} received for ${bill.month} from ${flatLabel}.`,
        link: `/societies/${societyId}/maintenance/dashboard`,
        metadata: {
          billId,
          paymentId: updatedPayment._id,
          receiptNumber,
          amount: bill.totalAmount
        }
      });
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (err) {
    console.error("Failed to send payment notifications:", err);
  }

  return updatedPayment;
};
// =====================================================
// UPDATE PAYMENT BY RAZORPAY ORDER ID
// =====================================================

const updatePaymentByOrderIfExists = async ({ societyId, razorpayOrderId, updates }) => {
  if (!razorpayOrderId) {
    return null;
  }

  const payment = await findPaymentByRazorpayOrderId(societyId, razorpayOrderId);

  if (!payment) {
    return null;
  }

  return updatePayment(societyId, payment._id, updates);
};

// =====================================================
// GET BILL DETAILS FOR RESIDENT
// =====================================================

const getResidentMaintenanceBill = async ({ societyId, billId, flatId }) => {
  if (!flatId) {
    throw new Error("Flat information is required");
  }

  return getMaintenanceBill({
    societyId,
    billId,
    flatId,
    role: "RESIDENT"
  });
};

// =====================================================
// EXPORTS
// =====================================================
//

export {
  createMaintenanceBill,
  generateMonthlyBills,
  getMaintenanceBill,
  getResidentMaintenanceBill,
  updateMaintenanceBill,
  markOverdueBills,
  getSocietyBills,
  getCurrentMaintenanceBill,
  getMaintenanceHistory,
  getMaintenanceDashboard,
  getSocietyPaymentHistory,
  getPaymentHistory,
  getPayment,
  recordOfflinePayment,
  getMaintenanceTransparency,
  getMaintenanceRates,
  getMaintenanceRate,
  updateMaintenanceRate,
  createMaintenancePaymentOrder,
  verifyMaintenancePayment,
  updatePaymentByOrderIfExists
};
