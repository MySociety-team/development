import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    mobileNumber: {
      type: String,
      required: true
    }
  },
  {
    timestamps: false
  }
);

const User = mongoose.model("User", userSchema);

export default User;
