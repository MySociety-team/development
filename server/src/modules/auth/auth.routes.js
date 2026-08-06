import express from "express";

import authenticate from "../../middleware/authentication.js";

import { getCurrentUser, login, logout, register } from "./auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", authenticate, getCurrentUser);

router.post("/logout", authenticate, logout);

export default router;
