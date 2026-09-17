import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
  createAnnouncementController,
  deleteAnnouncementController,
  getAnnouncementController,
  getAnnouncementsController,
  updateAnnouncementController
} from "./announcement.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:societyId/announcements", requireSocietyMember, getAnnouncementsController);

router.get(
  "/:societyId/announcements/:announcementId",
  requireSocietyMember,
  getAnnouncementController
);

router.post(
  "/:societyId/announcements",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  createAnnouncementController
);

router.put(
  "/:societyId/announcements/:announcementId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateAnnouncementController
);

router.delete(
  "/:societyId/announcements/:announcementId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  deleteAnnouncementController
);

export default router;
