import mongoose from "mongoose";

const specialCollectionPaymentSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true
    },

    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialCollection",
      required: true,
      index: true
    },

    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true
    },

    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocietyMember",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ["RAZORPAY", "CASH", "UPI", "BANK_TRANSFER", "OTHER"],
      required: true
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    transactionId: {
      type: String,
      trim: true,
      maxlength: 200
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      index: true
    },

    razorpayPaymentId: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true
    },

    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    receiptDocumentUrl: {
      type: String,
      trim: true,
      default: null
    },

    // =====================================================
    // REFUND / ADJUSTMENT
    // =====================================================

    refundStatus: {
      type: String,
      enum: ["NONE", "REFUNDED"],
      default: "NONE",
      index: true
    },

    refundAmount: {
      type: Number,
      min: 0,
      default: 0
    },

    refundDate: {
      type: Date,
      default: null
    },

    refundTransactionId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null
    },

    razorpayRefundId: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null
    },

    refundRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

specialCollectionPaymentSchema.index({
  societyId: 1,
  collectionId: 1,
  residentId: 1
});

specialCollectionPaymentSchema.index({
  societyId: 1,
  collectionId: 1,
  status: 1
});

specialCollectionPaymentSchema.index({
  societyId: 1,
  paymentDate: -1
});

specialCollectionPaymentSchema.index({
  societyId: 1,
  collectionId: 1,
  refundStatus: 1
});

const SpecialCollectionPayment = mongoose.model(
  "SpecialCollectionPayment",
  specialCollectionPaymentSchema
);

export default SpecialCollectionPayment;
