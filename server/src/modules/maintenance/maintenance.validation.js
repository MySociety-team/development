import mongoose from "mongoose";
import Joi from "joi";


// =====================================================
// OBJECT ID
// =====================================================

const objectId =
  Joi.string().custom(
    (value, helpers) => {

      if (
        !mongoose.isValidObjectId(
          value
        )
      ) {

        return helpers.error(
          "any.invalid"
        );

      }

      return value;

    },
    "MongoDB ObjectId validation"
  );


// =====================================================
// MONTH
// =====================================================

const monthSchema =
  Joi.string()
    .pattern(
      /^\d{4}-(0[1-9]|1[0-2])$/
    )
    .messages({
      "string.pattern.base":
        "Month must be in YYYY-MM format"
    });


// =====================================================
// CREATE BILL
// =====================================================

const createBillSchema =
  Joi.object({

    flatId:
      objectId.required(),

    month:
      monthSchema.required(),

    maintenanceAmount:
      Joi.number()
        .min(0)
        .required(),

    dueDate:
      Joi.date().required(),

    lateFee:
      Joi.number()
        .min(0)
        .default(0),

    adjustmentReason:
      Joi.string()
        .trim()
        .max(500)
        .allow("", null)

  });


// =====================================================
// UPDATE BILL
// =====================================================

const updateBillSchema =
  Joi.object({

    maintenanceAmount:
      Joi.number().min(0),

    dueDate:
      Joi.date(),

    lateFee:
      Joi.number().min(0),

    adjustmentReason:
      Joi.string()
        .trim()
        .max(500)
        .allow("", null)

  }).min(1);


// =====================================================
// GENERATE MONTHLY BILLS
// =====================================================

const generateBillsSchema =
  Joi.object({

    month:
      monthSchema.required(),

    dueDate:
      Joi.date().required(),

    defaultMaintenanceAmount:
      Joi.number()
        .min(0)
        .required(),

    lateFee:
      Joi.number()
        .min(0)
        .default(0)

  });


// =====================================================
// MARK OVERDUE
// =====================================================

const markOverdueSchema =
  Joi.object({

    month:
      monthSchema.required()

  });


// =====================================================
// OFFLINE PAYMENT
// =====================================================

const offlinePaymentSchema =
  Joi.object({

    billId:
      objectId.required(),

    amount:
      Joi.number()
        .min(0)
        .required(),

    paymentMethod:
      Joi.string()
        .valid(
          "CASH",
          "UPI",
          "BANK_TRANSFER"
        )
        .required(),

    paymentDate:
      Joi.date().required(),

    transactionId:
      Joi.string()
        .trim()
        .max(200)
        .allow("", null)

  });


// =====================================================
// RAZORPAY CREATE ORDER
// =====================================================

const createPaymentOrderSchema =
  Joi.object({

    billId:
      objectId.required()

  });


// =====================================================
// RAZORPAY VERIFY PAYMENT
// =====================================================

const verifyPaymentSchema =
  Joi.object({

    billId:
      objectId.required(),

    razorpay_order_id:
      Joi.string()
        .trim()
        .required(),

    razorpay_payment_id:
      Joi.string()
        .trim()
        .required(),

    razorpay_signature:
      Joi.string()
        .trim()
        .required()

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

  verifyPaymentSchema

};