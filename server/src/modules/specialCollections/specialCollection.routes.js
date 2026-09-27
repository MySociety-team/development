import express from "express";

import {
  createSpecialCollectionController,
  getSpecialCollectionsController,
  getSpecialCollectionController,
  getSpecialCollectionSelectionOptionsController,
  updateSpecialCollectionController,
  activateSpecialCollectionController,
  closeSpecialCollectionController,
  cancelSpecialCollectionController,
  getResidentCollectionStatusController,
  recordOfflinePaymentController,
  refundSpecialCollectionPaymentController,
  createSpecialCollectionPaymentOrderController,
  verifySpecialCollectionPaymentController,
  getMySpecialCollectionPaymentsController,
  getFlatSpecialCollectionPaymentsController,
  getSpecialCollectionPaymentsController,
  getSpecialCollectionSummaryController,
  getSpecialCollectionPaymentController,
  sendSpecialCollectionReminderController
} from "./specialCollection.controller.js";

import authenticate from "../../middleware/authentication.js";

import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

const router = express.Router();

router.use(authenticate);

// =====================================================
// COLLECTIONS
// =====================================================

// Get collections

router.get(
  "/:societyId/special-collections",
  requireSocietyMember,
  getSpecialCollectionsController
);

// Create collection

router.post(
  "/:societyId/special-collections",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  createSpecialCollectionController
);

// =====================================================
// COLLECTION SELECTION OPTIONS
// =====================================================

// Get flats and active residents for collection audience selection

router.get(
  "/:societyId/special-collections/selection-options",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  getSpecialCollectionSelectionOptionsController
);

// Get single collection

router.get(
  "/:societyId/special-collections/:collectionId",
  requireSocietyMember,
  getSpecialCollectionController
);

// Update collection

router.put(
  "/:societyId/special-collections/:collectionId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateSpecialCollectionController
);

// Activate collection

router.patch(
  "/:societyId/special-collections/:collectionId/activate",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  activateSpecialCollectionController
);

// Close collection

router.patch(
  "/:societyId/special-collections/:collectionId/close",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  closeSpecialCollectionController
);

// Cancel collection

router.patch(
  "/:societyId/special-collections/:collectionId/cancel",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  cancelSpecialCollectionController
);

// =====================================================
// RESIDENT STATUS
// =====================================================

router.get(
  "/:societyId/special-collections/:collectionId/status",
  requireSocietyMember,
  getResidentCollectionStatusController
);

// =====================================================
// COLLECTION PAYMENT MANAGEMENT
// =====================================================

// Get all payments for a collection

router.get(
  "/:societyId/special-collections/:collectionId/payments",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  getSpecialCollectionPaymentsController
);

// Get collection summary

router.get(
  "/:societyId/special-collections/:collectionId/summary",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  getSpecialCollectionSummaryController
);

// Send manual reminder

router.post(
  "/:societyId/special-collections/:collectionId/reminder",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  sendSpecialCollectionReminderController
);

// =====================================================
// ONLINE PAYMENT
// =====================================================

// Create Razorpay order

router.post(
  "/:societyId/special-collections/payments/order",
  requireSocietyMember,
  createSpecialCollectionPaymentOrderController
);

// Verify Razorpay payment

router.post(
  "/:societyId/special-collections/payments/verify",
  requireSocietyMember,
  verifySpecialCollectionPaymentController
);

// =====================================================
// OFFLINE PAYMENT
// =====================================================

// Secretary records cash / UPI / bank transfer payment

router.post(
  "/:societyId/special-collections/payments/offline",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  recordOfflinePaymentController
);

// =====================================================
// REFUND / ADJUSTMENT
// =====================================================

// Secretary refunds a successful payment

router.post(
  "/:societyId/special-collections/payments/:paymentId/refund",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  refundSpecialCollectionPaymentController
);

// =====================================================
// PAYMENT HISTORY
// =====================================================

// Get single payment

router.get(
  "/:societyId/special-collections/payments/:paymentId",
  requireSocietyMember,
  getSpecialCollectionPaymentController
);

// Get current resident's payments

router.get(
  "/:societyId/special-collections/my-payments",
  requireSocietyMember,
  getMySpecialCollectionPaymentsController
);

// Get payments of a particular flat

router.get(
  "/:societyId/special-collections/flats/:flatId/payments",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  getFlatSpecialCollectionPaymentsController
);

export default router;
