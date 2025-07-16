import Task from "../models/Task.js";
import WeeklyActivity from "../models/WeeklyActivity.js";

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
  // Debug: print the last day
  if (process.env.NODE_ENV !== "production") {
    console.log("Last day (should be today):", days[6].toString());
  }
  return days;
}

function getDayLabel(date) {
  // Use local time for day label
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

// Debug: Print generated days and labels
if (process.env.NODE_ENV !== "production") {
  const days = getLast7Days();
  days.forEach((d) => {
    console.log("WeeklyActivity Day:", d.toLocaleString(), getDayLabel(d));
  });
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

  // Debug log: print the generated dayStats
  if (process.env.NODE_ENV !== "production") {
    console.log("WeeklyActivity dayStats:", JSON.stringify(dayStats, null, 2));
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
    res.status(201).json({ success: true, task: responseTask });
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
    res.json({ success: true, tasks });
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
    if (task.data.status === "completed")
      return res
        .status(400)
        .json({ success: false, message: "Cannot edit a completed task" });

    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "Task data is required" });
    }
    // Log the received data for debugging
    console.log("[updateTask] Received data:", JSON.stringify(data, null, 2));
    // Defensive: Ensure status is set
    if (!data.status) data.status = task.data.status || "pending";
    task.data = data;
    await task.save();
    // Log the saved task for debugging
    console.log("[updateTask] Saved task:", JSON.stringify(task, null, 2));
    await calculateAndStoreWeeklyActivity(req.user._id);
    // Always return status at top level
    const responseTask = {
      ...task.toObject(),
      status: task.data.status || "pending",
    };
    res.json({ success: true, task: responseTask });
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

    // Use UTC to define the start and end of the day to avoid timezone issues
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Find all tasks for the user within the specified day
    const tasksFromDb = await Task.find({
      user: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

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
      };
    });

    res.json(formattedTasks);
  } catch (err) {
    console.error("[getTasksByDate] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
