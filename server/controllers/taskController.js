import Task from "../models/Task.js";
import Goal from "../models/Goal.js";
import WeeklyActivity from "../models/WeeklyActivity.js";
import { getFileSignedUrl, s3Client, S3_CONFIG } from "../config/aws.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

function getLast7Days() {
  const days = [];
  const now = new Date();
  // Use UTC for day boundaries
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    days.push(d);
  }
  return days;
}

function getDayLabel(date) {
  // Use local time for day label
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

async function calculateAndStoreWeeklyActivity(userId) {
  const days = getLast7Days();
  const nextDay = (date) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  // Fetch all tasks for the last 7 days
  const start = days[0];
  const end = nextDay(days[6]);
  const tasks = await Task.find({
    user: userId,
    scheduledDate: { $gte: start, $lt: end },
  });

  let totalTasks = 0,
    completedTasks = 0,
    avgCompletedSum = 0,
    streak = 0,
    bestDay = "",
    bestDayPct = 0;
  const dayStats = [];

  for (let i = 0; i < 7; i++) {
    const dayStart = days[i];
    const dayEnd = nextDay(dayStart);
    const dayTasks = tasks.filter(
      (t) => t.scheduledDate >= dayStart && t.scheduledDate < dayEnd
    );
    const dayTotal = dayTasks.length;
    const dayCompleted = dayTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const pct = dayTotal ? (dayCompleted / dayTotal) * 100 : 0;

    dayStats.push({
      day: getDayLabel(dayStart),
      date: dayStart.toISOString(),
      goal: 100,
      completed: pct,
      hasTasks: dayTotal > 0,
      totalTasks: dayTotal,
      completedTasks: dayCompleted,
    });

    totalTasks += dayTotal;
    completedTasks += dayCompleted;
    avgCompletedSum += pct;

    if (pct > bestDayPct) {
      bestDayPct = pct;
      bestDay = getDayLabel(dayStart);
    }
  }

  // Calculate streak (consecutive days with 100% completion, ending with today)
  for (let i = 6; i >= 0; i--) {
    if (
      dayStats[i].completed === 100 &&
      dayStats[i].goal === 100 &&
      dayStats[i].hasTasks
    ) {
      streak++;
    } else {
      break;
    }
  }

  const avgGoal = 100;
  const avgCompleted = Math.round(avgCompletedSum / 7);

  // Store/update in WeeklyActivity
  await WeeklyActivity.findOneAndUpdate(
    { user: userId, weekStart: days[0] },
    {
      $set: {
        days: dayStats,
        totalTasks,
        completedTasks,
        avgGoal,
        avgCompleted,
        streak,
        bestDay,
        weekStart: days[0],
      },
    },
    { upsert: true }
  );
}

// Create a new task
export const createTask = async (req, res) => {
  try {
    const {
      goalId,
      title,
      description,
      type,
      category,
      difficulty,
      priority,
      estimatedTime,
      scheduledDate,
    } = req.body;

    if (!goalId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Goal ID, title, and description are required",
      });
    }

    // Verify goal belongs to user
    const goal = await Goal.findOne({ _id: goalId, user: req.user._id });
    if (!goal) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found" });
    }

    const task = new Task({
      user: req.user._id,
      goal: goalId,
      title,
      description,
      type: type || "learning",
      category: category || "General",
      difficulty: difficulty || 3,
      priority: priority || "medium",
      estimatedTime: estimatedTime || 1,
      scheduledDate: scheduledDate || new Date(),
      status: "pending",
      isAIGenerated: false,
    });

    await task.save();
    await calculateAndStoreWeeklyActivity(req.user._id);

    res.status(201).json({
      success: true,
      data: task.formattedData,
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// Get all tasks for the authenticated user
export const getTasks = async (req, res) => {
  try {
    const { goalId } = req.query;

    let query = { user: req.user._id };
    if (goalId) {
      query.goal = goalId;
    }

    const tasks = await Task.find(query)
      .populate("goal", "field description timeline")
      .sort({ scheduledDate: 1 });

    const formattedTasks = tasks.map((task) => task.formattedData);

    res.json({
      success: true,
      data: formattedTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    const updateData = req.body;

    // Update allowed fields
    const allowedUpdates = [
      "title",
      "description",
      "type",
      "category",
      "difficulty",
      "priority",
      "estimatedTime",
      "status",
      "scheduledDate",
      "submissionType",
      "submissionFile",
      "submissionText",
      "submissionLink",
      "submittedAt",
      "actualTime",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    // Update legacy data field for backward compatibility
    task.data = {
      ...task.data,
      title: task.title,
      description: task.description,
      type: task.type,
      category: task.category,
      difficulty: task.difficulty,
      priority: task.priority,
      estimatedTime: task.estimatedTime,
      status: task.status,
      isAIGenerated: task.isAIGenerated,
      topics: task.topics,
      resources: task.resources,
      realWorldApplication: task.realWorldApplication,
      successCriteria: task.successCriteria,
      scheduledDate: task.scheduledDate,
      phase: task.phase,
      dayNumber: task.dayNumber,
      submissionType: task.submissionType,
      submissionFile: task.submissionFile,
      submissionText: task.submissionText,
      submissionLink: task.submissionLink,
      submittedAt: task.submittedAt,
      actualTime: task.actualTime,
    };

    await task.save();
    await calculateAndStoreWeeklyActivity(req.user._id);

    res.json({
      success: true,
      data: task.formattedData,
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    await calculateAndStoreWeeklyActivity(req.user._id);
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("goal", "field description timeline");
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task.formattedData });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// Get tasks by date for the authenticated user
export const getTasksByDate = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Parse the incoming date as UTC midnight
    const queryDate = new Date(date + "T00:00:00Z");
    const nextDate = new Date(queryDate);
    nextDate.setUTCDate(queryDate.getUTCDate() + 1);

    // Query tasks scheduled on that UTC day
    const tasks = await Task.find({
      user: req.user._id,
      scheduledDate: { $gte: queryDate, $lt: nextDate },
    }).populate("goal", "field description timeline");

    // Format tasks for frontend compatibility
    const formattedTasks = tasks.map((task) => task.formattedData);

    res.json({ success: true, data: formattedTasks });
  } catch (err) {
    console.error("[getTasksByDate] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Upload task submission file to S3 or local storage
export const uploadTaskSubmission = async (req, res) => {
  try {
    console.log("[uploadTaskSubmission] Upload request received:", {
      file: req.file
        ? {
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            key: req.file.key,
            location: req.file.location,
            bucket: req.file.bucket,
            path: req.file.path, // For local storage
          }
        : null,
      body: req.body,
      user: req.user ? req.user._id : null,
    });

    if (!req.file) {
      console.log(
        "[uploadTaskSubmission] No file uploaded - multer may have failed"
      );
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { taskId, submissionType } = req.body;

    console.log("[uploadTaskSubmission] Extracted data:", {
      taskId,
      submissionType,
      taskIdType: typeof taskId,
      submissionTypeType: typeof submissionType,
    });

    // Temporary fix: Handle undefined taskId
    let actualTaskId = taskId;
    if (!taskId) {
      console.log(
        "[uploadTaskSubmission] taskId is undefined, using temporary ID"
      );
      actualTaskId = `temp-${Date.now()}`;
    }

    if (!submissionType) {
      console.log("[uploadTaskSubmission] Missing submission type:", {
        taskId: actualTaskId,
        submissionType,
        hasTaskId: !!taskId,
        hasSubmissionType: !!submissionType,
      });
      return res.status(400).json({
        success: false,
        message: "Submission type is required",
      });
    }

    // Only validate taskId format if it's not a temporary ID
    if (actualTaskId !== taskId && !actualTaskId.startsWith("temp-")) {
      if (!actualTaskId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log(
          "[uploadTaskSubmission] Invalid taskId format:",
          actualTaskId
        );
        return res.status(400).json({
          success: false,
          message: "Invalid task ID format",
        });
      }
    }

    // Only verify task exists if we have a real taskId
    let task = null;
    if (!actualTaskId.startsWith("temp-")) {
      task = await Task.findOne({ _id: actualTaskId, user: req.user._id });
      if (!task) {
        console.log("[uploadTaskSubmission] Task not found:", {
          taskId: actualTaskId,
          userId: req.user._id,
          userExists: !!req.user,
        });
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      console.log("[uploadTaskSubmission] Task found:", {
        taskId: task._id,
        taskTitle: task.title,
        taskStatus: task.status,
      });
    } else {
      console.log(
        "[uploadTaskSubmission] Using temporary taskId:",
        actualTaskId
      );
    }

    // Determine if using S3 or local storage
    const isS3Storage = req.file.key && req.file.location && req.file.bucket;
    const isLocalStorage = req.file.path;

    let filePath, fileData;

    if (isS3Storage) {
      // S3 storage
      filePath = req.file.key;
      fileData = {
        filePath: req.file.key,
        s3Key: req.file.key,
        s3Location: req.file.location,
        originalName: req.file.originalname,
        size: req.file.size,
        submissionType,
        cloudStorage: true,
      };
      console.log("[uploadTaskSubmission] File uploaded to S3 successfully:", {
        s3Key: req.file.key,
        s3Location: req.file.location,
        originalName: req.file.originalname,
        size: req.file.size,
        bucket: req.file.bucket,
        taskId,
        submissionType,
      });
    } else if (isLocalStorage) {
      // Local storage
      filePath = req.file.path;
      fileData = {
        filePath: req.file.path,
        originalName: req.file.originalname,
        size: req.file.size,
        submissionType,
        cloudStorage: false,
      };
      console.log(
        "[uploadTaskSubmission] File uploaded to local storage successfully:",
        {
          filePath: req.file.path,
          originalName: req.file.originalname,
          size: req.file.size,
          taskId,
          submissionType,
        }
      );
    } else {
      console.log("[uploadTaskSubmission] Unknown storage type:", req.file);
      return res.status(500).json({
        success: false,
        message: "File upload failed - unknown storage type",
      });
    }

    res.json({
      success: true,
      data: {
        ...fileData,
        taskId: actualTaskId, // Include the taskId that was actually used
        isTemporaryTaskId: actualTaskId.startsWith("temp-"),
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: error.message,
    });
  }
};

// View task submission file from S3 or local storage
export const viewTaskSubmission = async (req, res) => {
  try {
    const { id: taskId } = req.params;

    console.log("[viewTaskSubmission] Request received:", {
      taskId,
      userId: req.user?._id,
    });

    // Find task and verify ownership
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      console.log("[viewTaskSubmission] Task not found:", {
        taskId,
        userId: req.user._id,
      });
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const submissionFile = task.submissionFile;
    if (!submissionFile) {
      console.log("[viewTaskSubmission] No submission file found:", {
        taskId,
        hasSubmissionFile: !!task.submissionFile,
      });
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
      // Handle local file
      const fs = await import("fs");
      const path = await import("path");

      const filePath = submissionFile;

      if (!fs.existsSync(filePath)) {
        console.log("[viewTaskSubmission] Local file not found:", filePath);
        return res.status(404).json({
          success: false,
          message: "Submission file not found",
        });
      }

      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      console.log("[viewTaskSubmission] Local file found:", {
        filePath,
        fileName,
        fileSize: stats.size,
        lastModified: stats.mtime,
      });

      res.json({
        success: true,
        data: {
          fileUrl: `/api/tasks/${taskId}/submission/download`, // Use download endpoint
          submissionType: task.submissionType,
          submittedAt: task.submittedAt,
          originalName: fileName,
          fileSize: stats.size,
          lastModified: stats.mtime,
          cloudStorage: false,
          expiresIn: null,
        },
      });
    } else if (isS3File) {
      // Handle S3 file (existing logic)
      const s3Key = submissionFile;

      console.log("[viewTaskSubmission] Checking S3 file:", {
        s3Key,
        bucket: S3_CONFIG.bucket,
      });

      // Check if file exists in S3 and get file info
      try {
        const headCommand = new GetObjectCommand({
          Bucket: S3_CONFIG.bucket,
          Key: s3Key,
        });

        const headResult = await s3Client.send(headCommand);

        console.log("[viewTaskSubmission] S3 file found:", {
          s3Key,
          contentLength: headResult.ContentLength,
          contentType: headResult.ContentType,
          lastModified: headResult.LastModified,
        });

        // Generate signed URL for secure access (expires in 1 hour)
        const signedUrl = await getFileSignedUrl(s3Key, 3600);

        console.log(
          "[viewTaskSubmission] S3 signed URL generated successfully"
        );

        res.json({
          success: true,
          data: {
            fileUrl: signedUrl,
            submissionType: task.submissionType,
            submittedAt: task.submittedAt,
            originalName: task.data?.originalName || s3Key.split("/").pop(),
            fileSize: headResult.ContentLength,
            lastModified: headResult.LastModified,
            cloudStorage: true,
            expiresIn: 3600,
          },
        });
      } catch (s3Error) {
        console.log("[viewTaskSubmission] S3 file not found or error:", {
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
      console.log("[viewTaskSubmission] Unknown file type:", submissionFile);
      return res.status(500).json({
        success: false,
        message: "Unknown file storage type",
      });
    }
  } catch (error) {
    console.error("[viewTaskSubmission] Error:", {
      message: error.message,
      stack: error.stack,
      taskId: req.params.id,
      userId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve submission file",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
