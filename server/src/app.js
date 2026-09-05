import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import errorHandler from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

import authRoutes from "./modules/auth/auth.routes.js";
import contactRoutes from "./modules/contacts/contact.routes.js";
import societyRoutes from "./modules/societies/society.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import meetingRoutes from "./modules/meetings/meeting.routes.js";
import complaintRoutes from "./modules/complaints/complaint.routes.js";
import announcementRoutes from "./modules/announcements/announcement.routes.js";

import apiRouter from "./routes/index.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

app.use(compression());

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/v1", apiRouter);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/contacts", contactRoutes);

app.use("/api/v1/societies", societyRoutes);
app.use("/api/v1/societies", complaintRoutes);

app.use("/api/v1/subscriptions", subscriptionRoutes);

app.use("/api/v1/meetings", meetingRoutes);

app.use("/api/v1/societies", announcementRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
