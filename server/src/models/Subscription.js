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
      default: null
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

subscriptionSchema.statics.findActiveForUser = function (userId, options = {}) {
  const { plan, unassignedOnly = false } = options;

  const query = {
    purchasedBy: userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    startsAt: { $lte: new Date() },
    expiresAt: { $gt: new Date() }
  };

  if (plan) {
    query.plan = plan;
  }

  if (unassignedOnly) {
    query.societyId = null;
  }

  return this.findOne(query);
};

subscriptionSchema.index({
  purchasedBy: 1,
  plan: 1,
  status: 1,
  expiresAt: 1
});

subscriptionSchema.index({
  societyId: 1
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export { SUBSCRIPTION_STATUS, PLAN_NAME };
export default Subscription;
