import mongoose from "mongoose";

const { Schema } = mongoose;

// Schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  mobileNumber: {
    type: String,
    required: true,
    trim: true
  }
});

const User = mongoose.model("User", userSchema);

export default User;
