import mongoose from "mongoose";

import Flat from "../../models/Flat.js";
import Society from "../../models/Society.js";
import SocietyMember from "../../models/SocietyMember.js";
import Subscription, { PLAN_NAME, SUBSCRIPTION_STATUS } from "../../models/Subscription.js";

import ApiError from "../../utils/apiError.js";

import { generateUniqueJoiningCode } from "./society.utils.js";

export const checkSocietyCreationSubscription = async ({ userId, session = null }) => {
  const enforcementEnabled = process.env.SOCIETY_SUBSCRIPTION_ENFORCEMENT !== "false";

  if (!enforcementEnabled) {
    return null;
  }

  const now = new Date();

  let query = Subscription.findOne({
    purchasedBy: userId,
    plan: PLAN_NAME.SOCIETY_CREATOR,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    startsAt: {
      $lte: now
    },
    expiresAt: {
      $gt: now
    },
    societyId: null
  }).sort({
    expiresAt: 1
  });

  if (session) {
    query = query.session(session);
  }

  const subscription = await query;

  if (!subscription) {
    throw new ApiError(
      403,
      "SOCIETY_CREATION_SUBSCRIPTION_REQUIRED",
      "An active society creator subscription is required to create a society"
    );
  }

  return subscription;
};

const mapDuplicateKeyError = (error) => {
  if (error?.code !== 11000) {
    return null;
  }

  if (error.keyPattern?.joiningCode) {
    return new ApiError(
      409,
      "SOCIETY_JOINING_CODE_CONFLICT",
      "Unable to create society because the generated joining code already exists"
    );
  }

  if (error.keyPattern?.societyId && error.keyPattern?.flatNumber) {
    return new ApiError(
      409,
      "FLAT_ALREADY_EXISTS",
      "A flat with this number already exists in the society"
    );
  }

  if (error.keyPattern?.societyId && error.keyPattern?.userId) {
    return new ApiError(
      409,
      "SOCIETY_MEMBERSHIP_ALREADY_EXISTS",
      "The user is already a member of this society"
    );
  }

  return new ApiError(409, "RESOURCE_CONFLICT", "A conflicting society record already exists");
};

export const createSociety = async ({ user, payload }) => {
  if (!user?.id) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required");
  }

  if (!user.mobileNumber) {
    throw new ApiError(
      400,
      "USER_MOBILE_REQUIRED",
      "A mobile number is required before creating a society"
    );
  }

  const facilities = [...new Set((payload.facilities ?? []).filter(Boolean))];

  const invitedEmails = [
    ...new Set(
      (payload.invitedEmails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean)
    )
  ];

  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(async () => {
      const subscription = await checkSocietyCreationSubscription({
        userId: user.id,
        session
      });

      const joiningCode = await generateUniqueJoiningCode({
        session
      });

      const [society] = await Society.create(
        [
          {
            name: payload.name,
            address: payload.address,
            joiningCode,

            secretary: user.id,
            createdBy: user.id,

            subscriptionId: subscription?._id ?? null,

            numberOfFlats: payload.numberOfFlats,

            facilities,

            isActive: true
          }
        ],
        {
          session
        }
      );

      const [flat] = await Flat.create(
        [
          {
            societyId: society._id,

            flatNumber: payload.secretaryFlat.flatNumber,

            floor: payload.secretaryFlat.floor,

            wing: payload.secretaryFlat.wing,

            addressNote: payload.secretaryFlat.addressNote,

            flatType: payload.secretaryFlat.flatType,

            isOccupied: true
          }
        ],
        {
          session
        }
      );

      const [membership] = await SocietyMember.create(
        [
          {
            societyId: society._id,
            userId: user.id,
            flatId: flat._id,

            role: "SECRETARY",

            memberType: payload.secretaryFlat.memberType,

            mobileNumber: user.mobileNumber,

            status: "ACTIVE"
          }
        ],
        {
          session
        }
      );

      if (subscription) {
        subscription.societyId = society._id;

        await subscription.save({
          session
        });
      }

      result = {
        society,
        flat,
        membership,
        invitedEmails
      };
    });
  } catch (error) {
    const conflictError = mapDuplicateKeyError(error);

    if (conflictError) {
      throw conflictError;
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return {
    id: result.society._id.toString(),

    name: result.society.name,

    joiningCode: result.society.joiningCode,

    role: result.membership.role,

    memberType: result.membership.memberType,

    flat: {
      id: result.flat._id.toString(),
      flatNumber: result.flat.flatNumber,
      floor: result.flat.floor,
      wing: result.flat.wing,
      addressNote: result.flat.addressNote,
      flatType: result.flat.flatType
    },

    facilities: result.society.facilities,

    invitedEmails: result.invitedEmails
  };
};
