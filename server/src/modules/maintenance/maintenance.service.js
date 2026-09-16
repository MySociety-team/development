import mongoose from "mongoose";
import crypto from "crypto";

import ApiError from "../../utils/apiError.js";
import getRazorpayClient from "../../config/razorpay.js";

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
  findPaymentByRazorpayOrderId,
  findPaymentsByFlat,
  findPaymentsBySociety,
  updatePayment,
  getDashboardStats,
  getTransparencyStats
} from "./maintenance.repository.js";


// =====================================================
// CREATE MAINTENANCE BILL
// =====================================================

const createMaintenanceBill = async ({
  societyId,
  flatId,
  month,
  maintenanceAmount,
  dueDate,
  lateFee = 0,
  adjustmentReason,
  createdBy
}) => {

  if (
    !mongoose.isValidObjectId(
      societyId
    )
  ) {
    throw new ApiError(
      400,
      "SOCIETY_ID_INVALID",
      "Society ID is invalid"
    );
  }


  if (
    !mongoose.isValidObjectId(
      flatId
    )
  ) {
    throw new ApiError(
      400,
      "FLAT_ID_INVALID",
      "Flat ID is invalid"
    );
  }


  const existingBill =
    await findBillByFlatAndMonth(
      societyId,
      flatId,
      month
    );


  if (existingBill) {

    throw new ApiError(
      409,
      "MAINTENANCE_BILL_EXISTS",
      "Maintenance bill already exists for this flat and month"
    );
  }


  const bill =
    await createBill({

      societyId,

      flatId,

      month,

      maintenanceAmount,

      dueDate,

      lateFee,

      totalAmount:
        maintenanceAmount,

      status:
        "PENDING",

      adjustmentReason,

      createdBy
    });


  return bill;
};


// =====================================================
// GENERATE MONTHLY BILLS
// =====================================================

const generateMonthlyBills = async ({
  societyId,
  month,
  dueDate,
  defaultMaintenanceAmount,
  lateFee = 0,
  createdBy
}) => {

  const Flat =
    mongoose.model("Flat");


  const flats =
    await Flat.find({
      societyId,
      isOccupied: true
    })
      .select("_id")
      .lean();


  if (!flats.length) {

    return {
      created: 0,
      skipped: 0,
      bills: []
    };
  }


  const existingBills =
    await findBillsBySocietyAndMonth(
      societyId,
      month
    );


  const existingFlatIds =
    new Set(
      existingBills.map(
        (bill) =>
          bill.flatId._id.toString()
      )
    );


  const billsToCreate = [];


  for (const flat of flats) {

    if (
      existingFlatIds.has(
        flat._id.toString()
      )
    ) {
      continue;
    }


    billsToCreate.push({

      societyId,

      flatId:
        flat._id,

      month,

      maintenanceAmount:
        defaultMaintenanceAmount,

      dueDate,

      lateFee,

      totalAmount:
        defaultMaintenanceAmount,

      status:
        "PENDING",

      createdBy
    });
  }


  const bills =
    await createBills(
      billsToCreate
    );


  return {

    created:
      bills.length,

    skipped:
      flats.length - bills.length,

    bills
  };
};


// =====================================================
// GET BILL
// =====================================================

const getMaintenanceBill = async ({
  societyId,
  billId
}) => {

  if (
    !mongoose.isValidObjectId(
      billId
    )
  ) {
    throw new ApiError(
      400,
      "BILL_ID_INVALID",
      "Bill ID is invalid"
    );
  }


  const bill =
    await findBillByIdWithDetails(
      societyId,
      billId
    );


  if (!bill) {

    throw new ApiError(
      404,
      "MAINTENANCE_BILL_NOT_FOUND",
      "Maintenance bill not found"
    );
  }


  return bill;
};


// =====================================================
// GET CURRENT BILL
// =====================================================

const getCurrentMaintenanceBill = async ({
  societyId,
  flatId
}) => {

  const bill =
    await findCurrentBill(
      societyId,
      flatId
    );


  return bill;
};


// =====================================================
// GET MAINTENANCE HISTORY
// =====================================================

const getMaintenanceHistory = async ({
  societyId,
  flatId
}) => {

  const bills =
    await findBillsByFlat(
      societyId,
      flatId
    );


  return bills;
};


// =====================================================
// GET SOCIETY BILLS BY MONTH
// =====================================================

const getSocietyBills = async ({
  societyId,
  month
}) => {

  if (
    !month ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month
    )
  ) {

    throw new ApiError(
      400,
      "MONTH_INVALID",
      "Month must be in YYYY-MM format"
    );
  }


  const bills =
    await findBillsBySocietyAndMonth(
      societyId,
      month
    );


  return bills;
};


