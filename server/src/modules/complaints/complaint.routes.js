import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember } from "../../middleware/societyAuthorization.js";
import {
  createComplaintController,
  deleteComplaintController,
  getComplaintsController,
  updateComplaintStatusController
} from "./complaint.controller.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get("/", requireSocietyMember, getComplaintsController);
router.post("/", requireSocietyMember, createComplaintController);
router.patch("/:complaintId/status", requireSocietyMember, updateComplaintStatusController);
router.delete("/:complaintId", requireSocietyMember, deleteComplaintController);

export default router;
