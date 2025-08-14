import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByDate,
  uploadTaskSubmission,
  viewTaskSubmission,
} from "../controllers/taskController.js";
import Task from "../models/Task.js";
// AWS S3 dependencies removed - files are now stored locally in browser localStorage

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All routes below require authentication
router.use(protect);



// GET /api/tasks - Get all tasks for user OR get tasks by date if date query param exists
router.get("/", async (req, res, next) => {
  if (req.query.date) {
    return getTasksByDate(req, res, next);
  }
  return getTasks(req, res, next);
});

// GET /api/tasks/:id - Get a single task by id
router.get("/:id", getTaskById);

// PUT /api/tasks/:id - Update a task
router.put("/:id", updateTask);

// POST /api/tasks/:id/submit - Submit a task (frontend expects this)
router.post("/:id/submit", updateTask);

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", deleteTask);

// POST /api/tasks/upload-submission - Upload task submission file
router.post(
  "/upload-submission",
  upload.single("file"),
  (req, res, next) => {
    console.log(
      "[taskRoutes] Upload submission middleware - Request details:",
      {
        method: req.method,
        url: req.url,
        contentType: req.headers["content-type"],
        bodyKeys: Object.keys(req.body || {}),
        bodyValues: req.body,
        taskId: req.body.taskId,
        submissionType: req.body.submissionType,
        hasFile: !!req.file,
        fileDetails: req.file
          ? {
              originalname: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
              key: req.file.key,
            }
          : null,
      }
    );

    // Handle multer errors
    if (req.fileValidationError) {
      console.log(
        "[taskRoutes] File validation error:",
        req.fileValidationError
      );
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    if (!req.file) {
      console.log("[taskRoutes] No file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a file to upload.",
      });
    }

    // Log successful file upload
    console.log("[taskRoutes] File uploaded successfully:", {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      // Note: File upload functionality moved to client-side LocalFileManager
    });

    next();
  },
  uploadTaskSubmission
);

// GET /api/tasks/:id/submission - View task submission file
router.get("/:id/submission", viewTaskSubmission);

// GET /api/tasks/test-file-access - Test file access functionality (development only)
if (process.env.NODE_ENV !== "production") {
  router.get("/test-file-access", async (req, res) => {
    try {
      const uploadsDir = path.join(__dirname, "../uploads");
      const submissionsDir = path.join(uploadsDir, "submissions");

      // Check directory structure
      const result = {
        uploadsDir: {
          path: uploadsDir,
          exists: fs.existsSync(uploadsDir),
        },
        submissionsDir: {
          path: submissionsDir,
          exists: fs.existsSync(submissionsDir),
        },
        files: [],
      };

      if (fs.existsSync(submissionsDir)) {
        const files = fs.readdirSync(submissionsDir).slice(0, 5); // First 5 files
        result.files = files.map((file) => {
          const filePath = path.join(submissionsDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime,
            accessible: fs.constants.R_OK,
          };
        });
      }

      res.json({
        success: true,
        message: "File access test completed",
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "File access test failed",
        error: error.message,
      });
    }
  });
}

// File download functionality removed - files are now stored locally in browser localStorage
// This endpoint is no longer needed as files are accessed directly through LocalFileManager
router.get("/:id/submission/download", async (req, res) => {
  res.status(410).json({
    success: false,
    message: "File download functionality has been moved to client-side local storage. Files are now accessed directly in the browser.",
  });
});

// Helper function to get MIME type based on file extension
function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Debug endpoint to check task-goal relationships
router.get("/debug-goal-relationships", protect, async (req, res) => {
  try {
    const { Goal } = await import("../models/Goal.js");
    
    // Get all tasks for this user
    const allTasks = await Task.find({ user: req.user._id });
    
    // Get all goals for this user
    const allGoals = await Goal.find({ user: req.user._id });
    
    // Analyze task-goal relationships
    const tasksWithGoal = allTasks.filter(task => task.goal);
    const tasksWithoutGoal = allTasks.filter(task => !task.goal);
    
    const goalStats = {};
    allGoals.forEach(goal => {
      const goalTasks = allTasks.filter(task => task.goal && task.goal.toString() === goal._id.toString());
      goalStats[goal._id] = {
        goalName: goal.field,
        taskCount: goalTasks.length,
        tasks: goalTasks.map(t => ({ id: t._id, name: t.title, status: t.status }))
      };
    });
    
    res.json({
      success: true,
      data: {
        totalTasks: allTasks.length,
        totalGoals: allGoals.length,
        tasksWithGoal: tasksWithGoal.length,
        tasksWithoutGoal: tasksWithoutGoal.length,
        goalStats,
        orphanTasks: tasksWithoutGoal.map(t => ({ id: t._id, name: t.title, status: t.status }))
      }
    });
  } catch (error) {
    console.error('Error analyzing task-goal relationships:', error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze task-goal relationships",
      error: error.message
    });
  }
});

// Test endpoint to create a task with sample resources
router.post("/create-test-task", protect, async (req, res) => {
  try {
    // Get user's first goal or create a dummy one
    const { Goal } = await import("../models/Goal.js");
    let goal = await Goal.findOne({ user: req.user._id });
    
    if (!goal) {
      goal = new Goal({
        user: req.user._id,
        field: "Test Goal",
        description: "Test goal for resource display",
        timeline: 30
      });
      await goal.save();
    }

    const testTask = new Task({
      user: req.user._id,
      goal: goal._id,
      title: "Test Task with Resources",
      description: "This is a test task to verify resource display functionality. Click 'Details' to see the resources section.",
      type: "learning",
      category: "Testing",
      difficulty: 3,
      priority: "medium",
      estimatedTime: 1,
      status: "pending",
      isAIGenerated: true,
      topics: ["React", "JavaScript", "Testing"],
      resources: [
        {
          type: "documentation",
          title: "React Official Documentation",
          url: "https://reactjs.org/docs/getting-started.html"
        },
        {
          type: "video",
          title: "React Tutorial for Beginners",
          url: "https://www.youtube.com/watch?v=Ke90Tje7VS0"
        },
        {
          type: "article",
          title: "Modern React Best Practices",
          url: "https://blog.logrocket.com/modern-react-best-practices/"
        },
        {
          type: "project",
          title: "React Examples Repository",
          url: "https://github.com/facebook/react"
        }
      ],
      realWorldApplication: "Building modern web applications with React components and hooks",
      successCriteria: [
        "Understand React components and JSX",
        "Create a simple React application",
        "Use React hooks effectively",
        "Implement component state management"
      ],
      scheduledDate: new Date(),
      phase: 1,
      dayNumber: 1
    });

    await testTask.save();
    
    res.json({
      success: true,
      message: "Test task created successfully! Check your daily tasks and click 'Details' to see resources.",
      task: testTask.formattedData
    });
  } catch (error) {
    console.error('Error creating test task:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create test task",
      error: error.message
    });
  }
});

export default router;
