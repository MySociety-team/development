import mongoose from "mongoose";
import SocietyMember from "../models/SocietyMember.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const requireSocietyMember = asyncHandler(async (req, res, next) => {
  const { societyId } = req.params;

  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const membership = await SocietyMember.findOne({
    societyId,
    userId: req.user.id,
    status: "ACTIVE"
  });

  if (!membership) {
    throw new ApiError(403, "SOCIETY_MEMBERSHIP_REQUIRED", "You are not a member of this society");
  }

  req.societyMember = membership;

  next();
});

const requireSocietyRole = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const userRole = req.societyMember.role;

    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        "SOCIETY_ROLE_FORBIDDEN",
        "You do not have permission for this society action"
      );
    }

    next();
  });

export { requireSocietyMember, requireSocietyRole };
