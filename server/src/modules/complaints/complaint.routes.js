import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";
import {
  getComplaintsController,
  createComplaintController,
  updateComplaintStatusController,
  deleteComplaintController
} from "./complaint.controller.js";

const router = express.Router();

router.use(authenticate);

// Fetch all complaints for a society
router.get("/:societyId/complaints", requireSocietyMember, getComplaintsController);

// Lodge a new complaint
router.post("/:societyId/complaints", requireSocietyMember, createComplaintController);

// Update complaint status (Secretary only)
router.patch(
  "/:societyId/complaints/:complaintId/status",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateComplaintStatusController
);

// Delete a complaint
router.delete(
  "/:societyId/complaints/:complaintId",
  requireSocietyMember,
  deleteComplaintController
);

export default router;
