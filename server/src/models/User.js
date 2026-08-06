import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

// Schema
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is Required"],
      trim: true
    },

    email: {
      type: String,
      required: [true, "Email is Required"],
      trim: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: [true, "Password is Required"],
      minlength: [4, "Password must be at least 4 characters"],
      select: false
    },

    mobileNumber: {
      type: String,
      required: [true, "Moblie Number  is Required"],
      trim: true
    },

    avatarUrl: {
      type: String,
      trim: true,
      default:
        "https://static.vecteezy.com/system/resources/thumbnails/020/937/370/small/user-icon-for-your-website-design-logo-app-ui-free-vector.jpg"
    }
  },
  {
    timestamps: true
  }
);

//==============middleware - Run before saving===============
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//===========compare Enter password with hash password from database===============

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

//===========serialization convert document into json===================

userSchema.methods.toJSON = function () {
  //convert mongoose documnet into normal js object
  const user = this.toObject();
  // remove password from user
  delete user.password;
  // return safe user without password ;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
