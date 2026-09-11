import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
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
} from "./maintenance.controller.js";

const router = express.Router();

/*
 * All maintenance routes require:
 * 1. Logged-in user
 * 2. Active society membership
 */

router.use(authenticate, requireSocietyMember);

/* =========================================================
   RESIDENT ROUTES
   ========================================================= */

/*
 * Get current/latest maintenance bill
 */
router.get("/:societyId/current", getCurrentBill);

/*
 * Get maintenance bill history
 */
router.get("/:societyId/history", getHistory);

/*
 * Get resident's payment history
 */
router.get("/:societyId/my-payments", getMyPaymentHistory);

/* =========================================================
   SECRETARY ROUTES
   ========================================================= */

/*
 * Create one bill for a flat
 */
router.post("/:societyId/bills", requireSocietyRole("SECRETARY"), createBill);

/*
 * Generate bills for all flats
 */
router.post("/:societyId/bills/generate", requireSocietyRole("SECRETARY"), generateBills);

/*
 * Update an unpaid bill
 */
router.patch("/:societyId/bills/:billId", requireSocietyRole("SECRETARY"), updateBill);

/*
 * Mark overdue bills
 */
router.patch("/:societyId/bills/overdue", requireSocietyRole("SECRETARY"), markOverdue);

/*
 * Record cash / UPI / bank transfer
 */
router.post("/:societyId/payments/offline", requireSocietyRole("SECRETARY"), recordOffline);

/*
 * Get all society payments
 */
router.get("/:societyId/payments", requireSocietyRole("SECRETARY"), getSocietyPayments);

/*
 * Secretary dashboard
 */
router.get("/:societyId/dashboard", requireSocietyRole("SECRETARY"), getDashboard);

/* =========================================================
   SHARED BILL / PAYMENT DETAILS
   ========================================================= */

/*
 * Get one bill
 */
router.get("/:societyId/bills/:billId", getBill);

/*
 * Get one payment / receipt
 */
router.get("/:societyId/payments/:paymentId", getPaymentDetails);

export default router;
