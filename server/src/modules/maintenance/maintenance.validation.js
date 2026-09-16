import mongoose from "mongoose";
import Joi from "joi";

// =====================================================
// OBJECT ID VALIDATION
// =====================================================

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }

  return value;
}, "MongoDB ObjectId validation");

// =====================================================
// MONTH VALIDATION
// =====================================================

const monthSchema = Joi.string()
  .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
  .messages({
    "string.pattern.base": "Month must be in YYYY-MM format"
  });

// =====================================================
// FLAT TYPE
// =====================================================

const flatTypeSchema = Joi.string().valid("1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK").required();

// =====================================================
// CREATE BILL
// =====================================================

const createBillSchema = Joi.object({
  flatId: objectId.required(),

  month: monthSchema.required(),

  maintenanceAmount: Joi.number().min(0).required(),

  dueDate: Joi.date().required(),

  lateFee: Joi.number().min(0).default(0),

  adjustmentReason: Joi.string().trim().max(500).allow("", null)
});

// =====================================================
// UPDATE BILL
// =====================================================

const updateBillSchema = Joi.object({
  maintenanceAmount: Joi.number().min(0),

  dueDate: Joi.date(),

  lateFee: Joi.number().min(0),

  adjustmentReason: Joi.string().trim().max(500).allow("", null)
}).min(1);

// =====================================================
// GENERATE MONTHLY BILLS
// =====================================================
//
// maintenance amount is NOT accepted here.
//
// The amount is automatically taken from:
//
// Flat.flatType
//       ↓
// MaintenanceRate
//       ↓
// maintenanceAmount
//
// Example:
//
// 1BHK → ₹1000
// 2BHK → ₹2000
// 3BHK → ₹3000
//

const generateBillsSchema = Joi.object({
  month: monthSchema.required(),

  dueDate: Joi.date().required(),

  lateFee: Joi.number().min(0).default(0)
});

// =====================================================
// MARK OVERDUE
// =====================================================

const markOverdueSchema = Joi.object({
  month: monthSchema.required()
});

// =====================================================
// OFFLINE PAYMENT
// =====================================================

const offlinePaymentSchema = Joi.object({
  billId: objectId.required(),

  amount: Joi.number().min(0).required(),

  paymentMethod: Joi.string().valid("CASH", "UPI", "BANK_TRANSFER").required(),

  paymentDate: Joi.date().required(),

  transactionId: Joi.string().trim().max(200).allow("", null)
});

// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

const createPaymentOrderSchema = Joi.object({
  billId: objectId.required()
});

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyPaymentSchema = Joi.object({
  billId: objectId.required(),

  razorpay_order_id: Joi.string().trim().required(),

  razorpay_payment_id: Joi.string().trim().required(),

  razorpay_signature: Joi.string().trim().required()
});

// =====================================================
// CREATE / UPDATE MAINTENANCE RATE
// =====================================================
//
// Example:
//
// flatType: "2BHK"
// amount: 2000
//

const maintenanceRateSchema = Joi.object({
  flatType: flatTypeSchema,

  amount: Joi.number().min(0).required()
});

// =====================================================
// EXPORT
// =====================================================

export {
  createBillSchema,
  updateBillSchema,
  generateBillsSchema,
  markOverdueSchema,
  offlinePaymentSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
  maintenanceRateSchema
};
