import Task from "../models/Task.js";
import WeeklyActivity from "../models/WeeklyActivity.js";

function getLast7Days() {
  const days = [];
  // Force IST (UTC+5:30)
  const now = new Date();
  const IST_OFFSET = 330; // 5 hours 30 minutes
  // Convert now to IST
  const istNow = new Date(
    now.getTime() + (IST_OFFSET - now.getTimezoneOffset()) * 60000
  );
  const today = new Date(
    istNow.getFullYear(),
    istNow.getMonth(),
    istNow.getDate()
  );
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
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
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
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
    if (dayStats[i].completed === 100 && dayStats[i].goal === 100) {
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
    const task = new Task({ user: req.user._id, data });
    await task.save();
    await calculateAndStoreWeeklyActivity(req.user._id);
    res.status(201).json({ success: true, task });
  } catch (error) {
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
    const { data } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { data },
      { new: true }
    );
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    await calculateAndStoreWeeklyActivity(req.user._id);
    res.json({ success: true, task });
  } catch (error) {
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