// =====================================================
// UPDATE MAINTENANCE BILL
// =====================================================

const updateMaintenanceBill = async ({
  societyId,
  billId,
  maintenanceAmount,
  dueDate,
  lateFee,
  adjustmentReason
}) => {

  if (
    !mongoose.isValidObjectId(
      billId
    )
  ) {
    throw new ApiError(
      400,
      "BILL_ID_INVALID",
      "Bill ID is invalid"
    );
  }


  const existingBill =
    await findBillById(
      societyId,
      billId
    );


  if (!existingBill) {

    throw new ApiError(
      404,
      "MAINTENANCE_BILL_NOT_FOUND",
      "Maintenance bill not found"
    );
  }


  if (
    existingBill.status === "PAID"
  ) {

    throw new ApiError(
      400,
      "PAID_BILL_CANNOT_BE_EDITED",
      "Paid maintenance bills cannot be edited"
    );
  }


  const updates = {};


  if (
    typeof maintenanceAmount !==
    "undefined"
  ) {

    updates.maintenanceAmount =
      maintenanceAmount;
  }


  if (
    typeof dueDate !==
    "undefined"
  ) {

    updates.dueDate =
      dueDate;
  }


  if (
    typeof lateFee !==
    "undefined"
  ) {

    updates.lateFee =
      lateFee;
  }


  if (
    typeof adjustmentReason !==
    "undefined"
  ) {

    updates.adjustmentReason =
      adjustmentReason;
  }


  const finalMaintenanceAmount =
    typeof maintenanceAmount !==
    "undefined"
      ? maintenanceAmount
      : existingBill.maintenanceAmount;


  const finalLateFee =
    typeof lateFee !==
    "undefined"
      ? lateFee
      : existingBill.lateFee;


  const finalDueDate =
    typeof dueDate !==
    "undefined"
      ? new Date(dueDate)
      : new Date(
          existingBill.dueDate
        );


  // ---------------------------------------------------
  // Late fee is charged ONLY after overdue
  // ---------------------------------------------------

  const dueDateEnd =
    new Date(
      finalDueDate
    );

  dueDateEnd.setHours(
    23,
    59,
    59,
    999
  );


  const isOverdue =
    existingBill.status ===
      "OVERDUE" ||
    new Date() >
      dueDateEnd;


  if (isOverdue) {

    updates.status =
      "OVERDUE";

    updates.totalAmount =
      finalMaintenanceAmount +
      finalLateFee;

  } else {

    updates.status =
      "PENDING";

    updates.totalAmount =
      finalMaintenanceAmount;
  }


  const updatedBill =
    await updateBill(
      societyId,
      billId,
      updates
    );


  return updatedBill;
};


// =====================================================
// MARK OVERDUE BILLS
// =====================================================

const markOverdueBills = async ({
  societyId,
  month
}) => {

  const bills =
    await findBillsBySocietyAndMonth(
      societyId,
      month
    );


  const now =
    new Date();


  let updatedCount = 0;


  for (const bill of bills) {

    if (
      bill.status !==
      "PENDING"
    ) {
      continue;
    }


    const dueDate =
      new Date(
        bill.dueDate
      );


    dueDate.setHours(
      23,
      59,
      59,
      999
    );


    if (
      now <= dueDate
    ) {
      continue;
    }


    await updateBillStatus(

      societyId,

      bill._id,

      "OVERDUE",

      Number(
        bill.maintenanceAmount || 0
      ) +
        Number(
          bill.lateFee || 0
        )
    );


    updatedCount += 1;
  }


  return {

    updated:
      updatedCount
  };
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
  transactionId
}) => {

  if (
    !mongoose.isValidObjectId(
      billId
    )
  ) {
    throw new ApiError(
      400,
      "BILL_ID_INVALID",
      "Bill ID is invalid"
    );
  }


  const bill =
    await findBillById(
      societyId,
      billId
    );


  if (!bill) {

    throw new ApiError(
      404,
      "MAINTENANCE_BILL_NOT_FOUND",
      "Maintenance bill not found"
    );
  }


  if (
    bill.status === "PAID"
  ) {

    throw new ApiError(
      400,
      "BILL_ALREADY_PAID",
      "This maintenance bill is already paid"
    );
  }


  if (
    Number(amount) !==
    Number(bill.totalAmount)
  ) {

    throw new ApiError(
      400,
      "PAYMENT_AMOUNT_MISMATCH",
      "Payment amount must match the bill total amount"
    );
  }


  const payment =
    await createPayment({

      societyId,

      flatId:
        bill.flatId,

      billId:
        bill._id,

      amount,

      paymentMethod,

      paymentDate,

      transactionId,

      status:
        "SUCCESS",

      receiptNumber:
        `REC-${Date.now()}`
    });


  await updateBillStatus(

    societyId,

    bill._id,

    "PAID",

    bill.totalAmount
  );


  return payment;
};


