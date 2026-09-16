import express from "express";

import authenticate
  from "../../middleware/authentication.js";

import validate
  from "../../middleware/validation.js";

import {
  requireSocietyMember,
  requireSocietyRole
} from "../../middleware/societyAuthorization.js";


import {
  createBillSchema,
  updateBillSchema,
  generateBillsSchema,
  markOverdueSchema,
  offlinePaymentSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema
} from "./maintenance.validation.js";


import {
  createBill,
  generateBills,
  getBill,
  getBillsByMonth,
  getCurrentBill,
  getHistory,
  updateBill,
  markOverdue,
  recordOffline,
  getMyPaymentHistory,
  getSocietyPayments,
  getPaymentDetails,
  getDashboard,
  getTransparency,
  createPaymentOrder,
  verifyPayment
} from "./maintenance.controller.js";


const router =
  express.Router();


// =====================================================
// BILL ROUTES
// =====================================================


// -----------------------------------------------------
// CREATE ONE BILL
// -----------------------------------------------------

router.post(
  "/:societyId/bills",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  validate(
    createBillSchema
  ),

  createBill
);


// -----------------------------------------------------
// GENERATE MONTHLY BILLS
// -----------------------------------------------------

router.post(
  "/:societyId/bills/generate",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  validate(
    generateBillsSchema
  ),

  generateBills
);


// -----------------------------------------------------
// GET BILLS BY MONTH
// -----------------------------------------------------

router.get(
  "/:societyId/bills/month",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  getBillsByMonth
);


// -----------------------------------------------------
// MARK BILLS OVERDUE
// -----------------------------------------------------

router.patch(
  "/:societyId/bills/overdue",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  validate(
    markOverdueSchema
  ),

  markOverdue
);


// -----------------------------------------------------
// UPDATE BILL
// -----------------------------------------------------

router.patch(
  "/:societyId/bills/:billId",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  validate(
    updateBillSchema
  ),

  updateBill
);


// -----------------------------------------------------
// GET PARTICULAR BILL
// -----------------------------------------------------

router.get(
  "/:societyId/bills/:billId",

  authenticate,

  requireSocietyMember,

  getBill
);


// =====================================================
// PAYMENT ROUTES
// =====================================================


// -----------------------------------------------------
// RECORD OFFLINE PAYMENT
// -----------------------------------------------------

router.post(
  "/:societyId/payments/offline",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  validate(
    offlinePaymentSchema
  ),

  recordOffline
);


// -----------------------------------------------------
// SOCIETY PAYMENT HISTORY
// -----------------------------------------------------

router.get(
  "/:societyId/payments",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  getSocietyPayments
);


// -----------------------------------------------------
// PARTICULAR PAYMENT
// -----------------------------------------------------

router.get(
  "/:societyId/payments/:paymentId",

  authenticate,

  requireSocietyMember,

  getPaymentDetails
);


// =====================================================
// DASHBOARD
// =====================================================

router.get(
  "/:societyId/dashboard",

  authenticate,

  requireSocietyMember,

  requireSocietyRole(
    "SECRETARY"
  ),

  getDashboard
);


// =====================================================
// RESIDENT ROUTES
// =====================================================


// -----------------------------------------------------
// SOCIETY TRANSPARENCY
// -----------------------------------------------------

router.get(
  "/:societyId/transparency",

  authenticate,

  requireSocietyMember,

  getTransparency
);


// -----------------------------------------------------
// CURRENT BILL
// -----------------------------------------------------

router.get(
  "/:societyId/current",

  authenticate,

  requireSocietyMember,

  getCurrentBill
);


// -----------------------------------------------------
// MAINTENANCE HISTORY
// -----------------------------------------------------

router.get(
  "/:societyId/history",

  authenticate,

  requireSocietyMember,

  getHistory
);


// -----------------------------------------------------
// MY PAYMENT HISTORY
// -----------------------------------------------------

router.get(
  "/:societyId/my-payments",

  authenticate,

  requireSocietyMember,

  getMyPaymentHistory
);


// =====================================================
// RAZORPAY
// =====================================================


// -----------------------------------------------------
// CREATE PAYMENT ORDER
// -----------------------------------------------------

router.post(
  "/:societyId/payment-order",

  authenticate,

  requireSocietyMember,

  validate(
    createPaymentOrderSchema
  ),

  createPaymentOrder
);


// -----------------------------------------------------
// VERIFY PAYMENT
// -----------------------------------------------------

router.post(
  "/:societyId/verify-payment",

  authenticate,

  requireSocietyMember,

  validate(
    verifyPaymentSchema
  ),

  verifyPayment
);


export default router;