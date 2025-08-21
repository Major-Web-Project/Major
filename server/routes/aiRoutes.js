import express from "express";
import {
  generateRoadmapWithAI,
  default as aiStreamingRouter,
} from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Legacy /generate-tasks removed; per-phase SSE is used instead

// POST /api/ai/generate-roadmap - Generate roadmap using Gemini AI
router.post("/generate-roadmap", protect, generateRoadmapWithAI);

// Mount streaming SSE endpoints for roadmap and tasks
router.use(aiStreamingRouter);

export default router;
