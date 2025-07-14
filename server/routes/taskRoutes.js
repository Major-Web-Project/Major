import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// POST /api/tasks - Create a new task
router.post("/", createTask);

// GET /api/tasks - Get all tasks for user
router.get("/", getTasks);

// GET /api/tasks/:id - Get a single task by id
router.get("/:id", getTaskById);

// PUT /api/tasks/:id - Update a task
router.put("/:id", updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", deleteTask);

export default router;
