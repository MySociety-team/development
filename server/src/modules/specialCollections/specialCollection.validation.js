import mongoose from "mongoose";
import Joi from "joi";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }

  return value;
}, "MongoDB ObjectId validation");

const createCollectionSchema = Joi.object({
  title: Joi.string().trim().max(100).required(),

  description: Joi.string().trim().max(500).allow("", null).default(""),

  category: Joi.string()
    .valid("Event", "Repair", "Emergency Fund", "Building Work", "Other")
    .required(),

  amount: Joi.number().greater(0).required(),

  startDate: Joi.date().required(),

  dueDate: Joi.date().required(),

  paymentInstructions: Joi.string().trim().max(1000).allow("", null).default(""),

  imageUrl: Joi.string().trim().uri().allow("", null).default(""),

  documentUrl: Joi.string().trim().uri().allow("", null).default(""),

  audienceType: Joi.string()
    .valid("ALL_FLATS", "SELECTED_FLATS", "SELECTED_RESIDENTS")
    .default("ALL_FLATS"),

  applicableFlatIds: Joi.array().items(objectId).unique().default([]),

  applicableResidentIds: Joi.array().items(objectId).unique().default([]),

  status: Joi.string().valid("DRAFT", "ACTIVE").default("DRAFT")
});

const updateCollectionSchema = Joi.object({
  title: Joi.string().trim().max(100),

  description: Joi.string().trim().max(500).allow("", null),

  category: Joi.string().valid("Event", "Repair", "Emergency Fund", "Building Work", "Other"),

  amount: Joi.number().greater(0),

  startDate: Joi.date(),

  dueDate: Joi.date(),

  paymentInstructions: Joi.string().trim().max(1000).allow("", null),

  imageUrl: Joi.string().trim().uri().allow("", null),

  documentUrl: Joi.string().trim().uri().allow("", null),

  audienceType: Joi.string().valid("ALL_FLATS", "SELECTED_FLATS", "SELECTED_RESIDENTS"),

  applicableFlatIds: Joi.array().items(objectId).unique(),

  applicableResidentIds: Joi.array().items(objectId).unique()
}).min(1);

const offlinePaymentSchema = Joi.object({
  collectionId: objectId.required(),

  flatId: objectId.required(),

  residentId: objectId.required(),

  amount: Joi.number().greater(0).required(),

  paymentMethod: Joi.string().valid("CASH", "UPI", "BANK_TRANSFER", "OTHER").required(),

  paymentDate: Joi.date().required(),

  transactionId: Joi.string().trim().max(200).allow("", null),

  remarks: Joi.string().trim().max(500).allow("", null),

  receiptDocumentUrl: Joi.string().trim().uri().allow("", null)
});

const createPaymentOrderSchema = Joi.object({
  collectionId: objectId.required()
});

const verifyPaymentSchema = Joi.object({
  collectionId: objectId.required(),

  razorpay_order_id: Joi.string().trim().required(),

  razorpay_payment_id: Joi.string().trim().required(),

  razorpay_signature: Joi.string().trim().required()
});

export {
  createCollectionSchema,
  updateCollectionSchema,
  offlinePaymentSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema
};
