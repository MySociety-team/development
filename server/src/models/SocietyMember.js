import mongoose from "mongoose";

const { Schema } = mongoose;

const societyMemberSchema = new Schema(
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

    role: {
      type: String,
      enum: {
        values: ["SECRETARY", "RESIDENT"],
        message: "Role must be SECRETARY or RESIDENT"
      },
      default: "RESIDENT",
      required: true
    },

    memberType: {
      type: String,
      enum: {
        values: ["OWNER", "TENANT", "FAMILY_MEMBER"],
        message: "Member type must be OWNER, TENANT or FAMILY_MEMBER"
      },
      default: "OWNER",
      required: true
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile Number is Required"],
      trim: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent the same user from joining the same society twice
societyMemberSchema.index({ societyId: 1, userId: 1 }, { unique: true });

// Find members of a flat based on society and status
societyMemberSchema.index({
  societyId: 1,
  flatId: 1,
  status: 1
});

const SocietyMember = mongoose.model("SocietyMember", societyMemberSchema);

export default SocietyMember;
