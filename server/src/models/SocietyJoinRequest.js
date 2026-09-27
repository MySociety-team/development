import mongoose from "mongoose";

const { Schema } = mongoose;

const societyJoinRequestSchema = new Schema(
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

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      required: true
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    flatNumber: {
      type: String,
      trim: true,
      default: ""
    },

    floor: {
      type: Number,
      default: null
    },

    wing: {
      type: String,
      trim: true,
      default: ""
    },

    addressNote: {
      type: String,
      trim: true,
      default: ""
    },

    flatType: {
      type: String,
      enum: ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK", ""],
      default: "2BHK"
    },

    memberType: {
      type: String,
      enum: ["OWNER", "TENANT", "FAMILY_MEMBER"],
      default: "OWNER"
    },

    mobileNumber: {
      type: String,
      trim: true,
      default: ""
    },

    invitedEmails: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// There can be only one request record per user/society pair. Rejected requests
// are moved back to PENDING when the user enters the joining code again.
societyJoinRequestSchema.index({ societyId: 1, userId: 1 }, { unique: true });
societyJoinRequestSchema.index({ societyId: 1, status: 1, createdAt: -1 });

const SocietyJoinRequest = mongoose.model("SocietyJoinRequest", societyJoinRequestSchema);

export default SocietyJoinRequest;
