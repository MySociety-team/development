import mongoose from "mongoose";

const maintenanceBillSchema = new mongoose.Schema(
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

    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/
    },

    maintenanceAmount: {
      type: Number,
      required: true,
      min: 0
    },

    dueDate: {
      type: Date,
      required: true
    },

    lateFee: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "OVERDUE"],
      default: "PENDING",
      index: true
    },

    adjustmentReason: {
      type: String,
      trim: true,
      maxlength: 500
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

maintenanceBillSchema.index(
  {
    societyId: 1,
    flatId: 1,
    month: 1
  },
  {
    unique: true
  }
);

maintenanceBillSchema.index({
  societyId: 1,
  month: 1,
  status: 1
});

export default mongoose.model("MaintenanceBill", maintenanceBillSchema);
