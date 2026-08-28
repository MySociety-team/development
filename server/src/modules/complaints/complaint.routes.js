import express from "express";

import {
  createComplaintController,
  deleteComplaintController,
  getComplaintsController,
  updateComplaintStatusController
} from "./complaint.controller.js";

const router = express.Router({ mergeParams: true });

router.route("/")
  .get(getComplaintsController)
  .post(createComplaintController);

router.patch("/:complaintId/status", updateComplaintStatusController);
router.delete("/:complaintId", deleteComplaintController);

export default router;
