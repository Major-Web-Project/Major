import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createGoalWithRoadmap,
  getUserGoals,
  getGoalById,
  getGoalTasks,
  updateGoal,
  deleteGoal,
  setActiveGoal,
  cleanupIncompleteGoalsEndpoint,
  cleanupSpecificIncompleteGoal,
} from "../controllers/goalController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/goals/create - Create new goal with AI-generated tasks (enhanced with personalNeeds)
// POST /api/goals/create-roadmap - Create new goal and roadmap only
router.post("/create-roadmap", createGoalWithRoadmap);

// Legacy /generate-tasks removed; per-phase SSE is used on client

// POST /api/goals - Create new goal with AI-generated tasks (legacy endpoint)
// Legacy endpoint removed; use /create-roadmap and /generate-tasks instead

// GET /api/goals - Get all goals for the user
router.get("/", getUserGoals);

// GET /api/goals/:id - Get goal by ID with tasks
router.get("/:id", getGoalById);

// GET /api/goals/:goalId/tasks - Get tasks for a specific goal
router.get("/:goalId/tasks", getGoalTasks);

// PUT /api/goals/:id - Update goal
router.put("/:id", updateGoal);

// PUT /api/goals/:goalId/active - Set active goal for user
router.put("/:goalId/active", setActiveGoal);

// DELETE /api/goals/:id - Delete goal and all associated tasks
router.delete("/:id", deleteGoal);

// Legacy /:id/regenerate-tasks removed; use SSE per-phase instead

// POST /api/goals/cleanup - Clean up incomplete goals
// POST /api/goals/:id/cleanup - Clean up a specific incomplete goal by goalId
router.post("/:id/cleanup", cleanupSpecificIncompleteGoal);

// POST /api/goals/cleanup - Clean up all incomplete goals
router.post("/cleanup", cleanupIncompleteGoalsEndpoint);

export default router;
