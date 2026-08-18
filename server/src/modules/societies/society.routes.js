import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember } from "../../middleware/societyAuthorization.js";

import {
  createSocietyController,
  getMySocietiesController,
  getSocietyController,
  getSocietyMembersController,
  joinSocietyController,
  verifyJoiningCodeController
} from "./society.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/my-societies", getMySocietiesController);
router.post("/verify-code", verifyJoiningCodeController);
router.post("/", createSocietyController);
router.post("/:societyId/join", joinSocietyController);

router.get("/:societyId", requireSocietyMember, getSocietyController);
router.get("/:societyId/members", requireSocietyMember, getSocietyMembersController);

export default router;
