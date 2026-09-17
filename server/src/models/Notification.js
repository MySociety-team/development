import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"]
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society ID is required"]
    },
    type: {
      type: String,
      enum: {
        values: [
          "MEETING_SCHEDULED",
          "MEETING_UPDATED",
          "MEETING_CANCELLED",
          "COMPLAINT_FILED",
          "COMPLAINT_RESOLVED",
          "COMPLAINT_REJECTED",
          "MEMBER_JOINED",
          "GENERAL"
        ],
        message: "Invalid notification type"
      },
      default: "GENERAL",
      required: true
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true
    },
    link: {
      type: String,
      trim: true,
      default: ""
    },
    read: {
      type: Boolean,
      default: false,
      required: true
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, societyId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
