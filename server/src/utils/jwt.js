import jwt from "jsonwebtoken";

import ApiError from "./ApiError.js";

const JWT_ALGORITHM = "HS256";

const getJwtConfig = () => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  if (!expiresIn) {
    throw new Error("JWT_EXPIRES_IN environment variable is required");
  }

  return {
    secret,
    expiresIn
  };
};

export const generateJwt = (userId) => {
  if (userId === undefined || userId === null || userId === "") {
    throw new TypeError("generateJwt requires a valid user ID");
  }

  const { secret, expiresIn } = getJwtConfig();

  return jwt.sign({}, secret, {
    algorithm: JWT_ALGORITHM,
    subject: String(userId),
    expiresIn
  });
};

export const verifyJwt = (token) => {
  if (typeof token !== "string" || token.trim() === "") {
    throw new ApiError(401, "AUTH_TOKEN_INVALID", "Authentication token is invalid");
  }

  const { secret } = getJwtConfig();

  try {
    return jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM]
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "AUTH_TOKEN_EXPIRED", "Authentication token has expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "AUTH_TOKEN_INVALID", "Authentication token is invalid");
    }

    throw error;
  }
};
