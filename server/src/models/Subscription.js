import mongoose from "mongoose";

const { Schema } = mongoose;

const SUBSCRIPTION_STATUS = {
  CREATED: "created",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  FAILED: "failed"
};

const PLAN_NAME = {
  BASIC: "basic",
  SOCIETY_CREATOR: "society_creator"
};

const subscriptionSchema = new Schema(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: [true, "Society is Required"]
    },

    purchasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Purchased By is Required"]
    },

    plan: {
      type: String,
      default: PLAN_NAME.BASIC,
      enum: Object.values(PLAN_NAME)
    },

    amountPaise: {
      type: Number,
      required: [true, "Amount is Required"],
      min: [0, "Amount cannot be negative"]
    },

    status: {
      type: String,
      required: [true, "Status is Required"],
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.CREATED
    },

    razorpayOrderId: {
      type: String,
      trim: true
    },

    razorpayPaymentId: {
      type: String,
      trim: true
    },

    startsAt: {
      type: Date,
      required: [true, "Start Date is Required"]
    },

    expiresAt: {
      type: Date,
      required: [true, "End Date is Required"]
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.pre("validate", function (next) {
  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
    this.invalidate("expiresAt", "End date must be after start date");
  }

  next();
});

subscriptionSchema.statics.findActive = function () {
  return this.find({
    status: SUBSCRIPTION_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() }
  });
};

// TODO: Remove development-only subscription bypass before final presentation.
const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { SUBSCRIPTION_STATUS, PLAN_NAME };
export default Subscription;
