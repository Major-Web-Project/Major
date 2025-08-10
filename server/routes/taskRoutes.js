import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByDate,
  uploadTaskSubmission,
  viewTaskSubmission,
} from "../controllers/taskController.js";
import Task from "../models/Task.js";
import { s3Client, S3_CONFIG, getFileSignedUrl } from "../config/aws.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All routes below require authentication
router.use(protect);

// POST /api/tasks - Create a new task
router.post("/", createTask);

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
      s3Key: req.file.key,
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

// GET /api/tasks/:id/submission/download - Direct file download (S3 or local)
router.get("/:id/submission/download", async (req, res) => {
  try {
    const { id: taskId } = req.params;

    console.log("[downloadSubmission] Download request received:", {
      taskId,
      userId: req.user?._id,
    });

    // Find task and verify ownership
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const submissionFile = task.submissionFile;
    if (!submissionFile) {
      return res.status(404).json({
        success: false,
        message: "No submission file found for this task",
      });
    }

    // Check if it's a local file or S3 file
    const isLocalFile =
      submissionFile.startsWith("/") || submissionFile.includes("uploads");
    const isS3File = submissionFile.includes("submissions/") && !isLocalFile;

    if (isLocalFile) {
      // Handle local file download
      const fs = await import("fs");
      const path = await import("path");

      const filePath = submissionFile;

      if (!fs.existsSync(filePath)) {
        console.log("[downloadSubmission] Local file not found:", filePath);
        return res.status(404).json({
          success: false,
          message: "Submission file not found",
        });
      }

      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const mimeType = getMimeType(fileName);

      console.log("[downloadSubmission] Serving local file:", {
        filePath,
        fileName,
        fileSize: stats.size,
        mimeType,
      });

      // Set appropriate headers for download
      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Cache-Control", "no-cache");

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on("error", (streamError) => {
        console.error(
          "[downloadSubmission] Local file stream error:",
          streamError
        );
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error streaming file",
          });
        }
      });

      fileStream.on("end", () => {
        console.log(
          "[downloadSubmission] Local file download completed successfully"
        );
      });
    } else if (isS3File) {
      // Handle S3 file download (existing logic)
      const s3Key = submissionFile;

      console.log("[downloadSubmission] Downloading from S3:", {
        s3Key,
        bucket: S3_CONFIG.bucket,
      });

      try {
        // Get file from S3
        const getObjectCommand = new GetObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: s3Key,
        });

        const s3Response = await s3Client.send(getObjectCommand);

        // Set appropriate headers for download
        const originalName = task.data?.originalName || s3Key.split("/").pop();

        res.setHeader(
          "Content-Type",
          s3Response.ContentType || "application/octet-stream"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${originalName}"`
        );
        res.setHeader("Content-Length", s3Response.ContentLength);
        res.setHeader("Cache-Control", "no-cache");

        console.log("[downloadSubmission] S3 file headers set:", {
          originalName,
          contentType: s3Response.ContentType,
          contentLength: s3Response.ContentLength,
        });

        // Stream the file from S3 to client
        if (s3Response.Body) {
          s3Response.Body.pipe(res);

          s3Response.Body.on("error", (streamError) => {
            console.error("[downloadSubmission] S3 stream error:", streamError);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: "Error streaming file from cloud storage",
              });
            }
          });

          s3Response.Body.on("end", () => {
            console.log(
              "[downloadSubmission] S3 file download completed successfully"
            );
          });
        } else {
          throw new Error("No file body received from S3");
        }
      } catch (s3Error) {
        console.error("[downloadSubmission] S3 error:", {
          s3Key,
          error: s3Error.message,
          code: s3Error.name,
        });

        if (s3Error.name === "NoSuchKey") {
          return res.status(404).json({
            success: false,
            message: "Submission file not found in cloud storage",
          });
        } else if (s3Error.name === "AccessDenied") {
          return res.status(403).json({
            success: false,
            message: "Access denied to submission file",
          });
        } else {
          throw s3Error;
        }
      }
    } else {
      console.log("[downloadSubmission] Unknown file type:", submissionFile);
      return res.status(500).json({
        success: false,
        message: "Unknown file storage type",
      });
    }
  } catch (error) {
    console.error("[downloadSubmission] Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to download submission file",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
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

export default router;
