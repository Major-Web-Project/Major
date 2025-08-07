import Task from "../models/Task.js";
import WeeklyActivity from "../models/WeeklyActivity.js";
import { getFileSignedUrl, s3Client, S3_CONFIG } from '../config/aws.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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
  // Debug: print the last day (commented out to prevent server issues)
  // if (process.env.NODE_ENV !== "production") {
  //   console.log("Last day (should be today):", days[6].toString());
  // }
  return days;
}

function getDayLabel(date) {
  // Use local time for day label
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

// Debug: Print generated days and labels (removed to prevent server reload issues)
// if (process.env.NODE_ENV !== "production") {
//   const days = getLast7Days();
//   days.forEach((d) => {
//     console.log("WeeklyActivity Day:", d.toLocaleString(), getDayLabel(d));
//   });
// }

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
    createdAt: { $gte: start, $lt: end },
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
      (t) => t.createdAt >= dayStart && t.createdAt < dayEnd
    );
    const dayTotal = dayTasks.length;
    const dayCompleted = dayTasks.filter(
      (t) => t.data.status === "completed"
    ).length;
    const pct = dayTotal ? (dayCompleted / dayTotal) * 100 : 0;

    dayStats.push({
      day: getDayLabel(dayStart),
      date: dayStart.toISOString(),
      goal: 100,
      completed: pct,
      hasTasks: dayTotal > 0, // for frontend to optionally gray out days with no tasks
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

  // Debug log: print the generated dayStats (commented out to prevent server issues)
  // if (process.env.NODE_ENV !== "production") {
  //   console.log("WeeklyActivity dayStats:", JSON.stringify(dayStats, null, 2));
  // }

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
    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Task data is required" });
    }
    // Defensive: Ensure status is set
    if (!data.status) data.status = "pending";
    const task = new Task({ user: req.user._id, data });
    await task.save();
    await calculateAndStoreWeeklyActivity(req.user._id);
    // Always return status at top level
    const responseTask = {
      ...task.toObject(),
      status: task.data.status || "pending",
    };
    res.status(201).json({ success: true, data: responseTask });
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
    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    // Format tasks to match frontend expectations (same as getTasksByDate)
    const formattedTasks = tasks.map((task) => {
      const taskData = task.data || {}; // Handle cases where 'data' might be missing
      return {
        id: task._id,
        name: taskData.name || "Untitled Task",
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        notes: taskData.notes,
        estimatedTime: taskData.estimatedTime,
        completionTime: taskData.completionTime,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        // Include submission data
        submissionType: taskData.submissionType,
        submissionFile: taskData.submissionFile,
        actualTime: taskData.actualTime,
        submittedAt: taskData.submittedAt,
        category: taskData.category || taskData.type || 'General',
        isAIGenerated: taskData.isAIGenerated || false,
        // Keep original data structure for backward compatibility
        data: taskData
      };
    });

    res.json({ success: true, data: formattedTasks });
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
    // Allow task updates including completion status changes

    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Task data is required" });
    }
    console.log("[updateTask] Received data:", JSON.stringify(data, null, 2));
    
    // Defensive: Ensure status is set
    if (!data.status) data.status = task.data.status || "pending";
    
    // Merge the new data with existing task data to preserve other fields
    task.data = { ...task.data, ...data };
    
    // Validate required fields for completed tasks
    if (data.status === 'completed') {
      if (!data.submissionFile) {
        console.log("[updateTask] Warning: Completed task missing submission file");
      }
      if (!data.submissionType) {
        console.log("[updateTask] Warning: Completed task missing submission type");
      }
    }
    
    await task.save();
    console.log("[updateTask] Saved task:", JSON.stringify(task.toObject(), null, 2));
    await calculateAndStoreWeeklyActivity(req.user._id);
    // Always return status at top level
    const responseTask = {
      ...task.toObject(),
      status: task.data.status || "pending",
    };
    res.json({ success: true, data: responseTask });
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
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, task });
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

    // Get all tasks for the user and filter by date on the server side
    // This approach is more reliable than trying to handle timezone conversions
    const allUserTasks = await Task.find({ user: req.user._id });

    // Filter tasks by comparing the local date portion of createdAt
    const tasksFromDb = allUserTasks.filter(task => {
      if (!task.createdAt) return false;

      // Convert task creation date to local date string (YYYY-MM-DD)
      const taskDate = new Date(task.createdAt);
      const taskLocalDate = taskDate.getFullYear() + '-' +
        String(taskDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(taskDate.getDate()).padStart(2, '0');

      return taskLocalDate === date;
    });

    // console.log(`[getTasksByDate] Filtering tasks for date ${date}:`, {
    //   totalUserTasks: allUserTasks.length,
    //   tasksFoundForDate: tasksFromDb.length,
    //   requestedDate: date,
    //   taskDates: tasksFromDb.map(t => {
    //     const taskDate = new Date(t.createdAt);
    //     return {
    //       id: t._id,
    //       name: t.data?.name || 'Untitled',
    //       createdAt: t.createdAt,
    //       localDate: taskDate.getFullYear() + '-' +
    //         String(taskDate.getMonth() + 1).padStart(2, '0') + '-' +
    //         String(taskDate.getDate()).padStart(2, '0')
    //     };
    //   })
    // });

    // **CRUCIAL FIX**: Transform each task into the flat structure the frontend expects.
    // This moves details from the nested 'data' object to the top level.
    const formattedTasks = tasksFromDb.map((task) => {
      const taskData = task.data || {}; // Handle cases where 'data' might be missing
      return {
        id: task._id,
        name: taskData.name || "Untitled Task", // Provide default values to prevent errors
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        notes: taskData.notes,
        estimatedTime: taskData.estimatedTime,
        completionTime: taskData.completionTime,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        // Include submission data
        submissionType: taskData.submissionType,
        submissionFile: taskData.submissionFile,
        actualTime: taskData.actualTime,
        submittedAt: taskData.submittedAt,
        category: taskData.category || taskData.type || 'General',
        isAIGenerated: taskData.isAIGenerated || false,
        // Keep original data structure for backward compatibility
        data: taskData
      };
    });

    res.json({ success: true, data: formattedTasks });
  } catch (err) {
    console.error("[getTasksByDate] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Upload task submission file to S3
export const uploadTaskSubmission = async (req, res) => {
  try {
    console.log('[uploadTaskSubmission] S3 upload request received:', {
      file: req.file ? { 
        originalname: req.file.originalname, 
        size: req.file.size,
        mimetype: req.file.mimetype,
        key: req.file.key, // S3 key (path in bucket)
        location: req.file.location, // S3 URL
        bucket: req.file.bucket
      } : null,
      body: req.body,
      user: req.user ? req.user._id : null,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [token]' : 'none'
      }
    });

    if (!req.file) {
      console.log('[uploadTaskSubmission] No file uploaded to S3 - multer-s3 may have failed');
      return res.status(400).json({
        success: false,
        message: "No file uploaded to cloud storage"
      });
    }

    const { taskId, submissionType } = req.body;

    if (!taskId || !submissionType) {
      console.log('[uploadTaskSubmission] Missing required fields:', { taskId, submissionType });
      return res.status(400).json({
        success: false,
        message: "Task ID and submission type are required"
      });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      console.log('[uploadTaskSubmission] Task not found:', { taskId, userId: req.user._id });
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // Store S3 key (file path in bucket) instead of local file path
    const s3Key = req.file.key;

    console.log('[uploadTaskSubmission] File uploaded to S3 successfully:', {
      s3Key,
      s3Location: req.file.location,
      originalName: req.file.originalname,
      size: req.file.size,
      bucket: req.file.bucket,
      taskId,
      submissionType
    });

    res.json({
      success: true,
      data: {
        filePath: s3Key, // Store S3 key as filePath for compatibility
        s3Key: s3Key,
        s3Location: req.file.location,
        originalName: req.file.originalname,
        size: req.file.size,
        submissionType,
        cloudStorage: true // Flag to indicate this is stored in cloud
      }
    });
  } catch (error) {
    console.error("S3 file upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file to cloud storage",
      error: error.message
    });
  }
};

// View task submission file from S3
export const viewTaskSubmission = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    
    console.log('[viewTaskSubmission] S3 request received:', {
      taskId,
      userId: req.user?._id,
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers['referer']
      }
    });

    // Find task and verify ownership
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      console.log('[viewTaskSubmission] Task not found:', { taskId, userId: req.user._id });
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const submissionFile = task.data?.submissionFile;
    if (!submissionFile) {
      console.log('[viewTaskSubmission] No submission file found:', { 
        taskId, 
        taskData: task.data,
        hasSubmissionFile: !!task.data?.submissionFile 
      });
      return res.status(404).json({
        success: false,
        message: "No submission file found for this task"
      });
    }

    // For S3, submissionFile is the S3 key
    const s3Key = submissionFile;
    
    console.log('[viewTaskSubmission] Checking S3 file:', {
      s3Key,
      bucket: S3_CONFIG.bucket
    });

    // Check if file exists in S3 and get file info
    try {
      const headCommand = new GetObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: s3Key,
      });
      
      const headResult = await s3Client.send(headCommand);
      
      console.log('[viewTaskSubmission] S3 file found:', {
        s3Key,
        contentLength: headResult.ContentLength,
        contentType: headResult.ContentType,
        lastModified: headResult.LastModified
      });
      
      // Generate signed URL for secure access (expires in 1 hour)
      const signedUrl = await getFileSignedUrl(s3Key, 3600);
      
      console.log('[viewTaskSubmission] S3 signed URL generated successfully');

      res.json({
        success: true,
        data: {
          fileUrl: signedUrl, // Signed URL for direct S3 access
          submissionType: task.data?.submissionType,
          submittedAt: task.data?.submittedAt,
          originalName: task.data?.originalName || s3Key.split('/').pop(),
          fileSize: headResult.ContentLength,
          lastModified: headResult.LastModified,
          cloudStorage: true, // Flag to indicate this is from cloud storage
          expiresIn: 3600 // URL expires in 1 hour
        }
      });
      
    } catch (s3Error) {
      console.log('[viewTaskSubmission] S3 file not found or error:', {
        s3Key,
        error: s3Error.message,
        code: s3Error.name
      });
      
      if (s3Error.name === 'NoSuchKey') {
        return res.status(404).json({
          success: false,
          message: "Submission file not found in cloud storage"
        });
      } else if (s3Error.name === 'AccessDenied') {
        return res.status(403).json({
          success: false,
          message: "Access denied to submission file"
        });
      } else {
        throw s3Error; // Re-throw other errors
      }
    }
    
  } catch (error) {
    console.error("[viewTaskSubmission] S3 Error:", {
      message: error.message,
      stack: error.stack,
      taskId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to retrieve submission file from cloud storage",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
