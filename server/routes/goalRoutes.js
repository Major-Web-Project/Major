import express from "express";
import GoalController from "../controllers/goalController.js";

const router = express.Router();

// POST /api/goals - Create new goal
router.post("/", GoalController.createGoal);

// GET /api/goals/:id - Get goal by ID
router.get("/:id", GoalController.getGoalById);

// PUT /api/goals/:id - Update goal
router.put("/:id", GoalController.updateGoal);

// DELETE /api/goals/:id - Delete goal
router.delete("/:id", GoalController.deleteGoal);

export default router;
