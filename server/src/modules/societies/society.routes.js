import express from "express";

import authenticate from "../../middleware/authentication.js";

import { createSocietyController } from "./society.controller.js";

const router = express.Router();

router.post("/", authenticate, createSocietyController);

export default router;
