import mongoose from "mongoose";

const { Schema } = mongoose;

const complaintSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is Required"]
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is Required"]
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: [true, "Flat ID is Required"]
    },
    title: {
      type: String,
      required: [true, "Title is Required"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is Required"],
      uppercase: true,
      enum: {
        values: ["PLUMBING", "ELECTRICAL", "SECURITY", "CLEANLINESS", "OTHER"],
        message: "Category must be PLUMBING, ELECTRICAL, SECURITY, CLEANLINESS, or OTHER"
      }
    },
    description: {
      type: String,
      required: [true, "Description is Required"],
      trim: true,
      maxLength: [500, "Description cannot exceed 500 characters"]
    },
    status: {
      type: String,
      required: true,
      lowercase: true,
      enum: {
        values: ["pending", "resolved", "rejected"],
        message: "Status must be pending, resolved, or rejected"
      },
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, userId: 1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
