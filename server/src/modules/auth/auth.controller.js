import User from "../../models/User.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { generateJwt } from "../../utils/jwt.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobileNumber = null } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.exists({
    email: normalizedEmail
  });

  if (existingUser) {
    throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
  }

  let user;

  try {
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      mobileNumber
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
    }

    throw error;
  }

  const token = generateJwt(user._id);

  return res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        avatarUrl: user.avatarUrl
      }
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail
  }).select("+password");

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "invalid email or password ");
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "invalid email or password ");
  }

  const token = generateJwt(user._id);

  return res.status(200).json({
    success: true,
    code: "LOGIN_SUCCESS",
    message: "login successfull",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        avatarUrl: user.avatarUrl
      }
    }
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    code: "FETCH_SUCCESS",
    message: "fetched current user",
    data: {
      user: req.user
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    code: "LOGGED_OUT",
    message: "logged out from the current session"
  });
});
