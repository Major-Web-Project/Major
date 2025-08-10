import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createGoalWithTasks,
  getUserGoals,
  getGoalById,
  getGoalTasks,
  updateGoal,
  deleteGoal,
  regenerateGoalTasks,
} from "../controllers/goalController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/goals - Create new goal with AI-generated tasks
router.post("/", createGoalWithTasks);

// GET /api/goals - Get all goals for the user
router.get("/", getUserGoals);

// GET /api/goals/:id - Get goal by ID with tasks
router.get("/:id", getGoalById);

// GET /api/goals/:goalId/tasks - Get tasks for a specific goal
router.get("/:goalId/tasks", getGoalTasks);

// PUT /api/goals/:id - Update goal
router.put("/:id", updateGoal);

// DELETE /api/goals/:id - Delete goal and all associated tasks
router.delete("/:id", deleteGoal);

// POST /api/goals/:id/regenerate-tasks - Regenerate AI tasks for a goal
router.post("/:id/regenerate-tasks", regenerateGoalTasks);

export default router;
