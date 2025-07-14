import express from "express";
import testimonialRoutes from "./testimonialRoutes.js";
import achieverRoutes from "./achieverRoutes.js";
import goalRoutes from "./goalRoutes.js";
import fieldRoutes from "./fieldRoutes.js";
import voiceRoutes from "./voiceRoutes.js";
import chatRoutes from "./chatRoutes.js";
import authRoutes from "./authRoutes.js";
import taskRoutes from "./taskRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import weeklyActivityRoutes from "./weeklyActivityRoutes.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Infinite Learning API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    voiceRecognition: {
      available: true,
      provider: "Web Speech API",
      status: "browser-native",
    },
  });
});

// Mount route modules
router.use("/testimonials", testimonialRoutes);
router.use("/achievers", achieverRoutes);
router.use("/goals", goalRoutes);
router.use("/fields", fieldRoutes);
router.use("/voice", voiceRoutes);
router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/weekly-activity", weeklyActivityRoutes);

export default router;
