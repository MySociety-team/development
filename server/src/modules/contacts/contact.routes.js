import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
  createContactController,
  deleteContactController,
  getContactsController,
  updateContactController
} from "./contact.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:societyId", requireSocietyMember, getContactsController);

router.post(
  "/:societyId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  createContactController
);

router.put(
  "/:societyId/:contactId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateContactController
);

router.delete(
  "/:societyId/:contactId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  deleteContactController
);

export default router;
