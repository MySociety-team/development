import mongoose from "mongoose";

import Flat from "../../models/Flat.js";
import Society from "../../models/Society.js";
import SocietyMember from "../../models/SocietyMember.js";
import Subscription, { PLAN_NAME, SUBSCRIPTION_STATUS } from "../../models/Subscription.js";
import User from "../../models/User.js";
import ApiError from "../../utils/apiError.js";

import { generateUniqueJoiningCode, normalizeFacility } from "./society.utils.js";
import {
  validateCreateSocietyPayload,
  validateJoiningCodePayload,
  validateJoinSocietyPayload
} from "./society.validation.js";
import { createBulkNotifications } from "../notifications/notification.service.js";

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
    }
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

const serializeFlat = (flat) => {
  if (!flat) {
    return null;
  }

  return {
    id: flat._id.toString(),
    flatNumber: flat.flatNumber,
    floor: flat.floor,
    wing: flat.wing,
    addressNote: flat.addressNote,
    flatType: flat.flatType,
    invitedEmails: flat.invitedEmails ?? []
  };
};

export const createSociety = async ({ user, payload }) => {
  if (!user?.id) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required");
  }

  const validated = validateCreateSocietyPayload(payload);

  const secretaryMobileNumber = validated.mobileNumber ?? user.mobileNumber;

  if (!secretaryMobileNumber) {
    throw new ApiError(
      400,
      "USER_MOBILE_REQUIRED",
      "A mobile number is required before creating a society"
    );
  }

  const facilities = [...new Set(validated.facilities.map(normalizeFacility).filter(Boolean))];

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
            name: validated.name,
            address: validated.address,
            joiningCode,
            secretary: user.id,
            createdBy: user.id,
            subscriptionId: subscription?._id ?? null,
            numberOfFlats: validated.numberOfFlats,
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
            flatNumber: validated.secretaryFlat.flatNumber,
            floor: validated.secretaryFlat.floor,
            wing: validated.secretaryFlat.wing,
            addressNote: validated.secretaryFlat.addressNote,
            flatType: validated.secretaryFlat.flatType,
            invitedEmails: validated.invitedEmails,
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
            memberType: validated.secretaryFlat.memberType,
            mobileNumber: secretaryMobileNumber,
            status: "ACTIVE"
          }
        ],
        {
          session
        }
      );

      if (secretaryMobileNumber !== user.mobileNumber) {
        await User.updateOne(
          {
            _id: user.id
          },
          {
            $set: {
              mobileNumber: secretaryMobileNumber
            }
          },
          {
            session
          }
        );
      }

      result = {
        society,
        flat,
        membership
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
    address: result.society.address,
    joiningCode: result.society.joiningCode,
    numberOfFlats: result.society.numberOfFlats,
    facilities: result.society.facilities,
    role: result.membership.role,
    memberType: result.membership.memberType,
    flat: serializeFlat(result.flat)
  };
};

export const getMySocieties = async ({ userId }) => {
  const memberships = await SocietyMember.find({
    userId,
    status: "ACTIVE"
  })
    .populate({
      path: "societyId",
      select: "name address joiningCode secretary numberOfFlats facilities isActive"
    })
    .populate({
      path: "flatId",
      select: "flatNumber floor wing addressNote flatType invitedEmails"
    })
    .sort({
      createdAt: -1
    })
    .lean();

  return memberships
    .filter((membership) => membership.societyId?.isActive)
    .map((membership) => ({
      membershipId: membership._id.toString(),
      id: membership.societyId._id.toString(),
      name: membership.societyId.name,
      address: membership.societyId.address,
      joiningCode: membership.societyId.joiningCode,
      numberOfFlats: membership.societyId.numberOfFlats,
      facilities: membership.societyId.facilities,
      role: membership.role,
      memberType: membership.memberType,
      flat: serializeFlat(membership.flatId)
    }));
};