// =====================================================
// GET MY PAYMENT HISTORY
// =====================================================

const getPaymentHistory = async ({
  societyId,
  flatId
}) => {

  const payments =
    await findPaymentsByFlat(
      societyId,
      flatId
    );


  return payments;
};


// =====================================================
// GET SOCIETY PAYMENT HISTORY
// =====================================================

const getSocietyPaymentHistory = async ({
  societyId,
  month
}) => {

  const payments =
    await findPaymentsBySociety(
      societyId,
      month
    );


  return payments;
};


// =====================================================
// GET PAYMENT
// =====================================================

const getPayment = async ({
  societyId,
  paymentId
}) => {

  if (
    !mongoose.isValidObjectId(
      paymentId
    )
  ) {
    throw new ApiError(
      400,
      "PAYMENT_ID_INVALID",
      "Payment ID is invalid"
    );
  }


  const payment =
    await findPaymentById(
      societyId,
      paymentId
    );


  if (!payment) {

    throw new ApiError(
      404,
      "PAYMENT_NOT_FOUND",
      "Payment not found"
    );
  }


  return payment;
};
// =====================================================
// GET MAINTENANCE DASHBOARD
// =====================================================

const getMaintenanceDashboard = async ({
  societyId,
  month
}) => {

  if (
    !month ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month
    )
  ) {

    throw new ApiError(
      400,
      "MONTH_INVALID",
      "Month must be in YYYY-MM format"
    );
  }


  const stats =
    await getDashboardStats(
      societyId,
      month
    );


  const bills =
    await findBillsBySocietyAndMonth(
      societyId,
      month
    );


  return {

    month,

    stats,

    bills
  };
};


// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

