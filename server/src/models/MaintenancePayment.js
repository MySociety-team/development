import mongoose from "mongoose";

const maintenancePaymentSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true
    },

    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true
    },

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaintenanceBill",
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
      enum: ["RAZORPAY", "CASH", "UPI", "BANK_TRANSFER"],
      required: true
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    transactionId: {
      type: String,
      trim: true
    },

    razorpayOrderId: {
      type: String,
      trim: true
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
    }
  },
  {
    timestamps: true
  }
);

maintenancePaymentSchema.index({
  societyId: 1,
  billId: 1
});

maintenancePaymentSchema.index({
  societyId: 1,
  flatId: 1,
  paymentDate: -1
});

export default mongoose.model("MaintenancePayment", maintenancePaymentSchema);
