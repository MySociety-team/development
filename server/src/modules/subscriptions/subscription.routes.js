import express from "express";

import authenticate from "../../middleware/authentication.js";

import {
  createSubscriptionOrderController,
  getMySubscriptionController,
  verifySubscriptionPaymentController
} from "./subscription.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/my-subscription", getMySubscriptionController);
router.post("/create-order", createSubscriptionOrderController);
router.post("/verify-payment", verifySubscriptionPaymentController);

export default router;
