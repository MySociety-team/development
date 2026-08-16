import asyncHandler from "../../utils/asyncHandler.js";

import { createSociety } from "./society.service.js";

export const createSocietyController = asyncHandler(async (req, res) => {
  const society = await createSociety({
    user: req.user,

    payload: req.body
  });

  return res.status(201).json({
    success: true,
    code: "SOCIETY_CREATED",
    message: "society created successfully",
    data: { society: society }
  });
});
