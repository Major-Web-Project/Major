import Task from "../models/Task.js";
import { calculateAndStoreWeeklyActivity } from "../utils/taskCalculations.js";
import moment from "moment-timezone";

import undici from "undici";

const { fetch } = undici;
import { getGridFSBucket } from "../utils/gridfs.js";
import { Readable } from "stream";
import FormData from "form-data";
import axios from "axios";

// ---------------- Carry Forward Helper Logic (new) ----------------
// Creates carry-forward instances for any incomplete tasks from previous days
// so user can act on them today without editing past-day originals.
export async function ensureCarryForward(userId, goalId) {
  const tz = "Asia/Kolkata";
  const startOfToday = moment().tz(tz).startOf("day").toDate();
  try {
    const candidates = await Task.find({
      user: userId,
      goal: goalId,
      status: { $in: ["pending", "in_progress"] },
    });
    let updated = 0;
    for (const task of candidates) {
      // If the task was assigned before today and still incomplete, mark as carried
      if (task.assignedDate < startOfToday) {
        task.carriedCount = (task.carriedCount || 0) + 1;
        task.wasEverCarried = true;
        task.lastCarriedDate = startOfToday;
        task.isCarriedToday = true;
        // Move its assignedDate forward to today so queries for today pick it up
        task.assignedDate = startOfToday;
        if (!task.scheduledDate || task.scheduledDate < startOfToday) {
          task.scheduledDate = startOfToday;
        }
        // Ensure status is at least pending (don't resurrect cancelled)
        if (task.status === "pending" || task.status === "in_progress") {
          // no change
        }
        // Mirror into legacy data field
        task.data = {
          ...task.data,
          carriedCount: task.carriedCount,
          wasEverCarried: task.wasEverCarried,
          lastCarriedDate: task.lastCarriedDate,
          isCarriedToday: task.isCarriedToday,
          assignedDate: task.assignedDate,
        };
        await task.save();
        updated += 1;
      } else if (task.assignedDate >= startOfToday) {
        // If already today, ensure flag reflects current state
        task.isCarriedToday = false; // newly assigned or already today without carry
        await task.save();
      }
    }
    return { evaluated: candidates.length, updated };
  } catch (e) {
    return { evaluated: 0, updated: 0, error: e.message };
  }
}

// Create a new task (for POST /api/tasks)
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      goalId,
      scheduledDate,
      status,
      type,
      resources,
      ...rest
    } = req.body;
    const user = req.user?._id || req.user?.id;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }
    const newTask = new Task({
      user,
      title,
      description,
      goal: goalId,
      scheduledDate,
      status: status || "pending",
      type,
      resources,
      ...rest,
    });
    await newTask.save();
    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    console.error("[POST /api/tasks] Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// SEQUENTIAL TASK SYSTEM - Get all tasks assigned for today
export const getDailyTask = async (userId, goalId) => {
  try {
    // Validate inputs
    if (!userId || !goalId) {
      throw new Error("User ID and Goal ID are required");
    }

    // Validate goalId format
    if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error("Invalid goal ID format");
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    // Normalize any past incomplete tasks into today
    await ensureCarryForward(userId, goalId);

    // Get ALL tasks assigned for today (after normalization)
    const todaysTasks = await Task.find({
      user: userId,
      goal: goalId,
      assignedDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "in_progress", "completed"] },
    }).sort({ sequenceOrder: -1 });

    return todaysTasks;
  } catch (error) {
    console.error(`[getDailyTask] Error:`, error);
    throw error;
  }
};

// Get only assigned tasks (pending/completed) - HIDE ALL QUEUED TASKS
export const getAssignedTasksOnly = async (userId, goalId) => {
  try {
    if (!userId || !goalId) {
      throw new Error("User ID and Goal ID are required");
    }

    // Only return tasks that have been assigned (pending, in_progress, completed)
    // NEVER return queued tasks - they should be invisible to the user
    // Sort by assignedDate and sequenceOrder descending to show newest tasks first (stack behavior)
    const assignedTasks = await Task.find({
      user: userId,
      goal: goalId,
      status: { $in: ["pending", "in_progress", "completed"] },
    }).sort({ assignedDate: -1, sequenceOrder: -1 });
    return assignedTasks;
  } catch (error) {
    console.error(`[getAssignedTasksOnly] Error:`, error);
    throw error;
  }
};

export const requestNextTask = async (userId, goalId) => {
  try {
    // Validate inputs
    if (!userId || !goalId) {
      throw new Error("User ID and Goal ID are required");
    }

    // Normalize carry-forward state first
    await ensureCarryForward(userId, goalId);

    // Block new task generation if ANY task assigned for today is not completed
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const todaysIncompleteTasks = await Task.find({
      user: userId,
      goal: goalId,
      assignedDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "in_progress"] },
    });

    if (todaysIncompleteTasks.length > 0) {
      throw new Error(
        "Complete previous pending tasks (carried forward) before requesting a new one"
      );
    }

    // Get the next task using getDailyTask logic
    const nextTasks = await getDailyTask(userId, goalId);
    return nextTasks;
  } catch (error) {
    console.error(`[requestNextTask] Error:`, error);
    throw error;
  }
};

