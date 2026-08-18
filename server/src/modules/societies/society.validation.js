import mongoose from "mongoose";

import ApiError from "../../utils/apiError.js";

export const FLAT_TYPES = Object.freeze(["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5BHK"]);
export const MEMBER_TYPES = Object.freeze(["OWNER", "TENANT", "FAMILY_MEMBER"]);
export const INCLUDED_FLATS = 25;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[1-9]\d{7,14}$/;

const requireString = (value, field, label) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} is required`, {
      field
    });
  }

  return value.trim();
};

const requirePositiveInteger = (value, field, label) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be a positive integer`, {
      field
    });
  }

  return number;
};

const requireInteger = (value, field, label) => {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be an integer`, {
      field
    });
  }

  return number;
};

export const validateMobileNumber = (value, field = "mobileNumber") => {
  const mobileNumber = requireString(value, field, "Mobile number");

  if (!MOBILE_PATTERN.test(mobileNumber)) {
    throw new ApiError(
      400,
      "INVALID_MOBILE_NUMBER",
      "Mobile number must contain 8 to 15 digits and may start with +"
    );
  }

  return mobileNumber;
};

export const normalizeInvitedEmails = (values = []) => {
  if (!Array.isArray(values)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invited emails must be an array", {
      field: "invitedEmails"
    });
  }

  const normalized = [
    ...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))
  ];

  const invalidEmail = normalized.find((email) => !EMAIL_PATTERN.test(email));

  if (invalidEmail) {
    throw new ApiError(
      400,
      "INVALID_INVITED_EMAIL",
      `${invalidEmail} is not a valid email address`
    );
  }

  return normalized;
};

const validateFlatPayload = (flat, prefix) => {
  if (!flat || typeof flat !== "object") {
    throw new ApiError(400, "VALIDATION_ERROR", "Flat details are required", {
      field: prefix
    });
  }

  const flatNumber = requireString(flat.flatNumber, `${prefix}.flatNumber`, "Flat number");
  const floor = requireInteger(flat.floor, `${prefix}.floor`, "Floor");
  const wing = requireString(flat.wing, `${prefix}.wing`, "Wing");
  const addressNote = requireString(flat.addressNote, `${prefix}.addressNote`, "Flat address");
  const flatType = requireString(flat.flatType, `${prefix}.flatType`, "Flat type").toUpperCase();
  const memberType = requireString(
    flat.memberType,
    `${prefix}.memberType`,
    "Member type"
  ).toUpperCase();

  if (!FLAT_TYPES.includes(flatType)) {
    throw new ApiError(
      400,
      "INVALID_FLAT_TYPE",
      `Flat type must be one of ${FLAT_TYPES.join(", ")}`
    );
  }

  if (!MEMBER_TYPES.includes(memberType)) {
    throw new ApiError(
      400,
      "INVALID_MEMBER_TYPE",
      `Member type must be one of ${MEMBER_TYPES.join(", ")}`
    );
  }

  return {
    flatNumber,
    floor,
    wing,
    addressNote,
    flatType,
    memberType
  };
};

export const validateCreateSocietyPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "VALIDATION_ERROR", "Society details are required");
  }

  const facilities = payload.facilities ?? [];

  if (!Array.isArray(facilities)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Facilities must be an array", {
      field: "facilities"
    });
  }

  if (facilities.some((facility) => typeof facility !== "string")) {
    throw new ApiError(400, "VALIDATION_ERROR", "Every facility must be text", {
      field: "facilities"
    });
  }

  const numberOfFlats = requirePositiveInteger(
    payload.numberOfFlats,
    "numberOfFlats",
    "Number of flats"
  );

  if (numberOfFlats > INCLUDED_FLATS) {
    throw new ApiError(
      400,
      "ADDITIONAL_FLAT_PAYMENT_REQUIRED",
      `The base creator subscription includes up to ${INCLUDED_FLATS} flats. Additional-flat billing must be configured before creating a larger society.`
    );
  }

  return {
    name: requireString(payload.name, "name", "Society name"),
    address: requireString(payload.address, "address", "Society address"),
    numberOfFlats,
    facilities,
    invitedEmails: normalizeInvitedEmails(payload.invitedEmails ?? []),
    mobileNumber:
      payload.mobileNumber === undefined ||
      payload.mobileNumber === null ||
      payload.mobileNumber === ""
        ? null
        : validateMobileNumber(payload.mobileNumber),
    secretaryFlat: validateFlatPayload(payload.secretaryFlat, "secretaryFlat")
  };
};

export const validateJoiningCodePayload = (payload) => {
  const joiningCode = requireString(payload?.joiningCode, "joiningCode", "Joining code")
    .toUpperCase()
    .replace(/\s+/g, "");

  if (joiningCode.length < 6 || joiningCode.length > 12) {
    throw new ApiError(
      400,
      "JOINING_CODE_INVALID",
      "Joining code must contain between 6 and 12 characters"
    );
  }

  return {
    joiningCode
  };
};

export const validateJoinSocietyPayload = ({ societyId, payload }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const flat = validateFlatPayload(payload, "flat");

  const mobileNumber = validateMobileNumber(payload?.mobileNumber);

  return {
    ...flat,
    mobileNumber,
    invitedEmails: normalizeInvitedEmails(payload?.invitedEmails ?? [])
  };
};