export const verifyJoiningCode = async ({ userId, payload }) => {
  const { joiningCode } = validateJoiningCodePayload(payload);

  const society = await Society.findOne({
    joiningCode,
    isActive: true
  })
    .select("_id name address numberOfFlats facilities joiningCode")
    .lean();

  if (!society) {
    throw new ApiError(
      404,
      "SOCIETY_JOINING_CODE_NOT_FOUND",
      "No active society exists for this joining code"
    );
  }

  const existingMembership = await SocietyMember.exists({
    societyId: society._id,
    userId,
    status: "ACTIVE"
  });

  return {
    id: society._id.toString(),
    name: society.name,
    address: society.address,
    joiningCode: society.joiningCode,
    numberOfFlats: society.numberOfFlats,
    facilities: society.facilities,
    alreadyMember: Boolean(existingMembership)
  };
};

const flatDetailsMatch = (existingFlat, details) => {
  return (
    existingFlat.floor === details.floor &&
    existingFlat.wing.trim().toLowerCase() === details.wing.trim().toLowerCase() &&
    existingFlat.flatType === details.flatType
  );
};

export const joinSociety = async ({ user, societyId, payload }) => {
  const validated = validateJoinSocietyPayload({
    societyId,
    payload
  });

  const session = await mongoose.startSession();

  let result;

  try {
    await session.withTransaction(async () => {
      const society = await Society.findOne({
        _id: societyId,
        isActive: true
      }).session(session);

      if (!society) {
        throw new ApiError(404, "SOCIETY_NOT_FOUND", "The requested society does not exist");
      }

      const existingMembership = await SocietyMember.findOne({
        societyId,
        userId: user.id
      }).session(session);

      if (existingMembership?.status === "ACTIVE") {
        throw new ApiError(
          409,
          "SOCIETY_MEMBERSHIP_ALREADY_EXISTS",
          "You are already a member of this society"
        );
      }

      let flat = await Flat.findOne({
        societyId,
        flatNumber: validated.flatNumber
      }).session(session);

      if (flat && !flatDetailsMatch(flat, validated)) {
        throw new ApiError(
          409,
          "FLAT_DETAILS_MISMATCH",
          "A flat with this number already exists, but its floor, wing or flat type does not match"
        );
      }

      if (!flat) {
        const flatCount = await Flat.countDocuments({
          societyId
        }).session(session);

        if (flatCount >= society.numberOfFlats) {
          throw new ApiError(
            409,
            "SOCIETY_FLAT_LIMIT_REACHED",
            "The configured number of flats for this society has already been reached"
          );
        }

        [flat] = await Flat.create(
          [
            {
              societyId,
              flatNumber: validated.flatNumber,
              floor: validated.floor,
              wing: validated.wing,
              addressNote: validated.addressNote,
              flatType: validated.flatType,
              invitedEmails: validated.invitedEmails,
              isOccupied: true
            }
          ],
          {
            session
          }
        );
      } else {
        flat.isOccupied = true;

        const invitedEmails = flat.invitedEmails ?? [];

        for (const email of validated.invitedEmails) {
          if (!invitedEmails.includes(email)) {
            invitedEmails.push(email);
          }
        }

        flat.invitedEmails = invitedEmails;

        await flat.save({
          session
        });
      }

      let membership;

      if (existingMembership) {
        existingMembership.flatId = flat._id;
        existingMembership.role = "RESIDENT";
        existingMembership.memberType = validated.memberType;
        existingMembership.mobileNumber = validated.mobileNumber;
        existingMembership.status = "ACTIVE";

        membership = await existingMembership.save({
          session
        });
      } else {
        [membership] = await SocietyMember.create(
          [
            {
              societyId,
              userId: user.id,
              flatId: flat._id,
              role: "RESIDENT",
              memberType: validated.memberType,
              mobileNumber: validated.mobileNumber,
              status: "ACTIVE"
            }
          ],
          {
            session
          }
        );
      }

      await User.updateOne(
        {
          _id: user.id
        },
        {
          $set: {
            mobileNumber: validated.mobileNumber
          }
        },
        {
          session
        }
      );

      result = {
        society,
        flat,
        membership
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

  // Notify all society members (both secretary and residents) about new resident
  try {
    const activeMembers = await SocietyMember.find({
      societyId,
      status: "ACTIVE"
    }).select("userId role");

    if (activeMembers.length > 0) {
      const flatLabel = result.flat
        ? ` (Flat ${result.flat.wing || ""}-${result.flat.flatNumber || ""})`
        : "";

      const notifications = activeMembers.map((member) => {
        const isJoiningUser = member.userId.toString() === user.id.toString();

        if (isJoiningUser) {
          return {
            recipientId: member.userId,
            societyId,
            type: "MEMBER_JOINED",
            title: `Welcome to ${result.society.name}`,
            message: `You have successfully joined as ${result.membership.memberType}${flatLabel}.`,
            link: `/societies/${societyId}/dashboard`,
            metadata: {
              memberId: result.membership._id,
              userId: user.id
            }
          };
        }

        return {
          recipientId: member.userId,
          societyId,
          type: "MEMBER_JOINED",
          title: "New Resident Joined",
          message: `${user.name || "A new resident"}${flatLabel} joined as ${result.membership.memberType}.`,
          link: `/societies/${societyId}/members`,
          metadata: {
            memberId: result.membership._id,
            userId: user.id
          }
        };
      });

      await createBulkNotifications(notifications);
    }
  } catch (notificationErr) {
    console.error("Failed to notify members of new member:", notificationErr);
  }

  return {
    id: result.society._id.toString(),
    name: result.society.name,
    address: result.society.address,
    joiningCode: result.society.joiningCode,
    role: result.membership.role,
    memberType: result.membership.memberType,
    flat: serializeFlat(result.flat)
  };
};

export const getSocietyDetails = async ({ userId, societyId }) => {
  if (!mongoose.isValidObjectId(societyId)) {
    throw new ApiError(400, "SOCIETY_ID_INVALID", "Society ID is invalid");
  }

  const [society, membership] = await Promise.all([
    Society.findOne({
      _id: societyId,
      isActive: true
    })
      .select("name address joiningCode secretary numberOfFlats facilities createdAt")
      .lean(),
    SocietyMember.findOne({
      societyId,
      userId,
      status: "ACTIVE"
    })
      .populate({
        path: "flatId",
        select: "flatNumber floor wing addressNote flatType invitedEmails"
      })
      .lean()
  ]);

  if (!society) {
    throw new ApiError(404, "SOCIETY_NOT_FOUND", "The requested society does not exist");
  }

  if (!membership) {
    throw new ApiError(403, "SOCIETY_MEMBERSHIP_REQUIRED", "You are not a member of this society");
  }

  return {
    society: {
      id: society._id.toString(),
      name: society.name,
      address: society.address,
      joiningCode: society.joiningCode,
      secretaryId: society.secretary.toString(),
      numberOfFlats: society.numberOfFlats,
      facilities: society.facilities,
      createdAt: society.createdAt
    },
    membership: {
      id: membership._id.toString(),
      role: membership.role,
      memberType: membership.memberType,
      mobileNumber: membership.mobileNumber,
      flat: serializeFlat(membership.flatId)
    }
  };
};

export const getSocietyMembers = async ({ societyId }) => {
  const members = await SocietyMember.find({
    societyId,
    status: "ACTIVE"
  })
    .populate({
      path: "userId",
      select: "name email mobileNumber avatarUrl"
    })
    .populate({
      path: "flatId",
      select: "flatNumber floor wing flatType"
    })
    .sort({
      role: 1,
      createdAt: 1
    })
    .lean();

  return members.map((membership) => ({
    id: membership._id.toString(),
    role: membership.role,
    memberType: membership.memberType,
    mobileNumber: membership.mobileNumber,
    user: membership.userId
      ? {
          id: membership.userId._id.toString(),
          name: membership.userId.name,
          email: membership.userId.email,
          avatarUrl: membership.userId.avatarUrl
        }
      : null,
    flat: serializeFlat(membership.flatId)
  }));
};
