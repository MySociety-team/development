import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
  createSocietyController,
  getMySocietiesController,
  getSocietyController,
  getSocietyMembersController,
  getSocietyJoinRequestsController,
  joinSocietyController,
  submitSocietyJoinRequestController,
  approveSocietyJoinRequestController,
  rejectSocietyJoinRequestController,
  verifyJoiningCodeController
} from "./society.controller.js";
import complaintRoutes from "../complaints/complaint.routes.js";

const router = express.Router();

router.use(authenticate);

router.get("/my-societies", getMySocietiesController);
router.post("/verify-code", verifyJoiningCodeController);
router.post("/", createSocietyController);
router.post("/:societyId/join-request", submitSocietyJoinRequestController);
router.post("/:societyId/join", joinSocietyController);

router.get("/:societyId", requireSocietyMember, getSocietyController);
router.get("/:societyId/members", requireSocietyMember, getSocietyMembersController);
router.get(
  "/:societyId/join-requests",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  getSocietyJoinRequestsController
);
router.post(
  "/:societyId/join-requests/:requestId/approve",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  approveSocietyJoinRequestController
);
router.post(
  "/:societyId/join-requests/:requestId/reject",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  rejectSocietyJoinRequestController
);

// Complaint routes
router.use("/:societyId/complaints", complaintRoutes);

export default router;