const createMaintenancePaymentOrder =
  async ({
    societyId,
    billId,
    flatId,
    role,
    userId
  }) => {

    if (
      !mongoose.isValidObjectId(
        billId
      )
    ) {
      throw new ApiError(
        400,
        "BILL_ID_INVALID",
        "Bill ID is invalid"
      );
    }


    const bill =
      await findBillById(
        societyId,
        billId
      );


    if (!bill) {

      throw new ApiError(
        404,
        "MAINTENANCE_BILL_NOT_FOUND",
        "Maintenance bill not found"
      );
    }


    if (
      bill.status === "PAID"
    ) {

      throw new ApiError(
        400,
        "BILL_ALREADY_PAID",
        "This maintenance bill is already paid"
      );
    }


    // ---------------------------------------------------
    // Resident can pay only their own flat's bill
    // ---------------------------------------------------

    if (
      role === "RESIDENT" &&
      bill.flatId.toString() !==
        flatId.toString()
    ) {

      throw new ApiError(
        403,
        "BILL_ACCESS_FORBIDDEN",
        "You can only pay your own maintenance bill"
      );
    }


    // ---------------------------------------------------
    // Create Razorpay order
    // ---------------------------------------------------

    const razorpay =
      getRazorpayClient();


    const order =
      await razorpay.orders.create({

        amount:
          Math.round(
            Number(
              bill.totalAmount
            ) * 100
          ),

        currency:
          "INR",

        receipt:
          `maintenance_${bill._id}`,

        notes: {

          societyId:
            societyId.toString(),

          billId:
            bill._id.toString(),

          userId:
            userId.toString()
        }
      });


    // ---------------------------------------------------
    // Save payment as PENDING
    // ---------------------------------------------------

    const payment =
      await createPayment({

        societyId,

        flatId:
          bill.flatId,

        billId:
          bill._id,

        amount:
          bill.totalAmount,

        paymentMethod:
          "RAZORPAY",

        paymentDate:
          new Date(),

        razorpayOrderId:
          order.id,

        status:
          "PENDING"
      });


    return {

      order,

      paymentId:
        payment._id,

      // Required by Razorpay Checkout
      keyId:
        process.env.RAZORPAY_KEY_ID
    };
  };


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyMaintenancePayment =
  async ({
    societyId,
    billId,
    flatId,
    role,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  }) => {

    if (
      !mongoose.isValidObjectId(
        billId
      )
    ) {
      throw new ApiError(
        400,
        "BILL_ID_INVALID",
        "Bill ID is invalid"
      );
    }


    const bill =
      await findBillById(
        societyId,
        billId
      );


    if (!bill) {

      throw new ApiError(
        404,
        "MAINTENANCE_BILL_NOT_FOUND",
        "Maintenance bill not found"
      );
    }


    if (
      bill.status === "PAID"
    ) {

      throw new ApiError(
        400,
        "BILL_ALREADY_PAID",
        "This maintenance bill is already paid"
      );
    }


    // ---------------------------------------------------
    // Resident can verify only their own flat's bill
    // ---------------------------------------------------

    if (
      role === "RESIDENT" &&
      bill.flatId.toString() !==
        flatId.toString()
    ) {

      throw new ApiError(
        403,
        "BILL_ACCESS_FORBIDDEN",
        "You can only pay your own maintenance bill"
      );
    }


    // ---------------------------------------------------
    // Find the payment created for this Razorpay order
    // ---------------------------------------------------

    const payment =
      await findPaymentByRazorpayOrderId(
        societyId,
        razorpayOrderId
      );


    if (!payment) {

      throw new ApiError(
        404,
        "PAYMENT_NOT_FOUND",
        "Maintenance payment record not found"
      );
    }


    // ---------------------------------------------------
    // Get the order ID saved on our server
    // ---------------------------------------------------

    const serverOrderId =
      payment.razorpayOrderId;


    if (
      !serverOrderId ||
      serverOrderId !== razorpayOrderId
    ) {

      throw new ApiError(
        400,
        "RAZORPAY_ORDER_MISMATCH",
        "Razorpay order verification failed"
      );
    }


    // ---------------------------------------------------
    // Verify Razorpay signature
    // ---------------------------------------------------

    const secret =
      process.env.RAZORPAY_KEY_SECRET;


    if (!secret) {

      throw new ApiError(
        500,
        "RAZORPAY_SECRET_MISSING",
        "Razorpay key secret is not configured"
      );
    }


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${serverOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");


    if (
      expectedSignature !==
      razorpaySignature
    ) {

      await updatePaymentByOrderIfExists(
        societyId,
        razorpayOrderId,
        {
          status:
            "FAILED"
        }
      );


      throw new ApiError(
        400,
        "RAZORPAY_SIGNATURE_INVALID",
        "Razorpay payment verification failed"
      );
    }


    // ---------------------------------------------------
    // Mark payment successful
    // ---------------------------------------------------

    await updatePayment(

      societyId,

      payment._id,

      {

        razorpayPaymentId,

        status:
          "SUCCESS",

        receiptNumber:
          payment.receiptNumber ||
          `REC-${Date.now()}`,

        paymentDate:
          new Date()
      }
    );


    // ---------------------------------------------------
    // Mark bill paid
    // ---------------------------------------------------

    await updateBillStatus(

      societyId,

      bill._id,

      "PAID",

      bill.totalAmount
    );


    const updatedPayment =
      await findPaymentById(
        societyId,
        payment._id
      );


    return updatedPayment;
  };

// =====================================================
// HELPER FOR FAILED RAZORPAY PAYMENT
// =====================================================

const updatePaymentByOrderIfExists =
  async (
    societyId,
    razorpayOrderId,
    updates
  ) => {

    const payment =
      await findPaymentByRazorpayOrderId(
        societyId,
        razorpayOrderId
      );


    if (!payment) {
      return null;
    }


    return updatePayment(

      societyId,

      payment._id,

      updates
    );
  };


// =====================================================
// SOCIETY TRANSPARENCY
// =====================================================
//
// Returns every flat and its maintenance status
// for the selected month.
//
// Resident-safe information:
// - flat number
// - amount
// - status
// - payment date
//
// Possible status:
// - PAID
// - PENDING
// - OVERDUE
// - NO_BILL
// =====================================================

const getMaintenanceTransparency = async ({
  societyId,
  month
}) => {

  if (
    !month ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(
      month
    )
  ) {

    throw new ApiError(
      400,
      "MONTH_INVALID",
      "Month must be in YYYY-MM format"
    );
  }


  const flats =
    await getTransparencyStats(
      societyId,
      month
    );


  return {

    month,

    flats
  };
};


// =====================================================
// EXPORTS
// =====================================================

export {

  createMaintenanceBill,

  generateMonthlyBills,

  getMaintenanceBill,

  getCurrentMaintenanceBill,

  getMaintenanceHistory,

  getSocietyBills,

  updateMaintenanceBill,

  markOverdueBills,

  recordOfflinePayment,

  getPaymentHistory,

  getSocietyPaymentHistory,

  getPayment,

  getMaintenanceDashboard,

  createMaintenancePaymentOrder,

  verifyMaintenancePayment,

  getMaintenanceTransparency
};