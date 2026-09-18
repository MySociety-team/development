import express from "express";

import authenticate from "../../middleware/authentication.js";
import { requireSocietyMember, requireSocietyRole } from "../../middleware/societyAuthorization.js";

import {
  createFinanceController,
  deleteFinanceController,
  getFinanceRecordController,
  getFinanceRecordsController,
  getFinanceSummaryController,
  updateFinanceController
} from "./finance.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/:societyId/finance", requireSocietyMember, getFinanceRecordsController);

router.get("/:societyId/finance/summary", requireSocietyMember, getFinanceSummaryController);

router.get("/:societyId/finance/:financeId", requireSocietyMember, getFinanceRecordController);

router.post(
  "/:societyId/finance",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  createFinanceController
);

router.put(
  "/:societyId/finance/:financeId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  updateFinanceController
);

router.delete(
  "/:societyId/finance/:financeId",
  requireSocietyMember,
  requireSocietyRole("SECRETARY"),
  deleteFinanceController
);

export default router;
