import mongoose from "mongoose";

const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is required"]
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat ID is required"]
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true
    },
    category: {
      type: String,
      enum: {
        values: ["PLUMBING", "ELECTRICAL", "SECURITY", "CLEANLINESS", "SECRETARY", "OTHER"],
        message: "Invalid complaint category"
      },
      default: "OTHER",
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "resolved", "rejected"],
        message: "Status must be pending, resolved, or rejected"
      },
      default: "pending",
      required: true
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: ""
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ societyId: 1, createdAt: -1 });
complaintSchema.index({ societyId: 1, userId: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
