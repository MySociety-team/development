import { randomInt } from "node:crypto";

import Society from "../../models/Society.js";
import ApiError from "../../utils/apiError.js";

export const APPROVED_FACILITIES = Object.freeze([
  "GYM",
  "SWIMMING_POOL",
  "CLUBHOUSE",
  "PARKING",
  "SECURITY",
  "GARDEN",
  "CHILDREN_PLAY_AREA",
  "COMMUNITY_HALL",
  "LIFT",
  "POWER_BACKUP"
]);

const JOINING_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DEFAULT_JOINING_CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

/**
 * Normalizes a facility name.
 *
 * Approved facilities are returned in enum format.
 * Custom facilities are returned as readable title-cased strings.
 */
export const normalizeFacility = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  const enumCandidate = trimmed.toUpperCase().replace(/[\s-]+/g, "_");

  if (APPROVED_FACILITIES.includes(enumCandidate)) {
    return enumCandidate;
  }

  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Creates a random joining code.
 */
const createJoiningCodeCandidate = (length = DEFAULT_JOINING_CODE_LENGTH) => {
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += JOINING_CODE_CHARACTERS[randomInt(0, JOINING_CODE_CHARACTERS.length)];
  }

  return result;
};

/**
 * Checks whether a joining code is unique.
 */
export const isJoiningCodeUnique = async (joiningCode, { session = null } = {}) => {
  let query = Society.exists({
    joiningCode
  });

  if (session) {
    query = query.session(session);
  }

  const existingSociety = await query;

  return !existingSociety;
};

/**
 * Generates a unique society joining code.
 */
export const generateUniqueJoiningCode = async ({
  session = null,
  attempts = MAX_ATTEMPTS,
  length = DEFAULT_JOINING_CODE_LENGTH
} = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const joiningCode = createJoiningCodeCandidate(length);

    const isUnique = await isJoiningCodeUnique(joiningCode, { session });

    if (isUnique) {
      return joiningCode;
    }
  }

  throw new ApiError(
    500,
    "JOINING_CODE_GENERATION_FAILED",
    "Unable to generate a unique society joining code"
  );
};

/**
 * Backwards-compatible joining code generator.
 *
 * Allows:
 * import generateJoiningCode from "./society.util.js";
 */
const generateJoiningCode = async (options = {}) => generateUniqueJoiningCode(options);

export default generateJoiningCode;
