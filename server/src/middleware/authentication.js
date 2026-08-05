import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "./asyncHandler.js";
import { verifyJwt } from "../utils/jwt.js";

const extractBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const parts = authorizationHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return null;
  }

  return parts[1];
};

const authenticate = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req.get("Authorization");

  if (!authorizationHeader) {
    throw new ApiError(401, "AUTH_TOKEN_REQUIRED", "Authentication token is required");
  }

  const token = extractBearerToken(authorizationHeader);

  if (!token) {
    throw new ApiError(
      401,
      "AUTH_HEADER_INVALID",
      "Authorization header must use the Bearer token format"
    );
  }

  const payload = verifyJwt(token);

  if (!payload || typeof payload !== "object" || !payload.sub) {
    throw new ApiError(401, "AUTH_TOKEN_INVALID", "Authentication token is invalid");
  }

  const user = await User.findById(payload.sub)
    .select("_id name email role memberType status")
    .lean();

  if (!user) {
    throw new ApiError(
      401,
      "AUTH_USER_NOT_FOUND",
      "The account associated with this token no longer exists"
    );
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    avatarUrl: user.avatarUrl
  };

  next();
});

export { extractBearerToken };
export default authenticate;