// Get all tasks for the authenticated user with optional goal filtering
export const getTasks = async (req, res) => {
  try {
    const { goalId } = req.query;

    let query = { user: req.user._id };

    // Filter by goalId if provided - STRICT FILTERING
    if (goalId) {
      // Validate goalId format
      if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid goal ID format",
        });
      }
      // STRICT: Only return tasks that have this exact goalId
      query.goal = goalId;
    } else {
      // If no goalId provided, only return tasks that have NO goal field (legacy tasks)
      // This prevents showing all tasks when a specific goal should be selected
      query.goal = { $exists: false };
    }

    const tasks = await Task.find(query)
      .populate("goal", "field description timeline")
      .sort({ scheduledDate: -1 });

    const formattedTasks = tasks.map((task) => task.formattedData);

    res.json({
      success: true,
      data: formattedTasks,
      totalTasks: formattedTasks.length,
      filteredByGoal: !!goalId,
      goalId: goalId || null,
    });
  } catch (error) {
    console.error(`[getTasks] Error:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// Update a task - ENHANCED WITH GATED SEQUENTIAL LOGIC
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    const updateData = req.body;
    const oldStatus = task.status;

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
      "sequenceOrder",
      "assignedDate",
    ];

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    // SEQUENTIAL LOGIC: Task completion (no auto-assignment)
    if (oldStatus !== "completed" && task.status === "completed" && task.goal) {
      // PHASE/TOPIC-WISE: Add this task's _id to the correct phase/topic in goal.completedTaskIds
      const Goal = (await import("../models/Goal.js")).default;
      const goalDoc = await Goal.findById(task.goal);
      if (goalDoc) {
        const phase = task.phase || 1;
        const topic =
          task.topics && task.topics.length > 0 ? task.topics[0] : undefined;
        let found = false;
        for (let entry of goalDoc.completedTaskIds) {
          if (entry.phase === phase && (!topic || entry.topic === topic)) {
            if (!entry.taskIds.some((id) => id.equals(task._id))) {
              entry.taskIds.push(task._id);
            }
            found = true;
            break;
          }
        }
        if (!found) {
          goalDoc.completedTaskIds.push({
            phase,
            topic,
            taskIds: [task._id],
          });
        }
        await goalDoc.save();
      }
    }

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
      sequenceOrder: task.sequenceOrder,
      assignedDate: task.assignedDate,
    };

    await task.save();
    await calculateAndStoreWeeklyActivity(req.user._id);

    res.json({
      success: true,
      data: task.formattedData,
      nextTaskAssigned:
        oldStatus !== "completed" && task.status === "completed",
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

// Get tasks by date - SEQUENTIAL SYSTEM: Only show tasks assigned to specific dates
export const getTasksByDate = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { date, goalId } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Use Asia/Kolkata local time for date calculations

    const queryDate = moment.tz(date, "Asia/Kolkata").startOf("day").toDate();
    const nextDate = moment
      .tz(date, "Asia/Kolkata")
      .add(1, "day")
      .startOf("day")
      .toDate();

    // Filter by goalId if provided
    if (goalId) {
      // Validate goalId format
      if (!goalId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid goal ID format",
        });
      }

      // If the requested date is today ensure carry-forward instances are created
      const todayLocal = moment().tz("Asia/Kolkata").startOf("day").toDate();
      const requestedIsToday = queryDate.getTime() === todayLocal.getTime();
      if (requestedIsToday) {
        try {
          await ensureCarryForward(req.user._id, goalId); // logging inside
        } catch (cfErr) {
          console.warn(
            "[getTasksByDate] ensureCarryForward failed:",
            cfErr.message
          );
        }
      }

      // SEQUENTIAL LOGIC: Only show tasks that have been assigned to this specific date
      // Tasks get assignedDate when they become active (either at midnight or when user requests)
      let query = {
        user: req.user._id,
        goal: goalId,
        assignedDate: { $gte: queryDate, $lt: nextDate },
        status: { $in: ["pending", "in_progress", "completed"] },
      };

      const tasks = await Task.find(query)
        .populate("goal", "field description timeline")
        .sort({ sequenceOrder: -1 });

      const formattedTasks = tasks.map((task) => task.formattedData);

      return res.json({
        success: true,
        data: formattedTasks,
        filteredByGoal: true,
        goalId: goalId,
        totalTasks: formattedTasks.length,
        date: date,
        isSequentialSystem: true,
      });
    } else {
      // No goalId provided - return legacy tasks
      let query = {
        user: req.user._id,
        goal: { $exists: false },
        scheduledDate: { $gte: queryDate, $lt: nextDate },
      };

      const tasks = await Task.find(query).populate(
        "goal",
        "field description timeline"
      );
      const formattedTasks = tasks.map((task) => task.formattedData);

      return res.json({
        success: true,
        data: formattedTasks,
        filteredByGoal: false,
        goalId: null,
        totalTasks: formattedTasks.length,
        date: date,
        isSequentialSystem: false,
      });
    }
  } catch (err) {
    console.error("[getTasksByDate] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper to stream a Buffer to GridFS and return the file id and filename
async function streamToGridFS({
  buffer,
  filename,
  contentType,
  metadata = {},
}) {
  const bucket = getGridFSBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata,
    });
    const readable = Readable.from(buffer);
    readable
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => {
        resolve({
          fileId: uploadStream.id,
          filename: uploadStream.filename,
        });
      });
  });
}

// POST /api/tasks/:id/upload-submission - accepts multipart form-data
export const uploadTaskSubmission = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const file = req.file; // from multer memory storage
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!allowed.includes(file.mimetype)) {
      return res
        .status(400)
        .json({ success: false, message: "Unsupported file type" });
    }

    // Verify via pyserver
    const pyserverUrl = process.env.PYSERVER_URL || "http://localhost:8000";
    // Use 'form-data' package for Node.js
    const form = new FormData();
    form.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append("taskId", taskId);
    form.append("title", task.title);
    form.append("description", task.description);
    // Ensure successCriteria is sent as a list of strings, not a JSON string
    if (
      Array.isArray(task.successCriteria) &&
      task.successCriteria.length > 0
    ) {
      for (const crit of task.successCriteria) {
        form.append("successCriteria", crit);
      }
    } else {
      form.append("successCriteria", ""); // send empty if none
    }
    form.append("userId", String(userId));

    // DEBUG: Log form fields and file buffer info
    console.log("[DEBUG] About to send to pyserver:");
    console.log("  taskId:", taskId);
    console.log("  title:", task.title);
    console.log("  description:", task.description);
    console.log("  successCriteria:", task.successCriteria);
    console.log("  userId:", userId);
    console.log("  file.originalname:", file.originalname);
    console.log("  file.mimetype:", file.mimetype);
    console.log("  file.buffer length:", file.buffer?.length);

    let verified = false;
    let verificationReason = "";
    try {
      // Get headers and content length for form-data
      const headers = form.getHeaders();
      const contentLength = await new Promise((resolve, reject) => {
        form.getLength((err, length) => {
          if (err) reject(err);
          else resolve(length);
        });
      });
      headers["Content-Length"] = contentLength;
      // Use axios for reliable multipart streaming
      const verifyResp = await axios.post(
        `${pyserverUrl}/api/file-check/`,
        form,
        { headers }
      );
      const vr = verifyResp.data;
      if (verifyResp.status >= 200 && verifyResp.status < 300) {
        // vr.result can be true/false/None
        verified = Boolean(vr.result);
        verificationReason = vr.reason || "";
      } else {
        console.warn("[uploadTaskSubmission] Verification failed:", vr);
      }
    } catch (e) {
      console.error(
        "[uploadTaskSubmission] Error calling pyserver:",
        e.message
      );
    }

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "File verification failed",
        reason:
          verificationReason ||
          "The uploaded file did not match the task requirements.",
      });
    }

    // Store in GridFS
    const { fileId, filename } = await streamToGridFS({
      buffer: file.buffer,
      filename: `${taskId}-${Date.now()}-${file.originalname}`,
      contentType: file.mimetype,
      metadata: {
        userId,
        taskId,
        title: task.title,
        description: task.description,
        successCriteria: task.successCriteria || [],
        verified: true,
      },
    });

    // Update task
    task.submissionType = file.mimetype.includes("pdf") ? "pdf" : "excel";
    task.submissionFile = String(fileId);
    task.submittedAt = new Date();
    task.status = "completed";
    await task.save();

    return res.json({
      success: true,
      data: {
        fileId,
        filename,
        submissionType: task.submissionType,
        task: task.formattedData,
      },
      message: "Submission uploaded, verified and stored",
    });
  } catch (error) {
    console.error("[uploadTaskSubmission] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id/submission - streams the stored file (auth required)
export const streamTaskSubmission = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?._id;
    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    if (!task.submissionFile)
      return res.status(404).json({ success: false, message: "No submission" });

    const bucket = getGridFSBucket();
    const fileId = new (await import("mongodb")).ObjectId(task.submissionFile);

    // Find file to read contentType and filename
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }
    const fileDoc = files[0];
    res.setHeader(
      "Content-Type",
      fileDoc.contentType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileDoc.filename}"`
    );

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", (err) => {
      console.error("GridFS stream error:", err);
      res.status(500).end();
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error("[streamTaskSubmission] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
