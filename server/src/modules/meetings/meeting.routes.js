import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
  createMeetingController,
  deleteMeetingController,
  getMeetingController,
  getMeetingsController,
  updateAttendanceController,
  updateMeetingController
} from "./meeting.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:societyId", requireSocietyMember, getMeetingsController);

router.get("/:societyId/:meetingId", requireSocietyMember, getMeetingController);

router.post(
  "/:societyId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  createMeetingController
);

router.put(
  "/:societyId/:meetingId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateMeetingController
);

router.put(
  "/:societyId/:meetingId/attendance",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateAttendanceController
);

router.delete(
  "/:societyId/:meetingId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  deleteMeetingController
);

export default router;
