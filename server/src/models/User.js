import bcrypt from "bcrypt";
import mongoose from "mongoose";

const { Schema } = mongoose;

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
      trim: true,
      default: null
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
