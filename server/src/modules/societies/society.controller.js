import asyncHandler from "../../utils/asyncHandler.js";

import {
  createSociety,
  getMySocieties,
  getSocietyDetails,
  getSocietyMembers,
  joinSociety,
  verifyJoiningCode
} from "./society.service.js";

export const getMySocietiesController = asyncHandler(async (req, res) => {
  const societies = await getMySocieties({
    userId: req.user.id
  });

  return res.status(200).json({
    success: true,
    code: "MY_SOCIETIES_FETCHED",
    message: "societies fetched successfully",
    data: {
      societies
    }
  });
});

export const verifyJoiningCodeController = asyncHandler(async (req, res) => {
  const society = await verifyJoiningCode({
    userId: req.user.id,
    payload: req.body
  });

  return res.status(200).json({
    success: true,
    code: "SOCIETY_CODE_VERIFIED",
    message: "society joining code verified successfully",
    data: {
      society
    }
  });
});

export const joinSocietyController = asyncHandler(async (req, res) => {
  const society = await joinSociety({
    user: req.user,
    societyId: req.params.societyId,
    payload: req.body
  });

  return res.status(201).json({
    success: true,
    code: "SOCIETY_JOINED",
    message: "society joined successfully",
    data: {
      society
    }
  });
});

export const createSocietyController = asyncHandler(async (req, res) => {
  const society = await createSociety({
    user: req.user,
    payload: req.body
  });

  return res.status(201).json({
    success: true,
    code: "SOCIETY_CREATED",
    message: "society created successfully",
    data: {
      society
    }
  });
});

export const getSocietyController = asyncHandler(async (req, res) => {
  const data = await getSocietyDetails({
    userId: req.user.id,
    societyId: req.params.societyId
  });

  return res.status(200).json({
    success: true,
    code: "SOCIETY_FETCHED",
    message: "society fetched successfully",
    data
  });
});

export const getSocietyMembersController = asyncHandler(async (req, res) => {
  const members = await getSocietyMembers({
    societyId: req.params.societyId
  });

  return res.status(200).json({
    success: true,
    code: "SOCIETY_MEMBERS_FETCHED",
    message: "society members fetched successfully",
    data: {
      members
    }
  });
});
