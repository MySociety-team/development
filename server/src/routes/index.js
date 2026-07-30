import { Router } from "express";

const router = Router();

router.get("/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "MySociety API is running",
    data: {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
