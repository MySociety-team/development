import mongoose from "mongoose";

const { Schema } = mongoose;

const financeSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is Required"],
      index: true
    },

    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
      index: true
    },

    title: {
      type: String,
      required: [true, "Title is Required"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"]
    },

    description: {
      type: String,
      trim: true,
      maxLength: [500, "Description cannot exceed 500 characters"],
      default: ""
    },

    amount: {
      type: Number,
      required: [true, "Amount is Required"],
      min: [0.01, "Amount must be greater than 0"]
    },

    type: {
      type: String,
      required: [true, "Type is Required"],
      enum: {
        values: ["INCOME", "EXPENSE"],
        message: "Type must be INCOME or EXPENSE"
      }
    },

    category: {
      type: String,
      required: [true, "Category is Required"],
      trim: true,
      maxLength: [100, "Category cannot exceed 100 characters"]
    },

    date: {
      type: Date,
      required: [true, "Date is Required"]
    },

    paymentMethod: {
      type: String,
      required: [true, "Payment Method is Required"],
      enum: {
        values: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "RAZORPAY", "OTHER"],
        message: "Payment Method must be CASH, UPI, BANK_TRANSFER, CARD or OTHER"
      }
    },

    documentUrl: {
      type: String,
      trim: true,
      default: null
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created By is Required"]
    },

    // Used to connect automatically-created
    // Finance records with their source record.
    sourceType: {
      type: String,
      trim: true,
      default: null
    },

    sourcePaymentId: {
      type: Schema.Types.ObjectId,
      ref: "MaintenancePayment",
      default: null
    }
  },
  {
    timestamps: true
  }
);

financeSchema.index({ societyId: 1, type: 1 });
financeSchema.index({ societyId: 1, date: -1 });
financeSchema.index({ societyId: 1, category: 1 });
financeSchema.index({ societyId: 1, flatId: 1 });

// Prevent duplicate Finance entries for the same
// MaintenancePayment.
financeSchema.index(
  {
    sourceType: 1,
    sourcePaymentId: 1
  },
  {
    unique: true,
    sparse: true
  }
);

const Finance = mongoose.model("Finance", financeSchema);

export default Finance;
